import { useState } from "react";

export default function NewClaimModal({ team, onClose, onSave }) {
  const [name, setName] = useState("");
  const [gnc, setGnc] = useState("");
  const [claim, setClaim] = useState("");
  const [dol, setDol] = useState("");
  const [consultantEmail, setConsultantEmail] = useState(team[0]?.email || "");
  const [status, setStatus] = useState("Not Started");
  const [address, setAddress] = useState("");
  const [progress, setProgress] = useState(0);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!name.trim()) e.name = "Required";
    if (!gnc.trim()) e.gnc = "Required";
    if (!claim.trim()) e.claim = "Required";
    if (!dol) e.dol = "Required";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const selectedMember = team.find((m) => m.email === consultantEmail);
    onSave({
      name: name.trim(),
      gnc: gnc.trim(),
      claim: claim.trim(),
      date_of_loss: dol,
      consultant_email: consultantEmail,
      consultant: selectedMember?.name || "",
      consultant_initials: selectedMember?.initials || "",
      consultant_color: selectedMember?.color || "#8fa0c0",
      status,
      progress: parseInt(progress) || 0,
      address: address.trim(),
      description: description.trim(),
    });
  }

  return (
    <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains("modal-overlay")) onClose(); }}>
      <div className="modal" style={{ width: 760 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">New Claim File</div>
            <div className="modal-subtitle">Fill in the details to create a new claim</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg><use href="#icon-x" /></svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Insured / File Name *</label>
              <input
                className={`form-input${errors.name ? ' input-err' : ''}`}
                placeholder="e.g. Kootenay Christian"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-field">
              <label className="form-label">GNC # *</label>
              <input
                className={`form-input${errors.gnc ? ' input-err' : ''}`}
                placeholder="e.g. 4082"
                value={gnc}
                onChange={(e) => { setGnc(e.target.value); setErrors((p) => ({ ...p, gnc: '' })); }}
              />
              {errors.gnc && <div className="form-error">{errors.gnc}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Claim # *</label>
              <input
                className={`form-input${errors.claim ? ' input-err' : ''}`}
                placeholder="e.g. 18305115"
                value={claim}
                onChange={(e) => { setClaim(e.target.value); setErrors((p) => ({ ...p, claim: '' })); }}
              />
              {errors.claim && <div className="form-error">{errors.claim}</div>}
            </div>
            <div className="form-field">
              <label className="form-label">Date of Loss *</label>
              <input
                type="date"
                className={`form-input${errors.dol ? ' input-err' : ''}`}
                value={dol}
                onChange={(e) => { setDol(e.target.value); setErrors((p) => ({ ...p, dol: '' })); }}
              />
              {errors.dol && <div className="form-error">{errors.dol}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Lead Consultant</label>
              <select className="form-select" value={consultantEmail} onChange={(e) => setConsultantEmail(e.target.value)}>
                {team.map((m) => (
                  <option key={m.email} value={m.email}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Address</label>
              <input
                className="form-input"
                placeholder="123 Main St, City, Province"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Progress (%)</label>
              <input
                type="number"
                className="form-input"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field" style={{ marginBottom: 14 }}>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Brief description of the claim..."
              style={{ resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <svg width="11" height="11"><use href="#icon-plus" /></svg> Save Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}