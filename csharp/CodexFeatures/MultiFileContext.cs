using System.IO;
using System.Text;

namespace TormentNexus.CodexFeatures
{
    public class MultiFileContext
    {
        public string GatherContext(string directory, int maxFiles = 10)
        {
            var context = new StringBuilder();
            int fileCount = 0;

            if (Directory.Exists(directory))
            {
                var files = Directory.GetFiles(directory);
                foreach (var file in files)
                {
                    if (fileCount >= maxFiles) break;

                    var fileName = Path.GetFileName(file);
                    if (!fileName.StartsWith("."))
                    {
                        context.AppendLine($"\n--- File: {fileName} ---");
                        var content = File.ReadAllText(file);
                        context.Append(content.Length > 1000 ? content.Substring(0, 1000) : content);
                        fileCount++;
                    }
                }
            }

            return context.ToString();
        }
    }
}