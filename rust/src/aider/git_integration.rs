// Re-implementation of Aider's automated Git commit flow

use std::process::Command;

pub fn auto_commit(message: &str) -> bool {
    let add_status = Command::new("git").arg("add").arg(".").status();
    if add_status.is_err() || !add_status.unwrap().success() {
        println!("Git add failed");
        return false;
    }

    let commit_status = Command::new("git")
        .arg("commit")
        .arg("-m")
        .arg(message)
        .status();

    if commit_status.is_err() || !commit_status.unwrap().success() {
        println!("Git commit failed");
        return false;
    }

    true
}
