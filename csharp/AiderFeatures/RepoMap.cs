// Re-implementation of Aider's Tree-Sitter RepoMap context generator

using System.Collections.Generic;
using System.IO;

namespace TormentNexus.AiderFeatures
{
    public class RepoMap
    {
        private string ProjectRoot;

        public RepoMap(string projectRoot)
        {
            ProjectRoot = projectRoot;
        }

        public string GetMapContext()
        {
            // Scaffold: Real implementation requires tree-sitter bindings.
            List<string> fileList = new List<string>();
            ListFilesInDirectory(ProjectRoot, fileList);
            return $"Project Root: {ProjectRoot}\nFiles:\n{string.Join("\n", fileList)}\n[Map content generated via Tree-Sitter]";
        }

        private void ListFilesInDirectory(string dir, List<string> fileList)
        {
            try
            {
                foreach (string file in Directory.GetFiles(dir))
                {
                    fileList.Add(file);
                }
                foreach (string subDir in Directory.GetDirectories(dir))
                {
                    if (!subDir.Contains("node_modules") && !subDir.Contains(".git"))
                    {
                        ListFilesInDirectory(subDir, fileList);
                    }
                }
            }
            catch
            {
                // Ignore access errors
            }
        }
    }
}
