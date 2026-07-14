import { useState, useEffect } from "react";
import ClaimHeader from "./ClaimHeader.jsx";
import ClaimDeliverables from "./ClaimDeliverables.jsx";
import AddDeliverableForm from "./AddDeliverableForm.jsx";
import FullFileModal from "./FullFileModal.jsx";
import { StatusPill } from "../shared/StatusPill.jsx";

const STATUSES = ['Not Started', 'In Progress', 'Pending Approval', 'On Hold', 'Completed'];
const DELIVERABLE_TYPES = ['Site Visit', 'Report Writing', 'Photo Documentation', 'Estimate Preparation', 'Client Communication', 'Custom...'];

export default function ClaimModal({
  claim,
  deliverables,
  team,
  currentRole,
  currentUserEmail,
  getClaimProgress,
  onClose,
  onAddDeliverable,
  onUpdateDeliverable,
  onDeleteDeliverable,
  onDeleteClaim,
  onToggleFlag,
  onUpdateClaimStatus,
}) {
  const [newDelType, setNewDelType] = useState("Site Visit");
  const [newDelCustom, setNewDelCustom] = useState("");
  const [newDelAssignee, setNewDelAssignee] = useState("");
  const [newDelStatus, setNewDelStatus] = useState("Not Started");
  const [newDelDue, setNewDelDue] = useState("");
  const [showFullFile, setShowFullFile] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (claim) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNewDelDue(tomorrow.toISOString().slice(0, 10));
      setNewDelAssignee(team?.[0]?.email || "");
      setShowFullFile(false);
      setConfirmDelete(false);
    }
  }, [claim]);

  if (!claim) return null;

  const isManager = currentRole === "manager";
  const isOwner = claim.consultant_email === currentUserEmail;
  const canManage = isManager || isOwner;

  const dels = deliverables.filter((d) => d.claim_id === claim.id);
  const progress = getClaimProgress(claim.id);

  const handleAdd = () => {
    const name = newDelType === "Custom..." ? (newDelCustom.trim() || "Custom Task") : newDelType;
    onAddDeliverable(claim.id, {
      name,
      assigneeEmail: newDelAssignee,
      status: newDelStatus,
      priority: "Medium",
      due: newDelDue,
      note: "",
    });
    setNewDelCustom("");
  };

  if (showFullFile) {
    return (
      <FullFileModal
        claim={claim}
        deliverables={dels}
        getClaimProgress={getClaimProgress}
        onBack={() => setShowFullFile(false)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains("modal-overlay")) onClose(); }}>
      <div className="modal">
        <ClaimHeader claim={claim} onClose={onClose} onOpenFullFile={() => setShowFullFile(true)} />
        <div className="modal-body">
          <div className="modal-grid">
            <div className="modal-field">
              <div className="modal-field-label">Status</div>
              {canManage ? (
                <select
                  className="form-select"
                  style={{ fontSize: 12, padding: '4px 8px' }}
                  value={claim.status}
                  onChange={(e) => onUpdateClaimStatus(claim.id, e.target.value)}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <div className="modal-field-value"><StatusPill status={claim.status} /></div>
              )}
            </div>

            <div className="modal-field">
              <div className="modal-field-label">Progress</div>
              <div className="modal-field-value">{progress}%</div>
            </div>

            <div className="modal-field">
              <div className="modal-field-label">Lead Consultant</div>
              <div className="modal-field-value">
                <div className="consultant-cell">
                  <div className="avatar-xs" style={{ background: claim.consultant_color }}>
                    {claim.consultant_initials}
                  </div>
                  <span>{claim.consultant}</span>
                </div>
              </div>
            </div>

            <div className="modal-field">
              <div className="modal-field-label">Date of Loss</div>
              <div className="modal-field-value mono">{claim.date_of_loss}</div>
            </div>

            <div className="modal-field">
              <div className="modal-field-label">Last Updated</div>
              <div className="modal-field-value">{claim.last_updated}</div>
            </div>

            <div className="modal-field">
              <div className="modal-field-label">Flagged</div>
              <div className="modal-field-value">
                {canManage ? (
                  <button
                    className={`btn btn-sm ${claim.flagged ? 'btn-danger' : 'btn-ghost'}`}
                    onClick={() => onToggleFlag(claim.id)}
                    style={{ gap: 5 }}
                  >
                    <svg width="11" height="11"><use href="#icon-flag" /></svg>
                    {claim.flagged ? 'Flagged — Remove Flag' : 'Flag this file'}
                  </button>
                ) : (
                  claim.flagged
                    ? <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 12 }}>⚑ Flagged</span>
                    : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                )}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, marginBottom: 18 }}>
            {claim.description}
          </p>

          <div className="modal-section-title">
            <span>Deliverables & Task Assignments</span>
            <span className="canada-time-badge">
              <span className="canada-flag">🇨🇦</span>
              Due dates in Canada (MDT)
            </span>
          </div>

          <ClaimDeliverables
            deliverables={dels}
            team={team}
            currentRole={currentRole}
            currentUserEmail={currentUserEmail}
            onUpdateDeliverable={onUpdateDeliverable}
            onDeleteDeliverable={onDeleteDeliverable}
          />

          {canManage && (
            <AddDeliverableForm
              team={team}
              deliverableTypes={DELIVERABLE_TYPES}
              newDelType={newDelType}
              setNewDelType={setNewDelType}
              newDelCustom={newDelCustom}
              setNewDelCustom={setNewDelCustom}
              newDelAssignee={newDelAssignee}
              setNewDelAssignee={setNewDelAssignee}
              newDelStatus={newDelStatus}
              setNewDelStatus={setNewDelStatus}
              newDelDue={newDelDue}
              setNewDelDue={setNewDelDue}
              onAdd={handleAdd}
            />
          )}

          {isManager && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {!confirmDelete ? (
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
                  <svg width="11" height="11"><use href="#icon-trash" /></svg>
                  Delete Claim File
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                    Permanently delete this claim and all its deliverables?
                  </span>
                  <button className="btn btn-danger btn-sm" onClick={() => onDeleteClaim(claim.id)}>Yes, delete</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}