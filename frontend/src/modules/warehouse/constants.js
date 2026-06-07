/**
 * Warehouse Design Tokens
 *
 * Tokens compartidos por todos los componentes del módulo de Almacén
 * (tooltips, modales, chips, toasts, barras flotantes). Sirven para
 * mantener la coherencia visual entre vistas: misma opacidad de fondo,
 * mismo blur, mismo border-radius, mismo tamaño de botón, etc.
 *
 * Si un valor visual se va a repetir en 2+ componentes, va aquí.
 */

// ─── Fondos y superficies ────────────────────────────────────────────
export const SURFACE = {
  // Paneles principales (modales, barras flotantes) - más opaco
  PANEL: 'rgba(13, 18, 28, 0.96)',
  // Barras flotantes, chips - semi-transparente
  BAR: 'rgba(9, 13, 22, 0.92)',
  // Tooltips sobre cubos - más ligero para no ocultar la muestra
  TOOLTIP: 'rgba(9, 13, 22, 0.75)',
  // Inputs y campos secundarios
  FIELD: 'rgba(255, 255, 255, 0.02)',
  FIELD_BORDER: 'rgba(255, 255, 255, 0.04)',
};

// ─── Backdrop de overlays modales ────────────────────────────────────
export const BACKDROP = {
  BG: 'rgba(0, 0, 0, 0.55)',
  FILTER: 'blur(8px)',
  Z_INDEX: 110,
};

// ─── Blur levels ─────────────────────────────────────────────────────
export const BLUR = {
  SM: 'blur(12px)',
  MD: 'blur(16px)',
  LG: 'blur(20px)',
  XL: 'blur(24px)',
};

// ─── Border radius ───────────────────────────────────────────────────
export const RADIUS = {
  SM: 6,
  MD: 8,
  LG: 12,
  XL: 16,
  PILL: 9999,
};

// ─── Padding presets ────────────────────────────────────────────────
export const PADDING = {
  TOOLTIP: '6px 10px',
  PANEL: '20px 24px',
  TOAST: '10px 14px',
  BAR: '8px 10px 8px 14px',
  CHIP: '3px 8px 3px 6px',
};

// ─── Botones ─────────────────────────────────────────────────────────
export const BUTTON = {
  // Botón secundario (ghost) - Cancelar, Cerrar, Limpiar
  GHOST: {
    BG: 'rgba(255, 255, 255, 0.04)',
    BORDER: '1px solid rgba(255, 255, 255, 0.1)',
    COLOR: '#cbd5e1',
    RADIUS: RADIUS.MD,
    PAD: '9px 16px',
    FONT_SIZE: 11,
    FONT_WEIGHT: 700,
    LETTER_SPACING: 0.3,
  },
  // Botón primario azul - Confirmar movimiento, Mover individual
  PRIMARY: {
    GRADIENT: 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
    BORDER: '1px solid rgba(14, 165, 233, 0.4)',
    COLOR: '#fff',
    RADIUS: RADIUS.MD,
    PAD: '9px 18px',
    FONT_SIZE: 11,
    FONT_WEIGHT: 800,
    LETTER_SPACING: 0.4,
    SHADOW: '0 4px 14px rgba(14, 165, 233, 0.3)',
  },
  // Botón primario verde - Confirmar movimiento válido
  PRIMARY_GREEN: {
    GRADIENT: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
    BORDER: '1px solid rgba(16, 185, 129, 0.4)',
    COLOR: '#fff',
    RADIUS: RADIUS.MD,
    PAD: '9px 20px',
    FONT_SIZE: 11,
    FONT_WEIGHT: 800,
    LETTER_SPACING: 0.4,
    SHADOW: '0 4px 14px rgba(16, 185, 129, 0.3)',
  },
  // Botón deshabilitado
  DISABLED: {
    BG: 'rgba(100, 116, 139, 0.4)',
    COLOR: '#fff',
    CURSOR: 'not-allowed',
  },
  // Botón sky/informativo - Agregar a grupo
  SKY: {
    BG: 'rgba(56, 189, 248, 0.08)',
    BORDER: '1px solid rgba(56, 189, 248, 0.35)',
    COLOR: '#7dd3fc',
  },
};

// ─── Tipografía ──────────────────────────────────────────────────────
export const FONT = {
  LABEL_XS: {
    SIZE: 8,
    WEIGHT: 800,
    COLOR: '#64748b',
    LETTER_SPACING: 0.4,
    TRANSFORM: 'uppercase',
  },
  LABEL_SM: {
    SIZE: 9,
    WEIGHT: 800,
    COLOR: '#64748b',
    LETTER_SPACING: 0.4,
    TRANSFORM: 'uppercase',
  },
  LABEL_MD: {
    SIZE: 10,
    WEIGHT: 800,
    COLOR: '#64748b',
    LETTER_SPACING: 0.4,
    TRANSFORM: 'uppercase',
  },
  ID_MONO: {
    SIZE: 9,
    WEIGHT: 800,
    FAMILY: 'monospace',
    LETTER_SPACING: 0.4,
  },
  VALUE_SM: { SIZE: 10, WEIGHT: 600, COLOR: '#e2e8f0' },
  VALUE_MD: { SIZE: 12, WEIGHT: 700, COLOR: '#f1f5f9' },
  HEADING_SM: { SIZE: 15, WEIGHT: 800, COLOR: '#f1f5f9' },
  HEADING_MD: { SIZE: 16, WEIGHT: 800, COLOR: '#f1f5f9' },
};

// ─── Animaciones ─────────────────────────────────────────────────────
export const ANIM = {
  FADE_IN: 'modalFadeIn 160ms ease',
  SLIDE_UP: 'modalSlideUp 220ms ease',
  TOOLTIP_IN: 'sampleTooltipIn 120ms ease-out',
  BAR_IN: 'floatingBarIn 220ms ease-out',
  TOAST_DOWN: 'toastSlideDown 220ms ease',
};

// ─── SGA Colors (re-exportado para conveniencia) ─────────────────────
export const SGA_COLORS = {
  'Toxic': '#a855f7',
  'Flammable': '#f97316',
  'Oxidizing': '#eab308',
  'Explosive': '#ef4444',
  'Corrosive': '#10b981',
  'Miscellaneous': '#64748b',
  'Sin Riesgo': '#38bdf8',
};

// ─── Sombras estándar ───────────────────────────────────────────────
export const SHADOW = {
  PANEL: '0 20px 60px rgba(0, 0, 0, 0.7)',
  BAR: '0 8px 28px rgba(0, 0, 0, 0.55)',
  TOOLTIP: '0 4px 16px rgba(0, 0, 0, 0.5)',
  TOAST: '0 8px 24px rgba(0, 0, 0, 0.5)',
};

// ─── SGA badge ──────────────────────────────────────────────────────
export const SGA_BADGE = (sgaColor) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 6px',
  borderRadius: 4,
  background: `${sgaColor}15`,
  border: `1px solid ${sgaColor}30`,
  fontSize: 9,
  fontWeight: 800,
  color: sgaColor,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
});

// ─── Status colors (occupied/warning/expired) ────────────────────────
export const STATUS_COLORS = {
  occupied: '#0ea5e9',
  warning: '#f59e0b',
  expired: '#ef4444',
  empty: '#1e293b',
};

export const STATUS_LABELS = {
  occupied: 'Activa',
  warning: 'Por vencer',
  expired: 'Vencida',
};

export const STATUS_TEXT_COLORS = {
  occupied: '#34d399',
  warning: '#facc15',
  expired: '#f87171',
};
