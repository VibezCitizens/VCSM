import React from "react";
import { FIELD_BLOCK_STYLE } from "./membershipAssignmentPanel.styles";
import { MemberSearchField } from "./MemberSearchField";
import { CreateMemberForm } from "./CreateMemberForm";
import { SelectField } from "./SelectField";

export function MembershipAssignmentPanel({
  title,
  actionLabel,
  actorIdLabel,
  onSubmit,
  isSaving = false,
  helperText = "",
  roleOptions = null,
  defaultRole = "",
  roleLabel = "Role",
  statusOptions = null,
  defaultStatus = "",
  statusLabel = "Status",
  onSearchCandidates = null,
  searchPlaceholder = "",
  noSearchResultsLabel = "No matching members found.",
  onCreateMember = null,
  createActionLabel = "Create and Assign",
  createHelperText = "",
  createDisplayNameLabel = "Display Name",
  createEmailLabel = "Email",
}) {
  const [value, setValue] = React.useState("");
  const [role, setRole] = React.useState(
    defaultRole || roleOptions?.[0]?.value || "",
  );
  const [status, setStatus] = React.useState(
    defaultStatus || statusOptions?.[0]?.value || "",
  );
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchError, setSearchError] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedResult, setSelectedResult] = React.useState(null);
  const [createDisplayName, setCreateDisplayName] = React.useState("");
  const [createEmail, setCreateEmail] = React.useState("");
  const [submitError, setSubmitError] = React.useState("");
  const lastAutoFilledEmailRef = React.useRef("");

  const isSearchMode = typeof onSearchCandidates === "function";
  const canCreateMember = typeof onCreateMember === "function";
  const isDirectCreateMode = canCreateMember && !isSearchMode;

  React.useEffect(() => {
    if (!isSearchMode) {
      return undefined;
    }

    const query = value.trim();

    if (!query || selectedResult) {
      setSearchResults([]);
      setSearchError("");
      setIsSearching(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");

      try {
        const result = await onSearchCandidates(query);

        if (result?.ok === false) {
          setSearchResults([]);
          setSearchError(result?.error?.message ?? result?.error?.code ?? "Search failed.");
          return;
        }

        setSearchResults(result?.data?.results ?? []);
      } catch (error) {
        setSearchResults([]);
        setSearchError(error?.message ?? "Search failed.");
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [isSearchMode, onSearchCandidates, selectedResult, value]);

  React.useEffect(() => {
    if (!canCreateMember || selectedResult) {
      return;
    }

    const query = value.trim();

    if (!query || !query.includes("@")) {
      return;
    }

    setCreateEmail((current) => {
      if (!current || current === lastAutoFilledEmailRef.current) {
        lastAutoFilledEmailRef.current = query;
        return query;
      }

      return current;
    });
  }, [canCreateMember, selectedResult, value]);

  const showCreateForm = Boolean(
    isDirectCreateMode ||
      (canCreateMember &&
        isSearchMode &&
        !selectedResult &&
        value.trim() &&
        !isSearching &&
        !searchError &&
        searchResults.length === 0),
  );

  const resetForm = () => {
    setValue("");
    setSelectedResult(null);
    setSearchResults([]);
    setSearchError("");
    setCreateDisplayName("");
    setCreateEmail("");
    lastAutoFilledEmailRef.current = "";

    if (roleOptions?.length) {
      setRole(defaultRole || roleOptions[0]?.value || "");
    }

    if (statusOptions?.length) {
      setStatus(defaultStatus || statusOptions[0]?.value || "");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if ((isDirectCreateMode || isSearchMode) && !selectedResult && showCreateForm) {
      const normalizedDisplayName = createDisplayName.trim();
      const normalizedEmail = createEmail.trim();

      if (!normalizedDisplayName) {
        setSubmitError("Display name is required to create a new member.");
        return;
      }

      if (!normalizedEmail) {
        setSubmitError("Email is required to create a new member.");
        return;
      }

      const result = await onCreateMember?.({
        displayName: normalizedDisplayName,
        email: normalizedEmail,
        role,
        status,
      });

      if (result?.ok === false) {
        return;
      }

      resetForm();
      return;
    }

    const actorId = isSearchMode ? selectedResult?.actorId ?? "" : value.trim();

    if (!actorId) {
      setSubmitError("Select a member before saving the organization membership.");
      return;
    }

    const result = await onSubmit?.({
      actorId,
      role,
      status,
    });

    if (result?.ok === false) {
      return;
    }

    resetForm();
  };

  const handleSelectResult = (result) => {
    setSelectedResult(result);
    setValue(result.displayName ?? result.username ?? result.email ?? "");
    setSearchResults([]);
  };

  const handleClearSelection = () => {
    setSelectedResult(null);
    setValue("");
  };

  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 16,
        background: "#fff",
        marginBottom: 16,
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>

      {helperText ? (
        <p style={{ marginTop: 0, marginBottom: 12, color: "#555" }}>{helperText}</p>
      ) : null}

      <form onSubmit={handleSubmit}>
        {!isDirectCreateMode ? (
          <MemberSearchField
            label={actorIdLabel}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (selectedResult) {
                setSelectedResult(null);
              }
            }}
            placeholder={searchPlaceholder}
            isSearchMode={isSearchMode}
            isSearching={isSearching}
            searchError={searchError}
            searchResults={searchResults}
            selectedResult={selectedResult}
            noSearchResultsLabel={noSearchResultsLabel}
            onSelectResult={handleSelectResult}
            onClearSelection={handleClearSelection}
          />
        ) : null}

        {showCreateForm ? (
          <CreateMemberForm
            createDisplayName={createDisplayName}
            onChangeDisplayName={setCreateDisplayName}
            createEmail={createEmail}
            onChangeEmail={setCreateEmail}
            createHelperText={createHelperText}
            createDisplayNameLabel={createDisplayNameLabel}
            createEmailLabel={createEmailLabel}
          />
        ) : null}

        <SelectField label={roleLabel} value={role} onChange={setRole} options={roleOptions} />
        <SelectField label={statusLabel} value={status} onChange={setStatus} options={statusOptions} />

        {submitError ? (
          <div style={{ marginBottom: 12, fontSize: 13, color: "#b42318" }}>
            {submitError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          style={{
            ...FIELD_BLOCK_STYLE,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #222",
            background: "#222",
            color: "#fff",
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        >
          {isSaving
            ? "Saving..."
            : showCreateForm && !selectedResult
              ? createActionLabel
              : actionLabel}
        </button>
      </form>
    </div>
  );
}

export default MembershipAssignmentPanel;
