using System;
using System.Collections.Generic;

namespace TormentNexus {
    public class Agent {
        private Dictionary<string, object> _state;
        private HashSet<object> _listeners;
        private List<object> _steeringQueue;
        private List<object> _followUpQueue;

        public Agent() {
            _state = new Dictionary<string, object>();
            _listeners = new HashSet<object>();
            _steeringQueue = new List<object>();
            _followUpQueue = new List<object>();
        }

        public void AddListener(object listener) {
            _listeners.Add(listener);
        }

        public void RemoveListener(object listener) {
            _listeners.Remove(listener);
        }
    }
}