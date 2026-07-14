import { useState, useEffect } from 'react';
import { STATUS_CONFIG, KANBAN_COLS } from '../data/index.js';

function StatCard({ color, iconId, trend, trendClass, target, label, onClick }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let c = 0;
    const t = setInterval(() => { c = Math.min(c + 1, target); setCount(c); if (c >= target) clearInterval(t); }, 55);
    return () => clearInterval(t);
  }, [target]);
  return (
    <div className={`stat-card ${color}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-card-top">
        <div className={`stat-icon ${color}`}><svg><use href={`#${iconId}`} /></svg></div>
        <span className={`stat-trend ${trendClass}`}>{trend}</span>
      </div>
      <div className="stat-number">{count}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function KanbanCard({ claim, deliverables, progress, onClick }) {
  const cfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG['Not Started'];
  const openDels = deliverables.filter(d => d.claimId === claim.id && d.status !== 'Completed').length;
  const [barWidth, setBarWidth] = useState('0%');
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(progress + '%'), 300);
    return () => clearTimeout(t);
  }, [progress]);
  return (
    <div className="kanban-card" onClick={onClick}>
      <div className="kanban-card-title">
        {claim.name}
        {claim.flagged && (
          <span className="flag-badge" style={{ marginLeft: 5 }} title="Flagged">
            <svg><use href="#icon-flag" /></svg>
          </span>
        )}
      </div>
      <div className="kanban-card-meta">
        <span className="kanban-card-gnc">GNC #{claim.gnc}</span>
        <div className="kanban-consultant">
          <div className="avatar-xs" style={{ background: claim.consultantColor }}>{claim.consultantInitials}</div>
          <span>{claim.consultant.split(' ')[0]}</span>
        </div>
      </div>
      {openDels > 0 && (
        <div style={{ marginTop: 5 }}>
          <span className="status-pill pill-yellow" style={{ fontSize: 9, padding: '2px 6px' }}>
            <span className="dot"></span>{openDels} open deliverable{openDels > 1 ? 's' : ''}
          </span>
        </div>
      )}
      <div className="kanban-progress-wrap">
        <div className="kanban-progress-track">
          <div className="kanban-progress-fill" style={{ width: barWidth, background: cfg.progressColor }}></div>
        </div>
        <div className="kanban-progress-label">{progress}% complete</div>
      </div>
    </div>
  );
}

export default function DashboardPage({ claims, deliverables, currentRole, currentUserId, getClaimProgress, onClaimClick, onNavigate, onOpenNewClaim }) {
  const [dateStr, setDateStr] = useState('');
  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const isJr = currentRole === 'jr';

  const assignedClaimIds = new Set(
    deliverables.filter(d => d.assigneeId === currentUserId).map(d => d.claimId)
  );
  const visibleClaims = isJr
    ? claims.filter(c => c.consultantId === currentUserId || assignedClaimIds.has(c.id))
    : claims;

  const active = visibleClaims.filter(c => c.status !== 'Completed').length;
  const completed = visibleClaims.filter(c => c.status === 'Completed').length;
  const pending = visibleClaims.filter(c => c.status === 'Pending Approval').length;
  const openTasks = deliverables.filter(d => d.status !== 'Completed' && (isJr ? d.assigneeId === currentUserId : true)).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Claims Overview</div>
          <div className="page-subtitle">{dateStr}</div>
        </div>
        <div className="page-actions">
          {!isJr && (
            <>
              <button className="btn btn-ghost btn-sm">
                <svg width="12" height="12"><use href="#icon-download" /></svg> Export
              </button>
              <button className="btn btn-primary btn-sm" onClick={onOpenNewClaim}>
                <svg width="12" height="12"><use href="#icon-plus" /></svg> New Claim File
              </button>
            </>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard color="blue" iconId="icon-folder" trend="Total" trendClass="neutral" target={active} label="Active Claim Files" onClick={() => onNavigate('claims')} />
        <StatCard color="green" iconId="icon-check-circle" trend="↑ completed" trendClass="up" target={completed} label="Completed Files" />
        <StatCard color="yellow" iconId="icon-clock" trend="Needs review" trendClass="neutral" target={pending} label="Pending Approval" />
        <StatCard color="red" iconId="icon-check-list" trend="Needs attention" trendClass="down" target={openTasks} label="Open Tasks" onClick={!isJr ? () => onNavigate('tasks') : undefined} />
      </div>

      <div className="section-title">Live Status Board</div>
      <div className="kanban-grid">
        {KANBAN_COLS.map(status => {
          const cfg = STATUS_CONFIG[status];
          const cols = visibleClaims.filter(c => c.status === status);
          return (
            <div className="kanban-col" key={status}>
              <div className="kanban-col-header">
                <div className="kanban-col-title">
                  <div className="kanban-dot" style={{ background: cfg.kanbanColor }}></div>
                  {status}
                </div>
                <span className="kanban-count">{cols.length}</span>
              </div>
              <div className="kanban-cards">
                {cols.map(c => (
                  <KanbanCard
                    key={c.id}
                    claim={c}
                    deliverables={deliverables}
                    progress={getClaimProgress(c.id)}
                    onClick={() => onClaimClick(c)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}