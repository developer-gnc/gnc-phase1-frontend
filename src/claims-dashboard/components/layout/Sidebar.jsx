export default function Sidebar({ activePage, onNavigate, currentRole, taskBadgeCount }) {
  return (
    <div className="sidebar">
      <div className={`sidebar-icon ${activePage === 'dashboard' ? 'active' : ''}`} title="Dashboard" onClick={() => onNavigate('dashboard')}>
        <svg><use href="#icon-grid" /></svg>
      </div>
      <div className={`sidebar-icon ${activePage === 'claims' ? 'active' : ''}`} title="Claim Files" onClick={() => onNavigate('claims')}>
        <svg><use href="#icon-folder" /></svg>
      </div>
      <div className={`sidebar-icon ${activePage === 'mytasks' ? 'active' : ''}`} title="My Tasks" onClick={() => onNavigate('mytasks')}>
        <svg><use href="#icon-check-list" /></svg>
        {taskBadgeCount > 0 && <span className="sidebar-badge">{taskBadgeCount}</span>}
      </div>
      {(currentRole === 'manager' || currentRole === 'director') && (
        <div className={`sidebar-icon ${activePage === 'tasks' ? 'active' : ''}`} title="All Tasks" onClick={() => onNavigate('tasks')}>
          <svg><use href="#icon-users" /></svg>
        </div>
      )}
      {(currentRole === 'manager' || currentRole === 'director') && (
        <div className={`sidebar-icon ${activePage === 'admin' ? 'active' : ''}`} title="Admin" onClick={() => onNavigate('admin')}>
          <svg><use href="#icon-shield" /></svg>
        </div>
      )}
      <div className={`sidebar-icon ${activePage === 'reports' ? 'active' : ''}`} title="Reports" onClick={() => onNavigate('reports')}>
        <svg><use href="#icon-trending-up" /></svg>
      </div>
    </div>
  );
}
