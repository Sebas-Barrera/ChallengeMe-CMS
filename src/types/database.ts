/**
 * Tipos de la base de datos Supabase
 * Generados basándose en el esquema de la base de datos
 */

// ============================================
// CHALLENGES (Retos)
// ============================================

export interface ChallengeCategory {
  id: string;
  game_mode_id: string;
  icon: string | null;
  text_color: string;
  sort_order: number;
  min_players: number;
  max_players: number;
  route: string | null;
  age_rating: 'ALL' | 'TEEN' | 'ADULT';
  gradient_colors: string[] | null;
  is_active: boolean;
  is_premium: boolean;
  author: string | null;
}

export interface ChallengeCategoryTranslation {
  id: string;
  challenge_category_id: string;
  language_code: string;
  title: string;
  description: string | null;
  instructions: string | null;
  tags: string[] | null;
}

export interface Challenge {
  id: string;
  challenge_category_id: string;
  icon: string | null;
  is_active: boolean;
  is_premium: boolean;
}

export interface ChallengeTranslation {
  id: string;
  challenge_id: string;
  language_code: string;
  content: string;
}

// ============================================
// DEEP TALKS
// ============================================

export interface DeepTalkCategory {
  id: string;
  label: string | null;
  game_mode_id: string;
  sort_order: number;
  icon: string | null;
  color: string | null;
  route: string | null;
  is_premium: boolean;
  is_active: boolean;
}

export interface DeepTalkCategoryTranslation {
  id: string;
  language_code: string;
  deep_talk_category_id: string;
  name: string | null;
}

export interface DeepTalk {
  id: string;
  deep_talk_category_id: string;
  icon: string | null;
  gradient_colors: string[] | null;
  estimated_time: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface DeepTalkTranslation {
  id: string;
  deep_talk_id: string;
  language_code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  intensity: string | null;
}

export interface DeepTalkQuestion {
  id: string;
  deep_talk_id: string;
  language_code: string;
  question: string;
  sort_order: number;
  is_active: boolean;
}

// ============================================
// DRINKING GAMES
// ============================================

export interface DrinkingGameCategory {
  id: string;
  label: string | null;
  game_mode_id: string;
  sort_order: number;
  icon: string | null;
  color: string | null;
  is_premium: boolean;
  is_active: boolean;
}

export interface DrinkingGameCategoryTranslation {
  id: string;
  language_code: string;
  drinking_game_category_id: string;
  name: string | null;
}

export interface DrinkingGame {
  id: string;
  drinking_game_category_id: string;
  icon: string | null;
  gradient_colors: string[] | null;
  image_url: string | null;
  estimated_time: string | null;
  min_players: number;
  max_players: number;
  route: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface DrinkingGameTranslation {
  id: string;
  drinking_game_id: string;
  language_code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  intensity: string | null;
}

// ============================================
// GAME MODES
// ============================================

export interface GameMode {
  id: string;
  color: string;
  text_color: string;
  icon: string | null;
  route: string | null;
  sort_order: number;
  is_active: boolean;
  is_premium: boolean;
}

export interface GameModeTranslation {
  id: string;
  game_mode_id: string;
  language_code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
}

// ============================================
// DAILY TIPS
// ============================================

export interface DailyTip {
  id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyTipTranslation {
  id: string;
  tip_id: string;
  language_code: string;
  text: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// OTROS
// ============================================

export interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  language: string | null;
  is_active: boolean;
  push_token: string | null;
  push_token_updated_at: string | null;
  created_at: string;
  updated_at: string;
}
