import { TEAM } from "../../data/index.js";
import { StatusPill } from "../shared/StatusPill.jsx";

function priorityBadge(p) {
  const cls = p === 'High' ? 'priority-high' : p === 'Medium' ? 'priority-medium' : 'priority-low';
  return <span className={`priority-badge ${cls}`}>{p}</span>;
}

function getTeamMember(id) {
  return TEAM.find((t) => t.id === id);
}

export default function FullFileModal({ claim, deliverables, getClaimProgress, onBack, onClose }) {
  const progress = getClaimProgress(claim.id);

  return (
    <div
      className="modal-overlay show"
      onClick={(e) => {
        if (e.target.classList.contains("modal-overlay")) onClose();
      }}
    >
      <div className="modal" style={{ width: 820 }}>
        <div className="modal-header">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="modal-title">{claim.name} — Full File</div>
            <div className="modal-subtitle">GNC #{claim.gnc} · Claim #{claim.claim}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to Summary</button>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <svg><use href="#icon-x" /></svg>
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="full-section">
            <div className="full-section-title">Identification</div>
            <div className="full-grid">
              <div className="full-field"><div className="full-field-label">File Name</div><div className="full-field-value">{claim.name}</div></div>
              <div className="full-field"><div className="full-field-label">GNC #</div><div className="full-field-value">{claim.gnc}</div></div>
              <div className="full-field"><div className="full-field-label">Claim #</div><div className="full-field-value">{claim.claim}</div></div>
              <div className="full-field"><div className="full-field-label">Status</div><div className="full-field-value"><StatusPill status={claim.status} /></div></div>
              <div className="full-field"><div className="full-field-label">Progress</div><div className="full-field-value">{progress}%</div></div>
            </div>
          </div>

          <div className="full-section">
            <div className="full-section-title">Claim Details</div>
            <div className="full-grid">
              <div className="full-field"><div className="full-field-label">Date of Loss</div><div className="full-field-value">{claim.dateOfLoss || '—'}</div></div>
              <div className="full-field"><div className="full-field-label">Address</div><div className="full-field-value">{claim.address || '—'}</div></div>
              <div className="full-field">
                <div className="full-field-label">Lead Consultant</div>
                <div className="full-field-value">
                  <div className="consultant-cell">
                    <div className="avatar-xs" style={{ background: claim.consultantColor }}>{claim.consultantInitials}</div>
                    <span>{claim.consultant}</span>
                  </div>
                </div>
              </div>
              <div className="full-field"><div className="full-field-label">Last Updated</div><div className="full-field-value">{claim.lastUpdated || '—'}</div></div>
              <div className="full-field">
                <div className="full-field-label">Flagged</div>
                <div className="full-field-value">
                  {claim.flagged
                    ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Yes</span>
                    : 'No'}
                </div>
              </div>
            </div>
          </div>

          {claim.description && (
            <div className="full-section">
              <div className="full-section-title">Description</div>
              <div className="full-desc">{claim.description}</div>
            </div>
          )}

          <div className="full-section">
            <div className="full-section-title">Deliverables ({deliverables.length})</div>
            <div className="table-card">
              <table className="deliverables-table">
                <thead>
                  <tr>
                    <th>Deliverable</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {deliverables.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 14, color: 'var(--text3)', fontSize: 11 }}>No deliverables.</td></tr>
                  ) : deliverables.map((d) => {
                    const assignee = getTeamMember(d.assigneeId);
                    return (
                      <tr key={d.id}>
                        <td>{d.name}</td>
                        <td>{assignee ? assignee.name : '—'}</td>
                        <td><StatusPill status={d.status} /></td>
                        <td style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>{d.due || '—'}</td>
                        <td>{priorityBadge(d.priority)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to Summary</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}