import React, { useEffect, useMemo, useState } from "react";

function tagsToString(tags) {
  if (!tags) return "";
  if (Array.isArray(tags)) return tags.join(", ");
  return String(tags);
}

function normalizeDraft({ title, content, tags }) {
  return {
    title: String(title || "").trim() || "Untitled",
    content: String(content || ""),
    // Backend contract is unknown; we send tags as array if user supplied comma list.
    tags: String(tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

// PUBLIC_INTERFACE
export function NoteEditorModal({
  isOpen,
  mode,
  initialNote,
  onClose,
  onSave,
  isBusy,
}) {
  const header = useMemo(
    () => (mode === "edit" ? "Edit note" : "Create note"),
    [mode]
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialNote?.title || "");
    setContent(initialNote?.content || "");
    setTags(tagsToString(initialNote?.tags || ""));
  }, [isOpen, initialNote]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onSave(normalizeDraft({ title, content, tags }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, onSave, title, content, tags]);

  if (!isOpen) return null;

  return (
    <div className="ModalOverlay" role="dialog" aria-modal="true" aria-label={header}>
      <div className="Modal">
        <div className="ModalHeader">
          <h3>{header}</h3>
          <button className="Btn BtnGhost BtnSmall" onClick={onClose} disabled={isBusy}>
            Close
          </button>
        </div>

        <div className="ModalBody">
          <div className="Field">
            <label htmlFor="note-title">Title</label>
            <input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              autoFocus
            />
          </div>

          <div className="Field">
            <label htmlFor="note-tags">Tags (optional)</label>
            <input
              id="note-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. work, ideas, personal"
            />
          </div>

          <div className="Field">
            <label htmlFor="note-content">Content</label>
            <textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note..."
            />
          </div>

          <div className="NoteMeta" style={{ marginTop: 2 }}>
            Tip: <span className="Badge">Ctrl</span>+<span className="Badge">Enter</span>{" "}
            to save
          </div>
        </div>

        <div className="ModalFooter">
          <button className="Btn" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button
            className="Btn BtnPrimary"
            onClick={() => onSave(normalizeDraft({ title, content, tags }))}
            disabled={isBusy}
          >
            {isBusy ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
