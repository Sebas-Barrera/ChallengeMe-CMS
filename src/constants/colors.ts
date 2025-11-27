/**
 * Sistema de colores del CMS ChallengeMe
 * Basado en el diseño de la app móvil
 */

export const BrandColors = {
  // Colores neón principales
  neon: {
    yellow: '#BDF522',
    pink: '#FF3BA7',
    orange: '#FD8616',
    purple: '#A855F7',
    blue: '#3B82F6',
    green: '#10B981',
  },

  // Fondos
  background: {
    primary: '#0A0A0A',      // Negro profundo
    secondary: '#1A1A1A',    // Gris muy oscuro
    tertiary: '#2A2A2A',     // Gris oscuro
    card: '#1A1A1A',
  },

  // Bordes
  border: {
    default: '#333333',
    light: '#444444',
    dark: '#222222',
  },

  // Texto
  text: {
    primary: '#FFFFFF',
    secondary: '#999999',
    tertiary: '#666666',
    disabled: '#444444',
  },

  // Estados
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  // Overlay
  overlay: {
    dark: 'rgba(0, 0, 0, 0.8)',
    medium: 'rgba(0, 0, 0, 0.6)',
    light: 'rgba(0, 0, 0, 0.4)',
  },
} as const;

// Export para usar en Tailwind
export const tailwindColors = {
  'brand-yellow': BrandColors.neon.yellow,
  'brand-pink': BrandColors.neon.pink,
  'brand-orange': BrandColors.neon.orange,
  'brand-purple': BrandColors.neon.purple,
  'bg-primary': BrandColors.background.primary,
  'bg-secondary': BrandColors.background.secondary,
  'bg-tertiary': BrandColors.background.tertiary,
} as const;
