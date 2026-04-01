import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { createNotesApiClient } from "./api/client";
import { NotesAppLayout } from "./components/NotesAppLayout";
import { NoteEditorModal } from "./components/NoteEditorModal";
import { ToastHost } from "./components/ToastHost";
import {
  deriveTagsFromNotes,
  filterNotes,
  sortNotesByUpdatedDesc,
} from "./domain/notes";

/**
 * Notes app entrypoint.
 *
 * Contract:
 * - Renders the full notes management UI (tags sidebar + notes list + details/editor).
 * - Wires UI actions to the backend via the API client (create/update/delete/list).
 * - Uses a safe fallback when backend does not expose notes endpoints (demo mode),
 *   but still keeps the API flow centralized and debuggable.
 */

// PUBLIC_INTERFACE
function App() {
  const api = useMemo(
    () =>
      createNotesApiClient({
        baseUrl: "http://localhost:3001",
      }),
    []
  );

  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const [activeTag, setActiveTag] = useState(null);
  const [query, setQuery] = useState("");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create"); // 'create' | 'edit'
  const [isBusy, setIsBusy] = useState(false);

  const [toasts, setToasts] = useState([]);

  const pushToast = (toast) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  const tags = useMemo(() => deriveTagsFromNotes(notes), [notes]);

  const filteredNotes = useMemo(() => {
    const filtered = filterNotes(notes, { query, tag: activeTag });
    return sortNotesByUpdatedDesc(filtered);
  }, [notes, query, activeTag]);

  const ensureSelection = (nextNotes) => {
    if (!nextNotes.length) {
      setSelectedNoteId(null);
      return;
    }
    const stillExists = nextNotes.some((n) => n.id === selectedNoteId);
    if (!selectedNoteId || !stillExists) {
      setSelectedNoteId(nextNotes[0].id);
    }
  };

  const refreshNotes = async () => {
    setIsBusy(true);
    try {
      const data = await api.notes.list();
      setNotes(data);
      ensureSelection(data);
    } catch (err) {
      // Centralized error boundary for the app startup.
      console.error("[NotesApp] refreshNotes failed:", err);
      pushToast({
        type: "error",
        title: "Backend not ready",
        message:
          "Could not load notes from the API. Running in demo mode (in-memory).",
      });

      // Demo fallback so UI remains functional when backend exposes only /.
      const demo = api.notes.getDemoSeed();
      setNotes(demo);
      ensureSelection(demo);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    refreshNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateNew = () => {
    setEditorMode("create");
    setIsEditorOpen(true);
  };

  const onEditSelected = () => {
    if (!selectedNote) return;
    setEditorMode("edit");
    setIsEditorOpen(true);
  };

  const onDeleteSelected = async () => {
    if (!selectedNote) return;

    // Basic confirm to avoid accidental deletes.
    const ok = window.confirm("Delete this note? This cannot be undone.");
    if (!ok) return;

    setIsBusy(true);
    try {
      const deleted = await api.notes.remove(selectedNote.id);
      const next = notes.filter((n) => n.id !== deleted.id);
      setNotes(next);
      ensureSelection(next);
      pushToast({ type: "success", title: "Deleted", message: "Note removed." });
    } catch (err) {
      console.error("[NotesApp] delete failed:", err);
      pushToast({
        type: "error",
        title: "Delete failed",
        message: api.formatError(err),
      });
    } finally {
      setIsBusy(false);
    }
  };

  const onSaveEditor = async (draft) => {
    setIsBusy(true);
    try {
      if (editorMode === "create") {
        const created = await api.notes.create(draft);
        const next = [created, ...notes];
        setNotes(next);
        setSelectedNoteId(created.id);
        pushToast({
          type: "success",
          title: "Created",
          message: "New note saved.",
        });
      } else {
        const updated = await api.notes.update(selectedNote.id, draft);
        const next = notes.map((n) => (n.id === updated.id ? updated : n));
        setNotes(next);
        setSelectedNoteId(updated.id);
        pushToast({
          type: "success",
          title: "Updated",
          message: "Changes saved.",
        });
      }

      setIsEditorOpen(false);
    } catch (err) {
      console.error("[NotesApp] save failed:", err);
      pushToast({
        type: "error",
        title: "Save failed",
        message: api.formatError(err),
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="NotesAppRoot">
      <NotesAppLayout
        isBusy={isBusy}
        tags={tags}
        activeTag={activeTag}
        onSelectTag={setActiveTag}
        query={query}
        onQueryChange={setQuery}
        notes={filteredNotes}
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
        selectedNote={selectedNote}
        onCreateNew={onCreateNew}
        onEditSelected={onEditSelected}
        onDeleteSelected={onDeleteSelected}
        onRefresh={refreshNotes}
      />

      <NoteEditorModal
        isOpen={isEditorOpen}
        mode={editorMode}
        initialNote={editorMode === "edit" ? selectedNote : null}
        onClose={() => setIsEditorOpen(false)}
        onSave={onSaveEditor}
        isBusy={isBusy}
      />

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
