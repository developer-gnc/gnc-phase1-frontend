import { useState } from 'react';

export default function AdminPage({ team, onRoleChange }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  let members = [...team];
  if (search) members = members.filter(m => m.name.toLowerCase().includes(search) || m.email.toLowerCase().includes(search));
  if (roleFilter !== 'all') members = members.filter(m => m.role === roleFilter);

  const ROLE_ORDER = { director: 0, manager: 1, consultant: 2 };
  members = [...members].sort((a, b) => {
    const roleDiff = (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3);
    if (roleDiff !== 0) return roleDiff;
    return a.name.localeCompare(b.name);
  });

  const roleMeta = (role) => {
    if (role === 'director') return { label: 'Director', color: '#f87171' };
    if (role === 'manager') return { label: 'Manager', color: '#a78bfa' };
    return { label: 'Consultant', color: '#60a5fa' };
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Access Control</div>
          <div className="page-subtitle">Manage team roles and permissions</div>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap'
      }}>
        <div className="search-wrap" style={{ maxWidth: 320 }}>
          <span className="search-icon"><svg><use href="#icon-search" /></svg></span>
          <input type="text" className="search-input" placeholder="Search name or email..." onChange={e => setSearch(e.target.value.toLowerCase())} />
        </div>
        <select className="filter-select" onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="director">Director</option>
          <option value="manager">Manager</option>
          <option value="consultant">Consultant</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>
          {members.length} of {team.length} members
        </span>
      </div>

      <div style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)'
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 220px',
          padding: '14px 24px', borderBottom: '1px solid var(--border)'
        }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Member</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Role</span>
        </div>

        {members.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            No team members match your search.
          </div>
        ) : members.map((m, i) => {
          const meta = roleMeta(m.role);
          return (
            <div
              key={m.email}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 220px', alignItems: 'center',
                padding: '16px 24px',
                borderBottom: i === members.length - 1 ? 'none' : '1px solid var(--border)',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: m.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
                }}>
                  {m.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                    {m.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                <select
                  value={m.role}
                  onChange={e => onRoleChange(m.email, e.target.value)}
                  style={{
                    background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8,
                    color: 'var(--text)', fontSize: 12.5, fontFamily: 'var(--font)',
                    padding: '7px 10px', outline: 'none', cursor: 'pointer', flex: 1, minWidth: 130
                  }}
                >
                  <option value="director">Director</option>
                  <option value="manager">Manager</option>
                  <option value="consultant">Consultant</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}