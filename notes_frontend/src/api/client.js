/**
 * API client layer (I/O adapter) for the notes backend.
 *
 * Flow name: NotesApiClient
 * Entrypoint: createNotesApiClient()
 *
 * Contract:
 * - All network calls go through requestJson() for consistent error shape.
 * - Exposes a notes facade: list/create/update/remove with stable return objects.
 * - If the backend doesn't implement notes endpoints yet, we gracefully fall back
 *   to an in-memory demo store, but keep the same facade.
 */

const DEFAULT_TIMEOUT_MS = 12000;

class ApiError extends Error {
  constructor(message, { status, url, payload }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.payload = payload;
  }
}

/**
 * PUBLIC_INTERFACE
 * Create an API client for the notes backend.
 */
export function createNotesApiClient({ baseUrl }) {
  if (!baseUrl) throw new Error("createNotesApiClient requires { baseUrl }");

  const demoStore = createDemoStore();

  const requestJson = async (path, { method = "GET", body, signal } = {}) => {
    const url = `${baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: signal ?? controller.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      const payload = isJson ? await res.json().catch(() => null) : null;

      if (!res.ok) {
        throw new ApiError(`Request failed with ${res.status}`, {
          status: res.status,
          url,
          payload,
        });
      }

      return payload;
    } catch (err) {
      // Re-throw with context but preserve original error for debugging.
      if (err instanceof ApiError) throw err;

      const message =
        err?.name === "AbortError"
          ? "Request timed out"
          : err?.message || "Network error";

      throw new ApiError(message, { status: 0, url, payload: null });
    } finally {
      clearTimeout(timeout);
    }
  };

  const tryOrDemo = async (opName, fn, fallbackFn) => {
    try {
      return await fn();
    } catch (err) {
      // If backend doesn't have the endpoint (404), use demo store.
      if (err instanceof ApiError && err.status === 404) {
        console.warn(`[NotesApiClient] ${opName} -> demo fallback (404)`);
        return fallbackFn();
      }
      throw err;
    }
  };

  const notes = {
    async list() {
      return tryOrDemo(
        "notes.list",
        async () => {
          // Expected backend routes (best-effort):
          // GET /notes -> list of notes
          const data = await requestJson("/notes");
          return normalizeNotesArray(data);
        },
        async () => demoStore.list()
      );
    },

    async create(draft) {
      return tryOrDemo(
        "notes.create",
        async () => {
          // POST /notes
          const data = await requestJson("/notes", { method: "POST", body: draft });
          return normalizeNote(data);
        },
        async () => demoStore.create(draft)
      );
    },

    async update(id, draft) {
      return tryOrDemo(
        "notes.update",
        async () => {
          // PUT /notes/{id}
          const data = await requestJson(`/notes/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: draft,
          });
          return normalizeNote(data);
        },
        async () => demoStore.update(id, draft)
      );
    },

    async remove(id) {
      return tryOrDemo(
        "notes.remove",
        async () => {
          // DELETE /notes/{id}
          const data = await requestJson(`/notes/${encodeURIComponent(id)}`, {
            method: "DELETE",
          });
          return normalizeNote(data);
        },
        async () => demoStore.remove(id)
      );
    },

    getDemoSeed() {
      return demoStore.listSync();
    },
  };

  return {
    notes,
    // Public helper to surface readable errors to UI.
    formatError(err) {
      if (!err) return "Unknown error";
      if (err instanceof ApiError) {
        if (err.status === 0) return `${err.message}. Is the backend running?`;
        if (err.payload?.detail) return String(err.payload.detail);
        return `${err.message} (HTTP ${err.status})`;
      }
      return err.message || String(err);
    },
  };
}

/* --------------------- Normalization helpers --------------------- */

function normalizeNotesArray(data) {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeNote);
}

function normalizeNote(raw) {
  // Our UI expects: { id, title, content, tags?: string[], created_at?, updated_at? }
  if (!raw || typeof raw !== "object") {
    return createDemoNote({ title: "Untitled", content: "" });
  }

  const id = raw.id ?? raw.note_id ?? raw.uuid ?? raw._id ?? raw.slug ?? null;

  const title =
    raw.title ??
    raw.name ??
    (typeof raw.content === "string" ? raw.content.split("\n")[0] : "Untitled") ??
    "Untitled";

  const content = raw.content ?? raw.body ?? raw.text ?? "";

  const tagsRaw = raw.tags ?? raw.tag_names ?? raw.labels ?? [];
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map(String).map((t) => t.trim()).filter(Boolean)
    : String(tagsRaw)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

  const created_at = raw.created_at ?? raw.createdAt ?? raw.created ?? null;
  const updated_at = raw.updated_at ?? raw.updatedAt ?? raw.updated ?? null;

  return {
    id: String(id ?? `demo-${Math.random().toString(16).slice(2)}`),
    title: String(title || "Untitled"),
    content: String(content || ""),
    tags,
    created_at,
    updated_at,
  };
}

/* --------------------- Demo store (in-memory) --------------------- */

function createDemoStore() {
  let notes = [
    createDemoNote({
      title: "Welcome to Notes",
      content:
        "This is a lightweight notes app UI.\n\nIf the backend endpoints /notes are not available yet, the app runs in demo mode.",
      tags: ["welcome", "demo"],
      updated_at: new Date().toISOString(),
    }),
    createDemoNote({
      title: "Quick tips",
      content:
        "- Use the search box to filter notes\n- Click a tag to filter by tag\n- Create, edit, and delete notes from the header actions",
      tags: ["tips"],
      updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    }),
  ];

  const list = async () => [...notes];
  const listSync = () => [...notes];

  const create = async (draft) => {
    const n = createDemoNote({
      title: draft?.title || "Untitled",
      content: draft?.content || "",
      tags: normalizeTags(draft?.tags),
      updated_at: new Date().toISOString(),
    });
    notes = [n, ...notes];
    return n;
  };

  const update = async (id, draft) => {
    const idx = notes.findIndex((n) => n.id === String(id));
    if (idx < 0) throw new Error("Note not found");
    const next = {
      ...notes[idx],
      title: draft?.title ?? notes[idx].title,
      content: draft?.content ?? notes[idx].content,
      tags: normalizeTags(draft?.tags ?? notes[idx].tags),
      updated_at: new Date().toISOString(),
    };
    notes = notes.map((n) => (n.id === next.id ? next : n));
    return next;
  };

  const remove = async (id) => {
    const idx = notes.findIndex((n) => n.id === String(id));
    if (idx < 0) throw new Error("Note not found");
    const removed = notes[idx];
    notes = notes.filter((n) => n.id !== removed.id);
    return removed;
  };

  return { list, listSync, create, update, remove };
}

function createDemoNote({ title, content, tags = [], updated_at }) {
  const now = new Date().toISOString();
  return {
    id: `demo-${Math.random().toString(16).slice(2)}`,
    title,
    content,
    tags,
    created_at: now,
    updated_at: updated_at || now,
  };
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String).map((t) => t.trim()).filter(Boolean);
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
