package com.tormentnexus.copilot;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Scanner;

public class ShellExecutor {
    private final Scanner scanner;

    public ShellExecutor() {
        this.scanner = new Scanner(System.in);
    }

    public boolean executeWithConfirmation(String command, String explanation) {
        System.out.println("\nSuggestion: " + command);
        System.out.println("Explanation: " + explanation);
        System.out.print("\nExecute this command? [y/N] ");

        String answer = scanner.nextLine().trim().toLowerCase();

        if (answer.equals("y") || answer.equals("yes")) {
            System.out.println("Executing: " + command + "...");
            try {
                ProcessBuilder processBuilder = new ProcessBuilder();
                if (System.getProperty("os.name").toLowerCase().contains("win")) {
                    processBuilder.command("cmd.exe", "/c", command);
                } else {
                    processBuilder.command("sh", "-c", command);
                }

                Process process = processBuilder.start();

                BufferedReader stdInput = new BufferedReader(new InputStreamReader(process.getInputStream()));
                BufferedReader stdError = new BufferedReader(new InputStreamReader(process.getErrorStream()));

                String s;
                while ((s = stdInput.readLine()) != null) {
                    System.out.println(s);
                }
                while ((s = stdError.readLine()) != null) {
                    System.err.println(s);
                }

                process.waitFor();
                return true;
            } catch (Exception e) {
                System.err.println("Error executing command: " + e.getMessage());
                return false;
            }
        }

        System.out.println("Command execution cancelled.");
        return false;
    }
}