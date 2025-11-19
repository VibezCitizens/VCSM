// src/ui/Global/GlobalMoreMenu.jsx

import React, { useState, useRef, useEffect } from "react";
import { DotsThreeVertical, Flag, XCircle, Warning } from "phosphor-react";

export default function GlobalMoreMenu({
  onBlock = () => {},
  onReport = () => {},
  onBlockAndReport = () => {},
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (open && menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      {/* THREE DOTS BUTTON */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-full hover:bg-neutral-800 transition"
      >
        <DotsThreeVertical size={22} weight="bold" className="text-white" />
      </button>

      {/* MENU */}
      {open && (
        <div
          className="
            absolute right-0 mt-2
            w-44 
            bg-neutral-900 border border-neutral-700 
            rounded-xl shadow-xl p-1
            z-50
          "
        >
          {/* REPORT */}
          <button
            onClick={() => {
              setOpen(false);
              onReport();
            }}
            className="
              w-full flex items-center gap-2 p-3 rounded-lg
              text-left hover:bg-neutral-800 transition
            "
          >
            <Flag size={18} weight="duotone" className="text-red-400" />
            <span className="text-sm text-white">Report</span>
          </button>

          {/* BLOCK */}
          <button
            onClick={() => {
              setOpen(false);
              onBlock();
            }}
            className="
              w-full flex items-center gap-2 p-3 rounded-lg
              text-left hover:bg-neutral-800 transition
            "
          >
            <XCircle size={18} weight="duotone" className="text-yellow-400" />
            <span className="text-sm text-white">Block</span>
          </button>

          {/* BLOCK + REPORT */}
          <button
            onClick={() => {
              setOpen(false);
              onBlockAndReport();
            }}
            className="
              w-full flex items-center gap-2 p-3 rounded-lg
              text-left hover:bg-neutral-800 transition
            "
          >
            <Warning size={18} weight="duotone" className="text-purple-400" />
            <span className="text-sm text-white">Block & Report</span>
          </button>
        </div>
      )}
    </div>
  );
}
