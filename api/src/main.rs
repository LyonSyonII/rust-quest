#![feature(slice_split_once)]

use std::io::{BufRead, Read, Write as _};

fn main() -> std::io::Result<()> {
    let port = std::env::var("PORT").unwrap_or(String::from("9571"));
    let server = std::net::TcpListener::bind(format!("0.0.0.0:{port}"))?;
    println!("Listening on {}", server.local_addr()?);
    for mut stream in server.incoming().flatten() {
        if let Err(e) = handle_request(&mut stream) {
            println!("[Error] {e}");
            stream.write_all(ERROR)?;
        }
    }
    Ok(())
}

const OK: &[u8] = b"HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: POST, GET\r\n\r\n";
const ERROR: &[u8] = b"HTTP/1.1 400 Bad Request\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: POST, GET\r\n\r\n";

macro_rules! err {
    () => {
        Err(std::io::Error::other(""))
    };
    ( $($tt:tt)* ) => {
        Err(std::io::Error::other(format!( $($tt)* )))
    }
}

fn handle_request(stream: &mut std::net::TcpStream) -> std::io::Result<()> {
    println!("{stream:?}");
    let mut buf = [0; 1024 * 32];
    let bytes = read_request(stream, &mut buf)?;
    let request = &buf[..bytes];
    if request.starts_with(b"GET") {
        handle_get(request)
    } else if request.starts_with(b"POST") {
        handle_post(request)
    } else {
        err!("Invalid request!")
    }
}

fn handle_get(request: &[u8]) -> std::io::Result<()> {
    let request: Request<'_, 1, false> = Request::parse(request)?;
    Ok(())
}

fn handle_post(request: &[u8]) -> std::io::Result<()> {
    let request: Request<'_, 1, true> = Request::parse(request)?;
    Ok(())
}

fn read_request(mut stream: &std::net::TcpStream, buf: &mut [u8]) -> std::io::Result<usize> {
    let bytes = stream.read(buf)?;
    if buf.len() == bytes {
        return err!("Request too large: > {bytes} bytes");
    }
    Ok(bytes)
}

#[derive(Clone, Copy)]
struct Parameter<'i> {
    name: &'i [u8],
    value: &'i [u8],
}
struct Request<'i, const PARAMS: usize, const BODY: bool> {
    params: ([Parameter<'i>; PARAMS], usize),
    headers: &'i [u8],
    body: &'i [u8],
}
impl<'i, const PARAMS: usize, const BODY: bool> Request<'i, PARAMS, BODY> {
    pub fn parse(bytes: &'i [u8]) -> std::io::Result<Self> {
        let mut request = Request::new();
        
        if PARAMS > 0 {
            let Some(start) = memchr::memchr(b'?', bytes) else {
                return request.into_result();
            };
            let Some(end) = memchr::memchr(b' ', &bytes[start..]) else {
                return request.into_result();
            };
            let start_end_str = || std::str::from_utf8(&bytes[start+1..start+end]).unwrap_or("BINARY");
            for param in bytes[start+1..start+end].split(|&b| b == b'&') {
                let Some((name, value)) =
                    memchr::memchr(b'=', param).map(|sep| param.split_at(sep))
                else {
                    return err!("No parameter found in {:?}", start_end_str());
                };
                if memchr::memchr3(b';', b'/', b'\\', value).is_some() {
                    return err!("Parameter contains ';', '/' or '\\' in {:?}", start_end_str());
                }
                if request.push_param((name, &value[1..])).is_none() {
                    return err!("Too many parameters, expected {PARAMS} in {:?}", start_end_str());
                }
            }
        }

        for i in 0..bytes.len() {
            if matches!(bytes.get(i..i + 4), Some(b"\r\n\r\n")) {
                request.set_headers_body(bytes.split_at(i));
                break;
            }
        }
        eprintln!("{request:#?}");
        request.into_result()
    }

    fn new() -> Self {
        Request {
            params: ([Parameter::empty(); PARAMS], 0),
            headers: &[],
            body: &[],
        }
    }
    fn push_param(&mut self, (name, value): (&'i [u8], &'i [u8])) -> Option<usize> {
        let (params, i) = &mut self.params;
        if *i == PARAMS {
            return None;
        }
        params[*i] = Parameter::new((name, value));
        *i += 1;
        Some(*i)
    }

    fn set_headers_body(&mut self, (headers, body): (&'i [u8], &'i [u8])) {
        self.headers = headers.trim_ascii();
        self.body = body.trim_ascii();
    }

    fn into_result(self) -> std::io::Result<Self> {
        if self.params.1 != PARAMS {
            return err!(
                "Malformed Request: Expected {PARAMS} parameters, got {}",
                self.params.1
            );
        }
        if self.headers.is_empty() {
            return err!("Malformed Request: Expected header");
        }
        if BODY && self.body.is_empty() {
            return err!("Malformed Request: Expected body");
        }
        Ok(self)
    }
}
impl<const PARAMS: usize, const BODY: bool> std::fmt::Debug for Request<'_, PARAMS, BODY> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut f = f.debug_struct("Request");
        let to_str = |b| std::str::from_utf8(b);
        if PARAMS > 0 {
            f.field("params", &self.params.0);
        }
        f.field("headers", &to_str(self.headers).unwrap_or("???"));
        if BODY {
            f.field("body", &to_str(self.body).unwrap_or("BINARY"));
        }
        Ok(())
    }
}

impl<'i> Parameter<'i> {
    pub fn new((name, value): (&'i [u8], &'i [u8])) -> Self {
        Self { name, value }
    }

    pub fn empty() -> Self {
        Self {
            name: &[],
            value: &[],
        }
    }

    pub fn is_empty(&self) -> bool {
        self.name.is_empty() && self.value.is_empty()
    }

    pub fn name_str(&self) -> &'i str {
        std::str::from_utf8(self.name).unwrap()
    }

    pub fn value_str(&self) -> &'i str {
        std::str::from_utf8(self.value).unwrap()
    }
}

impl std::fmt::Debug for Parameter<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if !self.is_empty() {
            return write!(f, "{}: \"{}\"", self.name_str(), self.value_str());
        }
        Err(std::fmt::Error)
    }
}
