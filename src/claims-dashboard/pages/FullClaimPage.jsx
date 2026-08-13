import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient.js";
import Dropdown from "../components/shared/Dropdown.jsx";

const AVAILABLE_SECTIONS = [
  { key: "engineering_inspection", label: "Engineering/Inspection" },
  { key: "site_visit", label: "Site Visit" },
  { key: "demolition_scope", label: "Demolition Scope of Work" },
  { key: "demolition_bid_tendering", label: "Demolition Bid Tendering" },
  { key: "demolition_bid_recommendation", label: "Demolition Bid Recommendation & Award" },
  { key: "building_finishes", label: "Building Finishes Sheet" },
  { key: "reconstruction_scope", label: "Reconstruction Scope of Work" },
  { key: "reconstruction_bid_tendering", label: "Reconstruction Bid Tendering" },
  { key: "reconstruction_bid_recommendation", label: "Reconstruction Bid Recommendation & Award" },
  { key: "rcv_acv_reserve", label: "RCV/ACV Reserve Details" },
];

const SECTION_FIELDS = {
  site_visit: [
    { key: "visit_date", label: "Visit Date", type: "date" },
    { key: "attendees", label: "Attendees", type: "text", placeholder: "Names of people present" },
    { key: "weather_conditions", label: "Weather Conditions", type: "text" },
    { key: "site_observations", label: "Site Observations", type: "textarea" },
    { key: "access_issues", label: "Access Issues", type: "textarea" },
  ],
  demolition_scope: [
    { key: "scope_description", label: "Scope Description", type: "textarea" },
    { key: "areas_affected", label: "Areas Affected", type: "text" },
    { key: "square_footage", label: "Square Footage", type: "text" },
    { key: "special_considerations", label: "Special Considerations", type: "textarea" },
  ],
  demolition_bid_tendering: [
    { key: "bidders_invited", label: "Bidders Invited", type: "textarea", placeholder: "One per line" },
    { key: "bid_due_date", label: "Bid Due Date", type: "date" },
    { key: "bids_received", label: "Number of Bids Received", type: "text" },
  ],
  demolition_bid_recommendation: [
    { key: "recommended_bidder", label: "Recommended Bidder", type: "text" },
    { key: "recommended_amount", label: "Recommended Amount", type: "text" },
    { key: "justification", label: "Justification", type: "textarea" },
    { key: "award_date", label: "Award Date", type: "date" },
  ],
  building_finishes: [
    { key: "flooring", label: "Flooring", type: "text" },
    { key: "walls", label: "Walls", type: "text" },
    { key: "ceiling", label: "Ceiling", type: "text" },
    { key: "trim_millwork", label: "Trim / Millwork", type: "text" },
    { key: "fixtures", label: "Fixtures", type: "text" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
  reconstruction_scope: [
    { key: "scope_description", label: "Scope Description", type: "textarea" },
    { key: "areas_affected", label: "Areas Affected", type: "text" },
    { key: "square_footage", label: "Square Footage", type: "text" },
    { key: "special_considerations", label: "Special Considerations", type: "textarea" },
  ],
  reconstruction_bid_tendering: [
    { key: "bidders_invited", label: "Bidders Invited", type: "textarea", placeholder: "One per line" },
    { key: "bid_due_date", label: "Bid Due Date", type: "date" },
    { key: "bids_received", label: "Number of Bids Received", type: "text" },
  ],
  reconstruction_bid_recommendation: [
    { key: "recommended_bidder", label: "Recommended Bidder", type: "text" },
    { key: "recommended_amount", label: "Recommended Amount", type: "text" },
    { key: "justification", label: "Justification", type: "textarea" },
    { key: "award_date", label: "Award Date", type: "date" },
  ],
  rcv_acv_reserve: [
    { key: "rcv_amount", label: "RCV Amount", type: "text" },
    { key: "acv_amount", label: "ACV Amount", type: "text" },
    { key: "depreciation", label: "Depreciation", type: "text" },
    { key: "reserve_amount", label: "Reserve Amount", type: "text" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
};

function SectionCard({ id, title, onRemove, children }) {
  return (
    <div
      id={id}
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "28px 32px",
        marginBottom: 24,
        scrollMarginTop: 90,
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border)"
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        {onRemove && (
          <button
            onClick={onRemove}
            style={{
              background: "none", border: "1px solid var(--border2)", borderRadius: 7,
              color: "var(--text3)", fontSize: 11, padding: "5px 11px", cursor: "pointer",
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => { e.target.style.color = 'var(--danger)'; e.target.style.borderColor = 'var(--danger)'; }}
            onMouseLeave={(e) => { e.target.style.color = 'var(--text3)'; e.target.style.borderColor = 'var(--border2)'; }}
          >
            Remove section
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, span2 }) {
  return (
    <div className="form-field" style={span2 ? { gridColumn: "1 / -1" } : undefined}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function SectionForm({ sectionType, content, onChange }) {
  const fields = SECTION_FIELDS[sectionType] || [];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
      {fields.map((f) => (
        <Field key={f.key} label={f.label} span2={f.type === "textarea"}>
          {f.type === "textarea" ? (
            <textarea
              className="form-input" rows={3} style={{ resize: "vertical" }}
              placeholder={f.placeholder || ""}
              value={content[f.key] || ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          ) : (
            <input
              type={f.type === "date" ? "date" : "text"}
              className="form-input"
              placeholder={f.placeholder || ""}
              value={content[f.key] || ""}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          )}
        </Field>
      ))}
    </div>
  );
}

export default function FullClaimPage({ claim, team, deliverables = [], onAddDeliverable, onBack, onSaveClaim }) {
  const [form, setForm] = useState({ ...claim });
  const [engineers, setEngineers] = useState([]);
  const [activeSections, setActiveSections] = useState([]);
  const [sectionContent, setSectionContent] = useState({});
  const [activeNavKey, setActiveNavKey] = useState("file_details");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    setForm({ ...claim });
    loadEngineers();
    loadSections();
  }, [claim.id]);

  async function loadEngineers() {
    const { data } = await supabase.from("claim_engineers").select("*").eq("claim_id", claim.id).order("sort_order");
    setEngineers(data || []);
  }

  async function loadSections() {
    const { data } = await supabase
      .from("claim_sections")
      .select("*")
      .eq("claim_id", claim.id)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    setActiveSections(data || []);
    const contentMap = {};
    (data || []).forEach((s) => { contentMap[s.id] = s.content || {}; });
    setSectionContent(contentMap);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateSectionField(sectionId, fieldKey, value) {
    setSectionContent((prev) => ({ ...prev, [sectionId]: { ...(prev[sectionId] || {}), [fieldKey]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    await onSaveClaim(claim.id, form);

    await supabase.from("claim_engineers").delete().eq("claim_id", claim.id);
    if (engineers.length > 0) {
      const payload = engineers.map((e, idx) => ({
        claim_id: claim.id, type: e.type, name: e.name, organization: e.organization,
        engaged_for: e.engaged_for, comments: e.comments, sort_order: idx,
      }));
      await supabase.from("claim_engineers").insert(payload);
    }
    await loadEngineers();

    for (const section of activeSections) {
      await supabase.from("claim_sections").update({ content: sectionContent[section.id] || {} }).eq("id", section.id);
    }

    setSaving(false);
    setLastSaved(new Date());
  }

  function addEngineerRow() {
    setEngineers((prev) => [...prev, { type: "", name: "", organization: "", engaged_for: "", comments: "" }]);
  }
  function updateEngineerRow(index, field, value) {
    setEngineers((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  }
  function removeEngineerRow(index) {
    setEngineers((prev) => prev.filter((_, i) => i !== index));
  }

  async function addSection(sectionKey) {
    const nextOrder = activeSections.length;
    const { data, error } = await supabase
      .from("claim_sections").insert([{ claim_id: claim.id, section_type: sectionKey, content: {}, sort_order: nextOrder }]).select();
    if (!error) {
      setActiveSections((prev) => [...prev, data[0]]);
      setSectionContent((prev) => ({ ...prev, [data[0].id]: {} }));
      setTimeout(() => scrollToSection(sectionKey), 100);
    }
  }

  async function removeSection(sectionId) {
    const { error } = await supabase.from("claim_sections").delete().eq("id", sectionId);
    if (!error) setActiveSections((prev) => prev.filter((s) => s.id !== sectionId));
  }

  const [callingTaskForms, setCallingTaskForms] = useState({});
  const [progressLogForms, setProgressLogForms] = useState({});
  const operationsTeam = team.filter((t) => t.is_operations);

  function updateProgressLogForm(sectionId, field, value) {
    setProgressLogForms((prev) => ({ ...prev, [sectionId]: { ...(prev[sectionId] || {}), [field]: value } }));
  }

  async function addProgressLogEntry(sectionId) {
    const form = progressLogForms[sectionId] || {};
    if (!form.desc || !form.updatedBy) return;

    const entry = {
      id: Date.now().toString(),
      description: form.desc,
      target_date: form.date || "",
      percent_complete: form.percent ? parseInt(form.percent, 10) : 0,
      updated_by_email: form.updatedBy,
      created_at: new Date().toISOString(),
    };

    const existingLog = (sectionContent[sectionId]?.progress_log) || [];
    const newLog = [entry, ...existingLog];
    const newContent = { ...(sectionContent[sectionId] || {}), progress_log: newLog };

    setSectionContent((prev) => ({ ...prev, [sectionId]: newContent }));
    setProgressLogForms((prev) => ({ ...prev, [sectionId]: { desc: "", date: "", percent: "", updatedBy: "" } }));

    await supabase.from("claim_sections").update({ content: newContent }).eq("id", sectionId);
  }

  function updateCallingTaskForm(sectionId, field, value) {
    setCallingTaskForms((prev) => ({ ...prev, [sectionId]: { ...(prev[sectionId] || {}), [field]: value } }));
  }

  function addCallingTask(sectionId) {
    const form = callingTaskForms[sectionId] || {};
    if (!form.desc || !form.assignee) return;
    onAddDeliverable(claim.id, {
      name: form.desc,
      assigneeEmail: form.assignee,
      status: "Not Started",
      due: form.due || "",
      priority: form.priority || "Medium",
      note: "",
      sectionId,
      isCallingTask: true,
    });
    setCallingTaskForms((prev) => ({ ...prev, [sectionId]: { desc: "", assignee: "", due: "", priority: "Medium" } }));
  }

  async function moveSection(sectionId, direction) {
    const idx = activeSections.findIndex((s) => s.id === sectionId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= activeSections.length) return;

    const reordered = [...activeSections];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    setActiveSections(reordered);

    await supabase.from("claim_sections").update({ sort_order: idx }).eq("id", reordered[idx].id);
    await supabase.from("claim_sections").update({ sort_order: swapIdx }).eq("id", reordered[swapIdx].id);
  }

  function scrollToSection(key) {
    setActiveNavKey(key);
    const el = document.getElementById(`section-${key}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const addedSectionKeys = activeSections.map((s) => s.section_type);
  const availableToAdd = AVAILABLE_SECTIONS.filter((s) => !addedSectionKeys.includes(s.key));

  const navItem = (key, label) => (
    <div
      key={key}
      onClick={() => scrollToSection(key)}
      style={{
        padding: "9px 14px",
        cursor: "pointer",
        fontSize: 12.5,
        fontWeight: activeNavKey === key ? 600 : 500,
        color: activeNavKey === key ? "var(--text)" : "var(--text2)",
        borderLeft: `2px solid ${activeNavKey === key ? "var(--accent)" : "transparent"}`,
        background: activeNavKey === key ? "rgba(37,99,235,0.08)" : "transparent",
        transition: "all 0.12s",
        borderRadius: "0 6px 6px 0",
      }}
    >
      {label}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--bg)", overflowY: "auto", zIndex: 600 }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px", borderBottom: "1px solid var(--border)", background: "var(--white)",
        position: "sticky", top: 0, zIndex: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", letterSpacing: "-0.01em" }}>{form.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 2 }}>
              GNC #{form.gnc} · Claim #{form.claim} · {form.loss_address || form.address}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="status-pill pill-yellow">{form.status}</span>
          {lastSaved && (
            <span style={{ fontSize: 11, color: "var(--text3)" }}>
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>Close</button>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto" }}>
        {/* Left nav */}
        <div style={{ width: 240, flexShrink: 0, padding: "28px 16px", position: "sticky", top: 65, alignSelf: "flex-start", maxHeight: "calc(100vh - 65px)", overflowY: "auto" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "0 14px", marginBottom: 8 }}>
            On this page
          </div>
          {navItem("file_details", "File Details")}
          {activeSections.map((s, idx) => {
            const meta = AVAILABLE_SECTIONS.find((a) => a.key === s.section_type);
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {navItem(s.section_type, meta?.label || s.section_type)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, gap: 1 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveSection(s.id, "up"); }}
                    disabled={idx === 0}
                    title="Move up"
                    style={{
                      background: "none", border: "none", padding: 0, lineHeight: 1, fontSize: 9,
                      cursor: idx === 0 ? "default" : "pointer",
                      color: idx === 0 ? "var(--border2)" : "var(--text3)",
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveSection(s.id, "down"); }}
                    disabled={idx === activeSections.length - 1}
                    title="Move down"
                    style={{
                      background: "none", border: "none", padding: 0, lineHeight: 1, fontSize: 9,
                      cursor: idx === activeSections.length - 1 ? "default" : "pointer",
                      color: idx === activeSections.length - 1 ? "var(--border2)" : "var(--text3)",
                    }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            );
          })}

          {availableToAdd.length > 0 && (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "20px 14px 8px" }}>
                Add sections
              </div>
              {availableToAdd.map((s) => (
                <div key={s.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 14px", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>{s.label}</span>
                  <button
                    onClick={() => addSection(s.key)}
                    style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 15, cursor: "pointer", lineHeight: 1, padding: 2 }}
                    title={`Add ${s.label}`}
                  >
                    +
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Scrolling content */}
        <div style={{ flex: 1, padding: "28px 32px 80px", minWidth: 0 }}>
          <SectionCard id="section-file_details" title="File Details">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
              <Field label="Insured / File Name">
                <input className="form-input" value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} />
              </Field>
              <Field label="Loss Address">
                <input className="form-input" value={form.loss_address || form.address || ""} onChange={(e) => updateField("loss_address", e.target.value)} />
              </Field>
              <Field label="Date of Loss">
                <input type="date" className="form-input" value={form.date_of_loss || ""} onChange={(e) => updateField("date_of_loss", e.target.value)} />
              </Field>
              <Field label="Assignment Date">
                <input type="date" className="form-input" value={form.assignment_date || ""} onChange={(e) => updateField("assignment_date", e.target.value)} />
              </Field>
              <Field label="GNC File #">
                <input className="form-input" value={form.gnc || ""} onChange={(e) => updateField("gnc", e.target.value)} />
              </Field>
              <Field label="Claim #">
                <input className="form-input" value={form.claim || ""} onChange={(e) => updateField("claim", e.target.value)} />
              </Field>
              <Field label="GNC Assigned Manager">
                <Dropdown
                  value={form.manager_email || ""}
                  placeholder="— None —"
                  options={team.filter(t => t.role === "manager" || t.role === "director").map(m => ({ value: m.email, label: m.name }))}
                  onChange={(email) => {
                    const m = team.find(t => t.email === email);
                    updateField("manager_email", email);
                    updateField("manager", m?.name || "");
                    updateField("manager_initials", m?.initials || "");
                    updateField("manager_color", m?.color || "");
                  }}
                />
              </Field>
              <Field label="GNC Assigned Consultant">
                <Dropdown
                  value={form.consultant_email || ""}
                  placeholder="— None —"
                  options={team.filter(t => t.role === "consultant").map(c => ({ value: c.email, label: c.name }))}
                  onChange={(email) => {
                    const c = team.find(t => t.email === email);
                    updateField("consultant_email", email);
                    updateField("consultant", c?.name || "");
                    updateField("consultant_initials", c?.initials || "");
                    updateField("consultant_color", c?.color || "");
                  }}
                />
              </Field>
              <Field label="Adjuster Name">
                <input className="form-input" placeholder="Full name" value={form.adjuster_name || ""} onChange={(e) => updateField("adjuster_name", e.target.value)} />
              </Field>
              <Field label="Adjuster Company">
                <input className="form-input" placeholder="Insurance company" value={form.adjuster_company || ""} onChange={(e) => updateField("adjuster_company", e.target.value)} />
              </Field>
              <Field label="Examiner Name">
                <input className="form-input" placeholder="If applicable" value={form.examiner_name || ""} onChange={(e) => updateField("examiner_name", e.target.value)} />
              </Field>
              <Field label="Examiner Company">
                <input className="form-input" placeholder="If applicable" value={form.examiner_company || ""} onChange={(e) => updateField("examiner_company", e.target.value)} />
              </Field>
              <Field label="Brief Description" span2>
                <textarea className="form-input" rows={3} style={{ resize: "vertical" }} value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} />
              </Field>
            </div>
          </SectionCard>

          {activeSections.map((s) => {
            const meta = AVAILABLE_SECTIONS.find((a) => a.key === s.section_type);
            return (
              <SectionCard
                key={s.id}
                id={`section-${s.section_type}`}
                title={meta?.label || s.section_type}
                onRemove={() => removeSection(s.id)}
              >
                {s.section_type === "engineering_inspection" ? (
                  <>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["TYPE", "NAME", "ORGANIZATION", "ENGAGED FOR", "COMMENTS", ""].map((h) => (
                            <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.05em", padding: "0 8px 10px" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {engineers.map((e, i) => (
                          <tr key={i}>
                            <td style={{ padding: "6px 8px" }}><input className="form-input" placeholder="Type" value={e.type || ""} onChange={(ev) => updateEngineerRow(i, "type", ev.target.value)} /></td>
                            <td style={{ padding: "6px 8px" }}><input className="form-input" placeholder="Name" value={e.name || ""} onChange={(ev) => updateEngineerRow(i, "name", ev.target.value)} /></td>
                            <td style={{ padding: "6px 8px" }}><input className="form-input" placeholder="Firm" value={e.organization || ""} onChange={(ev) => updateEngineerRow(i, "organization", ev.target.value)} /></td>
                            <td style={{ padding: "6px 8px" }}><input className="form-input" placeholder="Purpose" value={e.engaged_for || ""} onChange={(ev) => updateEngineerRow(i, "engaged_for", ev.target.value)} /></td>
                            <td style={{ padding: "6px 8px" }}><textarea className="form-input" rows={1} placeholder="Comments..." value={e.comments || ""} onChange={(ev) => updateEngineerRow(i, "comments", ev.target.value)} /></td>
                            <td style={{ padding: "6px 8px" }}>
                              <button onClick={() => removeEngineerRow(i)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={addEngineerRow}>+ Add Engineer</button>
                  </>
                ) : (
                  <SectionForm
                    sectionType={s.section_type}
                    content={sectionContent[s.id] || {}}
                    onChange={(fieldKey, value) => updateSectionField(s.id, fieldKey, value)}
                  />
                )}

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                    {s.section_type === "site_visit" ? "Assign Site Visit" : "Calling Tasks"}
                  </div>

                  {deliverables.filter((d) => d.section_id === s.id && d.is_calling_task).length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>No calling tasks yet.</div>
                  ) : (
                    <div style={{ marginBottom: 10 }}>
                      {deliverables.filter((d) => d.section_id === s.id && d.is_calling_task).map((t) => {
                        const assignee = team.find((m) => m.email === t.assignee_email);
                        return (
                          <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 6 }}>
                            <div style={{ fontSize: 12, color: "var(--text)" }}>
                              {t.name}{t.due ? ` — due ${t.due}` : ""}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {assignee && <span style={{ fontSize: 11, color: "var(--text2)" }}>{assignee.name}</span>}
                              <span className="status-pill pill-yellow" style={{ fontSize: 9 }}>{t.status}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {operationsTeam.length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--warn)" }}>
                      No team members are tagged as Operations yet — tag someone in Admin first.
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input
                        className="form-input" placeholder={s.section_type === "site_visit" ? "Site visit details (e.g. Initial inspection walkthrough)" : "Calling task description"} style={{ flex: 2, minWidth: 160 }}
                        value={callingTaskForms[s.id]?.desc || ""}
                        onChange={(e) => updateCallingTaskForm(s.id, "desc", e.target.value)}
                      />
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <Dropdown
                          value={callingTaskForms[s.id]?.assignee || ""}
                          placeholder="Assign to..."
                          options={operationsTeam.map((m) => ({ value: m.email, label: m.name }))}
                          onChange={(val) => updateCallingTaskForm(s.id, "assignee", val)}
                        />
                      </div>
                      <input
                        type="date" className="form-input" style={{ flex: 1, minWidth: 120 }}
                        value={callingTaskForms[s.id]?.due || ""}
                        onChange={(e) => updateCallingTaskForm(s.id, "due", e.target.value)}
                      />
                    <div style={{ flex: 1, minWidth: 100 }}>
                        <Dropdown
                          value={callingTaskForms[s.id]?.priority || "Medium"}
                          options={[{ value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }]}
                          onChange={(val) => updateCallingTaskForm(s.id, "priority", val)}
                        />
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => addCallingTask(s.id)}>+ Add</button>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                    Progress Log
                  </div>

                  {(sectionContent[s.id]?.progress_log || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>No progress updates yet.</div>
                  ) : (
                    <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                      {(sectionContent[s.id]?.progress_log || []).map((entry) => (
                        <div
                          key={entry.id}
                          style={{
                            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                            padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.5 }}>{entry.description}</div>
                            <div style={{ fontSize: 10.5, color: "var(--text3)", marginTop: 4 }}>
                              {team.find((m) => m.email === entry.updated_by_email)?.name || "Unknown"}
                              {entry.target_date && ` · Target: ${entry.target_date}`}
                              {" · Logged "}
                              {new Date(entry.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          </div>
                          <span
                            className="status-pill pill-blue"
                            style={{ fontSize: 10, flexShrink: 0 }}
                          >
                            {entry.percent_complete}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      className="form-input" placeholder="What's the update? (e.g. Sent to insured for review)" style={{ flex: 2, minWidth: 200 }}
                      value={progressLogForms[s.id]?.desc || ""}
                      onChange={(e) => updateProgressLogForm(s.id, "desc", e.target.value)}
                    />
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <Dropdown
                        value={progressLogForms[s.id]?.updatedBy || ""}
                        placeholder="Logged by..."
                        options={team.map((m) => ({ value: m.email, label: m.name }))}
                        onChange={(val) => updateProgressLogForm(s.id, "updatedBy", val)}
                      />
                    </div>
                    <input
                      type="date" className="form-input" style={{ flex: 1, minWidth: 130 }}
                      title="Target / expected date"
                      value={progressLogForms[s.id]?.date || ""}
                      onChange={(e) => updateProgressLogForm(s.id, "date", e.target.value)}
                    />
                    <input
                      type="number" min="0" max="100" className="form-input" placeholder="%" style={{ flex: "0 0 70px" }}
                      title="Percent complete"
                      value={progressLogForms[s.id]?.percent || ""}
                      onChange={(e) => updateProgressLogForm(s.id, "percent", e.target.value)}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => addProgressLogEntry(s.id)}>+ Log Update</button>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}