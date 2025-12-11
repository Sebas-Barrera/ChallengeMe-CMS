'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

interface CategoryData {
  game_mode_id: string;
  icon: string | null;
  text_color: string;
  min_players: number;
  max_players: number;
  gradient_colors: [string, string];
  age_rating: 'ALL' | 'TEEN' | 'ADULT';
  is_premium: boolean;
  is_active: boolean;
  sort_order?: number;
  route?: string | null;
  author?: string | null;
}

interface CategoryTranslation {
  challenge_category_id: string;
  language_code: string;
  title: string;
  description: string | null;
  instructions: string | null;
  tags: string[] | null;
}

interface ChallengeData {
  challenge_category_id: string;
  icon: string | null;
  is_active: boolean;
  is_premium: boolean;
}

interface ChallengeTranslation {
  challenge_id: string;
  language_code: string;
  content: string;
}

export async function createChallengeCategory(
  categoryData: CategoryData,
  translations: Omit<CategoryTranslation, 'challenge_category_id'>[]
) {
  try {
    // 1. Insertar la categoría
    const { data: category, error: categoryError } = await supabaseAdmin
      .from('challenge_categories')
      .insert(categoryData)
      .select('id')
      .single();

    if (categoryError) {
      return { success: false, error: categoryError.message };
    }

    // 2. Insertar traducciones
    const translationsToInsert = translations.map((trans) => ({
      ...trans,
      challenge_category_id: category.id,
    }));

    const { error: translationsError } = await supabaseAdmin
      .from('challenge_category_translations')
      .insert(translationsToInsert);

    if (translationsError) {
      // Rollback: eliminar la categoría
      await supabaseAdmin.from('challenge_categories').delete().eq('id', category.id);
      return { success: false, error: translationsError.message };
    }

    return { success: true, data: category };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

export async function createChallenge(
  challengeData: ChallengeData,
  translations: Omit<ChallengeTranslation, 'challenge_id'>[]
) {
  try {
    // 1. Insertar el challenge
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .insert(challengeData)
      .select('id')
      .single();

    if (challengeError) {
      return { success: false, error: challengeError.message };
    }

    // 2. Insertar traducciones
    const translationsToInsert = translations.map((trans) => ({
      ...trans,
      challenge_id: challenge.id,
    }));

    const { error: translationsError } = await supabaseAdmin
      .from('challenge_translations')
      .insert(translationsToInsert);

    if (translationsError) {
      // Rollback: eliminar el challenge
      await supabaseAdmin.from('challenges').delete().eq('id', challenge.id);
      return { success: false, error: translationsError.message };
    }

    return { success: true, data: challenge };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

export async function updateChallenge(
  challengeId: string,
  challengeData: Omit<ChallengeData, 'challenge_category_id'>,
  translations: Omit<ChallengeTranslation, 'challenge_id'>[]
) {
  try {
    // 1. Actualizar el challenge
    const { error: challengeError } = await supabaseAdmin
      .from('challenges')
      .update(challengeData)
      .eq('id', challengeId);

    if (challengeError) {
      return { success: false, error: challengeError.message };
    }

    // 2. Eliminar traducciones existentes
    const { error: deleteError } = await supabaseAdmin
      .from('challenge_translations')
      .delete()
      .eq('challenge_id', challengeId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // 3. Insertar nuevas traducciones
    const translationsToInsert = translations.map((trans) => ({
      ...trans,
      challenge_id: challengeId,
    }));

    const { error: translationsError } = await supabaseAdmin
      .from('challenge_translations')
      .insert(translationsToInsert);

    if (translationsError) {
      return { success: false, error: translationsError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

export async function updateChallengeCategory(
  categoryId: string,
  categoryData: CategoryData,
  translations: Omit<CategoryTranslation, 'challenge_category_id'>[]
) {
  try {
    // 1. Actualizar la categoría
    const { error: categoryError } = await supabaseAdmin
      .from('challenge_categories')
      .update(categoryData)
      .eq('id', categoryId);

    if (categoryError) {
      return { success: false, error: categoryError.message };
    }

    // 2. Eliminar traducciones existentes
    const { error: deleteError } = await supabaseAdmin
      .from('challenge_category_translations')
      .delete()
      .eq('challenge_category_id', categoryId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // 3. Insertar nuevas traducciones
    const translationsToInsert = translations.map((trans) => ({
      ...trans,
      challenge_category_id: categoryId,
    }));

    const { error: translationsError } = await supabaseAdmin
      .from('challenge_category_translations')
      .insert(translationsToInsert);

    if (translationsError) {
      return { success: false, error: translationsError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

export async function deleteChallenge(challengeId: string) {
  try {
    // Eliminar el reto (las traducciones se eliminan automáticamente por CASCADE)
    const { error } = await supabaseAdmin
      .from('challenges')
      .delete()
      .eq('id', challengeId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

export async function deleteChallengeCategory(categoryId: string) {
  try {
    // Primero obtener el conteo de retos asociados
    const { count: challengeCount, error: countError } = await supabaseAdmin
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_category_id', categoryId);

    if (countError) {
      console.error('Error counting challenges:', countError);
    }

    // Eliminar la categoría (CASCADE se encargará de eliminar:
    // - challenge_category_translations
    // - challenges
    // - challenge_translations)
    const { error } = await supabaseAdmin
      .from('challenge_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, deletedChallenges: challengeCount || 0 };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

export async function createChallengeBulk(
  challengeData: ChallengeData,
  translations: Record<string, { content: string }>
) {
  try {
    // 1. Insertar el challenge
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .insert(challengeData)
      .select('id')
      .single();

    if (challengeError) {
      return { success: false, error: challengeError.message };
    }

    if (!challenge) {
      return { success: false, error: 'No se pudo crear el reto' };
    }

    // 2. Preparar traducciones
    const translationsToInsert: any[] = [];
    Object.entries(translations).forEach(([langCode, trans]) => {
      if (trans && trans.content) {
        translationsToInsert.push({
          challenge_id: challenge.id,
          language_code: langCode,
          content: trans.content,
        });
      }
    });

    if (translationsToInsert.length === 0) {
      // Rollback: eliminar el challenge
      await supabaseAdmin.from('challenges').delete().eq('id', challenge.id);
      return { success: false, error: 'No hay traducciones válidas para insertar' };
    }

    // 3. Insertar traducciones
    const { error: translationsError } = await supabaseAdmin
      .from('challenge_translations')
      .insert(translationsToInsert);

    if (translationsError) {
      // Rollback: eliminar el challenge
      await supabaseAdmin.from('challenges').delete().eq('id', challenge.id);
      return { success: false, error: translationsError.message };
    }

    return { success: true, data: challenge };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}
