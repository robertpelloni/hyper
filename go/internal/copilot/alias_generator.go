package copilot

type AliasGenerator struct{}

func NewAliasGenerator() *AliasGenerator {
	return &AliasGenerator{}
}

func (a *AliasGenerator) GenerateBashAlias() string {
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
`
}

func (a *AliasGenerator) GenerateZshAlias() string {
	return a.GenerateBashAlias()
}

func (a *AliasGenerator) GeneratePwshAlias() string {
	return `
# Copilot CLI aliases
function ?? { copilot-cli suggest $args }
function git? { copilot-cli suggest git $args }
function gh? { copilot-cli suggest gh $args }
`
}