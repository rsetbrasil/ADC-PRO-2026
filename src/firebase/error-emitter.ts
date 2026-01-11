// This is a simple event emitter.
// It's used to decouple the error source from the error handler.

type Listener<T> = (data: T) => void;

class EventEmitter<TEventData> {
  private listeners: Set<Listener<TEventData>> = new Set();

  on(listener: Listener<TEventData>) {
    this.listeners.add(listener);
  }

  off(listener: Listener<TEventData>) {
    this.listeners.delete(listener);
  }

  emit(channel: string, data: TEventData) {
    // Note: The 'channel' argument is kept for API consistency,
    // even though this simple emitter doesn't use it.
    this.listeners.forEach(listener => listener(data));
  }
}

export const errorEmitter = new EventEmitter<any>();
