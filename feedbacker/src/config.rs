#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct Config {
    pub port: u16,
    pub allowed_origins: Vec<String>,
    pub output: Option<std::path::PathBuf>,
}

impl Config {
    fn figment() -> figment::Figment {
        figment::Figment::from(figment::providers::Serialized::defaults(Config::default()))
            .merge(figment::providers::Env::prefixed(""))
    }

    pub fn get() -> &'static Config {
        Box::leak(Box::new(Self::figment().extract::<Config>().unwrap()))
    }
}

impl Default for Config {
    fn default() -> Self {
        Config {
            port: 9090,
            allowed_origins: Vec::new(),
            output: None,
        }
    }
}
