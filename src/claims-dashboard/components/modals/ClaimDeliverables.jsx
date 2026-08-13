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

function DeliverableNameCell({ name, note }) {
  return (
    <td>
      <div className="deliverable-name">{name}</div>
      {note && <div className="deliverable-note">{note}</div>}
    </td>
  );
}

function DeliverableDueCell({ dueDate }) {
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

            return (
              <tr key={deliverable.id}>
                <DeliverableNameCell name={deliverable.name} note={deliverable.note} />
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
                <DeliverableDueCell dueDate={deliverable.due} />
                <td><PriorityBadge priority={deliverable.priority} /></td>
                <td>
                  {isManager ? (
                    <button
                      className="task-action-btn"
                      onClick={() => onDeleteDeliverable(deliverable.id)}
                      style={{ color: "var(--danger)" }}
                      aria-label="Delete deliverable"
                    >
                      <svg><use href="#icon-trash" /></svg>
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}