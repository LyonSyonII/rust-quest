pub struct FormatterWriter<'r, 'f>(pub &'r mut std::fmt::Formatter<'f>);

impl std::io::Write for FormatterWriter<'_, '_> {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        let s = std::str::from_utf8(buf).unwrap();
        self.0.write_str(s).unwrap();
        Ok(buf.len())
    }

    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}
