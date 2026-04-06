import {
  isLearningErrorDebugEnabled,
  normalizeLearningError,
} from "@/learning/administration/utils/realmDebug";

function formatDebugValue(value) {
  if (value === null || value === undefined || value === "") {
    return "n/a";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function DebugField({ label, value, multiline = false }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <strong style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </strong>

      {multiline ? (
        <pre
          style={{
            margin: 0,
            padding: 12,
            overflowX: "auto",
            borderRadius: 10,
            background: "#0f172a",
            color: "#e2e8f0",
            fontSize: 12,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {formatDebugValue(value)}
        </pre>
      ) : (
        <div style={{ fontSize: 14, color: "#475467", wordBreak: "break-word" }}>
          {formatDebugValue(value)}
        </div>
      )}
    </div>
  );
}

function DebugTraceList({ trace = [] }) {
  if (!Array.isArray(trace) || trace.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <strong style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Trace
      </strong>

      <div style={{ display: "grid", gap: 12 }}>
        {trace.map((entry, index) => (
          <div
            key={`${entry?.scope ?? "trace"}-${entry?.timestamp ?? index}`}
            style={{
              border: "1px solid #d0d5dd",
              borderRadius: 12,
              background: "#fff",
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <strong>{entry?.scope ?? `trace_${index + 1}`}</strong>
              <span style={{ fontSize: 12, color: "#667085" }}>{entry?.timestamp ?? null}</span>
            </div>
            <pre
              style={{
                margin: 0,
                padding: 12,
                overflowX: "auto",
                borderRadius: 10,
                background: "#0f172a",
                color: "#e2e8f0",
                fontSize: 12,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {formatDebugValue(entry)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelatedErrors({ relatedErrors = [] }) {
  if (!Array.isArray(relatedErrors) || relatedErrors.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <strong style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Related Failures
      </strong>

      {relatedErrors.map((entry, index) => {
        const error = normalizeLearningError(entry);
        return (
          <div
            key={`${error.code ?? "related"}-${index}`}
            style={{
              border: "1px solid #d0d5dd",
              borderRadius: 12,
              background: "#fff",
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <strong>{error.code ?? "RELATED_ERROR"}</strong>
              {error.status ? <span style={{ color: "#667085" }}>HTTP {error.status}</span> : null}
            </div>
            <div style={{ color: "#475467" }}>{error.message}</div>
            <DebugField label="Context" value={error.context} multiline />
            <DebugTraceList trace={error.trace} />
          </div>
        );
      })}
    </div>
  );
}

export default function LearningErrorState({
  error,
  onRetry,
  title = "Something went wrong",
  subtitle = null,
}) {
  const normalizedError = normalizeLearningError(error);
  const showDebug = isLearningErrorDebugEnabled();

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-semibold text-red-600 mb-2">{title}</h3>

      <p className="text-sm text-gray-500 mb-4">
        {subtitle ?? normalizedError.message ?? "An unexpected error occurred"}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-black text-white text-sm rounded-md hover:opacity-90"
        >
          Try Again
        </button>
      )}

      {showDebug && (
        <div
          style={{
            width: "100%",
            maxWidth: 960,
            marginTop: 24,
            padding: 20,
            textAlign: "left",
            borderRadius: 16,
            border: "1px solid #fecdca",
            background: "#fef3f2",
            display: "grid",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <strong style={{ color: "#b42318" }}>Learning Debugger</strong>
            <span style={{ fontSize: 12, color: "#7a271a" }}>
              Visible in local/dev debug mode
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <DebugField label="Code" value={normalizedError.code} />
            <DebugField label="Status" value={normalizedError.status} />
            <DebugField label="Hint" value={normalizedError.hint} />
          </div>

          <DebugField label="Details" value={normalizedError.details} multiline={typeof normalizedError.details === "object"} />
          <DebugField label="Context" value={normalizedError.context} multiline />
          <DebugTraceList trace={normalizedError.trace} />
          <RelatedErrors relatedErrors={normalizedError.relatedErrors} />

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Raw error payload</summary>
            <pre
              style={{
                marginTop: 12,
                padding: 12,
                overflowX: "auto",
                borderRadius: 10,
                background: "#0f172a",
                color: "#e2e8f0",
                fontSize: 12,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {formatDebugValue(normalizedError)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
