/**
 * BottomSheetHandle
 *
 * Drag handle de 8px en la parte superior del BottomSheet.
 * Soporta:
 *  - Hover: cursor ns-resize, color más visible
 *  - Click simple: cicla al siguiente snap point
 *  - Drag vertical: ajusta el alto (con snap al soltar)
 *  - Doble click: resetea al default
 *  - Touch: funciona en mobile con pointer events
 *
 * Props:
 *  - onCycle: () => void               ← click handler
 *  - onDragStart: () => void           ← inicio de drag
 *  - onDragMove: (deltaY) => void      ← durante drag
 *  - onDragEnd: () => void             ← fin de drag
 *  - isDragging: boolean               ← estado actual
 */
import React, { useCallback } from 'react';

const BottomSheetHandle = ({
  onCycle,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging = false,
}) => {
  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      if (e.target.setPointerCapture) {
        try { e.target.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      }
      const startY = e.clientY;
      let lastY = startY;
      let moved = false;
      const MOVE_THRESHOLD = 4; // px

      const onMove = (ev) => {
        const dy = ev.clientY - lastY;
        lastY = ev.clientY;
        if (!moved && Math.abs(ev.clientY - startY) > MOVE_THRESHOLD) {
          moved = true;
          if (onDragStart) onDragStart();
        }
        if (moved && onDragMove) onDragMove(dy);
      };

      const onUp = (ev) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (ev.target?.releasePointerCapture && e.pointerId !== undefined) {
          try { ev.target.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
        }
        if (moved && onDragEnd) onDragEnd();
        else if (onCycle) onCycle();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [onCycle, onDragStart, onDragMove, onDragEnd]
  );

  return (
    <div
      data-testid="bottom-sheet-handle"
      onPointerDown={handlePointerDown}
      onDoubleClick={onCycle}
      title="Arrastra para ajustar · Click para colapsar/expandir · Doble click para reset"
      style={{
        height: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'ns-resize' : 'ns-resize',
        background: isDragging
          ? 'rgba(56, 189, 248, 0.08)'
          : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        userSelect: 'none',
        touchAction: 'none',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)';
      }}
      onMouseLeave={(e) => {
        if (!isDragging) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{
        width: 40,
        height: 3,
        borderRadius: 2,
        background: isDragging ? '#38bdf8' : 'rgba(148, 163, 184, 0.5)',
        boxShadow: isDragging ? '0 0 8px rgba(56, 189, 248, 0.6)' : 'none',
        transition: 'all 0.2s',
      }} />
    </div>
  );
};

export default BottomSheetHandle;
