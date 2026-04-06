// src/components/PullToRefresh.jsx
import { useRef, useState, forwardRef, useImperativeHandle } from 'react';

function PullToRefreshImpl({
  onRefresh,
  threshold = 70,
  maxPull = 120,
  className = '',
  children,
  ...rest
}, ref) {
  const localRef = useRef(null);
  useImperativeHandle(ref, () => localRef.current);

  const [pull, setPull] = useState(0);
  const [status, setStatus] = useState('idle'); // idle|pulling|ready|refreshing
  const startY = useRef(null);
  const dragging = useRef(false);

  const reset = () => {
    setPull(0);
    setStatus('idle');
  };

  const canStart = () => {
    const el = localRef.current;
    return el && el.scrollTop <= 0 && status !== 'refreshing';
  };

  const onStart = (y) => {
    if (!canStart()) return;
    startY.current = y;
    dragging.current = true;
  };

  const onMove = (y, e) => {
    if (!dragging.current || startY.current == null) return;
    const dy = y - startY.current;
    if (dy <= 0) return;

    // keep the page from scrolling while pulling
    if (e?.cancelable) e.preventDefault();

    const dist = Math.min(dy, maxPull);
    setPull(dist);
    setStatus(dist >= threshold ? 'ready' : 'pulling');
  };

  const onEnd = async () => {
    if (!dragging.current) return;
    dragging.current = false;

    if (status === 'ready') {
      setStatus('refreshing');
      setPull(56); // lock indicator height
      try {
        await onRefresh?.();
      } finally {
        setTimeout(reset, 250);
      }
    } else {
      reset();
    }
  };

  const indicatorText =
    status === 'refreshing'
      ? 'Refreshing…'
      : status === 'ready'
      ? 'Release to refresh'
      : 'Pull to refresh';

  return (
    <div
      ref={localRef}
      data-ptr-root="1"
      className={`relative overflow-auto overscroll-contain select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
      onTouchStart={(e) => onStart(e.touches[0].clientY)}
      onTouchMove={(e) => onMove(e.touches[0].clientY, e)}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
      onPointerDown={(e) => onStart(e.clientY)}
      onPointerMove={(e) => onMove(e.clientY, e)}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      {...rest}
    >
      <div
        style={{
          height: pull,
          transition: status === 'refreshing' ? 'height 150ms ease' : 'height 0ms',
        }}
        className="flex items-center justify-center text-xs text-gray-400"
      >
        {pull > 0 && (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"
              style={{ animationPlayState: status === 'refreshing' ? 'running' : 'paused' }}
            />
            <span>{indicatorText}</span>
          </div>
        )}
      </div>

      <div
        style={{
          transform: pull ? `translateY(${pull}px)` : undefined,
          transition: status === 'refreshing' ? 'transform 150ms ease' : 'transform 0ms',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const PullToRefresh = forwardRef(PullToRefreshImpl);
export default PullToRefresh;
