import { useState, useEffect } from "react";
import ClaimHeader from "./ClaimHeader.jsx";
import ClaimDeliverables from "./ClaimDeliverables.jsx";
import AddDeliverableForm from "./AddDeliverableForm.jsx";
import FullClaimPage from "../../pages/FullClaimPage.jsx";
import { StatusPill } from "../shared/StatusPill.jsx";
import Dropdown from "../shared/Dropdown.jsx";

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
  onUpdateClaim,
  onOpenNewClaim,
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

  const isManager = currentRole === "manager" || currentRole === "director";
  const isOwner = claim.consultant_email === currentUserEmail || claim.manager_email === currentUserEmail;
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
      <FullClaimPage
        claim={claim}
        team={team}
        deliverables={dels}
        onAddDeliverable={onAddDeliverable}
        onBack={() => setShowFullFile(false)}
        onSaveClaim={onUpdateClaim}
        onOpenNewClaim={onOpenNewClaim}
      />
    );
  }

  return (
    <div className="modal-overlay show">
      <div className="modal">
        <ClaimHeader claim={claim} onClose={onClose} onOpenFullFile={() => setShowFullFile(true)} />
        <div className="modal-body">
          <div className="modal-grid">
            <div className="modal-field">
              <div className="modal-field-label">Status</div>
              {canManage ? (
                <Dropdown
                  value={claim.status}
                  options={STATUSES.map(s => ({ value: s, label: s }))}
                  onChange={(val) => onUpdateClaimStatus(claim.id, val)}
                />
              ) : (
                <div className="modal-field-value"><StatusPill status={claim.status} /></div>
              )}
            </div>


            <div className="modal-field">
              <div className="modal-field-label">Manager</div>
              <div className="modal-field-value">
                {claim.manager ? (
                  <div className="consultant-cell">
                    <div className="avatar-xs" style={{ background: claim.manager_color }}>
                      {claim.manager_initials}
                    </div>
                    <span>{claim.manager}</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text3)' }}>—</span>
                )}
              </div>
            </div>

            <div className="modal-field">
              <div className="modal-field-label">Consultant</div>
              <div className="modal-field-value">
                {claim.consultant ? (
                  <div className="consultant-cell">
                    <div className="avatar-xs" style={{ background: claim.consultant_color }}>
                      {claim.consultant_initials}
                    </div>
                    <span>{claim.consultant}</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text3)' }}>—</span>
                )}
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
              <div className="modal-field-label">Progress</div>
              <div className="modal-field-value">
                {dels.length > 0 ? (
                  <div className="table-progress" style={{ maxWidth: 160 }}>
                    <div className="table-progress-track">
                      <div className="table-progress-fill" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
                    </div>
                    <span className="table-progress-pct">{progress}%</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text3)' }}>—</span>
                )}
              </div>
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

            {claim.onedrive_link && (
              <div className="modal-field">
                <div className="modal-field-label">Documents</div>
                <div className="modal-field-value">
                  <a href={claim.onedrive_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                    Open OneDrive Folder →
                  </a>
                </div>
              </div>
            )}
          </div>

          {claim.description && (
            <div className="full-desc" style={{ marginBottom: 4 }}>
              {claim.description}
            </div>
          )}

          <div className="modal-section-title">
            <span>Deliverables & Task Assignments</span>
            <span className="canada-time-badge">
            Due dates in Canada Timezone (MDT)
            </span>
          </div>

          <ClaimDeliverables
            deliverables={dels.filter((d) => !d.is_calling_task)}
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

          <div className="modal-section-title">
            <span>Operations</span>
          </div>

          <ClaimDeliverables
            deliverables={dels.filter((d) => d.is_calling_task)}
            team={team}
            currentRole={currentRole}
            currentUserEmail={currentUserEmail}
            onUpdateDeliverable={onUpdateDeliverable}
            onDeleteDeliverable={onDeleteDeliverable}
          />

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