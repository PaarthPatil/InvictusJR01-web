export const DATA_CHANGED_EVENT = "inventory:data-changed";

export function emitDataChange(action, metadata = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DATA_CHANGED_EVENT, {
      detail: {
        action,
        metadata,
        at: new Date().toISOString(),
      },
    })
  );
}

export function onDataChange(handler) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const wrapped = (event) => {
    handler(event.detail || {});
  };

  window.addEventListener(DATA_CHANGED_EVENT, wrapped);
  return () => {
    window.removeEventListener(DATA_CHANGED_EVENT, wrapped);
  };
}
