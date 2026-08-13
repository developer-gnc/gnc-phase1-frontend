import Dropdown from "../shared/Dropdown.jsx";

export default function AddDeliverableForm({
  team,
  deliverableTypes,
  newDelType,
  setNewDelType,
  newDelCustom,
  setNewDelCustom,
  newDelAssignee,
  setNewDelAssignee,
  newDelStatus,
  setNewDelStatus,
  newDelDue,
  setNewDelDue,
  onAdd,
}) {
  return (
    <div className="add-del-row">
      <div style={{ flex: "1.2" }}>
        <Dropdown
          value={newDelType}
          options={(deliverableTypes || []).map((t) => ({ value: t, label: t }))}
          onChange={setNewDelType}
        />
      </div>
      {newDelType === "Custom..." && (
        <input
          type="text"
          className="add-del-input"
          placeholder="Custom name..."
          value={newDelCustom}
          onChange={(e) => setNewDelCustom(e.target.value)}
          style={{ flex: "1.2" }}
        />
      )}
      <div style={{ flex: 1 }}>
        <Dropdown
          value={newDelAssignee}
          options={(team || []).map((m) => ({ value: m.email, label: m.name }))}
          onChange={setNewDelAssignee}
        />
      </div>
      <div style={{ flex: 1 }}>
        <Dropdown
          value={newDelStatus}
          options={["Not Started", "In Progress", "Pending Approval", "On Hold", "Completed"].map((s) => ({ value: s, label: s }))}
          onChange={setNewDelStatus}
        />
      </div>
      <input
        type="date"
        className="add-del-input"
        value={newDelDue}
        onChange={(e) => setNewDelDue(e.target.value)}
        style={{ flex: "0.7", minWidth: 110 }}
      />
      <button
        className="btn btn-primary btn-sm"
        onClick={onAdd}
        aria-label="Add deliverable"
      >
        <svg width="10" height="10">
          <use href="#icon-plus" />
        </svg>
        Add
      </button>
    </div>
  );
}