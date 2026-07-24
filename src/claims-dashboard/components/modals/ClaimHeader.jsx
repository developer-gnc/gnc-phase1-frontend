export default function ClaimHeader({ claim, onClose, onOpenFullFile }) {
  return (
    <div className="modal-header">
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="modal-title">{claim.name}</div>
        <div className="modal-subtitle">
          GNC #{claim.gnc} · Claim #{claim.claim} · {claim.address}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={onOpenFullFile}>
          <svg width="11" height="11"><use href="#icon-external-link" /></svg> Open Full File
        </button>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <svg><use href="#icon-x" /></svg>
        </button>
      </div>
    </div>
  );
}