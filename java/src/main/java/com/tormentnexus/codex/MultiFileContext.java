package com.tormentnexus.codex;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class MultiFileContext {
    public String gatherContext(String directory, int maxFiles) {
        StringBuilder context = new StringBuilder();
        int fileCount = 0;

        File dir = new File(directory);
        File[] files = dir.listFiles();

        if (files != null) {
            for (File file : files) {
                if (fileCount >= maxFiles) break;

                if (file.isFile() && !file.getName().startsWith(".")) {
                    context.append("\n--- File: ").append(file.getName()).append(" ---\n");
                    try {
                        String content = new String(Files.readAllBytes(Paths.get(file.getAbsolutePath())));
                        context.append(content.length() > 1000 ? content.substring(0, 1000) : content);
                        fileCount++;
                    } catch (IOException e) {
                        // ignore unreadable files
                    }
                }
            }
        }
        return context.toString();
    }
}