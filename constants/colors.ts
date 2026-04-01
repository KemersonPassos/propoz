/**
 * Propoz App — Design Tokens centralizados.
 * Cada tela importa `C` deste arquivo ao invés de redeclarar.
 */

export const C = {
  // ── Primary ──
  blue:        '#1A56DB',
  blueA12:     'rgba(255,255,255,0.12)',
  blueA15:     'rgba(255,255,255,0.15)',
  blueA20:     'rgba(255,255,255,0.20)',
  blueA65:     'rgba(255,255,255,0.65)',
  blueBg:      '#EFF6FF',
  blueText:    '#1e3a8a',
  blueLink:    '#3b82f6',

  // ── Orange ──
  orange:      '#EA580C',
  orangeBg:    '#FFF7ED',
  orangeBdr:   '#FED7AA',
  orangeTitle: '#9a3412',
  orangeSub:   '#c2410c',

  // ── Green ──
  green:       '#16a34a',
  greenBg:     '#F0FDF4',
  greenText:   '#166534',
  greenBdr:    '#86EFAC',
  greenWa:     '#25D366',

  // ── Red ──
  redBg:       '#FEF2F2',
  redText:     '#DC2626',

  // ── Gray ──
  grayBg:      '#F1F5F9',
  grayText:    '#64748b',

  // ── Neutrals ──
  ink:         '#1e293b',
  inkDark:     '#0D1626',
  muted:       '#64748b',
  subtle:      '#94a3b8',
  border:      '#F1F5F9',
  borderDark:  '#E2E8F0',
  surface:     '#F8FAFC',
  white:       '#ffffff',
  bgLight:     '#F0F4F8',
} as const;
