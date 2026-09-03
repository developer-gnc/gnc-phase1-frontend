import { useState } from "react";
import { getDueInfo } from "../../utils/index.js";
import { StatusPill, PriorityBadge } from "../shared/StatusPill.jsx";
import Dropdown from "../shared/Dropdown.jsx";


const STATUS_OPTIONS = [
  "Not Started",
  "In Progress",
  "Pending Approval",
  "Completed",
  "On Hold",
];

const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

function NoteBox({ note, canEdit, onCommit }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(note || "");
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasNote = !!(note || "").trim();

  if (!canEdit && !hasNote) return null;

  async function commit() {
    if (draft === (note || "")) return;
    setSaving(true);
    const ok = await onCommit(draft);
    setSaving(false);
    setFailed(ok === false);
  }

  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
        <textarea
          className="deliverable-note-box"
          rows={expanded ? 4 : 1}
          placeholder={canEdit ? "Add a comment..." : ""}
          readOnly={!canEdit}
          value={draft}
          onChange={(e) => { setDraft(e.target.value); if (failed) setFailed(false); }}
          onFocus={() => setExpanded(true)}
          onBlur={commit}
          style={{
            flex: 1,
            fontSize: 11,
            padding: "4px 6px",
            borderRadius: 6,
            border: `1px solid ${failed ? "var(--danger)" : "var(--border)"}`,
            background: canEdit ? "var(--white)" : "var(--bg)",
            color: "var(--text2)",
            resize: "none",
            fontFamily: "inherit",
            transition: "all 0.12s",
          }}
        />
        {(hasNote || draft) && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? "Collapse" : "Expand"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text3)", padding: 2, lineHeight: 1, flexShrink: 0,
            }}
          >
            {expanded ? "▲" : "▼"}
          </button>
        )}
      </div>
      {saving && <div style={{ fontSize: 9.5, color: "var(--text3)", marginTop: 2 }}>Saving…</div>}
      {failed && (
        <div style={{ fontSize: 9.5, color: "var(--danger)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
          Failed to save
          <button
            type="button"
            onClick={commit}
            style={{ background: "none", border: "none", color: "var(--danger)", textDecoration: "underline", cursor: "pointer", padding: 0, fontSize: 9.5 }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

function DeliverableNameCell({ deliverable, canEdit, editing, editValue, onEditValueChange, onCommitNote }) {
  return (
    <td>
      {editing ? (
        <input
          type="text"
          className="add-del-input"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          style={{ width: "100%" }}
        />
      ) : (
        <div className="deliverable-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {deliverable.name}
          {deliverable.is_calling_task && (
            <span className="status-pill pill-blue" style={{ fontSize: 9, padding: "1px 6px" }}>
              Operations
            </span>
          )}
        </div>
      )}
      <NoteBox note={deliverable.note} canEdit={canEdit} onCommit={onCommitNote} />
    </td>
  );
}

function DeliverableDueCell({ dueDate, editing, editValue, onEditValueChange }) {
  if (editing) {
    return (
      <td>
        <input
          type="date"
          className="add-del-input"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
        />
      </td>
    );
  }
  const { canadaTime, due } = getDueInfo(dueDate);
  return (
    <td>
      <span className="canada-time-badge">
        <span className="canada-flag" aria-hidden="true">CA</span>
        {canadaTime}
      </span>
      {due?.overdue && (
        <div style={{ fontSize: 9, color: "var(--danger)", marginTop: 1 }}>
          {due.text}
        </div>
      )}
    </td>
  );
}

function AssigneeCell({ assignee }) {
  if (!assignee) return <td><span>—</span></td>;
  return (
    <td>
      <div className="consultant-cell">
        <div className="avatar-xs" style={{ background: assignee.color }}>
          {assignee.initials}
        </div>
        <span>{assignee.name}</span>
      </div>
    </td>
  );
}

export default function ClaimDeliverables({
  deliverables,
  team,
  currentRole,
  currentUserEmail,
  onUpdateDeliverable,
  onDeleteDeliverable,
}) {
  const TEAM_BY_EMAIL = Object.fromEntries((team || []).map((m) => [m.email, m]));
  const isManager = currentRole === "manager" || currentRole === "director";

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: "", due: "", priority: "Medium" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(false);

  function startEdit(d) {
    setEditingId(d.id);
    setEditError(false);
    setEditDraft({ name: d.name || "", due: d.due || "", priority: d.priority || "Medium" });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(false);
  }

  async function saveEdit(d) {
    setEditSaving(true);
    const results = await Promise.all([
      editDraft.name !== d.name ? onUpdateDeliverable(d.id, "name", editDraft.name) : Promise.resolve(true),
      editDraft.due !== d.due ? onUpdateDeliverable(d.id, "due", editDraft.due) : Promise.resolve(true),
      editDraft.priority !== d.priority ? onUpdateDeliverable(d.id, "priority", editDraft.priority) : Promise.resolve(true),
    ]);
    setEditSaving(false);
    if (results.some((ok) => ok === false)) {
      setEditError(true);
      return;
    }
    setEditingId(null);
    setEditError(false);
  }

  if (!deliverables || deliverables.length === 0) {
    return (
      <div className="table-card" style={{ marginBottom: 10, overflow: "visible" }}>
        <table className="deliverables-table">
          <thead>
            <tr>
              <th>Deliverable</th><th>Assigned To</th><th>Status</th>
              <th>Due Date</th><th>Priority</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: 18, color: "var(--text3)", fontSize: 11 }}>
                No deliverables added yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-card" style={{ marginBottom: 10 }}>
      <table className="deliverables-table">
        <thead>
          <tr>
            <th>Deliverable</th><th>Assigned To</th><th>Status</th>
            <th>Due Date</th><th>Priority</th><th></th>
          </tr>
        </thead>
        <tbody>
          {deliverables.map((deliverable) => {
            const assignee = TEAM_BY_EMAIL[deliverable.assignee_email];
            const canManageThisRow = isManager || deliverable.assignee_email === currentUserEmail;
            const editing = editingId === deliverable.id;

            return (
              <tr key={deliverable.id}>
                <DeliverableNameCell
                  deliverable={deliverable}
                  canEdit={canManageThisRow}
                  editing={editing}
                  editValue={editDraft.name}
                  onEditValueChange={(val) => setEditDraft((prev) => ({ ...prev, name: val }))}
                  onCommitNote={(val) => onUpdateDeliverable(deliverable.id, "note", val)}
                />
                {canManageThisRow && isManager ? (
                  <td>
                    <Dropdown
                      value={deliverable.assignee_email || ""}
                      options={(team || []).map((member) => ({ value: member.email, label: member.name }))}
                      onChange={(email) => onUpdateDeliverable(deliverable.id, "assignee_email", email)}
                    />
                  </td>
                ) : (
                  <AssigneeCell assignee={assignee} />
                )}
                <td>
                  {canManageThisRow ? (
                    <Dropdown
                      value={deliverable.status}
                      options={STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
                      onChange={(val) => onUpdateDeliverable(deliverable.id, "status", val)}
                    />
                  ) : (
                    <StatusPill status={deliverable.status} />
                  )}
                </td>
                <DeliverableDueCell
                  dueDate={deliverable.due}
                  editing={editing}
                  editValue={editDraft.due}
                  onEditValueChange={(val) => setEditDraft((prev) => ({ ...prev, due: val }))}
                />
                <td>
                  {editing ? (
                    <Dropdown
                      value={editDraft.priority}
                      options={PRIORITY_OPTIONS.map((p) => ({ value: p, label: p }))}
                      onChange={(val) => setEditDraft((prev) => ({ ...prev, priority: val }))}
                    />
                  ) : (
                    <PriorityBadge priority={deliverable.priority} />
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {isManager && (
                      editing ? (
                        <>
                          <button
                            className="task-action-btn"
                            onClick={() => saveEdit(deliverable)}
                            disabled={editSaving}
                            style={{ color: "var(--accent2)" }}
                            aria-label={editError ? "Retry save" : "Save changes"}
                            title={editError ? "Retry" : "Save"}
                          >
                            ✓
                          </button>
                          <button
                            className="task-action-btn"
                            onClick={cancelEdit}
                            style={{ color: "var(--text3)" }}
                            aria-label="Cancel edit"
                            title="Cancel"
                          >
                            ✕
                          </button>
                          {editError && (
                            <span style={{ fontSize: 9.5, color: "var(--danger)", whiteSpace: "nowrap" }}>
                              Failed to save — tap ✓ to retry
                            </span>
                          )}
                        </>
                      ) : (
                        <button
                          className="task-action-btn"
                          onClick={() => startEdit(deliverable)}
                          style={{ color: "var(--text3)" }}
                          aria-label="Edit deliverable"
                          title="Edit"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                      )
                    )}
                    {isManager && !editing && (
                      <button
                        className="task-action-btn"
                        onClick={() => onDeleteDeliverable(deliverable.id)}
                        style={{ color: "var(--danger)" }}
                        aria-label="Delete deliverable"
                      >
                        <svg><use href="#icon-trash" /></svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
