import { useCallback, useRef, useState } from "react";

export function useDraggableButton(
  storageKey: string,
  defaultPos: { x: number; y: number },
) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {
      console.warn('useDraggableButton', 'localStorage okuma hatası');
    }
    return defaultPos;
  });
  const dragging = useRef(false);
  const startRef = useRef({ mx: 0, my: 0, bx: 0, by: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      startRef.current = {
        mx: e.clientX,
        my: e.clientY,
        bx: pos.x,
        by: pos.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [pos],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startRef.current.mx;
    const dy = e.clientY - startRef.current.my;
    const newX = Math.max(
      8,
      Math.min(window.innerWidth - 64, startRef.current.bx + dx),
    );
    const newY = Math.max(
      8,
      Math.min(window.innerHeight - 64, startRef.current.by + dy),
    );
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setPos((p) => {
      localStorage.setItem(storageKey, JSON.stringify(p));
      return p;
    });
  }, [storageKey]);

  return {
    pos,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    isDragging: dragging,
  };
}
