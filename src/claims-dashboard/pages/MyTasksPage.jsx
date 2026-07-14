import { useState } from 'react';
import { TEAM, DELIVERABLE_STATUSES } from '../data/index.js';
import { getTeamMember } from '../utils/index.js';
import DeliverableItem from '../components/shared/DeliverableItem.jsx';

export default function MyTasksPage({ deliverables, currentUserId, onCycleStatus }) {
  const [activeTab, setActiveTab] = useState('all');
  const member = getTeamMember(TEAM, currentUserId);

  const counts = {};
  DELIVERABLE_STATUSES.forEach(s => { counts[s] = deliverables.filter(d => d.assigneeId === currentUserId && d.status === s).length; });

  let myDels = deliverables.filter(d => d.assigneeId === currentUserId);
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
      <div className="my-tasks-header">
        <div>
          <div className="my-tasks-greeting">My Tasks — {member?.name || ''}</div>
          <div className="my-tasks-sub">Deliverables & tasks assigned to you across all claim files</div>
        </div>
        <div className="my-tasks-counts">
          <div className="my-count"><div className="my-count-num">{counts['Not Started'] || 0}</div><div className="my-count-lbl">Not Started</div></div>
          <div className="my-count"><div className="my-count-num">{counts['In Progress'] || 0}</div><div className="my-count-lbl">In Progress</div></div>
          <div className="my-count"><div className="my-count-num">{counts['Pending Approval'] || 0}</div><div className="my-count-lbl">Approval</div></div>
          <div className="my-count"><div className="my-count-num">{counts['Completed'] || 0}</div><div className="my-count-lbl">Completed</div></div>
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
            showClaim={true}
            canEdit={false}
            currentUserId={currentUserId}
            onCycleStatus={onCycleStatus}
          />
        ))}
      </div>
    </div>
  );
}
