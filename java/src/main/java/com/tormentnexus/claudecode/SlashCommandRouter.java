package com.tormentnexus.claudecode;

// Re-implementation of Claude Code's Slash Command Router

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;

public class SlashCommandRouter {

    private final Map<String, Function<String[], CompletableFuture<String>>> commands = new HashMap<>();

    public void registerCommand(String command, Function<String[], CompletableFuture<String>> handler) {
        if (!command.startsWith("/")) {
            throw new IllegalArgumentException("Slash commands must start with '/'");
        }
        commands.put(command, handler);
    }

    public boolean isSlashCommand(String input) {
        return input.trim().startsWith("/");
    }

    public CompletableFuture<String> executeCommand(String input) {
        String[] parts = input.trim().split("\\s+");
        if (parts.length == 0 || parts[0].isEmpty()) {
            return CompletableFuture.completedFuture("Empty command.");
        }

        String cmd = parts[0];
        String[] args = Arrays.copyOfRange(parts, 1, parts.length);

        Function<String[], CompletableFuture<String>> handler = commands.get(cmd);
        if (handler != null) {
            return handler.apply(args);
        }

        return CompletableFuture.completedFuture("Unknown command: " + cmd + ". Type /help for available commands.");
    }
}
