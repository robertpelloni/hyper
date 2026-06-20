package com.tormentnexus.aider;

// Re-implementation of Aider's automated Git commit flow

import java.io.IOException;

public class GitIntegration {
    public static boolean autoCommit(String message) {
        try {
            new ProcessBuilder("git", "add", ".").start().waitFor();
            new ProcessBuilder("git", "commit", "-m", message).start().waitFor();
            return true;
        } catch (IOException | InterruptedException e) {
            System.out.println("Auto-commit failed: " + e.getMessage());
            return false;
        }
    }
}
