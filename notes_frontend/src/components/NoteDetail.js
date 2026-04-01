import React from "react";
import { formatRelativeTime } from "../domain/notes";

// PUBLIC_INTERFACE
export function NoteDetail({ note }) {
  if (!note) {
    return (
      <div className="EmptyState">
        <div>
          <strong>Select a note</strong>
          <div>Pick a note from the list, or create a new one.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="NoteDetail">
      <div className="NoteDetailHeader">
        <div>
          <h1 title={note.title}>{note.title}</h1>
          <div className="NoteMeta">
            {note.updated_at ? `Updated ${formatRelativeTime(note.updated_at)}` : ""}
            {!!(note.tags || []).length ? (
              <span style={{ marginLeft: 10 }}>
                {(note.tags || []).map((t) => (
                  <span key={t} className="Badge" style={{ marginRight: 6 }}>
                    {t}
                  </span>
                ))}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="NoteDetailContent">
        <p>{note.content || ""}</p>
      </div>
    </div>
  );
}
