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
}

interface CSVTranslation {
  title: string;
  description: string | null;
  instructions: string | null;
  tags: string | null;
}

interface CSVCategory {
  categoryData: FormData;
  translations: Record<string, CSVTranslation | null>;
}

interface CategoryTranslationInsert {
  challenge_category_id: string;
  language_code: string;
  title: string;
  description: string | null;
  instructions: string | null;
  tags: string[] | null;
}

export default function NewCategoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Modo de entrada: manual o CSV
  const [inputMode, setInputMode] = useState<'manual' | 'csv'>('manual');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvProgress, setCsvProgress] = useState<{ current: number; total: number; errors: string[] }>({
    current: 0,
    total: 0,
    errors: [],
  });

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

      // Ahora usamos el contexto de autenticación para insertar directamente
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // 1. Insertar la categoría
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
        throw new Error(categoryError.message);
      }

      // 2. Insertar traducciones
      const translationsToInsert = selectedLanguages.map((lang) => {
        const trans = translations[lang];
        const tags = trans.tags
          ? trans.tags
              .split(',')
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag)
          : [];

        return {
          challenge_category_id: category.id,
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
        // Si falla, eliminar la categoría
        await supabase.from('challenge_categories').delete().eq('id', category.id);
        throw new Error(translationsError.message);
      }

      // Éxito - mostrar modal
      setSuccessModal({ isOpen: true, categoriesCount: 1 });
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error al crear la categoría. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para parsear una línea CSV respetando comillas dobles
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Comillas dobles escapadas
          current += '"';
          i++; // Saltar la siguiente comilla
        } else {
          // Cambiar el estado de las comillas
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Fin del campo
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    // Agregar el último campo
    values.push(current.trim());
    return values;
  };

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      alert('Por favor, selecciona un archivo CSV');
      return;
    }

    setIsLoading(true);
    setCsvProgress({ current: 0, total: 0, errors: [] });

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        throw new Error('El archivo CSV está vacío o no tiene datos');
      }

      // Parsear encabezados
      const headers = parseCSVLine(lines[0]);
      const requiredHeaders = [
        'icon',
        'text_color',
        'min_players',
        'max_players',
        'gradient_color1',
        'gradient_color2',
        'age_rating',
        'is_premium',
        'is_active',
        'title_es',
        'title_en',
      ];

      // Validar que existan las columnas requeridas
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(
          `Faltan columnas requeridas en el CSV: ${missingHeaders.join(', ')}`
        );
      }

      // Parsear datos
      const categories: CSVCategory[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = parseCSVLine(line);

        if (values.length !== headers.length) {
          setCsvProgress((prev) => ({
            ...prev,
            errors: [
              ...prev.errors,
              `Fila ${i + 1}: Número incorrecto de columnas (esperado ${headers.length}, obtenido ${values.length})`,
            ],
          }));
          continue;
        }

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        // Validar campos requeridos
        if (!row.title_es || !row.title_en) {
          setCsvProgress((prev) => ({
            ...prev,
            errors: [
              ...prev.errors,
              `Fila ${i + 1}: Falta título en español o inglés`,
            ],
          }));
          continue;
        }

        // Validar valores numéricos
        const minPlayers = parseInt(row.min_players);
        const maxPlayers = parseInt(row.max_players);
        if (isNaN(minPlayers) || isNaN(maxPlayers)) {
          setCsvProgress((prev) => ({
            ...prev,
            errors: [
              ...prev.errors,
              `Fila ${i + 1}: min_players o max_players no son números válidos`,
            ],
          }));
          continue;
        }

        // Validar age_rating
        if (!['ALL', 'TEEN', 'ADULT'].includes(row.age_rating)) {
          setCsvProgress((prev) => ({
            ...prev,
            errors: [
              ...prev.errors,
              `Fila ${i + 1}: age_rating debe ser ALL, TEEN o ADULT`,
            ],
          }));
          continue;
        }

        categories.push({
          categoryData: {
            game_mode_id: '11111111-1111-1111-1111-111111111111',
            icon: row.icon || null,
            text_color: row.text_color || '#FFFFFF',
            min_players: minPlayers,
            max_players: maxPlayers,
            gradient_colors: [row.gradient_color1, row.gradient_color2],
            age_rating: row.age_rating as 'ALL' | 'TEEN' | 'ADULT',
            is_premium: row.is_premium === 'true' || row.is_premium === '1',
            is_active: row.is_active === 'true' || row.is_active === '1',
          },
          translations: {
            es: {
              title: row.title_es,
              description: row.description_es || null,
              instructions: row.instructions_es || null,
              tags: row.tags_es || null,
            },
            en: {
              title: row.title_en,
              description: row.description_en || null,
              instructions: row.instructions_en || null,
              tags: row.tags_en || null,
            },
            fr: row.title_fr
              ? {
                  title: row.title_fr,
                  description: row.description_fr || null,
                  instructions: row.instructions_fr || null,
                  tags: row.tags_fr || null,
                }
              : null,
            pt: row.title_pt
              ? {
                  title: row.title_pt,
                  description: row.description_pt || null,
                  instructions: row.instructions_pt || null,
                  tags: row.tags_pt || null,
                }
              : null,
          },
        });
      }

      if (categories.length === 0) {
        throw new Error('No se encontraron categorías válidas en el CSV');
      }

      // Inicializar progreso
      setCsvProgress({ current: 0, total: categories.length, errors: [] });

      // Insertar categorías en la base de datos
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let successCount = 0;

      for (let i = 0; i < categories.length; i++) {
        const { categoryData, translations } = categories[i];

        try {
          // Insertar categoría
          const { data: category, error: categoryError } = await supabase
            .from('challenge_categories')
            .insert(categoryData)
            .select('id')
            .single();

          if (categoryError) {
            throw new Error(categoryError.message);
          }

          // Preparar traducciones
          const translationsToInsert: any[] = [];
          Object.entries(translations).forEach(([langCode, trans]: [string, any]) => {
            if (trans && trans.title) {
              const tags = trans.tags
                ? trans.tags
                    .split(',')
                    .map((tag: string) => tag.trim())
                    .filter((tag: string) => tag)
                : [];

              translationsToInsert.push({
                challenge_category_id: category.id,
                language_code: langCode,
                title: trans.title,
                description: trans.description || null,
                instructions: trans.instructions || null,
                tags: tags.length > 0 ? tags : null,
              });
            }
          });

          // Insertar traducciones
          const { error: translationsError } = await supabase
            .from('challenge_category_translations')
            .insert(translationsToInsert);

          if (translationsError) {
            // Rollback: eliminar la categoría
            await supabase.from('challenge_categories').delete().eq('id', category.id);
            throw new Error(translationsError.message);
          }

          successCount++;
          setCsvProgress((prev) => ({ ...prev, current: i + 1 }));
        } catch (error: any) {
          setCsvProgress((prev) => ({
            ...prev,
            current: i + 1,
            errors: [
              ...prev.errors,
              `Categoría ${i + 1}: ${error.message || 'Error desconocido'}`,
            ],
          }));
        }
      }

      // Mostrar resultados
      if (successCount > 0) {
        setSuccessModal({ isOpen: true, categoriesCount: successCount });
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error al procesar el archivo CSV');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadExampleCSV = () => {
    const csvContent = `icon,text_color,min_players,max_players,gradient_color1,gradient_color2,age_rating,is_premium,is_active,title_es,title_en,description_es,description_en,instructions_es,instructions_en,tags_es,tags_en,title_fr,description_fr,instructions_fr,tags_fr,title_pt,description_pt,instructions_pt,tags_pt
party-popper,#FFFFFF,2,10,#FF6B6B,#FF8E53,ALL,false,true,Retos Divertidos,Fun Challenges,Retos para pasar un buen rato,Challenges for a good time,Completa estos retos y diviértete,Complete these challenges and have fun,"diversión,risas,entretenimiento","fun,laughs,entertainment",Défis Amusants,Défis pour passer un bon moment,Complétez ces défis et amusez-vous,"amusement,rires,divertissement",Desafios Divertidos,Desafios para passar um bom tempo,Complete esses desafios e divirta-se,"diversão,risadas,entretenimento"
mic,#FFFFFF,2,8,#9333EA,#C026D3,TEEN,false,true,Retos Musicales,Musical Challenges,Demuestra tu talento musical,Show your musical talent,Canta o toca instrumentos,Sing or play instruments,"música,canto,karaoke","music,singing,karaoke",Défis Musicaux,Montrez votre talent musical,Chantez ou jouez des instruments,"musique,chant,karaoké",Desafios Musicais,Mostre seu talento musical,Cante ou toque instrumentos,"música,canto,karaokê"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'example-categories.csv';
    link.click();
  };

  const ageRatingOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'TEEN', label: 'Adolescentes (13+)' },
    { value: 'ADULT', label: 'Adultos (18+)' },
  ];

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
                <h1 className="text-lg font-bold text-text-primary">Nueva Categoría</h1>
                <p className="text-xs text-text-secondary">
                  Crear categoría de retos
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selector de modo */}
        <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10 mb-8">
          <h2 className="text-lg font-bold text-text-primary mb-4">
            Método de Creación
          </h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                inputMode === 'manual'
                  ? 'bg-brand-yellow text-bg-primary shadow-lg shadow-brand-yellow/20'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-border'
              }`}
            >
              <svg
                className="w-5 h-5 inline-block mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Manual
            </button>
            <button
              type="button"
              onClick={() => setInputMode('csv')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                inputMode === 'csv'
                  ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-border'
              }`}
            >
              <svg
                className="w-5 h-5 inline-block mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Importar CSV
            </button>
          </div>
        </div>

        {/* Formulario Manual */}
        {inputMode === 'manual' && (
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
              {isLoading ? 'Guardando...' : 'Crear Categoría'}
            </Button>
          </div>
          </form>
        )}

        {/* Formulario CSV */}
        {inputMode === 'csv' && (
          <form onSubmit={handleCSVUpload} className="space-y-6">
            <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple/20 to-brand-purple/5 border border-brand-purple/30 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-brand-purple"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    Importar Categorías desde CSV
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Sube un archivo CSV para crear múltiples categorías a la vez
                  </p>
                </div>
              </div>



              {/* Input de archivo */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Archivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-text-secondary
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-brand-purple file:text-white
                    hover:file:bg-brand-purple/90
                    file:cursor-pointer cursor-pointer
                    border border-border rounded-xl
                    bg-bg-tertiary"
                  required
                />
                {csvFile && (
                  <p className="mt-2 text-xs text-brand-purple">
                    ✓ Archivo seleccionado: {csvFile.name}
                  </p>
                )}
              </div>

              {/* Barra de progreso */}
              {csvProgress.total > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Progreso</span>
                    <span className="text-text-primary font-medium">
                      {csvProgress.current} / {csvProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-purple h-full transition-all duration-300"
                      style={{
                        width: `${(csvProgress.current / csvProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Errores */}
              {csvProgress.errors.length > 0 && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">
                    ⚠️ Errores encontrados ({csvProgress.errors.length})
                  </h3>
                  <ul className="text-xs text-red-300 space-y-1 max-h-40 overflow-y-auto">
                    {csvProgress.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                className="bg-brand-purple hover:bg-brand-purple/90"
              >
                {isLoading ? 'Importando...' : 'Importar Categorías'}
              </Button>
            </div>
          </form>
        )}
      </main>

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => {
          setSuccessModal({ isOpen: false, categoriesCount: 0 });
          router.push('/challenges/categories');
        }}
        title="¡Importación Exitosa!"
        message={`Se ${successModal.categoriesCount === 1 ? 'creó' : 'crearon'} ${successModal.categoriesCount} ${successModal.categoriesCount === 1 ? 'categoría' : 'categorías'} correctamente.`}
      />
    </div>
  );
}
