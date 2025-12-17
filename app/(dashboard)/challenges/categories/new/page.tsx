'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import IconPicker from '@/components/ui/IconPicker';
import LanguageSelector from '@/components/forms/LanguageSelector';
import TranslationFields from '@/components/forms/TranslationFields';
import SuccessModal from '@/components/ui/SuccessModal';

interface Translation {
  language_code: string;
  title: string;
  description: string;
  instructions: string;
  tags: string;
}

interface FormData {
  game_mode_id: string;
  icon: string | null;
  text_color: string;
  min_players: number;
  max_players: number;
  gradient_colors: [string, string];
  age_rating: 'ALL' | 'TEEN' | 'ADULT';
  is_premium: boolean;
  is_active: boolean;
  author: string;
}

export default function NewCategoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Modal de éxito
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    categoriesCount: number;
  }>({
    isOpen: false,
    categoriesCount: 0,
  });

  // Idiomas seleccionados
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['es', 'en']);

  // Traducciones
  const [translations, setTranslations] = useState<Record<string, Translation>>({
    es: {
      language_code: 'es',
      title: '',
      description: '',
      instructions: '',
      tags: '',
    },
    en: {
      language_code: 'en',
      title: '',
      description: '',
      instructions: '',
      tags: '',
    },
  });

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
    author: '',
  });

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
    } catch (error) {
      console.error('Error al auto-traducir:', error);
      alert('Error al traducir: ' + (error instanceof Error ? error.message : 'Intenta de nuevo'));
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

      // Preparar datos de la categoría
      const categoryData = {
        game_mode_id: formData.game_mode_id,
        icon: formData.icon || null,
        text_color: formData.text_color,
        min_players: formData.min_players,
        max_players: formData.max_players,
        gradient_colors: formData.gradient_colors,
        age_rating: formData.age_rating,
        is_premium: formData.is_premium,
        is_active: formData.is_active,
        author: formData.author || null,
      };

      // Preparar traducciones
      const translationsToInsert = selectedLanguages.map((lang) => {
        const trans = translations[lang];
        const tags = trans.tags
          ? trans.tags
              .split(',')
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag)
          : [];

        return {
          language_code: lang,
          title: trans.title,
          description: trans.description || null,
          instructions: trans.instructions || null,
          tags: tags.length > 0 ? tags : null,
        };
      });

      // Usar Server Action para crear la categoría
      const { createChallengeCategory } = await import('@/actions/challenges');
      const result = await createChallengeCategory(categoryData, translationsToInsert);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Éxito - mostrar modal
      setSuccessModal({ isOpen: true, categoriesCount: 1 });
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al crear la categoría. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const ageRatingOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'TEEN', label: 'Adolescentes (13+)' },
    { value: 'ADULT', label: 'Adultos (18+)' },
  ];

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Header */}
      <header className="bg-[#2A2A2A]/80 backdrop-blur-sm border-b border-[#333333] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="shrink-0">
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
                className="w-10 h-10 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-5 h-5 text-white"
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
                <h1 className="text-lg font-bold text-white">Nueva Categoría</h1>
                <p className="text-xs text-[#999999]">
                  Crear categoría de retos
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
          <div className="bg-[#2A2A2A]/80 backdrop-blur-sm border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BDF522]/20 to-[#BDF522]/5 border border-[#BDF522]/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#BDF522]"
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
                <h2 className="text-xl font-bold text-white">Información General</h2>
                <p className="text-sm text-[#999999]">
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
                label="Autor"
                type="text"
                placeholder="Nombre del autor (opcional)"
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
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
              <label className="block text-sm font-medium text-white mb-2">
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
                  className="w-5 h-5 rounded border-[#333333] text-[#BDF522] focus:ring-2 focus:ring-[#BDF522]/50 bg-[#1A1A1A]"
                />
                <span className="text-sm text-white font-medium">
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
                  className="w-5 h-5 rounded border-[#333333] text-[#BDF522] focus:ring-2 focus:ring-[#BDF522]/50 bg-[#1A1A1A]"
                />
                <span className="text-sm text-white font-medium">
                  Categoría Activa
                </span>
              </label>
            </div>
          </div>

          {/* Idiomas */}
          <div className="bg-[#2A2A2A]/80 backdrop-blur-sm border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/10">
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
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#333333]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isLoading ? 'Guardando...' : 'Crear Categoría'}
            </Button>
          </div>
        </form>
      </main>

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => {
          setSuccessModal({ isOpen: false, categoriesCount: 0 });
          router.push('/challenges/categories');
        }}
        title="¡Categoría Creada!"
        message="La categoría se creó correctamente."
      />
    </div>
  );
}
