import { useState, useEffect } from 'react';
import { STATUS_CONFIG } from '../data/index.js';

function ProgressBar({ progress, color }) {
  const [width, setWidth] = useState('0%');
  useEffect(() => { const t = setTimeout(() => setWidth(progress + '%'), 250); return () => clearTimeout(t); }, [progress]);
  return (
    <div className="table-progress">
      <div className="table-progress-track">
        <div className="table-progress-fill" style={{ width, background: color }}></div>
      </div>
      <span className="table-progress-pct">{progress}%</span>
    </div>
  );
}

export default function ClaimsPage({ claims, deliverables, currentRole, currentUserId, getClaimProgress, onClaimClick, onOpenNewClaim }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [consultantFilter, setConsultantFilter] = useState('all');
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

  const consultants = [...new Set(visibleClaims.map(c => c.consultant))];

  const filtered = visibleClaims.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = !s || c.name.toLowerCase().includes(s) || c.claim.includes(s) || c.gnc.includes(s);
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
        {!isJr && (
          <div className="page-actions">
            <button className="btn btn-primary btn-sm" onClick={onOpenNewClaim}>
              <svg width="12" height="12"><use href="#icon-plus" /></svg> New Claim File
            </button>
          </div>
        )}
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
            {!isJr && (
              <select className="filter-select" value={consultantFilter} onChange={e => setConsultantFilter(e.target.value)}>
                <option value="all">All Consultants</option>
                {consultants.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter('all'); setConsultantFilter('all'); }}>Clear</button>
          </div>
        </div>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>File / Insured</th><th>GNC #</th><th>Claim #</th><th>Consultant</th>
                <th>Status</th><th>Progress</th><th>Deliverables</th><th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 28, color: 'var(--text3)' }}>No claims match your filters.</td></tr>
              ) : filtered.map(c => {
                const cfg = STATUS_CONFIG[c.status];
                const dels = deliverables.filter(d => d.claimId === c.id);
                const openDels = dels.filter(d => d.status !== 'Completed').length;
                const region = (c.address || '').split(',').slice(1).join(',').trim();
                const progress = getClaimProgress(c.id);
                return (
                  <tr key={c.id} onClick={() => onClaimClick(c)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="td-file-name">{c.name}{c.flagged && FLAG_ICON}</div>
                      <div className="td-sub">{region}</div>
                    </td>
                    <td><span className="td-mono">#{c.gnc}</span></td>
                    <td><span className="td-mono">#{c.claim}</span></td>
                    <td>
                      <div className="consultant-cell">
                        <div className="avatar-sm" style={{ background: c.consultantColor }}>{c.consultantInitials}</div>
                        <span>{c.consultant}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${cfg.pillClass}`}>
                        <span className="dot"></span>{c.status}
                      </span>
                    </td>
                    <td><ProgressBar progress={progress} color={cfg.progressColor} /></td>
                    <td>
                      {openDels > 0
                        ? <span className="status-pill pill-yellow" style={{ fontSize: 10 }}><span className="dot"></span>{openDels} open</span>
                        : dels.length > 0
                          ? <span className="status-pill pill-green" style={{ fontSize: 10 }}><span className="dot"></span>All done</span>
                          : <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 11 }}>{c.lastUpdated}</td>
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