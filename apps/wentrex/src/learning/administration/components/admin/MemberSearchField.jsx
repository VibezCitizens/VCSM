import React from "react";
import { FIELD_BLOCK_STYLE, CONTROL_STYLE } from "./membershipAssignmentPanel.styles";
import { SelectedMemberCard } from "./SelectedMemberCard";
import { MemberSearchResults } from "./MemberSearchResults";

/**
 * Combined search input that shows a selected member card, search status,
 * or a results dropdown depending on the current state.
 */
export function MemberSearchField({
  label,
  value,
  onChange,
  placeholder,
  isSearchMode,
  isSearching,
  searchError,
  searchResults,
  selectedResult,
  noSearchResultsLabel,
  onSelectResult,
  onClearSelection,
}) {
  return (
    <div style={{ ...FIELD_BLOCK_STYLE, marginBottom: 12 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={CONTROL_STYLE}
      />

      {isSearchMode ? (
        <div style={{ ...FIELD_BLOCK_STYLE, marginTop: 8 }}>
          {selectedResult ? (
            <SelectedMemberCard
              selectedResult={selectedResult}
              onClear={onClearSelection}
            />
          ) : null}

          {!selectedResult && isSearching ? (
            <div style={{ fontSize: 13, color: "#5f6f82" }}>Searching...</div>
          ) : null}

          {!selectedResult && searchError ? (
            <div style={{ marginTop: 8, fontSize: 13, color: "#b42318" }}>
              {searchError}
            </div>
          ) : null}

          {!selectedResult && !isSearching && value.trim() && !searchError ? (
            <MemberSearchResults
              searchResults={searchResults}
              noSearchResultsLabel={noSearchResultsLabel}
              onSelectResult={onSelectResult}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default MemberSearchField;
