'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface FilterTranslation {
  language_code: string;
  name: string;
}

interface FilterData {
  label: string;
  icon: string | null;
  color: string | null;
  route: string | null;
  sort_order: number;
  is_active: boolean;
  is_premium: boolean;
  translations: Record<string, FilterTranslation>;
}

interface CategoryTranslation {
  language_code: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  intensity?: string | null;
}

interface CategoryData {
  deep_talk_category_id: string;
  icon: string | null;
  gradient_colors: string[] | null;
  estimated_time: number | null;
  is_active: boolean;
  sort_order: number;
  translations: Record<string, CategoryTranslation>;
}

interface QuestionTranslation {
  language_code: string;
  question: string;
}

interface QuestionData {
  deep_talk_id: string;
  sort_order: number;
  is_active: boolean;
  icon: string | null;
  translations: Record<string, QuestionTranslation>;
}

interface QuestionDataWithCategory extends Omit<QuestionData, 'deep_talk_id'> {
  category_title_es: string;
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

const DEEP_TALKS_GAME_MODE_ID = '33333333-3333-3333-3333-333333333333';

// ============================================================================
// CREAR CATEGORÍA DE DEEP TALK (FILTRO)
// ============================================================================

interface CreateFilterData {
  game_mode_id: string;
  label: string;
  icon: string | null;
  color: string | null;
  route: string | null;
  sort_order: number;
  is_premium: boolean;
  is_active: boolean;
}

interface CreateFilterTranslation {
  language_code: string;
  name: string;
}

export async function createDeepTalkCategory(
  categoryData: CreateFilterData,
  translations: CreateFilterTranslation[]
) {
  try {
    // 1. Recorrer los sort_order existentes
    const { data: existingFilters } = await supabaseAdmin
      .from('deep_talk_categories')
      .select('id, sort_order')
      .eq('game_mode_id', categoryData.game_mode_id)
      .gte('sort_order', categoryData.sort_order)
      .order('sort_order', { ascending: false });

    // Actualizar cada uno incrementando su sort_order en 1
    if (existingFilters && existingFilters.length > 0) {
      for (const existing of existingFilters) {
        await supabaseAdmin
          .from('deep_talk_categories')
          .update({ sort_order: existing.sort_order + 1 })
          .eq('id', existing.id);
      }
    }

    // 2. Insertar la categoría
    const { data: category, error: categoryError } = await supabaseAdmin
      .from('deep_talk_categories')
      .insert({
        game_mode_id: categoryData.game_mode_id,
        label: categoryData.label || null,
        icon: categoryData.icon || null,
        color: categoryData.color || null,
        route: categoryData.route || null,
        sort_order: categoryData.sort_order,
        is_premium: categoryData.is_premium,
        is_active: categoryData.is_active,
      })
      .select('id')
      .single();

    if (categoryError) {
      return { success: false, error: categoryError.message };
    }

    // 3. Insertar traducciones
    const translationsToInsert = translations.map((trans) => ({
      deep_talk_category_id: category.id,
      language_code: trans.language_code,
      name: trans.name,
    }));

    const { error: translationsError } = await supabaseAdmin
      .from('deep_talk_categories_translations')
      .insert(translationsToInsert);

    if (translationsError) {
      // Rollback: eliminar la categoría
      await supabaseAdmin.from('deep_talk_categories').delete().eq('id', category.id);
      return { success: false, error: translationsError.message };
    }

    return { success: true, data: category };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// ============================================================================
// ACTUALIZAR CATEGORÍA DE DEEP TALK (FILTRO)
// ============================================================================

export async function updateDeepTalkCategory(
  categoryId: string,
  categoryData: CreateFilterData,
  translations: CreateFilterTranslation[]
) {
  try {
    // 1. Actualizar la categoría
    const { error: categoryError } = await supabaseAdmin
      .from('deep_talk_categories')
      .update({
        game_mode_id: categoryData.game_mode_id,
        label: categoryData.label || null,
        icon: categoryData.icon || null,
        color: categoryData.color || null,
        route: categoryData.route || null,
        sort_order: categoryData.sort_order,
        is_premium: categoryData.is_premium,
        is_active: categoryData.is_active,
      })
      .eq('id', categoryId);

    if (categoryError) {
      return { success: false, error: categoryError.message };
    }

    // 2. Eliminar traducciones existentes
    const { error: deleteError } = await supabaseAdmin
      .from('deep_talk_categories_translations')
      .delete()
      .eq('deep_talk_category_id', categoryId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // 3. Insertar nuevas traducciones
    const translationsToInsert = translations.map((trans) => ({
      deep_talk_category_id: categoryId,
      language_code: trans.language_code,
      name: trans.name,
    }));

    const { error: translationsError } = await supabaseAdmin
      .from('deep_talk_categories_translations')
      .insert(translationsToInsert);

    if (translationsError) {
      return { success: false, error: translationsError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// ============================================================================
// ELIMINAR CATEGORÍA DE DEEP TALK (FILTRO)
// ============================================================================

export async function deleteDeepTalkCategory(categoryId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('deep_talk_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// ============================================================================
// CREAR DEEP TALK
// ============================================================================

interface CreateDeepTalkData {
  deep_talk_category_id: string;
  icon: string | null;
  gradient_colors: string[] | null;
  estimated_time: number | null;
  is_active: boolean;
  sort_order: number;
}

interface CreateDeepTalkTranslation {
  language_code: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  intensity?: string | null;
}

export async function createDeepTalk(
  deepTalkData: CreateDeepTalkData,
  translations: CreateDeepTalkTranslation[]
) {
  try {
    // 1. Insertar el deep talk
    const { data: deepTalk, error: deepTalkError } = await supabaseAdmin
      .from('deep_talks')
      .insert({
        deep_talk_category_id: deepTalkData.deep_talk_category_id,
        icon: deepTalkData.icon,
        gradient_colors: deepTalkData.gradient_colors,
        estimated_time: deepTalkData.estimated_time,
        is_active: deepTalkData.is_active,
        sort_order: deepTalkData.sort_order,
      })
      .select('id')
      .single();

    if (deepTalkError) {
      return { success: false, error: deepTalkError.message };
    }

    // 2. Insertar traducciones
    const translationsToInsert = translations.map((trans) => ({
      deep_talk_id: deepTalk.id,
      language_code: trans.language_code,
      title: trans.title,
      subtitle: trans.subtitle || null,
      description: trans.description || null,
      intensity: trans.intensity || null,
    }));

    const { error: translationsError } = await supabaseAdmin
      .from('deep_talk_translations')
      .insert(translationsToInsert);

    if (translationsError) {
      // Rollback: eliminar el deep talk
      await supabaseAdmin.from('deep_talks').delete().eq('id', deepTalk.id);
      return { success: false, error: translationsError.message };
    }

    return { success: true, data: deepTalk };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// ============================================================================
// ACTUALIZAR DEEP TALK
// ============================================================================

export async function updateDeepTalk(
  deepTalkId: string,
  deepTalkData: Omit<CreateDeepTalkData, 'deep_talk_category_id'>,
  translations: CreateDeepTalkTranslation[]
) {
  try {
    // 1. Actualizar el deep talk
    const { error: deepTalkError } = await supabaseAdmin
      .from('deep_talks')
      .update({
        icon: deepTalkData.icon,
        gradient_colors: deepTalkData.gradient_colors,
        estimated_time: deepTalkData.estimated_time,
        is_active: deepTalkData.is_active,
        sort_order: deepTalkData.sort_order,
      })
      .eq('id', deepTalkId);

    if (deepTalkError) {
      return { success: false, error: deepTalkError.message };
    }

    // 2. Eliminar traducciones existentes
    const { error: deleteError } = await supabaseAdmin
      .from('deep_talk_translations')
      .delete()
      .eq('deep_talk_id', deepTalkId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // 3. Insertar nuevas traducciones
    const translationsToInsert = translations.map((trans) => ({
      deep_talk_id: deepTalkId,
      language_code: trans.language_code,
      title: trans.title,
      subtitle: trans.subtitle || null,
      description: trans.description || null,
      intensity: trans.intensity || null,
    }));

    const { error: translationsError } = await supabaseAdmin
      .from('deep_talk_translations')
      .insert(translationsToInsert);

    if (translationsError) {
      return { success: false, error: translationsError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// ============================================================================
// ELIMINAR DEEP TALK
// ============================================================================

export async function deleteDeepTalk(deepTalkId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('deep_talks')
      .delete()
      .eq('id', deepTalkId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// ============================================================================
// CREAR PREGUNTA DE DEEP TALK
// ============================================================================

interface CreateQuestionData {
  deep_talk_id: string;
  sort_order: number;
  is_active: boolean;
  icon?: string | null;
}

interface CreateQuestionTranslation {
  language_code: string;
  question: string;
}

export async function createDeepTalkQuestion(
  questionData: CreateQuestionData,
  translations: CreateQuestionTranslation[]
) {
  try {
    // Insertar una pregunta por cada idioma (no hay tabla de traducciones separada)
    const questionsToInsert = translations.map((trans) => ({
      deep_talk_id: questionData.deep_talk_id,
      language_code: trans.language_code,
      question: trans.question,
      icon: questionData.icon || null,
      sort_order: questionData.sort_order,
      is_active: questionData.is_active,
    }));

    const { data: questions, error: questionError } = await supabaseAdmin
      .from('deep_talk_questions')
      .insert(questionsToInsert)
      .select('id');

    if (questionError) {
      return { success: false, error: questionError.message };
    }

    return { success: true, data: questions };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// ============================================================================
// ACTUALIZAR PREGUNTA DE DEEP TALK
// ============================================================================

export async function updateDeepTalkQuestion(
  sortOrder: number,
  deepTalkId: string,
  questionData: Omit<CreateQuestionData, 'deep_talk_id' | 'sort_order'>,
  translations: CreateQuestionTranslation[]
) {
  try {
    // 1. Obtener todas las preguntas con este sort_order para este deep_talk
    const { data: existingQuestions, error: fetchError } = await supabaseAdmin
      .from('deep_talk_questions')
      .select('id, language_code')
      .eq('deep_talk_id', deepTalkId)
      .eq('sort_order', sortOrder);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // 2. Actualizar cada pregunta existente o insertar nueva si no existe para ese idioma
    for (const translation of translations) {
      const existingQuestion = existingQuestions?.find(
        (q) => q.language_code === translation.language_code
      );

      if (existingQuestion) {
        // Actualizar pregunta existente
        const { error: updateError } = await supabaseAdmin
          .from('deep_talk_questions')
          .update({
            question: translation.question,
            icon: questionData.icon || null,
            is_active: questionData.is_active,
          })
          .eq('id', existingQuestion.id);

        if (updateError) {
          return { success: false, error: updateError.message };
        }
      } else {
        // Insertar nueva pregunta para este idioma
        const { error: insertError } = await supabaseAdmin
          .from('deep_talk_questions')
          .insert({
            deep_talk_id: deepTalkId,
            language_code: translation.language_code,
            question: translation.question,
            icon: questionData.icon || null,
            sort_order: sortOrder,
            is_active: questionData.is_active,
          });

        if (insertError) {
          return { success: false, error: insertError.message };
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// ============================================================================
// ELIMINAR PREGUNTA DE DEEP TALK
// ============================================================================

export async function deleteDeepTalkQuestion(deepTalkId: string, sortOrder: number) {
  try {
    // Eliminar todas las preguntas con este sort_order para este deep_talk
    // (elimina todas las versiones en diferentes idiomas)
    const { error } = await supabaseAdmin
      .from('deep_talk_questions')
      .delete()
      .eq('deep_talk_id', deepTalkId)
      .eq('sort_order', sortOrder);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// ============================================================================
// TOGGLE ACTIVE/INACTIVE PREGUNTA DE DEEP TALK
// ============================================================================

export async function toggleDeepTalkQuestionActive(deepTalkId: string, sortOrder: number, isActive: boolean) {
  try {
    // Actualizar is_active de todas las preguntas con este sort_order para este deep_talk
    // (actualiza todas las versiones en diferentes idiomas)
    const { error } = await supabaseAdmin
      .from('deep_talk_questions')
      .update({ is_active: isActive })
      .eq('deep_talk_id', deepTalkId)
      .eq('sort_order', sortOrder);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// ============================================================================
// SUBIR FILTROS (CATEGORÍAS DE DEEP TALK)
// ============================================================================

export async function uploadFiltersFromCSV(filters: FilterData[]) {
  const results = {
    successCount: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < filters.length; i++) {
    const filter = filters[i];

    try {
      // 1. Recorrer los sort_order existentes si es necesario
      const { data: existingFilters } = await supabaseAdmin
        .from('deep_talk_categories')
        .select('id, sort_order')
        .eq('game_mode_id', DEEP_TALKS_GAME_MODE_ID)
        .gte('sort_order', filter.sort_order)
        .order('sort_order', { ascending: false });

      // Actualizar cada uno incrementando su sort_order en 1
      if (existingFilters && existingFilters.length > 0) {
        for (const existing of existingFilters) {
          await supabaseAdmin
            .from('deep_talk_categories')
            .update({ sort_order: existing.sort_order + 1 })
            .eq('id', existing.id);
        }
      }

      // 2. Insertar el filtro
      const { data: filterData, error: filterError } = await supabaseAdmin
        .from('deep_talk_categories')
        .insert({
          label: filter.label,
          icon: filter.icon,
          color: filter.color,
          route: filter.route,
          sort_order: filter.sort_order,
          is_active: filter.is_active,
          is_premium: filter.is_premium,
          game_mode_id: DEEP_TALKS_GAME_MODE_ID,
        })
        .select('id')
        .single();

      if (filterError) {
        results.errors.push(`Filtro ${i + 1}: ${filterError.message}`);
        continue;
      }

      // 3. Insertar traducciones
      const translationsToInsert = Object.entries(filter.translations)
        .filter(([_, translation]) => translation.name.trim() !== '')
        .map(([lang, translation]) => ({
          deep_talk_category_id: filterData.id,
          language_code: lang,
          name: translation.name,
        }));

      const { error: translationsError } = await supabaseAdmin
        .from('deep_talk_categories_translations')
        .insert(translationsToInsert);

      if (translationsError) {
        // Rollback: eliminar el filtro
        await supabaseAdmin.from('deep_talk_categories').delete().eq('id', filterData.id);
        results.errors.push(`Filtro ${i + 1}: Error en traducciones - ${translationsError.message}`);
        continue;
      }

      results.successCount++;
    } catch (error: any) {
      results.errors.push(`Filtro ${i + 1}: ${error.message}`);
    }
  }

  return {
    success: results.successCount > 0,
    successCount: results.successCount,
    errors: results.errors,
  };
}

// ============================================================================
// SUBIR CATEGORÍAS (DEEP TALKS)
// ============================================================================

interface CategoryDataWithLabel extends Omit<CategoryData, 'deep_talk_category_id'> {
  filter_label: string;
}

export async function uploadCategoriesFromCSV(categories: CategoryDataWithLabel[]) {
  const results = {
    successCount: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];

    try {
      // 1. Buscar el filtro por label
      const { data: filterData, error: filterError } = await supabaseAdmin
        .from('deep_talk_categories')
        .select('id')
        .eq('label', category.filter_label)
        .single();

      if (filterError || !filterData) {
        results.errors.push(`Categoría ${i + 1}: No se encontró filtro con label "${category.filter_label}"`);
        continue;
      }

      const filterId = filterData.id;

      // 2. Recorrer los sort_order existentes si es necesario
      const { data: existingCategories } = await supabaseAdmin
        .from('deep_talks')
        .select('id, sort_order')
        .eq('deep_talk_category_id', filterId)
        .gte('sort_order', category.sort_order)
        .order('sort_order', { ascending: false });

      // Actualizar cada uno incrementando su sort_order en 1
      if (existingCategories && existingCategories.length > 0) {
        for (const existing of existingCategories) {
          await supabaseAdmin
            .from('deep_talks')
            .update({ sort_order: existing.sort_order + 1 })
            .eq('id', existing.id);
        }
      }

      // 3. Insertar la categoría (deep talk)
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from('deep_talks')
        .insert({
          deep_talk_category_id: filterId,
          icon: category.icon,
          gradient_colors: category.gradient_colors,
          estimated_time: category.estimated_time,
          is_active: category.is_active,
          sort_order: category.sort_order,
        })
        .select('id')
        .single();

      if (categoryError) {
        results.errors.push(`Categoría ${i + 1}: ${categoryError.message}`);
        continue;
      }

      // 4. Insertar traducciones
      const translationsToInsert = Object.entries(category.translations)
        .filter(([_, translation]) => translation.title.trim() !== '')
        .map(([lang, translation]) => ({
          deep_talk_id: categoryData.id,
          language_code: lang,
          title: translation.title,
          subtitle: translation.subtitle || null,
          description: translation.description || null,
          intensity: translation.intensity || null,
        }));

      const { error: translationsError } = await supabaseAdmin
        .from('deep_talk_translations')
        .insert(translationsToInsert);

      if (translationsError) {
        // Rollback: eliminar la categoría
        await supabaseAdmin.from('deep_talks').delete().eq('id', categoryData.id);
        results.errors.push(`Categoría ${i + 1}: Error en traducciones - ${translationsError.message}`);
        continue;
      }

      results.successCount++;
    } catch (error: any) {
      results.errors.push(`Categoría ${i + 1}: ${error.message}`);
    }
  }

  return {
    success: results.successCount > 0,
    successCount: results.successCount,
    errors: results.errors,
  };
}

// ============================================================================
// SUBIR PREGUNTAS
// ============================================================================

export async function uploadQuestionsFromCSV(questions: QuestionDataWithCategory[]) {
  const results = {
    successCount: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    try {
      // 1. Buscar el deep_talk por el título en español
      const { data: deepTalkData, error: deepTalkError } = await supabaseAdmin
        .from('deep_talk_translations')
        .select('deep_talk_id')
        .eq('language_code', 'es')
        .eq('title', question.category_title_es)
        .single();

      if (deepTalkError || !deepTalkData) {
        results.errors.push(`Pregunta ${i + 1}: No se encontró categoría con título "${question.category_title_es}"`);
        continue;
      }

      const deepTalkId = deepTalkData.deep_talk_id;

      // 2. Recorrer los sort_order existentes si es necesario
      const { data: existingQuestions } = await supabaseAdmin
        .from('deep_talk_questions')
        .select('id, sort_order, language_code')
        .eq('deep_talk_id', deepTalkId)
        .gte('sort_order', question.sort_order)
        .order('sort_order', { ascending: false });

      // Actualizar cada uno incrementando su sort_order en 1
      if (existingQuestions && existingQuestions.length > 0) {
        // Agrupar por sort_order para evitar actualizaciones duplicadas
        const uniqueSortOrders = new Set(existingQuestions.map(q => q.sort_order));
        for (const sortOrder of uniqueSortOrders) {
          await supabaseAdmin
            .from('deep_talk_questions')
            .update({ sort_order: sortOrder + 1 })
            .eq('deep_talk_id', deepTalkId)
            .eq('sort_order', sortOrder);
        }
      }

      // 3. Insertar las preguntas (una por idioma)
      const questionsToInsert = Object.entries(question.translations)
        .filter(([_, translation]) => translation.question.trim() !== '')
        .map(([lang, translation]) => ({
          deep_talk_id: deepTalkId,
          language_code: lang,
          question: translation.question,
          icon: question.icon || null,
          sort_order: question.sort_order,
          is_active: question.is_active,
        }));

      const { error: questionError } = await supabaseAdmin
        .from('deep_talk_questions')
        .insert(questionsToInsert);

      if (questionError) {
        results.errors.push(`Pregunta ${i + 1}: ${questionError.message}`);
        continue;
      }

      results.successCount++;
    } catch (error: any) {
      results.errors.push(`Pregunta ${i + 1}: ${error.message}`);
    }
  }

  return {
    success: results.successCount > 0,
    successCount: results.successCount,
    errors: results.errors,
  };
}
