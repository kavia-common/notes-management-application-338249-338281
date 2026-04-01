import React from "react";
import { formatRelativeTime } from "../domain/notes";

function snippet(text) {
  const s = String(text || "").trim();
  if (!s) return "No content";
  return s;
}

// PUBLIC_INTERFACE
export function NotesList({ notes, selectedNoteId, onSelectNote }) {
  if (!notes.length) {
    return (
      <div className="EmptyState">
        <div>
          <strong>No notes found</strong>
          <div>Try clearing your search or tag filter.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="NoteList" role="list" aria-label="Notes list">
      {notes.map((n) => {
        const active = n.id === selectedNoteId;
        return (
          <div
            key={n.id}
            className={[
              "NoteListItem",
              active ? "NoteListItemActive" : "",
            ].join(" ")}
            role="listitem"
            tabIndex={0}
            onClick={() => onSelectNote(n.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelectNote(n.id);
            }}
            aria-label={`Open note ${n.title}`}
          >
            <div className="NoteTitleRow">
              <strong title={n.title}>{n.title}</strong>
              <div className="NoteMeta">
                {n.updated_at ? formatRelativeTime(n.updated_at) : ""}
              </div>
            </div>
            <p className="NoteSnippet">{snippet(n.content)}</p>
            {!!(n.tags || []).length && (
              <div className="NoteMeta">
                {(n.tags || []).slice(0, 3).map((t) => (
                  <span key={t} className="Badge">
                    {t}
                  </span>
                ))}
                {(n.tags || []).length > 3 ? (
                  <span className="Badge">+{n.tags.length - 3}</span>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
