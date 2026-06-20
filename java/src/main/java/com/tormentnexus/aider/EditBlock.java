package com.tormentnexus.aider;

// Re-implementation of Aider's SEARCH/REPLACE diff format patch application

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class EditBlock {
    public String search;
    public String replace;

    public EditBlock(String search, String replace) {
        this.search = search;
        this.replace = replace;
    }

    public static List<EditBlock> parseEditBlocks(String llmResponse) {
        List<EditBlock> blocks = new ArrayList<>();
        Pattern pattern = Pattern.compile("<<<<<<< SEARCH\n([\\s\\S]*?)=======\n([\\s\\S]*?)>>>>>>> REPLACE");
        Matcher matcher = pattern.matcher(llmResponse);

        while (matcher.find()) {
            blocks.add(new EditBlock(matcher.group(1), matcher.group(2)));
        }
        return blocks;
    }

    public static String applyEditBlocks(String fileContent, List<EditBlock> blocks) {
        String newContent = fileContent;
        for (EditBlock block : blocks) {
            if (newContent.contains(block.search)) {
                newContent = newContent.replace(block.search, block.replace);
            } else {
                System.out.println("Warning: Could not find SEARCH block exactly.");
            }
        }
        return newContent;
    }
}
