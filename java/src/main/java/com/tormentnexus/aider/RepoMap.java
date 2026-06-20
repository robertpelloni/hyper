package com.tormentnexus.aider;

// Re-implementation of Aider's Tree-Sitter RepoMap context generator

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class RepoMap {
    private String projectRoot;

    public RepoMap(String projectRoot) {
        this.projectRoot = projectRoot;
    }

    public String getMapContext() {
        // Scaffold: Real implementation requires tree-sitter bindings.
        List<String> fileList = new ArrayList<>();
        listFilesInDirectory(new File(this.projectRoot), fileList);
        return "Project Root: " + this.projectRoot + "\nFiles:\n" + String.join("\n", fileList) + "\n[Map content generated via Tree-Sitter]";
    }

    private void listFilesInDirectory(File dir, List<String> fileList) {
        File[] files = dir.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    String path = file.getPath();
                    if (!path.contains("node_modules") && !path.contains(".git")) {
                        listFilesInDirectory(file, fileList);
                    }
                } else {
                    fileList.add(file.getPath());
                }
            }
        }
    }
}
