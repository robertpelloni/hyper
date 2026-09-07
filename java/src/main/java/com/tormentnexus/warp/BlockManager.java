package com.tormentnexus.warp;

import java.util.ArrayList;
import java.util.List;

public class BlockManager {
    private final List<CommandBlock> blocks;

    public BlockManager() {
        this.blocks = new ArrayList<>();
    }

    public CommandBlock createBlock(String command, String cwd) {
        CommandBlock block = new CommandBlock(command, cwd);
        blocks.add(block);
        return block;
    }

    public void finishBlock(String id, String stdout, String stderr, int exitCode) {
        for (CommandBlock block : blocks) {
            if (block.getId().equals(id)) {
                block.setStdout(stdout);
                block.setStderr(stderr);
                block.setExitCode(exitCode);
                block.setEndTime(System.currentTimeMillis());
                break;
            }
        }
    }

    public List<CommandBlock> getBlocks() {
        return blocks;
    }
}