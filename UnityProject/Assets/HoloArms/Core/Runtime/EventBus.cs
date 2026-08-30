using System;
using System.Collections.Generic;

namespace HoloArms.Core
{
    /// <summary>
    /// Typed in-process event bus (spec §4 event model). Events are facts in
    /// past tense; commands stay direct method calls. Cross-node replication
    /// wraps these same event types later (Milestone 4).
    /// </summary>
    public interface IEventBus
    {
        void Subscribe<T>(Action<T> handler);
        void Unsubscribe<T>(Action<T> handler);
        void Publish<T>(T evt);
    }

    public sealed class EventBus : IEventBus
    {
        private readonly Dictionary<Type, List<Delegate>> _handlers = new Dictionary<Type, List<Delegate>>();

        public void Subscribe<T>(Action<T> handler)
        {
            if (!_handlers.TryGetValue(typeof(T), out var list))
            {
                list = new List<Delegate>();
                _handlers[typeof(T)] = list;
            }
            list.Add(handler);
        }

        public void Unsubscribe<T>(Action<T> handler)
        {
            if (_handlers.TryGetValue(typeof(T), out var list)) list.Remove(handler);
        }

        public void Publish<T>(T evt)
        {
            if (!_handlers.TryGetValue(typeof(T), out var list)) return;
            // Iterate by index over a snapshot count so a handler that
            // subscribes during publish never mutates the running loop.
            for (int i = 0, n = list.Count; i < n && i < list.Count; i++)
            {
                ((Action<T>)list[i]).Invoke(evt);
            }
        }
    }

    // ----- Milestone 1 platform events (spec §4 "Platform") -----

    public readonly struct QualityChangedEvent
    {
        public readonly string From;
        public readonly string To;
        public readonly string Reason;
        public QualityChangedEvent(string from, string to, string reason)
        {
            From = from; To = to; Reason = reason;
        }
    }

    public readonly struct ConfigChangedEvent
    {
        public readonly string Section;
        public ConfigChangedEvent(string section) { Section = section; }
    }
}
