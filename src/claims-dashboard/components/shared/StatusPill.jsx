export function StatusPill({ status }) {
  const map = {
    'Not Started': 'pill-gray',
    'In Progress': 'pill-blue',
    'Pending Approval': 'pill-yellow',
    'Completed': 'pill-green',
    'On Hold': 'pill-red',
  };
  return (
    <span className={`status-pill ${map[status] || 'pill-gray'}`}>
      <span className="dot"></span>{status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const cls = priority === 'High' ? 'priority-high' : priority === 'Medium' ? 'priority-medium' : 'priority-low';
  return <span className={`priority-badge ${cls}`}>{priority}</span>;
}
