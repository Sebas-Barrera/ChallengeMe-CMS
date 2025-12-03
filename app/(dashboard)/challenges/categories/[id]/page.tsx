'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import IconPicker from '@/components/ui/IconPicker';
import LanguageSelector from '@/components/forms/LanguageSelector';
import TranslationFields from '@/components/forms/TranslationFields';
import { useAuth } from '@/contexts/AuthContext';
import { Image } from 'next/image';

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

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const { supabase } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Idiomas seleccionados
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Traducciones
  const [translations, setTranslations] = useState<Record<string, Translation>>({});

  // Datos del formulario principal
  const [formData, setFormData] = useState<FormData>({
    game_mode_id: '11111111-1111-1111-1111-111111111111',
    icon: 'party-popper',
    text_color: '#FFFFFF',
    min_players: 2,
    max_players: 10,
    gradient_colors: ['#FF6B6B', '#FF8E53'],
    age_rating: 'ALL',
    is_premium: false,
    is_active: true,
  });

  // Cargar datos de la categoría
  useEffect(() => {
    fetchCategoryData();
  }, [categoryId]);

  const fetchCategoryData = async () => {
    try {
      setIsLoadingData(true);

      // Obtener categoría con sus traducciones
      const { data: categoryData, error: categoryError } = await supabase
        .from('challenge_categories')
        .select(`
          *,
          challenge_category_translations (
            language_code,
            title,
            description,
            instructions,
            tags
          )
        `)
        .eq('id', categoryId)
        .single();

      if (categoryError) {
        throw categoryError;
      }

      if (!categoryData) {
        alert('Categoría no encontrada');
        router.push('/challenges/categories');
        return;
      }

      // Llenar formData
      setFormData({
        game_mode_id: categoryData.game_mode_id,
        icon: categoryData.icon || 'party-popper',
        text_color: categoryData.text_color,
        min_players: categoryData.min_players || 2,
        max_players: categoryData.max_players || 10,
        gradient_colors: categoryData.gradient_colors || ['#FF6B6B', '#FF8E53'],
        age_rating: categoryData.age_rating || 'ALL',
        is_premium: categoryData.is_premium,
        is_active: categoryData.is_active,
      });

      // Llenar traducciones
      const translationsData: Record<string, Translation> = {};
      const languages: string[] = [];

      categoryData.challenge_category_translations.forEach((trans: any) => {
        languages.push(trans.language_code);
        translationsData[trans.language_code] = {
          language_code: trans.language_code,
          title: trans.title || '',
          description: trans.description || '',
          instructions: trans.instructions || '',
          tags: trans.tags ? trans.tags.join(', ') : '',
        };
      });

      setSelectedLanguages(languages);
      setTranslations(translationsData);
    } catch (error: any) {
      console.error('Error al cargar categoría:', error);
      alert('Error al cargar la categoría: ' + error.message);
      router.push('/challenges/categories');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTranslationChange = (
    languageCode: string,
    field: keyof Translation,
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [languageCode]: {
        ...prev[languageCode],
        [field]: value,
        language_code: languageCode,
      },
    }));
  };

  const handleAutoTranslate = async (targetLanguage: string) => {
    try {
      // Obtener la traducción en español
      const esTranslation = translations['es'];

      if (!esTranslation || !esTranslation.title || esTranslation.title.trim() === '') {
        alert('Por favor, completa primero el título en español antes de auto-traducir');
        return;
      }

      // Preparar todos los textos a traducir
      const textsToTranslate: string[] = [];
      const fieldsWithText: Array<keyof Translation> = [];

      // Solo traducir campos que tengan contenido en español
      if (esTranslation.title && esTranslation.title.trim()) {
        textsToTranslate.push(esTranslation.title);
        fieldsWithText.push('title');
      }
      if (esTranslation.description && esTranslation.description.trim()) {
        textsToTranslate.push(esTranslation.description);
        fieldsWithText.push('description');
      }
      if (esTranslation.instructions && esTranslation.instructions.trim()) {
        textsToTranslate.push(esTranslation.instructions);
        fieldsWithText.push('instructions');
      }
      if (esTranslation.tags && esTranslation.tags.trim()) {
        textsToTranslate.push(esTranslation.tags);
        fieldsWithText.push('tags');
      }

      if (textsToTranslate.length === 0) {
        alert('No hay contenido en español para traducir');
        return;
      }

      // Hacer múltiples llamadas a la API (una por campo)
      const translationPromises = textsToTranslate.map((text) =>
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            targetLanguages: [targetLanguage],
          }),
        }).then((res) => res.json())
      );

      const results = await Promise.all(translationPromises);

      // Aplicar las traducciones
      const updatedTranslation: Translation = {
        ...translations[targetLanguage],
        language_code: targetLanguage,
      };

      results.forEach((result, index) => {
        if (result.success && result.translations[targetLanguage]) {
          const field = fieldsWithText[index];
          updatedTranslation[field] = result.translations[targetLanguage];
        }
      });

      // Actualizar el estado
      setTranslations((prev) => ({
        ...prev,
        [targetLanguage]: updatedTranslation,
      }));
    } catch (error: any) {
      console.error('Error al auto-traducir:', error);
      alert('Error al traducir: ' + (error.message || 'Intenta de nuevo'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar que todas las traducciones tengan título
      const missingTitles = selectedLanguages.filter(
        (lang) => !translations[lang]?.title || translations[lang].title.trim() === ''
      );

      if (missingTitles.length > 0) {
        alert('Por favor, completa el título para todos los idiomas seleccionados');
        setIsLoading(false);
        return;
      }

      // 1. Actualizar la categoría
      const { error: categoryError } = await supabase
        .from('challenge_categories')
        .update({
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
        .eq('id', categoryId);

      if (categoryError) {
        throw new Error(categoryError.message);
      }

      // 2. Eliminar traducciones existentes
      const { error: deleteError } = await supabase
        .from('challenge_category_translations')
        .delete()
        .eq('challenge_category_id', categoryId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // 3. Insertar nuevas traducciones
      const translationsToInsert = selectedLanguages.map((lang) => {
        const trans = translations[lang];
        const tags = trans.tags
          ? trans.tags
              .split(',')
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag)
          : [];

        return {
          challenge_category_id: categoryId,
          language_code: lang,
          title: trans.title,
          description: trans.description || null,
          instructions: trans.instructions || null,
          tags: tags.length > 0 ? tags : null,
        };
      });

      const { error: translationsError } = await supabase
        .from('challenge_category_translations')
        .insert(translationsToInsert);

      if (translationsError) {
        throw new Error(translationsError.message);
      }

      // Éxito - redirigir
      alert('¡Categoría actualizada exitosamente!');
      router.push('/challenges/categories');
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error al actualizar la categoría. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const ageRatingOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'TEEN', label: 'Adolescentes (13+)' },
    { value: 'ADULT', label: 'Adultos (18+)' },
  ];

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-brand-yellow/30 border-t-brand-yellow rounded-full animate-spin"></div>
          <p className="text-text-secondary">Cargando categoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-bg-secondary/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/logos/ChallengeMe-05.png"
                  alt="ChallengeMe"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </Link>
              <Link
                href="/challenges/categories"
                className="w-10 h-10 rounded-xl bg-bg-tertiary hover:bg-border border border-border flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-5 h-5 text-text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Editar Categoría</h1>
                <p className="text-xs text-text-secondary">
                  Modificar categoría de retos
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información General */}
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-brand-yellow"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Información General</h2>
                <p className="text-sm text-text-secondary">
                  Configuración básica de la categoría
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IconPicker
                label="Icono"
                placeholder="Buscar ícono..."
                value={formData.icon}
                onChange={(value) => setFormData({ ...formData, icon: value })}
                helperText="Busca o selecciona un ícono de Ionicons"
                required
              />

              <Input
                label="Color de Texto"
                type="color"
                value={formData.text_color}
                onChange={(e) =>
                  setFormData({ ...formData, text_color: e.target.value })
                }
                required
              />

              <Select
                label="Clasificación de Edad"
                options={ageRatingOptions}
                value={formData.age_rating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    age_rating: e.target.value as FormData['age_rating'],
                  })
                }
                required
              />

              <Input
                label="Mínimo de Jugadores"
                type="number"
                min={1}
                value={formData.min_players}
                onChange={(e) =>
                  setFormData({ ...formData, min_players: parseInt(e.target.value) })
                }
                required
              />

              <Input
                label="Máximo de Jugadores"
                type="number"
                min={1}
                value={formData.max_players}
                onChange={(e) =>
                  setFormData({ ...formData, max_players: parseInt(e.target.value) })
                }
                required
              />

              <Input
                label="Color de Gradiente 1"
                type="color"
                value={formData.gradient_colors[0]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gradient_colors: [e.target.value, formData.gradient_colors[1]],
                  })
                }
                required
              />

              <Input
                label="Color de Gradiente 2"
                type="color"
                value={formData.gradient_colors[1]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gradient_colors: [formData.gradient_colors[0], e.target.value],
                  })
                }
                required
              />
            </div>

            {/* Vista previa del gradiente */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Vista Previa del Gradiente
              </label>
              <div
                className="h-24 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${formData.gradient_colors[0]}, ${formData.gradient_colors[1]})`,
                }}
              />
            </div>

            {/* Checkboxes */}
            <div className="mt-6 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_premium}
                  onChange={(e) =>
                    setFormData({ ...formData, is_premium: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-border text-brand-yellow focus:ring-2 focus:ring-brand-yellow/50 bg-bg-tertiary"
                />
                <span className="text-sm text-text-primary font-medium">
                  Es contenido Premium
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-border text-brand-yellow focus:ring-2 focus:ring-brand-yellow/50 bg-bg-tertiary"
                />
                <span className="text-sm text-text-primary font-medium">
                  Categoría Activa
                </span>
              </label>
            </div>
          </div>

          {/* Idiomas */}
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
            <LanguageSelector
              selectedLanguages={selectedLanguages}
              onChange={(languages) => {
                setSelectedLanguages(languages);
                // Agregar traducciones vacías para nuevos idiomas
                const newTranslations = { ...translations };
                languages.forEach((lang) => {
                  if (!newTranslations[lang]) {
                    newTranslations[lang] = {
                      language_code: lang,
                      title: '',
                      description: '',
                      instructions: '',
                      tags: '',
                    };
                  }
                });
                setTranslations(newTranslations);
              }}
            />
          </div>

          {/* Traducciones */}
          <div>
            <TranslationFields
              selectedLanguages={selectedLanguages}
              translations={translations}
              onChange={handleTranslationChange}
              onAutoTranslate={handleAutoTranslate}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
