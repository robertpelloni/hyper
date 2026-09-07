package com.tormentnexus.warp;

import java.util.UUID;

public class CommandBlock {
    private String id;
    private String command;
    private String stdout;
    private String stderr;
    private int exitCode;
    private long startTime;
    private long endTime;
    private String cwd;

    public CommandBlock(String command, String cwd) {
        this.id = UUID.randomUUID().toString();
        this.command = command;
        this.cwd = cwd;
        this.startTime = System.currentTimeMillis();
        this.exitCode = -1;
    }

    // Getters and Setters
    public String getId() { return id; }
    public String getStdout() { return stdout; }
    public void setStdout(String stdout) { this.stdout = stdout; }
    public String getStderr() { return stderr; }
    public void setStderr(String stderr) { this.stderr = stderr; }
    public int getExitCode() { return exitCode; }
    public void setExitCode(int exitCode) { this.exitCode = exitCode; }
    public void setEndTime(long endTime) { this.endTime = endTime; }
}