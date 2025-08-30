import { useEffect, useId } from 'react';
import Cropper from 'react-easy-crop';

export default function CropperPanel({
  filePreviewUrl,
  crop, setCrop,
  zoom, setZoom,
  onCropComplete,
  disabled = false,

  // New optional props
  aspect = 1,               // e.g. 1, 4/5, 16/9
  cropShape = 'rect',       // 'rect' | 'round'
  showGrid = true,
  minZoom = 1,
  maxZoom = 3,
  zoomStep = 0.1,
}) {
  const zoomId = useId();

  // Reset when a new image is selected
  useEffect(() => {
    if (!filePreviewUrl) return;
    setCrop?.({ x: 0, y: 0 });
    setZoom?.(1);
  }, [filePreviewUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!filePreviewUrl) return null;

  return (
    <>
      <div
        className={`relative w-full max-w-md bg-black mb-4 rounded-xl overflow-hidden ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        style={{ aspectRatio: aspect }}
        aria-disabled={disabled}
      >
        <Cropper
          image={filePreviewUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={showGrid}
          objectFit="contain"
          restrictPosition
          zoomWithScroll
        />
      </div>

      <div className="mb-4 flex items-center w-full max-w-md gap-3">
        <label htmlFor={zoomId} className="text-sm text-white/60">Zoom</label>
        <input
          type="range"
          id={zoomId}
          value={zoom}
          min={minZoom}
          max={maxZoom}
          step={zoomStep}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full accent-purple-500"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); }}
          className="text-xs px-2 py-1 rounded bg-neutral-800 border border-neutral-600 hover:bg-neutral-700 disabled:opacity-50"
          disabled={disabled}
        >
          Reset
        </button>
      </div>
    </>
  );
}
