"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_SPEED_PX_PER_SEC = 28;
const LOOP_GAP_PX = 40;
const RESUME_AFTER_USER_MS = 1000;

export default function MarqueeText({ text, className = "", title }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);

  const rafRef = useRef(null);
  const lastTsRef = useRef(null);

  const userActiveRef = useRef(false);
  const resumeTimeoutRef = useRef(null);

  const dragRef = useRef({
    pointerId: null,
    startX: 0,
    startOffset: 0,
  });

  const [canScroll, setCanScroll] = useState(false);

  const applyOffset = useCallback((value) => {
    const loopWidth = loopWidthRef.current;

    if (loopWidth <= 0) {
      offsetRef.current = 0;

      if (trackRef.current) {
        trackRef.current.style.transform = "translateX(0)";
      }

      return;
    }

    // Bikin offset selalu muter dalam satu siklus
    const normalized = ((value % loopWidth) + loopWidth) % loopWidth;

    offsetRef.current = normalized;

    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${normalized}px)`;
    }
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = null;
    lastTsRef.current = null;
  }, []);

  const runLoop = useCallback(
    (ts) => {
      if (userActiveRef.current) return;

      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
      }

      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      const next =
        offsetRef.current +
        (AUTO_SPEED_PX_PER_SEC * dt) / 1000;

      applyOffset(next);

      rafRef.current = requestAnimationFrame(runLoop);
    },
    [applyOffset],
  );

  const startLoop = useCallback(() => {
    if (userActiveRef.current || !canScroll) return;

    stopLoop();

    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(runLoop);
  }, [canScroll, runLoop, stopLoop]);

  const pauseForUser = useCallback(() => {
    userActiveRef.current = true;
    stopLoop();

    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
  }, [stopLoop]);

  const scheduleResume = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    resumeTimeoutRef.current = setTimeout(() => {
      userActiveRef.current = false;
      startLoop();
    }, RESUME_AFTER_USER_MS);
  }, [startLoop]);

  function handlePointerDown(e) {
    if (!canScroll) return;

    pauseForUser();

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startOffset: offsetRef.current,
    };

    containerRef.current?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (dragRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - dragRef.current.startX;

    applyOffset(dragRef.current.startOffset - dx);
  }

  function handlePointerUp(e) {
    if (dragRef.current.pointerId !== e.pointerId) return;

    try {
      containerRef.current?.releasePointerCapture(e.pointerId);
    } catch {}

    dragRef.current.pointerId = null;

    scheduleResume();
  }

  function handleWheel(e) {
    if (!canScroll) return;

    pauseForUser();

    const delta =
      Math.abs(e.deltaX) > Math.abs(e.deltaY)
        ? e.deltaX
        : e.deltaY;

    applyOffset(offsetRef.current + delta);

    scheduleResume();
  }

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;

    if (!container || !track) return;

    function measure() {
      const firstItem = track.querySelector(
        ".assetra-marquee-item",
      );

      if (!firstItem) return;

      const textWidth = firstItem.offsetWidth;

      const max = Math.max(
        0,
        textWidth + LOOP_GAP_PX,
      );

      loopWidthRef.current = max;

      const shouldScroll =
        textWidth > container.clientWidth + 1;

      setCanScroll(shouldScroll);

      if (!shouldScroll) {
        stopLoop();
        applyOffset(0);
        return;
      }

      applyOffset(offsetRef.current);

      if (!userActiveRef.current) {
        stopLoop();
        lastTsRef.current = null;
        rafRef.current = requestAnimationFrame(runLoop);
      }
    }

    measure();

    const ro = new ResizeObserver(measure);

    ro.observe(container);
    ro.observe(track);

    return () => {
      ro.disconnect();
      stopLoop();
    };
  }, [text, applyOffset, runLoop, stopLoop]);

  useEffect(() => {
    return () => {
      stopLoop();

      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [stopLoop]);

  return (
    <div
      ref={containerRef}
      title={title || text}
      className={`assetra-marquee ${
        canScroll ? "is-scrollable" : ""
      } ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <span
        ref={trackRef}
        className="assetra-marquee-track"
      >
        <span className="assetra-marquee-item">
          {text}
        </span>

        {canScroll && (
          <>
            <span
              aria-hidden="true"
              className="assetra-marquee-gap"
            />

            <span
              aria-hidden="true"
              className="assetra-marquee-item"
            >
              {text}
            </span>
          </>
        )}
      </span>
    </div>
  );
}