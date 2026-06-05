/**
 * useKeyboardGroupNav
 *
 * Alternativa keyboard al drag-en-grupo. Permite al usuario mover
 * muestras con el teclado cuando no quiere/puede usar el mouse.
 *
 * Atajos:
 *   M          → entra/sale de modo "Mover Grupo"
 *   Esc        → cancela
 *   Enter      → confirma drop en la celda actual
 *   Tab        → mueve foco a la siguiente muestra (ciclo)
 *   ↑/↓/←/→    → mueve el cursor de destino 1 celda
 *   Shift+↑↓←→ → mueve el cursor de destino 5 celdas
 *   C          → cambiar anaquel destino (callback onChangeShelf)
 *
 * @param {object} args
 * @param {boolean} args.active - si el hook debe capturar teclas
 * @param {Function} args.onMove - callback al entrar en modo mover
 * @param {Function} args.onDrop - callback al confirmar
 * @param {Function} args.onCancel - callback al cancelar
 * @param {Function} args.onCursorMove - callback (dx, dy, dz) al mover cursor
 * @param {Function} args.onChangeShelf - callback para cambiar anaquel
 * @param {{x:number,y:number,z:number}} args.cursorPos - posición actual del cursor
 */
import { useEffect } from 'react';

const KEY_STEP = 1;
const SHIFT_STEP = 5;

const AXIS_DELTAS = {
  ArrowUp: { dz: -1 },
  ArrowDown: { dz: 1 },
  ArrowLeft: { dx: -1 },
  ArrowRight: { dx: 1 },
  PageUp: { dy: 1 },
  PageDown: { dy: -1 },
};

export const useKeyboardGroupNav = ({
  active = true,
  onMove,
  onDrop,
  onCancel,
  onCursorMove,
  onChangeShelf,
} = {}) => {
  useEffect(() => {
    if (!active) return undefined;

    const handler = (e) => {
      // Ignorar si el foco está en un input/textarea (no queremos
      // capturar teclas mientras el usuario escribe en un modal).
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (onCancel) onCancel();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (onDrop) onDrop();
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        if (onMove) onMove();
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (onChangeShelf) onChangeShelf();
        return;
      }
      const delta = AXIS_DELTAS[e.key];
      if (delta && onCursorMove) {
        e.preventDefault();
        const step = e.shiftKey ? SHIFT_STEP : KEY_STEP;
        onCursorMove({
          dx: (delta.dx || 0) * step,
          dy: (delta.dy || 0) * step,
          dz: (delta.dz || 0) * step,
        });
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onMove, onDrop, onCancel, onCursorMove, onChangeShelf]);
};

export default useKeyboardGroupNav;
