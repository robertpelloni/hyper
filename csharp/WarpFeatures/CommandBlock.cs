using System;
using System.Collections.Generic;
using System.Linq;

namespace TormentNexus.WarpFeatures
{
    public class CommandBlock
    {
        public string Id { get; set; }
        public string Command { get; set; }
        public string Stdout { get; set; }
        public string Stderr { get; set; }
        public int ExitCode { get; set; }
        public long StartTime { get; set; }
        public long EndTime { get; set; }
        public string Cwd { get; set; }
    }

    public class BlockManager
    {
        private readonly List<CommandBlock> _blocks = new List<CommandBlock>();

        public CommandBlock CreateBlock(string command, string cwd)
        {
            var block = new CommandBlock
            {
                Id = Guid.NewGuid().ToString(),
                Command = command,
                Stdout = string.Empty,
                Stderr = string.Empty,
                ExitCode = -1,
                StartTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                EndTime = 0,
                Cwd = cwd
            };

            _blocks.Add(block);
            return block;
        }

        public void FinishBlock(string id, string stdout, string stderr, int exitCode)
        {
            var block = _blocks.FirstOrDefault(b => b.Id == id);
            if (block != null)
            {
                block.Stdout = stdout;
                block.Stderr = stderr;
                block.ExitCode = exitCode;
                block.EndTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            }
        }

        public IReadOnlyList<CommandBlock> GetBlocks()
        {
            return _blocks.AsReadOnly();
        }
    }
}