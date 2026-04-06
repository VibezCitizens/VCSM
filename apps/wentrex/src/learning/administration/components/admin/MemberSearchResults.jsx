import React from "react";
import { FIELD_BLOCK_STYLE } from "./membershipAssignmentPanel.styles";

/**
 * Renders a dropdown-style list of search results for member lookup.
 * Shows an empty-state label when no results match.
 */
export function MemberSearchResults({
  searchResults,
  noSearchResultsLabel,
  onSelectResult,
}) {
  return (
    <div
      style={{
        ...FIELD_BLOCK_STYLE,
        marginTop: 8,
        border: "1px solid #d0d7de",
        borderRadius: 10,
        overflow: "hidden",
        boxSizing: "border-box",
        background: "#fff",
      }}
    >
      {searchResults.length === 0 ? (
        <div style={{ padding: 12, fontSize: 13, color: "#5f6f82" }}>
          {noSearchResultsLabel}
        </div>
      ) : (
        searchResults.map((result) => (
          <button
            key={result.actorId}
            type="button"
            onClick={() => onSelectResult(result)}
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              textAlign: "left",
              border: "none",
              borderTop:
                searchResults[0]?.actorId === result.actorId
                  ? "none"
                  : "1px solid #eef2f7",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 700, color: "#08111b" }}>
              {result.displayName ?? result.username ?? result.email ?? "Unnamed member"}
            </div>
            <div style={{ fontSize: 13, color: "#5f6f82", marginTop: 4 }}>
              {result.username ? `@${result.username}` : "-"}
            </div>
            <div style={{ fontSize: 13, color: "#5f6f82", marginTop: 2 }}>
              {result.email ?? "-"}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export default MemberSearchResults;
