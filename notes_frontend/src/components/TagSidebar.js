import React from "react";

// PUBLIC_INTERFACE
export function TagSidebar({ tags, activeTag, onSelectTag, totalCount }) {
  return (
    <div className="TagList">
      <button
        type="button"
        className={[
          "TagItem",
          activeTag === null ? "TagItemActive" : "",
        ].join(" ")}
        onClick={() => onSelectTag(null)}
        aria-pressed={activeTag === null}
      >
        <div className="TagName">
          <div className="TagDot" aria-hidden="true" />
          <span>All notes</span>
        </div>
        <div className="TagCount">{totalCount}</div>
      </button>

      {(tags || []).map((t) => (
        <button
          key={t.name}
          type="button"
          className={[
            "TagItem",
            activeTag === t.name ? "TagItemActive" : "",
          ].join(" ")}
          onClick={() => onSelectTag(t.name)}
          aria-pressed={activeTag === t.name}
          title={t.name}
        >
          <div className="TagName">
            <div className="TagDot" aria-hidden="true" />
            <span>{t.name}</span>
          </div>
          <div className="TagCount">{t.count}</div>
        </button>
      ))}
    </div>
  );
}
