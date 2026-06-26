namespace TormentNexus.CodexFeatures
{
    public class GhostTextManager
    {
        public string Suggest(string input, int cursorPosition)
        {
            if (input.StartsWith("git c")) return "ommit -m \"update\"";
            if (input.StartsWith("dotnet r")) return "un";
            return string.Empty;
        }

        public string Render(string input, string suggestion)
        {
            return $"{input}\x1b[90m{suggestion}\x1b[0m";
        }
    }
}