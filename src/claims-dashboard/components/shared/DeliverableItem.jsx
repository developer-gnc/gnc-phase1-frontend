import { useState, useRef } from 'react';
import { formatDue, canadaTimeStr, canadaTimeZoneAbbr } from '../../utils/index.js';
import { PriorityBadge } from './StatusPill.jsx';

const STATUS_META = {
  'Not Started': { color: '#71717a', label: 'Not Started' },
  'In Progress': { color: '#2563eb', label: 'In Progress' },
  'Pending Approval': { color: '#f59e0b', label: 'Pending Approval' },
  'On Hold': { color: '#ef4444', label: 'On Hold' },
  'Completed': { color: '#4ade80', label: 'Completed' },
};

const HOLD_DURATION = 650; // ms to hold before triggering On Hold
const HOLD_UI_DELAY = 150; // ms before the hold animation is even shown — filters out normal clicks
const CIRCUMFERENCE = 2 * Math.PI * 10; // r=10

export default function DeliverableItem({ deliverable: d, claims, team, showClaim = true, canEdit = false, currentUserEmail, onCycleStatus, onUpdateDeliverable, onDelete }) {
  const assignee = (team || []).find(m => m.email === d.assignee_email);
  const claim = (claims || []).find(c => c.id === d.claim_id);
  const due = d.due ? formatDue(d.due) : null;
  const canadaTime = d.due ? canadaTimeStr(d.due) : null;
  const canCycle = canEdit || d.assignee_email === currentUserEmail;
  const isDone = d.status === 'Completed';
  const statusMeta = STATUS_META[d.status] || STATUS_META['Not Started'];

  const [holding, setHolding] = useState(false);
  const [justHeld, setJustHeld] = useState(false);
  const holdTimer = useRef(null);
  const uiTimer = useRef(null);
  const pressStart = useRef(0);

  function startHold() {
    if (!canCycle) return;
    pressStart.current = Date.now();

    // Don't show any hold feedback until the press has lasted HOLD_UI_DELAY —
    // this is what keeps a normal click from ever looking like a hold.
    uiTimer.current = setTimeout(() => {
      setHolding(true);
    }, HOLD_UI_DELAY);

    holdTimer.current = setTimeout(() => {
      onUpdateDeliverable(d.id, 'status', 'On Hold');
      setHolding(false);
      setJustHeld(true);
      setTimeout(() => setJustHeld(false), 450);
    }, HOLD_DURATION);
  }

  function endHold(allowClick) {
    if (uiTimer.current) {
      clearTimeout(uiTimer.current);
      uiTimer.current = null;
    }
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    const elapsed = Date.now() - pressStart.current;
    setHolding(false);
    if (allowClick && elapsed < HOLD_DURATION && canCycle) {
      onCycleStatus(d.id);
    }
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'var(--white)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px 20px', marginBottom: 10,
        transition: 'all 0.14s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div
        style={{ position: 'relative', width: 26, height: 26, flexShrink: 0 }}
        onMouseDown={startHold}
        onMouseUp={() => endHold(true)}
        onMouseLeave={() => endHold(false)}
        onTouchStart={startHold}
        onTouchEnd={() => endHold(true)}
        title={canCycle ? 'Click to cycle status · Hold to put on hold' : 'View only'}
      >
        {/* Progress ring — fills as you hold */}
        {canCycle && (
          <svg width="26" height="26" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)', pointerEvents: 'none' }}>
            <circle
              cx="13" cy="13" r="10" fill="none"
              stroke="#ef4444" strokeWidth="2" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={holding ? 0 : CIRCUMFERENCE}
              style={{
                transition: holding
                  ? `stroke-dashoffset ${HOLD_DURATION - HOLD_UI_DELAY}ms linear`
                  : 'stroke-dashoffset 200ms ease-out',
                opacity: holding ? 1 : 0,
              }}
            />
          </svg>
        )}

        {/* Checkbox circle */}
        <div
          style={{
            position: 'absolute', top: 3, left: 3,
            width: 20, height: 20, borderRadius: '50%',
            border: `2px solid ${isDone ? '#4ade80' : 'var(--border2)'}`,
            background: isDone ? '#4ade80' : 'transparent',
            cursor: canCycle ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s',
            transform: justHeld ? 'scale(1.25)' : holding ? 'scale(0.9)' : 'scale(1)',
            boxShadow: justHeld ? '0 0 0 6px rgba(239,68,68,0.15)' : 'none',
          }}
        >
          {isDone && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {d.status === 'On Hold' && !isDone && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 600, marginBottom: 5,
          color: isDone ? 'var(--text3)' : 'var(--text)',
          textDecoration: isDone ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {d.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {showClaim && claim && (
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              GNC #{claim.gnc} · {claim.name}
            </span>
          )}
          {canadaTime && (
            <span className="canada-time-badge">{canadaTime} {canadaTimeZoneAbbr()}</span>
          )}
          {due && due.overdue && (
            <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>{due.text}</span>
          )}
          {due && !due.overdue && (
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>{due.text}</span>
          )}
          <PriorityBadge priority={d.priority} />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 10.5, fontWeight: 600, color: statusMeta.color,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusMeta.color }} />
            {statusMeta.label}
          </span>
        </div>
      </div>

      {assignee && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', background: assignee.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
          }}>
            {assignee.initials}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{assignee.name?.split(' ')[0] || ''}</span>
        </div>
      )}

      {canEdit && onDelete && (
        <button
          onClick={() => onDelete(d.id)}
          title="Remove"
          style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            cursor: 'pointer', padding: 6, borderRadius: 6, flexShrink: 0,
            display: 'flex', alignItems: 'center', transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
        >
          <svg width="15" height="15"><use href="#icon-trash" /></svg>
        </button>
      )}
    </div>
  );
}