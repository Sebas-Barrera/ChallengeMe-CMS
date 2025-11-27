import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, translations } = body;

    // Validaciones básicas
    if (!formData || !translations || translations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Validar que todas las traducciones tengan título
    const missingTitles = translations.filter((t: any) => !t.title || t.title.trim() === '');
    if (missingTitles.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Todas las traducciones deben tener un título' },
        { status: 400 }
      );
    }

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Insertar la categoría principal
    const { data: category, error: categoryError } = await supabase
      .from('challenge_categories')
      .insert({
        game_mode_id: formData.game_mode_id,
        icon: formData.icon || null,
        text_color: formData.text_color,
        min_players: formData.min_players,
        max_players: formData.max_players,
        gradient_colors: formData.gradient_colors,
        age_rating: formData.age_rating,
        is_premium: formData.is_premium,
        is_active: formData.is_active,
      })
      .select('id')
      .single();

    if (categoryError) {
      console.error('Error al insertar categoría:', categoryError);
      return NextResponse.json(
        { success: false, error: categoryError.message },
        { status: 500 }
      );
    }

    // 2. Preparar las traducciones con el ID de la categoría
    const translationsToInsert = translations.map((t: any) => {
      const tags = t.tags
        ? t.tags
            .split(',')
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag)
        : [];

      return {
        challenge_category_id: category.id,
        language_code: t.language_code,
        title: t.title,
        description: t.description || null,
        instructions: t.instructions || null,
        tags: tags.length > 0 ? tags : null,
      };
    });

    // 3. Insertar las traducciones
    const { error: translationsError } = await supabase
      .from('challenge_category_translations')
      .insert(translationsToInsert);

    if (translationsError) {
      console.error('Error al insertar traducciones:', translationsError);
      // Si falla, intentar eliminar la categoría creada
      await supabase.from('challenge_categories').delete().eq('id', category.id);
      return NextResponse.json(
        { success: false, error: translationsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { categoryId: category.id },
      message: 'Categoría creada exitosamente',
    });
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
