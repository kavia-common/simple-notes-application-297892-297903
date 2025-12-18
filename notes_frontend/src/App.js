import React, { useEffect, useState, useMemo } from "react";

// Theme
const theme = {
  primary: "#3b82f6",
  secondary: "#64748b",
  success: "#06b6d4",
  error: "#EF4444",
  background: "#f9fafb",
  surface: "#ffffff",
  text: "#111827",
};

// Backend base URL
const API_BASE = "http://localhost:3001";

function Button({ children, variant = "primary", onClick, disabled, style }) {
  const base = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all .15s ease",
    opacity: disabled ? 0.6 : 1,
  };
  const variants = {
    primary: { background: theme.primary, color: "#fff" },
    success: { background: theme.success, color: "#003344", borderColor: theme.success },
    ghost: { background: "transparent", color: theme.text, borderColor: "#e5e7eb" },
    danger: { background: theme.error, color: "#fff" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...(style || {}) }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        outline: "none",
        fontSize: 16,
        color: theme.text,
        background: theme.surface,
      }}
    />
  );
}

function TextArea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={14}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        outline: "none",
        fontSize: 15,
        color: theme.text,
        background: theme.surface,
        resize: "vertical",
      }}
    />
  );
}

function App() {
  const [notes, setNotes] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);

  async function fetchNotes() {
    try {
      setLoadingList(true);
      const res = await fetch(`${API_BASE}/notes`);
      if (!res.ok) throw new Error(`Failed to load notes (${res.status})`);
      const data = await res.json();
      setNotes(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  async function createNote() {
    try {
      setLoadingSave(true);
      const body = { title: "Untitled", content: "" };
      // Optimistic: add temp note
      const tempId = Math.floor(Math.random() * 1e9) * -1;
      const optimistic = { id: tempId, ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setNotes((prev) => [optimistic, ...prev]);
      setSelectedId(tempId);

      const res = await fetch(`${API_BASE}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to create note (${res.status})`);
      const created = await res.json();

      setNotes((prev) => [created, ...prev.filter((n) => n.id !== tempId)]);
      setSelectedId(created.id);
      setError(null);
    } catch (e) {
      setError(e.message);
      // rollback by refetch
      fetchNotes();
    } finally {
      setLoadingSave(false);
    }
  }

  async function saveNote(updated) {
    try {
      setLoadingSave(true);
      const res = await fetch(`${API_BASE}/notes/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: updated.title, content: updated.content }),
      });
      if (!res.ok) throw new Error(`Failed to save note (${res.status})`);
      const saved = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingSave(false);
    }
  }

  async function deleteNote(id) {
    try {
      setLoadingDelete(true);
      const res = await fetch(`${API_BASE}/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete note (${res.status})`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedId === id) {
        setSelectedId((prev) => {
          const remaining = notes.filter((n) => n.id !== id);
          return remaining.length ? remaining[0].id : null;
        });
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingDelete(false);
    }
  }

  const layoutStyles = {
    app: {
      display: "flex",
      height: "100vh",
      background: theme.background,
      color: theme.text,
      fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
    },
    sidebar: {
      width: 300,
      background: theme.surface,
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      padding: 16,
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    list: { overflowY: "auto", padding: 8 },
    listItem: (active) => ({
      padding: 12,
      borderRadius: 8,
      cursor: "pointer",
      marginBottom: 8,
      background: active ? "#eff6ff" : "transparent",
      border: `1px solid ${active ? theme.primary : "#e5e7eb"}`,
      color: active ? theme.primary : theme.text,
      transition: "all .15s ease",
    }),
    content: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    contentHeader: {
      padding: 16,
      borderBottom: "1px solid #e5e7eb",
      background: theme.surface,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    editor: {
      padding: 16,
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 12,
    },
    error: {
      background: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
      padding: 8,
      borderRadius: 8,
      margin: "8px 16px",
    },
    badge: {
      marginLeft: 8,
      fontSize: 12,
      color: theme.secondary,
    },
  };

  return (
    <div style={layoutStyles.app}>
      <aside style={layoutStyles.sidebar}>
        <div style={layoutStyles.header}>
          <div style={{ fontWeight: 800, color: theme.primary }}>Notes</div>
          <Button variant="success" onClick={createNote} disabled={loadingSave}>
            + New
          </Button>
        </div>
        {error && <div style={layoutStyles.error}>{error}</div>}
        <div style={layoutStyles.list}>
          {loadingList ? (
            <div style={{ padding: 12, color: theme.secondary }}>Loading notes...</div>
          ) : notes.length === 0 ? (
            <div style={{ padding: 12, color: theme.secondary }}>No notes yet. Create one!</div>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                style={layoutStyles.listItem(n.id === selectedId)}
                onClick={() => setSelectedId(n.id)}
              >
                <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {n.title || "Untitled"}
                </div>
                <div style={layoutStyles.badge}>
                  {n.updated_at ? new Date(n.updated_at).toLocaleString() : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
      <main style={layoutStyles.content}>
        <div style={layoutStyles.contentHeader}>
          <div style={{ fontWeight: 700 }}>Detail</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" onClick={fetchNotes}>Refresh</Button>
            {selectedNote && (
              <Button
                variant="danger"
                onClick={() => deleteNote(selectedNote.id)}
                disabled={loadingDelete}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
        <div style={layoutStyles.editor}>
          {selectedNote ? (
            <>
              <Input
                value={selectedNote.title}
                onChange={(v) =>
                  setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? { ...n, title: v } : n)))
                }
                placeholder="Title"
              />
              <TextArea
                value={selectedNote.content}
                onChange={(v) =>
                  setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? { ...n, content: v } : n)))
                }
                placeholder="Write your note here..."
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  onClick={() => saveNote(selectedNote)}
                  disabled={loadingSave}
                >
                  Save
                </Button>
              </div>
            </>
          ) : (
            <div style={{ color: theme.secondary }}>Select or create a note to get started.</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
