/**
 * usePrefersReducedMotion
 *
 * Hook que observa el media query `prefers-reduced-motion: reduce` y
 * expone el estado actual. Usado por useGroupDrag y por SampleCube
 * para desactivar shake / pulse / float decorativos.
 *
 * @returns {boolean} true si el usuario prefiere reducir animaciones
 */
import { useEffect, useState } from 'react';

export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return reduced;
};

export default usePrefersReducedMotion;
