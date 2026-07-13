package com.tormentnexus.codex;

public class GhostTextManager {
    public String suggest(String input, int cursorPosition) {
        if (input.startsWith("git c")) return "ommit -m \"update\"";
        if (input.startsWith("mvn c")) return "lean install";
        return "";
    }

    public String render(String input, String suggestion) {
        return input + "\033[90m" + suggestion + "\033[0m";
    }
}