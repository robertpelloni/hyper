package com.tormentnexus.copilot;

public class AliasGenerator {

    public String generateBashAlias() {
        return "\n" +
               "# Copilot CLI aliases\n" +
               "alias ??='copilot-cli suggest'\n" +
               "alias git?='copilot-cli suggest git'\n" +
               "alias gh?='copilot-cli suggest gh'\n" +
               "\n" +
               "copilot_wrapper() {\n" +
               "    if [ \"$1\" = \"suggest\" ]; then\n" +
               "        copilot-cli \"$@\"\n" +
               "    else\n" +
               "        copilot-cli \"$@\"\n" +
               "    fi\n" +
               "}\n" +
               "alias copilot='copilot_wrapper'\n";
    }

    public String generateZshAlias() {
        return generateBashAlias();
    }

    public String generatePwshAlias() {
        return "\n" +
               "# Copilot CLI aliases\n" +
               "function ?? { copilot-cli suggest $args }\n" +
               "function git? { copilot-cli suggest git $args }\n" +
               "function gh? { copilot-cli suggest gh $args }\n";
    }
}