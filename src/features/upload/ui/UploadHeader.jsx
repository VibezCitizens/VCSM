// src/features/upload/ui/UploadHeader.jsx
import ActorPill from "./ActorPill";
import SegmentedButton from "./SegmentedButton";

export default function UploadHeader({ mode, onChangeMode }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-4">
      <ActorPill />

      <div className="flex gap-2">
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
