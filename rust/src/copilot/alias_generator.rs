pub struct AliasGenerator;

impl AliasGenerator {
    pub fn new() -> Self {
        AliasGenerator
    }

    pub fn generate_bash_alias(&self) -> String {
        r#"
# Copilot CLI aliases
alias ??='copilot-cli suggest'
alias git?='copilot-cli suggest git'
alias gh?='copilot-cli suggest gh'

copilot_wrapper() {
    if [ "$1" = "suggest" ]; then
        copilot-cli "$@"
    else
        copilot-cli "$@"
    fi
}
alias copilot='copilot_wrapper'
"#.to_string()
    }

    pub fn generate_zsh_alias(&self) -> String {
        self.generate_bash_alias()
    }

    pub fn generate_pwsh_alias(&self) -> String {
        r#"
# Copilot CLI aliases
function ?? { copilot-cli suggest $args }
function git? { copilot-cli suggest git $args }
function gh? { copilot-cli suggest gh $args }
"#.to_string()
    }
}