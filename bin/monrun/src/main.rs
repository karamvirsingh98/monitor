#[macro_use]
extern crate tracing;

use std::{io::Read, path::PathBuf, sync::OnceLock};

use anyhow::Context;
use clap::{Parser, Subcommand};
use monitor_client::{api::read, MonitorClient};
use serde::{de::DeserializeOwned, Deserialize};

mod execution;
mod maps;
mod resource;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct CliArgs {
  #[command(subcommand)]
  command: Command,
  #[arg(long, default_value_t = String::from("./creds.toml"))]
  creds: String,
}

fn cli_args() -> &'static CliArgs {
  static CLI_ARGS: OnceLock<CliArgs> = OnceLock::new();
  CLI_ARGS.get_or_init(CliArgs::parse)
}

#[derive(Debug, Clone, Subcommand)]
enum Command {
  /// Runs syncs on resource files
  Resource {
    /// The resource action to take
    action: resource::SyncDirection,
    /// The path of the resource file
    path: PathBuf,
  },
  /// Runs execution files
  Exec {
    /// The path of the exec file
    path: PathBuf,
  },
}

#[derive(Debug, Deserialize)]
struct CredsFile {
  url: String,
  key: String,
  secret: String,
}

fn monitor_client() -> &'static MonitorClient {
  static MONITOR_CLIENT: OnceLock<MonitorClient> = OnceLock::new();
  MONITOR_CLIENT.get_or_init(|| {
    let CredsFile { url, key, secret } =
      parse_toml_file(&cli_args().creds)
        .expect("failed to parse monitor credentials");
    futures::executor::block_on(MonitorClient::new(url, key, secret))
      .expect("failed to initialize monitor client")
  })
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  tracing_subscriber::fmt::init();

  let version =
    monitor_client().read(read::GetVersion {}).await?.version;
  info!("monitor version: {version}");

  match &cli_args().command {
    Command::Exec { path } => execution::run_execution(path).await?,
    Command::Resource { action, path } => {
      info!("got RESOURCE! action: {action:?} | path: {path:?}")
    }
  }

  Ok(())
}

fn parse_toml_file<T: DeserializeOwned>(
  path: impl AsRef<std::path::Path>,
) -> anyhow::Result<T> {
  let contents = std::fs::read_to_string(path)
    .context("failed to read file contents")?;
  toml::from_str(&contents).context("failed to parse toml contents")
}

fn wait_for_enter(message: &str) -> anyhow::Result<()> {
  println!("\nPress ENTER to {message}\n");
  let buffer = &mut [0u8];
  std::io::stdin()
    .read_exact(buffer)
    .context("failed to read ENTER")?;
  Ok(())
}
