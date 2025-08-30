import { useEffect, useRef } from 'react';

/**
 * useOnClickOutside
 * - Calls `handler(event)` when a pointer/click happens outside ALL provided refs.
 *
 * @param {React.RefObject|React.RefObject[]} refOrRefs  One ref or an array of refs.
 * @param {(e: Event) => void} handler                   Callback to run on outside click.
 * @param {{
 *   enabled?: boolean,          // default true
 *   events?: string[],          // default ['pointerdown'] (you can use ['mousedown','touchstart'] if needed)
 *   detectEscape?: boolean,     // default true -> call handler on Escape key
 *   ignore?: (Element | React.RefObject | string)[], // refs/elements/CSS selectors to ignore
 * }} options
 */
export default function useOnClickOutside(
  refOrRefs,
  handler,
  {
    enabled = true,
    events = ['pointerdown'],
    detectEscape = true,
    ignore = [],
  } = {}
) {
  // Keep latest handler without retriggering effect
  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; }, [handler]);

  // Normalize to an array of refs
  const refs = Array.isArray(refOrRefs) ? refOrRefs : [refOrRefs];

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === 'undefined') return; // SSR guard

    const getEl = (x) => {
      if (!x) return null;
      if (x instanceof Element) return x;
      if (typeof x === 'string') return document.querySelector(x);
      if (x.current instanceof Element) return x.current;
      return null;
    };

    const ignoreEls = ignore.map(getEl).filter(Boolean);

    const isInsideIgnored = (target) =>
      ignoreEls.some((el) => el && (el === target || el.contains(target)));

    const isInsideAnyRef = (target) =>
      refs.some((r) => r?.current && (r.current === target || r.current.contains(target)));

    const onEvent = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (isInsideAnyRef(target)) return;     // click was inside one of our refs
      if (isInsideIgnored(target)) return;    // click was inside an ignore element

      handlerRef.current?.(event);
    };

    const onKey = (event) => {
      if (!detectEscape) return;
      if (event.key === 'Escape') handlerRef.current?.(event);
    };

    events.forEach((evt) => document.addEventListener(evt, onEvent, true)); // capture phase = more reliable
    if (detectEscape) document.addEventListener('keydown', onKey, true);

    return () => {
      events.forEach((evt) => document.removeEventListener(evt, onEvent, true));
      if (detectEscape) document.removeEventListener('keydown', onKey, true);
    };
  }, [enabled, refs, events.join(','), detectEscape, ignore]);
}
