export class AliasGenerator {
    public generateBashAlias(): string {
        return `
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
`;
    }

    public generateZshAlias(): string {
        return this.generateBashAlias(); // Zsh syntax is highly compatible here
    }

    public generatePwshAlias(): string {
        return `
# Copilot CLI aliases
function ?? { copilot-cli suggest $args }
function git? { copilot-cli suggest git $args }
function gh? { copilot-cli suggest gh $args }
`;
    }
}