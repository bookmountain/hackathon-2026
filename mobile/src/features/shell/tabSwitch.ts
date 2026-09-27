// The tab bar announces tab switches so a tab can reset its map search.
// (Blur also fires when a detail screen opens on top, which should keep it.)

type Listener = () => void;
const listeners = new Set<Listener>();

export function emitTabSwitch() {
  listeners.forEach((l) => l());
}

/** Returns the unsubscribe function, for useEffect */
export function onTabSwitch(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
