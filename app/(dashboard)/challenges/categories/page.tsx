'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import * as IoIcons from 'react-icons/io5';

interface Translation {
  language_code: string;
  title: string;
  description: string;
}

interface CategoryData {
  id: string;
  icon: string;
  text_color: string;
  gradient_colors: string[];
  is_active: boolean;
  is_premium: boolean;
  min_players: number;
  max_players: number;
  sort_order: number;
  challenge_category_translations: {
    language_code: string;
    title: string;
    description: string;
  }[];
}

interface Category {
  id: string;
  icon: string;
  text_color: string;
  gradient_colors: string[];
  is_active: boolean;
  is_premium: boolean;
  min_players: number;
  max_players: number;
  sort_order: number;
  challenge_count: number;
  translations: Record<string, Translation>;
}

type FilterStatus = 'all' | 'active' | 'inactive';

// Convertir nombre de Ionicons a componente de React Icons
// Ejemplo: game-controller -> IoGameController
const getIconComponent = (iconName: string) => {
  if (!iconName) return null;

  const reactIconName = 'Io' + iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return IoIcons[reactIconName as keyof typeof IoIcons] || null;
};

export default function CategoriesPage() {
  const { supabase } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para el modal de upload CSV
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'challenges'>('categories');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; errors: string[] }>({
    current: 0,
    total: 0,
    errors: []
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Efecto para bloquear el scroll cuando los modales están abiertos
  useEffect(() => {
    if (deleteModalOpen || showUploadModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup: restaurar el scroll cuando el componente se desmonte
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [deleteModalOpen, showUploadModal]);

  // Filtrar categorías
  const getFilteredCategories = () => {
    let filtered = [...categories];

    // Aplicar filtro por estado
    if (filterStatus === 'active') {
      filtered = filtered.filter(cat => cat.is_active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(cat => !cat.is_active);
    }

    return filtered;
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);

      // Importar y usar la Server Action
      const { deleteChallengeCategory } = await import('@/actions/challenges');
      const result = await deleteChallengeCategory(categoryToDelete.id);

      if (!result.success) {
        showToast({ message: `Error al eliminar la categoría: ${result.error}`, type: 'error' });
        return;
      }

      // Actualizar la lista de categorías
      setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
      setDeleteModalOpen(false);
      setCategoryToDelete(null);

      const deletedChallenges = result.deletedChallenges || 0;
      const message = deletedChallenges > 0
        ? `Categoría eliminada exitosamente junto con ${deletedChallenges} ${deletedChallenges === 1 ? 'reto' : 'retos'}`
        : 'Categoría eliminada exitosamente';

      showToast({ message, type: 'success' });
    } catch (error) {
      console.error('Error:', error);
      showToast({ message: 'Error al eliminar la categoría', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);

      // Obtener categorías con sus traducciones, ordenadas por sort_order
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('challenge_categories')
        .select(`
          id,
          icon,
          text_color,
          gradient_colors,
          is_active,
          is_premium,
          min_players,
          max_players,
          sort_order,
          challenge_category_translations (
            language_code,
            title,
            description
          )
        `)
        .order('sort_order', { ascending: true });

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      // Obtener el conteo de retos para cada categoría
      const formattedCategories: Category[] = await Promise.all(
        (categoriesData || []).map(async (cat: CategoryData) => {
          const translations: Record<string, Translation> = {};

          cat.challenge_category_translations.forEach((trans) => {
            translations[trans.language_code] = {
              language_code: trans.language_code,
              title: trans.title,
              description: trans.description || '',
            };
          });

          // Contar retos de esta categoría
          const { count, error: countError } = await supabase
            .from('challenges')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_category_id', cat.id);

          if (countError) {
            console.error('Error counting challenges for category:', cat.id, countError);
          }

          return {
            id: cat.id,
            icon: cat.icon || 'flash',
            text_color: cat.text_color,
            gradient_colors: cat.gradient_colors,
            is_active: cat.is_active,
            is_premium: cat.is_premium,
            min_players: cat.min_players,
            max_players: cat.max_players,
            sort_order: cat.sort_order,
            challenge_count: count || 0,
            translations,
          };
        })
      );

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para parsear CSV
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  // Upload de Categorías CSV
  const handleUploadCategories = async () => {
    if (!csvFile) {
      showToast({ message: 'Por favor selecciona un archivo CSV', type: 'warning' });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: 0, errors: [] });

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('El archivo CSV está vacío');
      }

      const headers = parseCSVLine(lines[0]);
      const requiredHeaders = ['icon', 'text_color', 'min_players', 'max_players', 'gradient_color1', 'gradient_color2', 'age_rating', 'is_premium', 'is_active', 'title_es', 'title_en'];

      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
      }

      const categoriesToInsert: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        if (!row.title_es || !row.title_en) continue;

        categoriesToInsert.push({
          categoryData: {
            game_mode_id: '11111111-1111-1111-1111-111111111111',
            icon: row.icon || null,
            text_color: row.text_color || '#FFFFFF',
            min_players: parseInt(row.min_players) || 2,
            max_players: parseInt(row.max_players) || 10,
            gradient_colors: [row.gradient_color1, row.gradient_color2],
            age_rating: row.age_rating as 'ALL' | 'TEEN' | 'ADULT',
            is_premium: row.is_premium === 'true' || row.is_premium === '1',
            is_active: row.is_active === 'true' || row.is_active === '1',
          },
          translations: {
            es: { title: row.title_es, description: row.description_es || null, instructions: row.instructions_es || null, tags: row.tags_es || null },
            en: { title: row.title_en, description: row.description_en || null, instructions: row.instructions_en || null, tags: row.tags_en || null },
            fr: row.title_fr ? { title: row.title_fr, description: row.description_fr || null, instructions: row.instructions_fr || null, tags: row.tags_fr || null } : null,
            pt: row.title_pt ? { title: row.title_pt, description: row.description_pt || null, instructions: row.instructions_pt || null, tags: row.tags_pt || null } : null,
          },
        });
      }

      setUploadProgress({ current: 0, total: categoriesToInsert.length, errors: [] });
      let successCount = 0;

      // Importar Server Action
      const { createChallengeCategory } = await import('@/actions/challenges');

      for (let i = 0; i < categoriesToInsert.length; i++) {
        const { categoryData, translations } = categoriesToInsert[i];

        try {
          // Preparar traducciones en el formato correcto (sin challenge_category_id)
          const translationsToInsert: any[] = [];
          Object.entries(translations).forEach(([langCode, trans]: [string, any]) => {
            if (trans && trans.title) {
              const tags = trans.tags ? trans.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];
              translationsToInsert.push({
                language_code: langCode,
                title: trans.title,
                description: trans.description || null,
                instructions: trans.instructions || null,
                tags: tags.length > 0 ? tags : null,
              });
            }
          });

          // Usar Server Action para crear la categoría
          const result = await createChallengeCategory(categoryData, translationsToInsert);

          if (!result.success) {
            throw new Error(result.error);
          }

          successCount++;
          setUploadProgress(prev => ({ ...prev, current: i + 1 }));
        } catch (error: any) {
          setUploadProgress(prev => ({
            ...prev,
            current: i + 1,
            errors: [...prev.errors, `Categoría ${i + 1}: ${error.message}`],
          }));
        }
      }

      if (successCount > 0) {
        showToast({
          message: `${successCount} ${successCount === 1 ? 'categoría creada' : 'categorías creadas'} exitosamente`,
          type: 'success',
          duration: 3000
        });
        fetchCategories();
      } else {
        showToast({ message: 'No se pudo crear ninguna categoría', type: 'error' });
      }
    } catch (error: any) {
      showToast({ message: error.message || 'Error al procesar el CSV', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // Upload de Retos CSV
  const handleUploadChallenges = async () => {
    if (!csvFile) {
      showToast({ message: 'Por favor selecciona un archivo CSV', type: 'warning' });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: 0, errors: [] });

    try {
      // Obtener idiomas soportados
      const { data: supportedLangs } = await supabase
        .from('supported_languages')
        .select('code')
        .eq('is_active', true);

      const validLangCodes = new Set(supportedLangs?.map((l: { code: string }) => l.code) || ['es', 'en']);

      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('El archivo CSV está vacío');
      }

      const headers = parseCSVLine(lines[0]);
      const requiredHeaders = ['category_id', 'icon', 'is_active', 'text_es', 'text_en'];

      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
      }

      const challengesToInsert: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        if (!row.category_id || !row.icon || !row.text_es || !row.text_en) continue;

        // Solo incluir traducciones para idiomas soportados
        const translations: Record<string, any> = {};
        if (validLangCodes.has('es') && row.text_es) {
          translations.es = { content: row.text_es };
        }
        if (validLangCodes.has('en') && row.text_en) {
          translations.en = { content: row.text_en };
        }

        challengesToInsert.push({
          challengeData: {
            challenge_category_id: row.category_id,
            icon: row.icon,
            is_active: row.is_active === 'true' || row.is_active === '1',
            is_premium: row.is_premium === 'true' || row.is_premium === '1' || false,
          },
          translations,
        });
      }

      setUploadProgress({ current: 0, total: challengesToInsert.length, errors: [] });
      let successCount = 0;

      // Importar Server Action
      const { createChallengeBulk } = await import('@/actions/challenges');

      for (let i = 0; i < challengesToInsert.length; i++) {
        const { challengeData, translations } = challengesToInsert[i];

        try {
          // Filtrar solo traducciones válidas
          const validTranslations: Record<string, { content: string }> = {};
          Object.entries(translations).forEach(([langCode, trans]: [string, any]) => {
            if (trans && trans.content && validLangCodes.has(langCode)) {
              validTranslations[langCode] = { content: trans.content };
            }
          });

          // Usar Server Action para crear el reto
          const result = await createChallengeBulk(challengeData, validTranslations);

          if (!result.success) {
            throw new Error(result.error);
          }

          successCount++;
          setUploadProgress(prev => ({ ...prev, current: i + 1 }));
        } catch (error: any) {
          setUploadProgress(prev => ({
            ...prev,
            current: i + 1,
            errors: [...prev.errors, `Reto ${i + 1}: ${error.message}`],
          }));
        }
      }

      if (successCount > 0) {
        showToast({
          message: `${successCount} ${successCount === 1 ? 'reto creado' : 'retos creados'} exitosamente`,
          type: 'success',
          duration: 3000
        });
        fetchCategories();
      } else {
        showToast({ message: 'No se pudo crear ningún reto', type: 'error' });
      }
    } catch (error: any) {
      showToast({ message: error.message || 'Error al procesar el CSV', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] relative overflow-hidden">
      {/* Formas decorativas de fondo */}
      <div className="absolute top-0 left-0 w-full pointer-events-none opacity-15">
        <Image
          src="/resources/top-shapes.png"
          alt=""
          width={1920}
          height={300}
          className="w-full h-auto"
          priority
        />
      </div>
      <div className="absolute bottom-0 left-0 w-full pointer-events-none opacity-15">
        <Image
          src="/resources/bottom-shapes.png"
          alt=""
          width={1920}
          height={300}
          className="w-full h-auto"
          priority
        />
      </div>

      <div className="relative z-10">
        {/* Header mejorado */}
        <header className="bg-[#2A2A2A]/80 backdrop-blur-sm border-b border-[#333333] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <Image
                      src="/logos/ChallengeMe-05.png"
                      alt="ChallengeMe"
                      width={56}
                      height={56}
                      className="object-contain"
                    />
                  </div>
                </Link>
                <div className="h-10 w-px bg-[#333333]"></div>
                <div className="flex items-center gap-3">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      Categorías de Retos
                    </h1>
                    <p className="text-xs text-[#999999] font-medium">
                      Gestiona las categorías de desafíos
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-5 py-2.5 bg-[#7B46F8] hover:bg-[#7B46F8]/90 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#7B46F8]/20 hover:shadow-[#7B46F8]/30"
                >
                  <svg
                    className="w-5 h-5"
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
                  <span className="hidden sm:inline">Upload .CSV</span>
                  <span className="sm:hidden">Upload</span>
                </button>
                <Link href="/challenges/categories/new">
                  <button className="px-5 py-2.5 bg-[#BDF522] hover:bg-[#BDF522]/90 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#BDF522]/20 hover:shadow-[#BDF522]/30">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="hidden sm:inline">Nueva Categoría</span>
                    <span className="sm:hidden">Nueva</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="mb-10">
            <p className="text-lg text-[#999999] mb-2 font-medium">
              ¡Bienvenido de nuevo!
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              ¡Administra tus Categorías!
            </h2>
            <p className="text-base text-[#CCCCCC]">
              Crea, edita y organiza las categorías de retos para tu app
            </p>
          </div>

          {/* Stats mejoradas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#BDF522] mb-2">{categories.length}</div>
              <div className="text-sm text-[#999999]">Total de Categorías</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#BDF522] mb-2">
                {categories.filter((c) => c.is_active).length}
              </div>
              <div className="text-sm text-[#999999]">Categorías Activas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#7B46F8] mb-2">
                {categories.filter((c) => c.is_premium).length}
              </div>
              <div className="text-sm text-[#999999]">Premium</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#BDF522] mb-2">
                {categories.reduce((sum, cat) => sum + cat.challenge_count, 0)}
              </div>
              <div className="text-sm text-[#999999]">Retos Totales</div>
            </div>
          </div>

          {/* Lista de categorías mejorada */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#BDF522]/30 border-t-[#BDF522] rounded-full animate-spin"></div>
                <p className="text-[#999999]">Cargando categorías...</p>
              </div>
            </div>
          ) : categories.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white">
                  Todas las Categorías
                </h3>
                <div className="flex items-center gap-2 relative">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] text-[#999999] rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtrar
                  </button>

                  {/* Dropdown de filtros */}
                  {isFilterOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsFilterOpen(false)}
                      />

                      {/* Menu */}
                      <div className="absolute right-0 top-12 z-20 bg-[#2A2A2A] border border-[#333333] rounded-xl shadow-2xl shadow-black/50 p-4 min-w-[280px]">
                        {/* Estado */}
                        <div>
                          <label className="block text-xs font-medium text-[#999999] mb-2">
                            Estado
                          </label>
                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                setFilterStatus('all');
                                setIsFilterOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                                filterStatus === 'all'
                                  ? 'bg-[#BDF522]/20 border-2 border-[#BDF522] text-[#BDF522]'
                                  : 'bg-[#1A1A1A] hover:bg-[#333333] text-white'
                              }`}
                            >
                              Todas
                            </button>
                            <button
                              onClick={() => {
                                setFilterStatus('active');
                                setIsFilterOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                                filterStatus === 'active'
                                  ? 'bg-[#BDF522]/20 border-2 border-[#BDF522] text-[#BDF522]'
                                  : 'bg-[#1A1A1A] hover:bg-[#333333] text-white'
                              }`}
                            >
                              Activas
                            </button>
                            <button
                              onClick={() => {
                                setFilterStatus('inactive');
                                setIsFilterOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                                filterStatus === 'inactive'
                                  ? 'bg-red-500/20 border-2 border-red-500 text-red-500'
                                  : 'bg-[#1A1A1A] hover:bg-[#333333] text-white'
                              }`}
                            >
                              Inactivas
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getFilteredCategories().map((category) => (
                  <div
                    key={category.id}
                    className="group bg-[#2A2A2A] border border-[#333333] rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:border-[#BDF522]/30 transition-all duration-300"
                  >
                    {/* Header con gradiente */}
                    <div
                      className="relative h-32 flex items-center justify-center overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${category.gradient_colors[0]}, ${category.gradient_colors[1]})`,
                      }}
                    >
                      {/* Pattern decorativo */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-black rounded-full blur-2xl translate-x-1/2 translate-y-1/2"></div>
                      </div>

                      {/* Icono */}
                      <div className="relative z-10">
                        {(() => {
                          const IconComponent = getIconComponent(category.icon);
                          return IconComponent ? (
                            <IconComponent
                              className="w-16 h-16 drop-shadow-lg"
                              style={{ color: category.text_color }}
                            />
                          ) : (
                            <svg
                              className="w-16 h-16 drop-shadow-lg"
                              style={{ color: category.text_color }}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          );
                        })()}
                      </div>

                      {/* Badges en el header */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {category.is_premium && (
                          <span className="px-2.5 py-1 bg-black/30 backdrop-blur-sm text-white border border-white/30 rounded-lg text-xs font-bold shadow-lg">
                            PREMIUM
                          </span>
                        )}
                        {category.is_active ? (
                          <span className="px-2.5 py-1 bg-success/90 backdrop-blur-sm text-white border border-white/30 rounded-lg text-xs font-bold shadow-lg">
                            ACTIVA
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-black/30 backdrop-blur-sm text-white/70 border border-white/20 rounded-lg text-xs font-bold">
                            INACTIVA
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#BDF522] transition-colors">
                        {category.translations.es?.title || category.translations.en?.title || 'Sin título'}
                      </h3>
                      <p className="text-sm text-[#CCCCCC] mb-4 line-clamp-2">
                        {category.translations.es?.description || category.translations.en?.description || 'Sin descripción'}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center flex-wrap gap-3 mb-4 text-xs">
                        <div className="flex items-center gap-1.5 text-[#999999]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{category.min_players}-{category.max_players} jugadores</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#999999]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>{category.challenge_count} retos</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-[#999999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          {Object.keys(category.translations).map((lang) => (
                            <span
                              key={lang}
                              className="text-xs font-medium text-[#999999]"
                            >
                              {lang.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* ID de la categoría */}
                      <div className="mb-4 p-3 bg-[#1A1A1A] border border-[#333333] rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#666666] mb-1">Category ID:</p>
                            <p className="text-xs font-mono text-[#999999] truncate">{category.id}</p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(category.id);
                              const btn = document.getElementById(`copy-${category.id}`);
                              if (btn) {
                                btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                                setTimeout(() => {
                                  btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
                                }, 1500);
                              }
                            }}
                            id={`copy-${category.id}`}
                            className="p-2 bg-[#BDF522]/10 hover:bg-[#BDF522]/20 border border-[#BDF522]/30 text-[#BDF522] rounded-lg transition-all"
                            title="Copiar ID"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/challenges/categories/${category.id}`}
                          className="flex-1 px-4 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] hover:border-[#BDF522]/30 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/30"
                        >
                          <svg
                            className="w-4 h-4"
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
                          Editar
                        </Link>
                        <Link
                          href={`/challenges/categories/${category.id}/challenges`}
                          className="flex-1 px-4 py-2.5 bg-[#BDF522] hover:bg-[#BDF522]/90 text-black rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#BDF522]/20"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Ver Retos
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty state mejorado */
            <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-12 text-center shadow-lg shadow-black/20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#BDF522]/20 to-[#BDF522]/5 border border-[#BDF522]/30 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-[#BDF522]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No hay categorías aún
              </h3>
              <p className="text-[#CCCCCC] mb-8 max-w-md mx-auto leading-relaxed">
                Crea tu primera categoría de retos para comenzar a organizar los desafíos de tu app
              </p>
              <Link href="/challenges/categories/new">
                <button className="px-6 py-3 bg-[#BDF522] hover:bg-[#BDF522]/90 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg shadow-[#BDF522]/20">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Crear Primera Categoría
                </button>
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 bg-[#2A2A2A] border-2 border-red-500 rounded-2xl shadow-2xl shadow-red-500/30 p-6 max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-red-500/30">
              <div className="w-12 h-12 rounded-xl bg-red-500/30 border-2 border-red-500 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-500">
                  ¡CONFIRMAR ELIMINACIÓN!
                </h3>
                <p className="text-sm text-red-500/80">Esta acción no se puede deshacer</p>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-white mb-4 text-base">
                ¿Estás seguro que quieres eliminar la categoría{' '}
                <span className="font-bold text-red-500">
                  &ldquo;{categoryToDelete.translations.es?.title || 'Sin título'}&rdquo;
                </span>
                ?
              </p>
              <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4 space-y-2">
                <p className="text-sm text-red-500 font-bold">
                  ⚠️ Esta acción eliminará de forma permanente:
                </p>
                <ul className="text-sm text-red-500 ml-4 space-y-1 list-disc">
                  <li>La categoría y todas sus traducciones</li>
                  <li>Todos los retos asociados a esta categoría</li>
                  <li>Todas las traducciones de los retos</li>
                </ul>
                <p className="text-sm text-red-500 font-bold mt-2">
                  Esta acción NO se puede deshacer.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/30"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-500/80 text-white rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 border-2 border-red-500"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ELIMINANDO...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    SÍ, ELIMINAR
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upload CSV */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-[#2A2A2A] border-b border-[#333333] p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Upload Masivo - Challenges</h2>
                  <p className="text-sm text-[#999999] mt-1 font-medium">
                    Carga categorías y retos mediante archivos CSV
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setCsvFile(null);
                    setActiveTab('categories');
                  }}
                  className="w-10 h-10 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#333333] bg-[#1A1A1A]/50">
              <div className="flex gap-1 px-6">
                <button
                  onClick={() => {
                    setActiveTab('categories');
                    setCsvFile(null);
                  }}
                  className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === 'categories'
                      ? 'border-[#BDF522] text-[#BDF522]'
                      : 'border-transparent text-[#999999] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Agregar Categorías
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('challenges');
                    setCsvFile(null);
                  }}
                  className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === 'challenges'
                      ? 'border-[#7B46F8] text-[#7B46F8]'
                      : 'border-transparent text-[#999999] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Agregar Retos
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Tab: Agregar Categorías */}
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <div className="bg-[#BDF522]/5 border border-[#BDF522]/20 rounded-xl p-4">
                    <h3 className="font-bold text-[#BDF522] mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Formato del CSV para Categorías
                    </h3>
                    <p className="text-sm text-[#999999] mb-2">El archivo debe incluir estas columnas:</p>
                    <div className="text-sm text-[#999999] space-y-2">
                      <div>
                        <p className="font-bold text-white mb-1">Campos Obligatorios:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>icon:</strong> Nombre del ícono de Ionicons (ej: musical-notes, fitness, game-controller)</li>
                          <li><strong>text_color:</strong> Color hexadecimal del texto (ej: #FFFFFF)</li>
                          <li><strong>min_players, max_players:</strong> Número mínimo y máximo de jugadores</li>
                          <li><strong>gradient_color1, gradient_color2:</strong> Colores del gradiente en formato hexadecimal</li>
                          <li><strong>age_rating:</strong> Clasificación de edad: ALL, TEEN o ADULT</li>
                          <li><strong>is_premium:</strong> true (premium) o false (gratis)</li>
                          <li><strong>is_active:</strong> true (activa) o false (inactiva)</li>
                          <li><strong>title_es, title_en:</strong> Títulos en español e inglés (obligatorios)</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-white mb-1">Campos Opcionales:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>description_es, description_en:</strong> Descripción de la categoría en español e inglés</li>
                          <li><strong>instructions_es, instructions_en:</strong> Instrucciones para los retos en español e inglés</li>
                          <li><strong>tags_es, tags_en:</strong> Etiquetas separadas por comas (ej: música,canto,karaoke)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-[#BDF522]/10 border border-[#BDF522]/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-[#999999]">
                            <strong className="text-[#BDF522]">📋 Ejemplo de archivo CSV:</strong><br/>
                            <code className="text-xs bg-[#1A1A1A] px-2 py-1 rounded mt-1 block whitespace-pre-wrap break-all">
                              icon,text_color,min_players,max_players,gradient_color1,gradient_color2,age_rating,is_premium,is_active,title_es,title_en{'\n'}
                              musical-notes,#FFFFFF,2,8,#FF6B6B,#FFD93D,ALL,false,true,Retos Musicales,Musical Challenges
                            </code>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const csvExample = `icon,text_color,min_players,max_players,gradient_color1,gradient_color2,age_rating,is_premium,is_active,title_es,title_en
musical-notes,#FFFFFF,2,8,#FF6B6B,#FFD93D,ALL,false,true,Retos Musicales,Musical Challenges`;
                            navigator.clipboard.writeText(csvExample);
                            showToast({ message: 'Ejemplo CSV copiado!', type: 'success' });
                          }}
                          className="flex-shrink-0 p-2 hover:bg-[#BDF522]/20 rounded-lg transition-colors"
                          title="Copiar ejemplo CSV"
                        >
                          <svg className="w-5 h-5 text-[#BDF522]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Archivo CSV</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-[#999999] file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#BDF522] file:text-black hover:file:bg-[#BDF522]/90 file:cursor-pointer cursor-pointer"
                      disabled={isUploading}
                    />
                    {csvFile && (
                      <p className="mt-2 text-sm text-[#999999]">
                        Archivo seleccionado: <span className="font-medium text-white">{csvFile.name}</span>
                      </p>
                    )}
                  </div>

                  {uploadProgress.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-[#999999]">
                        <span>Progreso: {uploadProgress.current} / {uploadProgress.total}</span>
                        <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-[#1A1A1A] rounded-full h-2">
                        <div
                          className="bg-[#BDF522] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      {uploadProgress.errors.length > 0 && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl max-h-60 overflow-y-auto">
                          <h4 className="font-bold text-red-500 mb-2">Errores encontrados:</h4>
                          <ul className="text-sm text-red-500 space-y-1">
                            {uploadProgress.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleUploadCategories}
                    disabled={!csvFile || isUploading}
                    className="w-full px-6 py-3 bg-[#BDF522] hover:bg-[#BDF522]/90 text-black font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#BDF522]/20"
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        Subiendo categorías...
                      </span>
                    ) : (
                      'Subir Categorías'
                    )}
                  </button>
                </div>
              )}

              {/* Tab: Agregar Retos */}
              {activeTab === 'challenges' && (
                <div className="space-y-6">
                  <div className="bg-[#7B46F8]/5 border border-[#7B46F8]/20 rounded-xl p-4">
                    <h3 className="font-bold text-[#7B46F8] mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Formato del CSV para Retos
                    </h3>
                    <p className="text-sm text-[#999999] mb-2">El archivo debe incluir estas columnas:</p>
                    <div className="text-sm text-[#999999] space-y-2">
                      <div>
                        <p className="font-bold text-white mb-1">Campos Obligatorios:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong className="text-[#7B46F8]">category_id:</strong> ID de la categoría padre (copia el ID de la tabla de categorías)</li>
                          <li><strong>icon:</strong> Nombre del ícono de Ionicons (ej: game-controller, trophy, musical-notes)</li>
                          <li><strong>is_active:</strong> true (activo) o false (inactivo)</li>
                          <li><strong>text_es, text_en:</strong> Texto del reto en español e inglés (obligatorios)</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-white mb-1">Campos Opcionales:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>is_premium:</strong> true (premium) o false (gratis) - por defecto es false</li>
                        </ul>
                      </div>
                      <div className="mt-3 p-3 bg-[#7B46F8]/10 border border-[#7B46F8]/30 rounded-lg">
                        <p className="text-xs text-white font-semibold">
                          💡 Nota: Solo se soportan idiomas español (es) e inglés (en). Otros idiomas serán ignorados.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-[#BDF522]/10 border border-[#BDF522]/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-[#999999]">
                            <strong className="text-[#BDF522]">📋 Ejemplo de archivo CSV:</strong><br/>
                            <code className="text-xs bg-[#1A1A1A] px-2 py-1 rounded mt-1 block whitespace-pre-wrap break-all">
                              category_id,icon,is_active,is_premium,text_es,text_en{'\n'}
                              123e4567-e89b-12d3-a456-426614174000,game-controller,true,false,Imita el personaje de tu videojuego favorito,Imitate your favorite video game character
                            </code>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const csvExample = `category_id,icon,is_active,is_premium,text_es,text_en
123e4567-e89b-12d3-a456-426614174000,game-controller,true,false,Imita el personaje de tu videojuego favorito,Imitate your favorite video game character`;
                            navigator.clipboard.writeText(csvExample);
                            showToast({ message: 'Ejemplo CSV copiado!', type: 'success' });
                          }}
                          className="flex-shrink-0 p-2 hover:bg-[#BDF522]/20 rounded-lg transition-colors"
                          title="Copiar ejemplo CSV"
                        >
                          <svg className="w-5 h-5 text-[#BDF522]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Archivo CSV</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-[#999999] file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#7B46F8] file:text-white hover:file:bg-[#7B46F8]/90 file:cursor-pointer cursor-pointer"
                      disabled={isUploading}
                    />
                    {csvFile && (
                      <p className="mt-2 text-sm text-[#999999]">
                        Archivo seleccionado: <span className="font-medium text-white">{csvFile.name}</span>
                      </p>
                    )}
                  </div>

                  {uploadProgress.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-[#999999]">
                        <span>Progreso: {uploadProgress.current} / {uploadProgress.total}</span>
                        <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-[#1A1A1A] rounded-full h-2">
                        <div
                          className="bg-[#7B46F8] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      {uploadProgress.errors.length > 0 && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl max-h-60 overflow-y-auto">
                          <h4 className="font-bold text-red-500 mb-2">Errores encontrados:</h4>
                          <ul className="text-sm text-red-500 space-y-1">
                            {uploadProgress.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleUploadChallenges}
                    disabled={!csvFile || isUploading}
                    className="w-full px-6 py-3 bg-[#7B46F8] hover:bg-[#7B46F8]/90 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7B46F8]/20"
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Subiendo retos...
                      </span>
                    ) : (
                      'Subir Retos'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
