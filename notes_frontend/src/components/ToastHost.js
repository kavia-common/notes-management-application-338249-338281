import React, { useEffect } from "react";

// PUBLIC_INTERFACE
export function ToastHost({ toasts, onDismiss }) {
  useEffect(() => {
    // Auto-dismiss after 4 seconds.
    const timers = (toasts || []).map((t) =>
      setTimeout(() => onDismiss(t.id), 4000)
    );
    return () => timers.forEach((id) => clearTimeout(id));
  }, [toasts, onDismiss]);

  if (!toasts || !toasts.length) return null;

  return (
    <div className="ToastHost" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "Toast",
            t.type === "error" ? "ToastError" : "ToastSuccess",
          ].join(" ")}
          role="status"
        >
          <div className="ToastIcon" aria-hidden="true">
            {t.type === "error" ? "!" : "✓"}
          </div>
          <div className="ToastContent">
            <strong>{t.title || (t.type === "error" ? "Error" : "Success")}</strong>
            <p>{t.message || ""}</p>
          </div>
          <button
            className="ToastDismiss"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
