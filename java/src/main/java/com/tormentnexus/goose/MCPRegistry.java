package com.tormentnexus.goose;

// Re-implementation of Goose's Model Context Protocol (MCP) Registry

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;

public class MCPRegistry {

    public static class MCPTool {
        public String name;
        public String description;
        public String inputSchema;
        public Function<String, CompletableFuture<String>> execute;

        public MCPTool(String name, String description, String inputSchema, Function<String, CompletableFuture<String>> execute) {
            this.name = name;
            this.description = description;
            this.inputSchema = inputSchema;
            this.execute = execute;
        }
    }

    private final Map<String, MCPTool> tools = new HashMap<>();

    public void registerTool(MCPTool tool) {
        tools.put(tool.name, tool);
    }

    public MCPTool getTool(String name) {
        return tools.get(name);
    }

    public CompletableFuture<String> executeTool(String name, String input) {
        MCPTool tool = tools.get(name);
        if (tool != null) {
            return tool.execute.apply(input);
        }
        CompletableFuture<String> errorFuture = new CompletableFuture<>();
        errorFuture.completeExceptionally(new RuntimeException("Tool " + name + " not found in MCP registry."));
        return errorFuture;
    }
}
