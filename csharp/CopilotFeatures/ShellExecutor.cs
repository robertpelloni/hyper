using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace TormentNexus.CopilotFeatures
{
    public class ShellExecutor
    {
        public async Task<bool> ExecuteWithConfirmationAsync(string command, string explanation)
        {
            Console.WriteLine($"\nSuggestion: {command}");
            Console.WriteLine($"Explanation: {explanation}");
            Console.Write("\nExecute this command? [y/N] ");

            var answer = Console.ReadLine()?.Trim().ToLower();

            if (answer == "y" || answer == "yes")
            {
                Console.WriteLine($"Executing: {command}...");

                var processInfo = new ProcessStartInfo
                {
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    processInfo.FileName = "cmd.exe";
                    processInfo.Arguments = $"/C {command}";
                }
                else
                {
                    processInfo.FileName = "sh";
                    processInfo.Arguments = $"-c \"{command}\"";
                }

                using var process = new Process { StartInfo = processInfo };
                process.Start();

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                if (!string.IsNullOrEmpty(output)) Console.WriteLine(output);
                if (!string.IsNullOrEmpty(error)) Console.Error.WriteLine(error);

                return true;
            }

            Console.WriteLine("Command execution cancelled.");
            return false;
        }
    }
}