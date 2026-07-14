import { useState } from 'react';

export default function AdminPage({ team, onRoleChange }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  let members = [...team];
  if (search) members = members.filter(m => m.name.toLowerCase().includes(search) || m.email.toLowerCase().includes(search));
  if (roleFilter !== 'all') members = members.filter(m => m.role === roleFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Access Control</div>
          <div className="page-subtitle">Manage team roles and permissions</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="search-wrap" style={{ maxWidth: 300 }}>
          <span className="search-icon"><svg><use href="#icon-search" /></svg></span>
          <input type="text" className="search-input" placeholder="Search name or email..." onChange={e => setSearch(e.target.value.toLowerCase())} />
        </div>
        <select className="filter-select" onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="manager">Manager</option>
          <option value="consultant">Consultant</option>
        </select>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{members.length} of {team.length} members</span>
      </div>

      <div className="admin-list">
        <div className="admin-list-header">
          <span>Member</span><span>Role</span><span></span>
        </div>
        <div>
          {members.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No team members match your search.</div>
          ) : members.map(m => {
            const rolePill = m.role === 'manager' ? 'pill-purple' : 'pill-green';
            const roleLabel = m.role === 'manager' ? 'Manager' : 'Consultant';
            return (
              <div className="admin-list-row" key={m.email}>
                <div className="admin-member-cell">
                  <div className="avatar-md" style={{ background: m.color }}>{m.initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="admin-name">{m.name}</div>
                    <div className="admin-email">{m.email}</div>
                  </div>
                </div>
                <div>
                  <select className="admin-role-sel" value={m.role} onChange={e => onRoleChange(m.email, e.target.value)}>
                    <option value="manager">Manager</option>
                    <option value="consultant">Consultant</option>
                  </select>
                </div>
                <div>
                  <span className={`status-pill ${rolePill}`} style={{ fontSize: 10 }}>{roleLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}