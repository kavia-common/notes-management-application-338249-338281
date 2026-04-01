import React, { useEffect, useRef } from "react";
import { TagSidebar } from "./TagSidebar";
import { NotesList } from "./NotesList";
import { NoteDetail } from "./NoteDetail";

/**
 * NotesAppLayout is the top-level view component (UI orchestration layer).
 * It delegates to subcomponents and keeps presentation separate from API logic.
 */

// PUBLIC_INTERFACE
export function NotesAppLayout({
  isBusy,
  tags,
  activeTag,
  onSelectTag,
  query,
  onQueryChange,
  notes,
  selectedNoteId,
  onSelectNote,
  selectedNote,
  onCreateNew,
  onEditSelected,
  onDeleteSelected,
  onRefresh,
}) {
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        // quick reset filter
        onQueryChange("");
        onSelectTag(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onQueryChange, onSelectTag]);

  return (
    <>
      <header className="AppHeader" role="banner" aria-label="Notes header">
        <div className="Brand" aria-label="Brand">
          <div className="BrandMark" aria-hidden="true" />
          <div className="BrandTitle">
            <strong>Notes</strong>
            <span>Search, tag, and edit</span>
          </div>
        </div>

        <div className="SearchBox" role="search" aria-label="Search notes">
          <span aria-hidden="true" style={{ color: "var(--muted)" }}>
            ⌕
          </span>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search notes, content, tags..."
            aria-label="Search notes"
          />
          <span className="KbdHint" aria-hidden="true">
            Ctrl K
          </span>
        </div>

        <div className="HeaderActions" aria-label="Actions">
          {isBusy ? (
            <span className="BusyPill" aria-live="polite">
              <span className="Spinner" aria-hidden="true" /> Syncing
            </span>
          ) : (
            <button className="Btn BtnGhost BtnSmall" onClick={onRefresh}>
              Refresh
            </button>
          )}
          <button className="Btn BtnPrimary" onClick={onCreateNew}>
            + New
          </button>
          <button
            className="Btn"
            onClick={onEditSelected}
            disabled={!selectedNote}
            aria-disabled={!selectedNote}
          >
            Edit
          </button>
          <button
            className="Btn BtnDanger"
            onClick={onDeleteSelected}
            disabled={!selectedNote}
            aria-disabled={!selectedNote}
          >
            Delete
          </button>
        </div>
      </header>

      <main className="AppShell" aria-label="Notes app main content">
        <section className="Panel PanelTags" aria-label="Tags">
          <div className="PanelHeader">
            <h2>Tags</h2>
            <span className="Badge">{activeTag ? activeTag : "All"}</span>
          </div>
          <div className="PanelBody">
            <TagSidebar
              tags={tags}
              activeTag={activeTag}
              onSelectTag={onSelectTag}
              totalCount={notes.length}
            />
          </div>
        </section>

        <section className="Panel PanelList" aria-label="Notes list">
          <div className="PanelHeader">
            <h2>Notes</h2>
            <span className="Badge">{notes.length}</span>
          </div>
          <div className="PanelBody">
            <NotesList
              notes={notes}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
            />
          </div>
        </section>

        <section className="Panel PanelDetail" aria-label="Note detail">
          <NoteDetail note={selectedNote} />
        </section>
      </main>
    </>
  );
}
