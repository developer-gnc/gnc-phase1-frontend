import { useState, useEffect } from 'react';

export default function Header({ currentRole }) {
  const roleLabel = currentRole === 'manager' ? 'Manager' : 'Consultant';
  const roleBadgeClass = currentRole === 'manager' ? 'role-badge-manager' : 'role-badge-consultant';

  return (
    <div className="header">
      <div className="header-left">
        <span className="header-breadcrumb">
          <span className="header-breadcrumb-muted">GNC Group Tools</span>
          <span className="header-breadcrumb-sep">/</span>
          <span className="header-breadcrumb-current">Claims Dashboard</span>
        </span>
      </div>
      <div className="header-right">
        <span className={`role-badge ${roleBadgeClass}`}>{roleLabel}</span>
      </div>
    </div>
  );
}