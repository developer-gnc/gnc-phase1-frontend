import { useState, useEffect } from 'react';
import { STATUS_CONFIG } from '../data/index.js';

export default function ClaimsPage({ claims, deliverables, currentRole, currentUserEmail, onClaimClick, onOpenNewClaim }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [consultantFilter, setConsultantFilter] = useState('all');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const isManager = currentRole === 'manager' || currentRole === 'director';

  const assignedClaimIds = new Set(
    deliverables.filter(d => d.assignee_email === currentUserEmail).map(d => d.claim_id)
  );
  const visibleClaims = isManager
    ? claims
    : claims.filter(c => c.consultant_email === currentUserEmail || c.manager_email === currentUserEmail || assignedClaimIds.has(c.id));

  const consultants = [...new Set(visibleClaims.map(c => c.consultant).filter(Boolean))];

  const filtered = visibleClaims.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = !s || c.name?.toLowerCase().includes(s) || c.claim?.includes(s) || c.gnc?.includes(s);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchConsultant = consultantFilter === 'all' || c.consultant === consultantFilter;
    return matchSearch && matchStatus && matchConsultant;
  });

  const FLAG_ICON = (
    <span className="flag-badge" title="Flagged">
      <svg><use href="#icon-flag" /></svg>
    </span>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Claim Files</div>
          <div className="page-subtitle">{dateStr}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={onOpenNewClaim}>
            <svg width="12" height="12"><use href="#icon-plus" /></svg> New Claim File
          </button>
        </div>
      </div>
      <div className="table-section">
        <div className="table-toolbar">
          <div className="search-wrap">
            <span className="search-icon"><svg><use href="#icon-search" /></svg></span>
            <input type="text" className="search-input" placeholder="Search name, claim #, GNC #..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-group">
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
            <select className="filter-select" value={consultantFilter} onChange={e => setConsultantFilter(e.target.value)}>
              <option value="all">All Consultants</option>
              {consultants.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter('all'); setConsultantFilter('all'); }}>Clear</button>
          </div>
        </div>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>File / Insured</th><th>GNC #</th><th>Claim #</th><th>Consultant</th>
                <th>Status</th><th>Deliverables</th><th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 28, color: 'var(--text3)' }}>No claims match your filters.</td></tr>
              ) : filtered.map(c => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG['Not Started'];
                const dels = deliverables.filter(d => d.claim_id === c.id);
                const openDels = dels.filter(d => d.status !== 'Completed').length;
                const region = (c.address || '').split(',').slice(1).join(',').trim();
                return (
                  <tr key={c.id} onClick={() => onClaimClick(c)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="td-file-name">{c.name}{c.flagged && FLAG_ICON}</div>
                      <div className="td-sub">{region}</div>
                    </td>
                    <td><span className="td-mono">#{c.gnc}</span></td>
                    <td><span className="td-mono">#{c.claim}</span></td>
                    <td>
                      {c.consultant ? (
                        <div className="consultant-cell">
                          <div className="avatar-sm" style={{ background: c.consultant_color }}>{c.consultant_initials}</div>
                          <span>{c.consultant}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text3)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${cfg.pillClass}`}>
                        <span className="dot"></span>{c.status}
                      </span>
                    </td>
                    <td>
                      {openDels > 0
                        ? <span className="status-pill pill-yellow" style={{ fontSize: 10 }}><span className="dot"></span>{openDels} open</span>
                        : dels.length > 0
                          ? <span className="status-pill pill-green" style={{ fontSize: 10 }}><span className="dot"></span>All done</span>
                          : <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 11 }}>{c.last_updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}