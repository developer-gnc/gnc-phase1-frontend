import { CLAIMS, TEAM } from '../../data/index.js';
import { canadaTimeStr, formatDue, getTeamMember, getClaim } from '../../utils/index.js';
import { StatusPill, PriorityBadge } from './StatusPill.jsx';

export default function DeliverableItem({ deliverable: d, showClaim = true, canEdit = false, currentUserId, onCycleStatus, onDelete }) {
  const assignee = getTeamMember(TEAM, d.assigneeId);
  const claim = getClaim(CLAIMS, d.claimId);
  const due = d.due ? formatDue(d.due) : null;
  const canadaTime = d.due ? canadaTimeStr(d.due) : null;
  const checkClass = d.status === 'Completed' ? 'done' : d.status === 'In Progress' ? 'in-progress' : '';
  const canCycle = canEdit || d.assigneeId === currentUserId;

  return (
    <div className="task-item">
      <div
        className={`task-check ${checkClass}`}
        onClick={canCycle ? () => onCycleStatus(d.id) : undefined}
        title={canCycle ? 'Click to cycle status' : 'View only'}
        style={{ cursor: canCycle ? 'pointer' : 'default' }}
      ></div>
      <div className="task-content">
        <div className={`task-title ${d.status === 'Completed' ? 'done-text' : ''}`}>{d.name}</div>
        <div className="task-meta">
          {showClaim && claim && <span className="task-claim-ref">GNC #{claim.gnc} · {claim.name}</span>}
          {canadaTime && (
            <span className="canada-time-badge">
              <span className="canada-flag">🇨🇦</span>{canadaTime}
            </span>
          )}
          {due && due.overdue && <span className="task-due overdue">{due.text}</span>}
          {due && !due.overdue && <span className="task-due">{due.text}</span>}
          <PriorityBadge priority={d.priority} />
          <StatusPill status={d.status} />
        </div>
      </div>
      {assignee && (
        <div className="task-assignee">
          <div className="avatar-xs" style={{ background: assignee.color }}>{assignee.initials}</div>
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>{assignee.name.split(' ')[0]}</span>
        </div>
      )}
      {canEdit && onDelete && (
        <div className="task-actions">
          <button className="task-action-btn" style={{ color: 'var(--danger)' }} onClick={() => onDelete(d.id)} title="Remove">
            <svg><use href="#icon-trash" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
