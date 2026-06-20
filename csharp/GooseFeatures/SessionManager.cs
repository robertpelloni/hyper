// Re-implementation of Goose's Session and Memory Management

using System.Collections.Generic;

namespace TormentNexus.GooseFeatures
{
    public class Session
    {
        public string Id { get; }
        public List<Message> History { get; }

        public Session(string id)
        {
            Id = id;
            History = new List<Message>();
        }

        public void AddMessage(Message message)
        {
            History.Add(message);
        }

        public IReadOnlyList<Message> GetHistory()
        {
            return History.AsReadOnly();
        }
    }

    public class SessionManager
    {
        private readonly Dictionary<string, Session> _sessions = new Dictionary<string, Session>();

        public Session CreateSession(string id)
        {
            var session = new Session(id);
            _sessions[id] = session;
            return session;
        }

        public Session GetSession(string id)
        {
            _sessions.TryGetValue(id, out var session);
            return session;
        }

        public void ClearSession(string id)
        {
            _sessions.Remove(id);
        }
    }
}
