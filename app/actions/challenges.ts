'use server';

interface ChallengeTranslation {
  language_code: string;
  content: string;
}

interface ChallengeFormData {
  challenge_category_id: string;
  icon: string;
  is_active: boolean;
  is_premium: boolean;
}

export async function createChallenge(
  formData: ChallengeFormData,
  translations: ChallengeTranslation[]
) {
  try {
    // Validaciones básicas
    if (!formData || !translations || translations.length === 0) {
      return { success: false, error: 'Datos incompletos' };
    }

    if (!formData.challenge_category_id) {
      return { success: false, error: 'El ID de categoría es requerido' };
    }

    // Validar que todas las traducciones tengan contenido
    const missingContent = translations.filter((t) => !t.content || t.content.trim() === '');
    if (missingContent.length > 0) {
      return {
        success: false,
        error: 'Todas las traducciones deben tener contenido',
      };
    }

    // Construir el query completo en una sola transacción
    const fullQuery = `
      DO $$
      DECLARE
        challenge_id UUID;
      BEGIN
        -- Insertar challenge
        INSERT INTO challenges (
          challenge_category_id,
          icon,
          is_active,
          is_premium
        ) VALUES (
          '${formData.challenge_category_id}',
          ${formData.icon ? `'${formData.icon.replace(/'/g, "''")}'` : 'NULL'},
          ${formData.is_active},
          ${formData.is_premium}
        )
        RETURNING id INTO challenge_id;

        -- Insertar traducciones
        ${translations
          .map(
            (t) => `
        INSERT INTO challenge_translations (
          challenge_id,
          language_code,
          content
        ) VALUES (
          challenge_id,
          '${t.language_code}',
          '${t.content.replace(/'/g, "''")}'
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
    console.error('Error al crear challenge:', error);
    return { success: false, error: error.message };
  }
}
