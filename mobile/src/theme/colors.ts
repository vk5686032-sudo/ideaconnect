export const colors = {
  light: {
    background: '#f9fafb',
    surface: '#ffffff',
    border: '#f3f4f6',
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    tint: '#4f46e5',
  },
  dark: {
    background: '#0b0f19',
    surface: '#111827',
    border: '#1f2937',
    textPrimary: '#f3f4f6',
    textSecondary: '#9ca3af',
    tint: '#818cf8',
  },
} as const;

export type SchemeName = keyof typeof colors;
