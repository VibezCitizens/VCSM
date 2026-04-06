import React, { useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function StudentPicker({ organizationId, selected, onSelect, existingLinks }) {
  const [searchId, setSearchId] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeLetter, setActiveLetter] = useState(null);
  const [noResult, setNoResult] = useState(false);

  async function searchById() {
    if (!searchId.trim()) return;
    setSearching(true); setNoResult(false); setResults([]); setActiveLetter(null);

    const { data } = await supabase.schema("learning").from("actor_profiles")
      .select("actor_id, full_name, first_name, last_name, student_id, grade_level, section")
      .eq("student_id", searchId.trim())
      .limit(1);

    if (data?.length) {
      // Verify student belongs to this org
      const { data: actor } = await supabase.schema("learning").from("actors")
        .select("id").eq("id", data[0].actor_id).eq("organization_id", organizationId).maybeSingle();
      if (actor) {
        setResults(data);
      } else {
        setNoResult(true);
      }
    } else {
      setNoResult(true);
    }
    setSearching(false);
  }

  async function browseByLetter(letter) {
    setActiveLetter(letter); setSearching(true); setNoResult(false); setResults([]);

    // Get all student actor_ids in this org
    const { data: identities } = await supabase.schema("learning").from("actor_identities")
      .select("actor_id")
      .eq("organization_id", organizationId).eq("is_school_managed", true);

    const actorIds = (identities ?? []).map(i => i.actor_id);
    if (!actorIds.length) { setSearching(false); setNoResult(true); return; }

    let query = supabase.schema("learning").from("actor_profiles")
      .select("actor_id, full_name, first_name, last_name, student_id, grade_level, section")
      .in("actor_id", actorIds)
      .order("last_name").order("first_name");

    if (letter !== "All") {
      query = query.ilike("last_name", `${letter}%`);
    }

    const { data } = await query.limit(100);
    setResults(data ?? []);
    if (!data?.length) setNoResult(true);
    setSearching(false);
  }

  function handleSelect(student) {
    onSelect(student);
    setResults([]);
    setActiveLetter(null);
    setSearchId("");
  }

  const selectedLinks = selected ? (existingLinks ?? []).filter(l => l.student_actor_id === selected.actor_id) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Selected student card */}
      {selected && (
        <div style={{
          background: "#eff6ff", border: `1px solid #bfdbfe`, borderRadius: 12,
          padding: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: PRIMARY, color: "#fff" }}>Selected Student</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{selected.full_name}</div>
            <div style={{ display: "flex", gap: 16, fontSize: 13, color: MUTED }}>
              <span>ID: <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>{selected.student_id ?? "—"}</strong></span>
              {selected.grade_level && <span>Grade: <strong style={{ color: "#0f172a" }}>{selected.grade_level}</strong></span>}
              {selected.section && <span>Section: <strong style={{ color: "#0f172a" }}>{selected.section}</strong></span>}
            </div>
            {selectedLinks.length > 0 && (
              <div style={{ fontSize: 12, color: selectedLinks.length >= 2 ? "#dc2626" : MUTED, marginTop: 4 }}>
                {selectedLinks.length}/2 parents linked
                {selectedLinks.length >= 2 && " — maximum reached"}
              </div>
            )}
          </div>
          <button onClick={() => onSelect(null)} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`,
            background: "#fff", color: "#334155", fontSize: 12, cursor: "pointer",
          }}>
            Change
          </button>
        </div>
      )}

      {/* Search UI — only show when no student selected */}
      {!selected && (
        <>
          {/* Search by ID */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 6 }}>Search by Student ID</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); searchById(); } }}
                placeholder="e.g. 2026001"
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 10,
                  border: `1px solid ${BORDER}`, fontSize: 14, fontFamily: "monospace",
                  background: "#fff", color: "#0f172a",
                }}
              />
              <button onClick={searchById} disabled={searching || !searchId.trim()} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: !searchId.trim() ? MUTED : PRIMARY, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                Search
              </button>
            </div>
          </div>

          {/* Alphabetical browse */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 8 }}>Browse by Last Name</label>
            <div style={{
              display: "flex", gap: 0, justifyContent: "space-between",
            }}>
              {[...ALPHABET, "All"].map(letter => {
                const isActive = activeLetter === letter;
                return (
                  <button key={letter} onClick={() => browseByLetter(letter)} style={{
                    minWidth: 0, width: letter === "All" ? 30 : 24, height: 26, borderRadius: 999,
                    border: "none",
                    background: isActive ? PRIMARY : "transparent",
                    color: isActive ? "#fff" : MUTED,
                    fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0,
                    flexShrink: 0,
                  }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = SURFACE; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results */}
          {searching && <div style={{ padding: 16, color: MUTED, fontSize: 14 }}>Searching...</div>}

          {noResult && !searching && (
            <div style={{ padding: 16, color: MUTED, fontSize: 14, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, textAlign: "center" }}>
              No student found.
            </div>
          )}

          {!searching && results.length > 0 && (
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", maxHeight: 300, overflowY: "auto" }}>
              {results.map(s => (
                <button key={s.actor_id} onClick={() => handleSelect(s)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  width: "100%", border: "none", borderBottom: `1px solid ${BORDER}`,
                  background: "#fff", cursor: "pointer", textAlign: "left", fontSize: 14,
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                >
                  <span style={{ fontFamily: "monospace", fontWeight: 600, color: PRIMARY, minWidth: 70 }}>
                    {s.student_id ?? "—"}
                  </span>
                  <span style={{ fontWeight: 500, color: "#0f172a", flex: 1 }}>{s.full_name}</span>
                  {s.grade_level && <span style={{ fontSize: 12, color: MUTED }}>{s.grade_level}</span>}
                  {s.section && <span style={{ fontSize: 12, color: MUTED }}>/ {s.section}</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
