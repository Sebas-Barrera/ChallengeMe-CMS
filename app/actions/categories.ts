'use server';

interface Translation {
  language_code: string;
  title: string;
  description: string;
  instructions: string;
  tags: string;
}

interface FormData {
  game_mode_id: string;
  icon: string;
  text_color: string;
  min_players: number;
  max_players: number;
  gradient_colors: [string, string];
  age_rating: 'ALL' | 'TEEN' | 'ADULT';
  is_premium: boolean;
  is_active: boolean;
}

export async function createCategory(formData: FormData, translations: Translation[]) {
  try {
    // Validaciones básicas
    if (!formData || !translations || translations.length === 0) {
      return { success: false, error: 'Datos incompletos' };
    }

    // Validar que todas las traducciones tengan título
    const missingTitles = translations.filter((t) => !t.title || t.title.trim() === '');
    if (missingTitles.length > 0) {
      return { success: false, error: 'Todas las traducciones deben tener un título' };
    }

    // Construir el query completo en una sola transacción
    const tagsArrays = translations.map((t) => {
      const tags = t.tags
        ? t.tags
            .split(',')
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag)
        : [];
      return tags.length > 0
        ? `ARRAY[${tags.map((tag: string) => `'${tag.replace(/'/g, "''")}'`).join(', ')}]`
        : 'NULL';
    });

    const fullQuery = `
      DO $$
      DECLARE
        category_id UUID;
      BEGIN
        -- Insertar categoría
        INSERT INTO challenge_categories (
          game_mode_id,
          icon,
          text_color,
          min_players,
          max_players,
          gradient_colors,
          age_rating,
          is_premium,
          is_active
        ) VALUES (
          '${formData.game_mode_id}',
          ${formData.icon ? `'${formData.icon}'` : 'NULL'},
          '${formData.text_color}',
          ${formData.min_players},
          ${formData.max_players},
          ARRAY['${formData.gradient_colors[0]}', '${formData.gradient_colors[1]}'],
          '${formData.age_rating}',
          ${formData.is_premium},
          ${formData.is_active}
        )
        RETURNING id INTO category_id;

        -- Insertar traducciones
        ${translations
          .map(
            (t, index) => `
        INSERT INTO challenge_category_translations (
          challenge_category_id,
          language_code,
          title,
          description,
          instructions,
          tags
        ) VALUES (
          category_id,
          '${t.language_code}',
          '${t.title.replace(/'/g, "''")}',
          ${t.description ? `'${t.description.replace(/'/g, "''")}'` : 'NULL'},
          ${t.instructions ? `'${t.instructions.replace(/'/g, "''")}'` : 'NULL'},
          ${tagsArrays[index]}
        );
        `
          )
          .join('\n')}

      END $$;
    `;

    // Retornar el query para que sea ejecutado usando MCP tools en el cliente
    return {
      success: true,
      query: fullQuery,
      message: 'Query generado exitosamente',
    };
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    return { success: false, error: error.message };
  }
}
