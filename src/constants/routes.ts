/**
 * Rutas del CMS
 * Centraliza todas las rutas de la aplicación
 */

export const ROUTES = {
  // Autenticación
  AUTH: {
    LOGIN: '/login',
  },

  // Dashboard
  DASHBOARD: {
    HOME: '/',
  },

  // Retos (Challenges)
  CHALLENGES: {
    ROOT: '/challenges',
    CATEGORIES: {
      LIST: '/challenges/categories',
      NEW: '/challenges/categories/new',
      EDIT: (id: string) => `/challenges/categories/${id}`,
      CHALLENGES: {
        LIST: (categoryId: string) => `/challenges/categories/${categoryId}/challenges`,
        NEW: (categoryId: string) => `/challenges/categories/${categoryId}/challenges/new`,
        EDIT: (categoryId: string, challengeId: string) =>
          `/challenges/categories/${categoryId}/challenges/${challengeId}`,
      },
    },
  },

  // Deep Talks
  DEEP_TALKS: {
    ROOT: '/deep-talks',
    CATEGORIES: {
      LIST: '/deep-talks/categories',
      NEW: '/deep-talks/categories/new',
      EDIT: (id: string) => `/deep-talks/categories/${id}`,
    },
    TALKS: {
      LIST: (categoryId: string) => `/deep-talks/categories/${categoryId}/talks`,
      NEW: (categoryId: string) => `/deep-talks/categories/${categoryId}/talks/new`,
      EDIT: (categoryId: string, talkId: string) =>
        `/deep-talks/categories/${categoryId}/talks/${talkId}`,
    },
  },

  // Drinking Games
  DRINKING_GAMES: {
    ROOT: '/drinking-games',
    CATEGORIES: {
      LIST: '/drinking-games/categories',
      NEW: '/drinking-games/categories/new',
      EDIT: (id: string) => `/drinking-games/categories/${id}`,
    },
    GAMES: {
      LIST: (categoryId: string) => `/drinking-games/categories/${categoryId}/games`,
      NEW: (categoryId: string) => `/drinking-games/categories/${categoryId}/games/new`,
      EDIT: (categoryId: string, gameId: string) =>
        `/drinking-games/categories/${categoryId}/games/${gameId}`,
    },
  },

  // Game Modes
  GAME_MODES: {
    LIST: '/game-modes',
    NEW: '/game-modes/new',
    EDIT: (id: string) => `/game-modes/${id}`,
  },

  // Tips Diarios
  TIPS: {
    LIST: '/tips',
    NEW: '/tips/new',
    EDIT: (id: string) => `/tips/${id}`,
  },
} as const;
