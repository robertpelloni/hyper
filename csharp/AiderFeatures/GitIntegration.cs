// Re-implementation of Aider's automated Git commit flow

using System;
using System.Diagnostics;

namespace TormentNexus.AiderFeatures
{
    public static class GitIntegration
    {
        public static bool AutoCommit(string message)
        {
            try
            {
                var addProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "git",
                        Arguments = "add .",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    }
                };
                addProcess.Start();
                addProcess.WaitForExit();
                if (addProcess.ExitCode != 0) return false;

                var commitProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "git",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    }
                };
                commitProcess.StartInfo.ArgumentList.Add("commit");
                commitProcess.StartInfo.ArgumentList.Add("-m");
                commitProcess.StartInfo.ArgumentList.Add(message);

                commitProcess.Start();
                commitProcess.WaitForExit();
                return commitProcess.ExitCode == 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Auto-commit failed: {ex.Message}");
                return false;
            }
        }
    }
}
