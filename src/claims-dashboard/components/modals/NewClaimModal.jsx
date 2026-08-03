import { useState } from "react";

export default function NewClaimModal({ team, onClose, onSave }) {
  const managers = team.filter(m => m.role === 'manager' || m.role === 'director');
  const consultants = team.filter(m => m.role === 'consultant');

  const [name, setName] = useState("");
  const [gnc, setGnc] = useState("");
  const [claim, setClaim] = useState("");
  const [dol, setDol] = useState("");
  const [managerEmail, setManagerEmail] = useState(managers[0]?.email || "");
  const [consultantEmail, setConsultantEmail] = useState(consultants[0]?.email || "");
  const [status, setStatus] = useState("Not Started");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [typeOfLoss, setTypeOfLoss] = useState("Fire");
  const [typeOfLossCustom, setTypeOfLossCustom] = useState("");
  const [onedriveLink, setOnedriveLink] = useState("");

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

    const selectedManager = team.find((m) => m.email === managerEmail);
    const selectedConsultant = team.find((m) => m.email === consultantEmail);

    onSave({
      name: name.trim(),
      gnc: gnc.trim(),
      claim: claim.trim(),
      date_of_loss: dol,
      manager_email: managerEmail || null,
      manager: selectedManager?.name || "",
      manager_initials: selectedManager?.initials || "",
      manager_color: selectedManager?.color || "#8fa0c0",
      consultant_email: consultantEmail || null,
      consultant: selectedConsultant?.name || "",
      consultant_initials: selectedConsultant?.initials || "",
      consultant_color: selectedConsultant?.color || "#8fa0c0",
      status,
      type_of_loss: typeOfLoss === "Other..." ? typeOfLossCustom.trim() : typeOfLoss,
      address: address.trim(),
      description: description.trim(),
      onedrive_link: onedriveLink.trim(),
    });
  }

  return (
    <div className="modal-overlay show">
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
              <label className="form-label">GNC Assigned Manager</label>
              <select className="form-select" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)}>
                <option value="">— None —</option>
                {managers.map((m) => (
                  <option key={m.email} value={m.email}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">GNC Assigned Consultant</label>
              <select className="form-select" value={consultantEmail} onChange={(e) => setConsultantEmail(e.target.value)}>
                <option value="">— None —</option>
                {consultants.map((m) => (
                  <option key={m.email} value={m.email}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-3">
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
            <div className="form-field">
              <label className="form-label">Type of Loss</label>
              <select className="form-select" value={typeOfLoss} onChange={(e) => setTypeOfLoss(e.target.value)}>
                <option value="Fire">Fire</option>
                <option value="Water">Water</option>
                <option value="Flood">Flood</option>
                <option value="Wind">Wind</option>
                <option value="Hail">Hail</option>
                <option value="Wildfire">Wildfire</option>
                <option value="Vandalism">Vandalism</option>
                <option value="Structural">Structural</option>
                <option value="Under-Deductible">Under-Deductible</option>
                <option value="Pre-Loss Risk Assessment">Pre-Loss Risk Assessment</option>
                <option value="Other...">Other...</option>
              </select>
              {typeOfLoss === "Other..." && (
                <input
                  className="form-input"
                  placeholder="Specify type of loss..."
                  value={typeOfLossCustom}
                  onChange={(e) => setTypeOfLossCustom(e.target.value)}
                  style={{ marginTop: 6 }}
                />
              )}
            </div>
            <div className="form-field">
              <label className="form-label">Address</label>
              <input
                className="form-input"
                placeholder="123 Main St, City, Province"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">OneDrive Folder Link</label>
              <input
                className="form-input"
                placeholder="https://..."
                value={onedriveLink}
                onChange={(e) => setOnedriveLink(e.target.value)}
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