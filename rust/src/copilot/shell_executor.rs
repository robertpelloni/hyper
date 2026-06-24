use std::io::{self, Write};
use std::process::Command;

pub struct ShellExecutor;

impl ShellExecutor {
    pub fn new() -> Self {
        ShellExecutor
    }

    pub fn execute_with_confirmation(&self, command: &str, explanation: &str) -> io::Result<bool> {
        println!("\nSuggestion: {}", command);
        println!("Explanation: {}", explanation);
        print!("\nExecute this command? [y/N] ");
        io::stdout().flush()?;

        let mut input = String::new();
        io::stdin().read_line(&mut input)?;

        let answer = input.trim().to_lowercase();
        if answer == "y" || answer == "yes" {
            println!("Executing: {}...", command);
            let output = if cfg!(target_os = "windows") {
                Command::new("cmd").args(["/C", command]).output()?
            } else {
                Command::new("sh").arg("-c").arg(command).output()?
            };

            if output.status.success() {
                io::stdout().write_all(&output.stdout)?;
            } else {
                io::stderr().write_all(&output.stderr)?;
            }
            Ok(true)
        } else {
            println!("Command execution cancelled.");
            Ok(false)
        }
    }
}