import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function Dropdown({ value, options, onChange, placeholder = "Select..." }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        listRef.current && !listRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function handleScrollOrResize(e) {
      if (listRef.current && listRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const ESTIMATED_LIST_HEIGHT = 260;

  function openDropdown() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < ESTIMATED_LIST_HEIGHT && rect.top > spaceBelow;

      setCoords({
        top: openUpward ? undefined : rect.bottom + 6,
        bottom: openUpward ? window.innerHeight - rect.top + 6 : undefined,
        left: rect.left,
        width: rect.width,
      });
    }
    setOpen((o) => !o);
  }

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <div
        ref={triggerRef}
        className="role-select-custom"
        style={{
          background: "var(--white)", border: "1px solid var(--border2)", borderRadius: 8,
          padding: "7px 10px", fontSize: 12.5, justifyContent: "space-between", width: "100%",
        }}
        onClick={openDropdown}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginLeft: 6, opacity: 0.6 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {open && createPortal(
        <div
          ref={listRef}
          className="role-dropdown"
          style={{
            position: "fixed",
            top: coords.top, bottom: coords.bottom, left: coords.left, width: coords.width,
            maxHeight: 260, overflowY: "auto", zIndex: 9999,
          }}
        >
          {options.map((o) => (
            <div
              key={o.value}
              className={`role-dropdown-item ${o.value === value ? "active" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              <span className="role-dropdown-name">{o.label}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}