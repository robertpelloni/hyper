// Re-implementation of Aider's SEARCH/REPLACE diff format patch application

using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace TormentNexus.AiderFeatures
{
    public class EditBlock
    {
        public string Search { get; set; }
        public string Replace { get; set; }
    }

    public static class EditBlockParser
    {
        public static List<EditBlock> ParseEditBlocks(string llmResponse)
        {
            var blocks = new List<EditBlock>();
            var regex = new Regex(@"<<<<<<< SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> REPLACE");
            var matches = regex.Matches(llmResponse);

            foreach (Match match in matches)
            {
                blocks.Add(new EditBlock
                {
                    Search = match.Groups[1].Value,
                    Replace = match.Groups[2].Value
                });
            }
            return blocks;
        }

        public static string ApplyEditBlocks(string fileContent, List<EditBlock> blocks)
        {
            string newContent = fileContent;
            foreach (var block in blocks)
            {
                if (newContent.Contains(block.Search))
                {
                    newContent = newContent.Replace(block.Search, block.Replace);
                }
                else
                {
                    Console.WriteLine("Warning: Could not find SEARCH block exactly.");
                }
            }
            return newContent;
        }
    }
}
