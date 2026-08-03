import { useState, useEffect } from 'react';
import DeliverableItem from '../components/shared/DeliverableItem.jsx';

export default function AllTasksPage({ claims, deliverables, team, currentRole, currentUserEmail, onCycleStatus, onUpdateDeliverable, onDelete }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState('all');
  const [claimFilter, setClaimFilter] = useState('all');

  useEffect(() => {
    if (claimFilter !== 'all') {
      const stillExists = claims.some(c => c.id === parseInt(claimFilter));
      if (!stillExists) setClaimFilter('all');
    }
  }, [claims, claimFilter]);

  const open = deliverables.filter(d => d.status !== 'Completed').length;
  const pending = deliverables.filter(d => d.status === 'Not Started' || d.status === 'Pending Approval').length;
  const done = deliverables.filter(d => d.status === 'Completed').length;

  const claimsWithDeliverables = claims.filter(c =>
    deliverables.some(d => d.claim_id === c.id)
  );

  let filtered = [...deliverables];
  if (search) filtered = filtered.filter(d => {
    const claim = claims.find(c => c.id === d.claim_id);
    return d.name.toLowerCase().includes(search) || (claim?.name.toLowerCase().includes(search));
  });
  if (statusFilter !== 'all') filtered = filtered.filter(d => d.status === statusFilter);
  if (personFilter !== 'all') filtered = filtered.filter(d => d.assignee_email === personFilter);
  if (claimFilter !== 'all') filtered = filtered.filter(d => d.claim_id === parseInt(claimFilter));

  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  filtered = filtered.sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1));

  const canEdit = currentRole === 'manager' || currentRole === 'director';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">All Tasks & Deliverables</div>
          <div className="page-subtitle">Company-wide task overview — all claims</div>
        </div>
      </div>

      <div className="tasks-stats">
        <div className="task-stat">
          <div className="task-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warn)' }}>
            <svg><use href="#icon-clock" /></svg>
          </div>
          <div><div className="task-stat-num">{pending}</div><div className="task-stat-lbl">Pending / Approval</div></div>
        </div>
        <div className="task-stat">
          <div className="task-stat-icon" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
            <svg><use href="#icon-check-list" /></svg>
          </div>
          <div><div className="task-stat-num">{open}</div><div className="task-stat-lbl">Open Deliverables</div></div>
        </div>
        <div className="task-stat">
          <div className="task-stat-icon" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--accent2)' }}>
            <svg><use href="#icon-check-circle" /></svg>
          </div>
          <div><div className="task-stat-num">{done}</div><div className="task-stat-lbl">Completed</div></div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ maxWidth: 300 }}>
          <span className="search-icon"><svg><use href="#icon-search" /></svg></span>
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks, deliverables, claims..."
            onChange={e => setSearch(e.target.value.toLowerCase())}
          />
        </div>
        <select className="filter-select" onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>
        <select className="filter-select" onChange={e => setPersonFilter(e.target.value)}>
          <option value="all">All Consultants</option>
          {(team || []).map(m => <option key={m.email} value={m.email}>{m.name}</option>)}
        </select>
        <select className="filter-select" value={claimFilter} onChange={e => setClaimFilter(e.target.value)}>
          <option value="all">All Claims</option>
          {claimsWithDeliverables.map(c => (
            <option key={c.id} value={c.id}>GNC #{c.gnc} · {c.name}</option>
          ))}
        </select>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg><use href="#icon-check-list" /></svg>
            <p>No deliverables match your filters.</p>
          </div>
        ) : filtered.map(d => (
          <DeliverableItem
            key={d.id}
            deliverable={d}
            claims={claims}
            team={team}
            showClaim={true}
            canEdit={canEdit}
            currentUserEmail={currentUserEmail}
            onCycleStatus={onCycleStatus}
            onUpdateDeliverable={onUpdateDeliverable}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}