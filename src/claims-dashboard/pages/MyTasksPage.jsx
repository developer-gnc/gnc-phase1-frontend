import { useState } from 'react';
import DeliverableItem from '../components/shared/DeliverableItem.jsx';

export default function MyTasksPage({ deliverables, claims, currentUser, currentUserEmail, onCycleStatus }) {
  const [activeTab, setActiveTab] = useState('all');

  const STATUSES = ['Not Started', 'In Progress', 'Pending Approval', 'On Hold', 'Completed'];
  const counts = {};
  STATUSES.forEach(s => { counts[s] = deliverables.filter(d => d.assignee_email === currentUserEmail && d.status === s).length; });

  let myDels = deliverables.filter(d => d.assignee_email === currentUserEmail);
  if (activeTab !== 'all') myDels = myDels.filter(d => d.status === activeTab);

  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  const statusOrder = { 'Not Started': 0, 'In Progress': 1, 'Pending Approval': 2, 'On Hold': 3, 'Completed': 4 };
  myDels = [...myDels].sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
    return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
  });

  const tabs = ['all', 'Not Started', 'In Progress', 'Pending Approval', 'Completed'];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Tasks{currentUser?.name ? ` — ${currentUser.name}` : ''}</div>
          <div className="page-subtitle">Deliverables & tasks assigned to you across all claim files</div>
        </div>
      </div>

      <div className="tasks-stats">
        <div className="task-stat">
          <div className="task-stat-icon" style={{ background: 'rgba(139,160,192,0.1)', color: 'var(--text3)' }}>
            <svg><use href="#icon-clock" /></svg>
          </div>
          <div><div className="task-stat-num">{counts['Not Started'] || 0}</div><div className="task-stat-lbl">Not Started</div></div>
        </div>
        <div className="task-stat">
          <div className="task-stat-icon" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
            <svg><use href="#icon-check-list" /></svg>
          </div>
          <div><div className="task-stat-num">{counts['In Progress'] || 0}</div><div className="task-stat-lbl">In Progress</div></div>
        </div>
        <div className="task-stat">
          <div className="task-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warn)' }}>
            <svg><use href="#icon-clock" /></svg>
          </div>
          <div><div className="task-stat-num">{counts['Pending Approval'] || 0}</div><div className="task-stat-lbl">Pending Approval</div></div>
        </div>
        <div className="task-stat">
          <div className="task-stat-icon" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--accent2)' }}>
            <svg><use href="#icon-check-circle" /></svg>
          </div>
          <div><div className="task-stat-num">{counts['Completed'] || 0}</div><div className="task-stat-lbl">Completed</div></div>
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'all' ? 'All' : tab}
          </button>
        ))}
      </div>

      <div className="task-list">
        {myDels.length === 0 ? (
          <div className="empty-state">
            <svg><use href="#icon-check-circle" /></svg>
            <p>No tasks here — you're all caught up!</p>
          </div>
        ) : myDels.map(d => (
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