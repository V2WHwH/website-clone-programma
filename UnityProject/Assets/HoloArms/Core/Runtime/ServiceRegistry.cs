using System;
using System.Collections.Generic;

namespace HoloArms.Core
{
    /// <summary>
    /// Minimal service container (spec §4: explicit interfaces, no scattered
    /// singletons). Composition happens in the scene bootstrap; everything
    /// else resolves through this registry.
    /// </summary>
    public interface IServiceRegistry
    {
        void Register<T>(T instance) where T : class;
        T Resolve<T>() where T : class;
        bool TryResolve<T>(out T instance) where T : class;
    }

    public sealed class ServiceRegistry : IServiceRegistry
    {
        private readonly Dictionary<Type, object> _services = new Dictionary<Type, object>();

        public void Register<T>(T instance) where T : class
        {
            if (instance == null) throw new ArgumentNullException(nameof(instance));
            _services[typeof(T)] = instance;
        }

        public T Resolve<T>() where T : class
        {
            if (_services.TryGetValue(typeof(T), out var s)) return (T)s;
            throw new InvalidOperationException($"Service not registered: {typeof(T).Name}");
        }

        public bool TryResolve<T>(out T instance) where T : class
        {
            if (_services.TryGetValue(typeof(T), out var s)) { instance = (T)s; return true; }
            instance = null;
            return false;
        }
    }
}
