// src/features/upload/ui/UploadHeader.jsx
import ActorPill from "./ActorPill";
import SegmentedButton from "./SegmentedButton";

export default function UploadHeader({ mode, onChangeMode }) {
  return (
    <div className="upload-header flex flex-col items-center gap-3 mb-4">
      <ActorPill />

      <div className="upload-mode-wrap">
        <SegmentedButton
          active={mode === "post"}
          onClick={() => onChangeMode("post")}
        >
          VIBE
        </SegmentedButton>

        <SegmentedButton
          active={mode === "24drop"}
          onClick={() => onChangeMode("24drop")}
        >
          24DROP
        </SegmentedButton>

        <SegmentedButton
          active={mode === "vdrop"}
          onClick={() => onChangeMode("vdrop")}
        >
          VDROP
        </SegmentedButton>
      </div>
    </div>
  );
}
