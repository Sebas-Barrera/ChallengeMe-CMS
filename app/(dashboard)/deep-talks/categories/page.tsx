'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as IoIcons from 'react-icons/io5';
import Toast from '@/components/ui/Toast';

interface Filter {
  id: string;
  label: string;
  icon: string | null;
  color: string | null;
  route: string | null;
  sort_order: number;
  is_active: boolean;
  is_premium: boolean;
  deep_talk_count: number;
  translations: Record<string, { name: string }>;
}

interface DeepTalkTranslation {
  language_code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  intensity: string | null;
}

interface DeepTalk {
  id: string;
  deep_talk_category_id: string;
  icon: string | null;
  gradient_colors: string[] | null;
  estimated_time: number | null;
  is_active: boolean;
  is_premium: boolean;
  sort_order: number;
  deep_talk_translations: DeepTalkTranslation[];
  category: {
    id: string;
    label: string;
    color: string | null;
    deep_talk_categories_translations: { language_code: string; name: string }[];
  };
}

// Helper para obtener el icono de Ionicons dinámicamente
const getIonIcon = (iconName: string | null) => {
  if (!iconName) return null;

  // Convertir nombre de icono a formato PascalCase para Ionicons v5
  // Ejemplos: trophy -> IoTrophy, rocket -> IoRocket, game-controller -> IoGameController
  const pascalCase = 'Io' + iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const IconComponent = (IoIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase];

  return IconComponent || null;
};

export default function DeepTalkCategoriesPage() {
  const { supabase } = useAuth();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [deepTalks, setDeepTalks] = useState<DeepTalk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilterSelector, setShowFilterSelector] = useState(false);

  // Estados para el modal de upload CSV
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'filters' | 'categories' | 'questions'>('filters');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; errors: string[] }>({
    current: 0,
    total: 0,
    errors: []
  });
  const [showSuccessUploadModal, setShowSuccessUploadModal] = useState(false);
  const [successUploadMessage, setSuccessUploadMessage] = useState('');

  // Estados para eliminar filtro
  const [showDeleteFilterModal, setShowDeleteFilterModal] = useState(false);
  const [filterToDelete, setFilterToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para eliminar categoría
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Estado para filtro de activos/inactivos en Filtros
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Estado para búsqueda de filtros
  const [filterSearchTerm, setFilterSearchTerm] = useState('');

  // Estado para filtro de activos/inactivos en Categorías
  const [categoryFilterStatus, setCategoryFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Estado para búsqueda de categorías
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // Estado para Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  useEffect(() => {
    fetchFilters();

    // Restaurar posición de scroll
    const savedScrollPosition = sessionStorage.getItem('deepTalkCategoriesScrollPosition');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
      sessionStorage.removeItem('deepTalkCategoriesScrollPosition');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (showUploadModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showUploadModal]);

  // Función para guardar la posición de scroll antes de navegar
  const saveScrollPosition = () => {
    sessionStorage.setItem('deepTalkCategoriesScrollPosition', window.scrollY.toString());
  };

  const handleUploadFilters = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      setToast({ message: 'Por favor selecciona un archivo CSV', type: 'warning' });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: 0, errors: [] });

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setToast({ message: 'El archivo CSV está vacío o no tiene datos', type: 'error' });
        setIsUploading(false);
        return;
      }

      // Parsear header
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['label', 'sort_order', 'is_active', 'is_premium', 'name_es', 'name_en'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setToast({ message: `Faltan columnas requeridas en el CSV: ${missingHeaders.join(', ')}`, type: 'error' });
        setIsUploading(false);
        return;
      }

      const filters = [];
      const errors: string[] = [];

      // Parsear datos
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validar datos requeridos
        if (!row.label || !row.name_es || !row.name_en) {
          errors.push(`Fila ${i + 1}: Falta label, nombre en español o inglés`);
          continue;
        }

        // Validar que label esté en formato correcto (minúsculas, guiones bajos)
        if (!/^[a-z0-9_]+$/.test(row.label)) {
          errors.push(`Fila ${i + 1}: El label "${row.label}" debe estar en minúsculas y solo contener letras, números y guiones bajos`);
          continue;
        }

        filters.push({
          label: row.label,
          icon: row.icon || null,
          color: row.color || null,
          route: row.route || null,
          sort_order: parseInt(row.sort_order) || 0,
          is_active: row.is_active === 'true' || row.is_active === '1',
          is_premium: row.is_premium === 'true' || row.is_premium === '1',
          translations: {
            es: { name: row.name_es },
            en: { name: row.name_en },
          }
        });
      }

      if (filters.length === 0) {
        setToast({ message: 'No se encontraron filtros válidos en el CSV', type: 'error' });
        setIsUploading(false);
        return;
      }

      setUploadProgress({ current: 0, total: filters.length, errors });

      let successCount = 0;
      const insertErrors: string[] = [...errors];

      // Insertar filtros uno por uno
      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        setUploadProgress(prev => ({ ...prev, current: i + 1 }));

        try {
          // 1. Recorrer los sort_order existentes si es necesario
          // Obtener todos los filtros con sort_order >= al nuevo
          const { data: existingFilters } = await supabase
            .from('deep_talk_categories')
            .select('id, sort_order')
            .eq('game_mode_id', '33333333-3333-3333-3333-333333333333')
            .gte('sort_order', filter.sort_order)
            .order('sort_order', { ascending: false });

          // Actualizar cada uno incrementando su sort_order en 1
          if (existingFilters && existingFilters.length > 0) {
            for (const existing of existingFilters) {
              const newSortOrder = (existing as { id: string; sort_order: number }).sort_order + 1;
              const existingId = (existing as { id: string; sort_order: number }).id;

              await supabase
                .from('deep_talk_categories')
                .update({ sort_order: newSortOrder } as any)
                .eq('id', existingId);
            }
          }

          // 2. Insertar el filtro
          const { data: filterData, error: filterError } = await supabase
            .from('deep_talk_categories')
            .insert({
              label: filter.label,
              icon: filter.icon,
              color: filter.color,
              route: filter.route,
              sort_order: filter.sort_order,
              is_active: filter.is_active,
              is_premium: filter.is_premium,
              game_mode_id: '33333333-3333-3333-3333-333333333333', // Deep Talks game mode
            } as any)
            .select('id')
            .single();

          if (filterError) {
            insertErrors.push(`Filtro ${i + 1}: ${filterError.message}`);
            continue;
          }

          // 2. Insertar traducciones
          const translationsToInsert = Object.entries(filter.translations)
            .filter(([_, translation]) => translation.name.trim() !== '')
            .map(([lang, translation]) => ({
              deep_talk_category_id: (filterData as any).id,
              language_code: lang,
              name: translation.name,
            }));

          const { error: translationsError } = await supabase
            .from('deep_talk_categories_translations')
            .insert(translationsToInsert as any);

          if (translationsError) {
            // Si falla, eliminar el filtro
            await supabase.from('deep_talk_categories').delete().eq('id', (filterData as any).id);
            insertErrors.push(`Filtro ${i + 1}: Error en traducciones - ${translationsError.message}`);
            continue;
          }

          successCount++;
        } catch (error: any) {
          insertErrors.push(`Filtro ${i + 1}: ${error.message}`);
        }
      }

      setUploadProgress(prev => ({ ...prev, errors: insertErrors }));

      if (successCount > 0) {
        setSuccessUploadMessage(`${successCount} filtro(s) subido(s) exitosamente`);
        setShowSuccessUploadModal(true);
        // Refrescar la lista de filtros
        await fetchFilters();
      } else {
        setToast({ message: 'No se pudo insertar ningún filtro. Revisa los errores.', type: 'error' });
      }

    } catch (error: any) {
      console.error('Error:', error);
      setToast({ message: 'Error al procesar el archivo: ' + error.message, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadCategories = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      setToast({ message: 'Por favor selecciona un archivo CSV', type: 'warning' });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: 0, errors: [] });

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setToast({ message: 'El archivo CSV está vacío o no tiene datos', type: 'error' });
        setIsUploading(false);
        return;
      }

      // Parsear header
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['filter_label', 'sort_order', 'is_active', 'title_es', 'title_en'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setToast({ message: `Faltan columnas requeridas en el CSV: ${missingHeaders.join(', ')}`, type: 'error' });
        setIsUploading(false);
        return;
      }

      const categories = [];
      const errors: string[] = [];

      // Parsear datos
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validar datos requeridos
        if (!row.filter_label) {
          errors.push(`Fila ${i + 1}: Falta el filter_label`);
          continue;
        }
        if (!row.title_es || !row.title_en) {
          errors.push(`Fila ${i + 1}: Falta título en español o inglés`);
          continue;
        }

        // Parsear gradient_colors
        const gradientColors = row.gradient_colors
          ? row.gradient_colors.split('|').map(c => c.trim())
          : null;

        categories.push({
          filter_label: row.filter_label,
          icon: row.icon || null,
          gradient_colors: gradientColors,
          estimated_time: row.estimated_time || null,
          sort_order: parseInt(row.sort_order) || 0,
          is_active: row.is_active === 'true' || row.is_active === '1',
          translations: {
            es: {
              title: row.title_es,
              subtitle: row.subtitle_es || '',
              description: row.description_es || '',
              intensity: row.intensity_es || null,
            },
            en: {
              title: row.title_en,
              subtitle: row.subtitle_en || '',
              description: row.description_en || '',
              intensity: row.intensity_en || null,
            },
            pt: {
              title: row.title_pt || '',
              subtitle: row.subtitle_pt || '',
              description: row.description_pt || '',
              intensity: row.intensity_pt || null,
            },
            fr: {
              title: row.title_fr || '',
              subtitle: row.subtitle_fr || '',
              description: row.description_fr || '',
              intensity: row.intensity_fr || null,
            },
            it: {
              title: row.title_it || '',
              subtitle: row.subtitle_it || '',
              description: row.description_it || '',
              intensity: row.intensity_it || null,
            },
          }
        });
      }

      if (categories.length === 0) {
        setToast({ message: 'No se encontraron categorías válidas en el CSV', type: 'error' });
        setIsUploading(false);
        return;
      }

      setUploadProgress({ current: 0, total: categories.length, errors });

      let successCount = 0;
      const insertErrors: string[] = [...errors];

      // Insertar categorías una por una
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        setUploadProgress(prev => ({ ...prev, current: i + 1 }));

        try {
          // 1. Buscar el filtro por label
          const { data: filterData, error: filterError } = await supabase
            .from('deep_talk_categories')
            .select('id')
            .eq('label', category.filter_label)
            .single();

          if (filterError || !filterData) {
            insertErrors.push(`Categoría ${i + 1}: No se encontró filtro con label "${category.filter_label}"`);
            continue;
          }

          const filterId = (filterData as any).id;

          // 2. Recorrer los sort_order existentes dentro de este filtro
          const { data: existingDeepTalks } = await supabase
            .from('deep_talks')
            .select('id, sort_order')
            .eq('deep_talk_category_id', filterId)
            .gte('sort_order', category.sort_order)
            .order('sort_order', { ascending: false });

          // Actualizar cada uno incrementando su sort_order en 1
          if (existingDeepTalks && existingDeepTalks.length > 0) {
            for (const existing of existingDeepTalks) {
              const newSortOrder = (existing as { id: string; sort_order: number }).sort_order + 1;
              const existingId = (existing as { id: string; sort_order: number }).id;

              await supabase
                .from('deep_talks')
                .update({ sort_order: newSortOrder } as any)
                .eq('id', existingId);
            }
          }

          // 3. Insertar la categoría (deep_talk)
          const { data: deepTalkData, error: deepTalkError } = await supabase
            .from('deep_talks')
            .insert({
              deep_talk_category_id: filterId,
              icon: category.icon,
              gradient_colors: category.gradient_colors,
              estimated_time: category.estimated_time,
              sort_order: category.sort_order,
              is_active: category.is_active,
            } as any)
            .select('id')
            .single();

          if (deepTalkError) {
            insertErrors.push(`Categoría ${i + 1}: ${deepTalkError.message}`);
            continue;
          }

          // 3. Insertar traducciones
          const translationsToInsert = Object.entries(category.translations)
            .filter(([_, translation]) => translation.title.trim() !== '')
            .map(([lang, translation]) => ({
              deep_talk_id: (deepTalkData as any).id,
              language_code: lang,
              title: translation.title,
              subtitle: translation.subtitle || null,
              description: translation.description || null,
              intensity: translation.intensity || null,
            }));

          const { error: translationsError } = await supabase
            .from('deep_talk_translations')
            .insert(translationsToInsert as any);

          if (translationsError) {
            // Si falla, eliminar la categoría
            await supabase.from('deep_talks').delete().eq('id', (deepTalkData as any).id);
            insertErrors.push(`Categoría ${i + 1}: Error en traducciones - ${translationsError.message}`);
            continue;
          }

          successCount++;
        } catch (error: any) {
          insertErrors.push(`Categoría ${i + 1}: ${error.message}`);
        }
      }

      setUploadProgress(prev => ({ ...prev, errors: insertErrors }));

      if (successCount > 0) {
        setSuccessUploadMessage(`${successCount} categoría(s) subida(s) exitosamente`);
        setShowSuccessUploadModal(true);
        // Refrescar la lista de filtros
        await fetchFilters();
      } else {
        setToast({ message: 'No se pudo insertar ninguna categoría. Revisa los errores.', type: 'error' });
      }

    } catch (error: any) {
      console.error('Error:', error);
      setToast({ message: 'Error al procesar el archivo: ' + error.message, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFilterClick = (filterId: string) => {
    setFilterToDelete(filterId);
    setShowDeleteFilterModal(true);
  };

  const handleConfirmDeleteFilter = async () => {
    if (!filterToDelete) return;

    setIsDeleting(true);

    try {
      // 1. Eliminar el filtro (esto también eliminará las traducciones y categorías relacionadas por CASCADE)
      const { error: deleteError } = await supabase
        .from('deep_talk_categories')
        .delete()
        .eq('id', filterToDelete);

      if (deleteError) throw deleteError;

      // Recargar la lista de filtros
      await fetchFilters();

      // Cerrar modal
      setShowDeleteFilterModal(false);
      setFilterToDelete(null);

      // Mostrar mensaje de éxito
      setSuccessUploadMessage('Filtro eliminado exitosamente');
      setShowSuccessUploadModal(true);
    } catch (error: any) {
      console.error('Error al eliminar filtro:', error);
      setToast({ message: 'Error al eliminar el filtro: ' + error.message, type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCategoryClick = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setShowDeleteCategoryModal(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);

    try {
      // Eliminar la categoría (esto también eliminará las preguntas y traducciones por CASCADE)
      const { error: deleteError } = await supabase
        .from('deep_talks')
        .delete()
        .eq('id', categoryToDelete);

      if (deleteError) throw deleteError;

      // Recargar la lista de filtros y categorías
      await fetchFilters();

      // Cerrar modal
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);

      // Mostrar mensaje de éxito
      setSuccessUploadMessage('Categoría eliminada exitosamente');
      setShowSuccessUploadModal(true);
    } catch (error: any) {
      console.error('Error al eliminar categoría:', error);
      setToast({ message: 'Error al eliminar la categoría: ' + error.message, type: 'error' });
    } finally {
      setIsDeletingCategory(false);
    }
  };


  const handleUploadQuestions = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      setToast({ message: 'Por favor selecciona un archivo CSV', type: 'warning' });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: 0, errors: [] });

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setToast({ message: 'El archivo CSV está vacío o no tiene datos', type: 'error' });
        setIsUploading(false);
        return;
      }

      // Parsear header
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['category_title_es', 'sort_order', 'is_active', 'question_es', 'question_en'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setToast({ message: `Faltan columnas requeridas en el CSV: ${missingHeaders.join(', ')}`, type: 'error' });
        setIsUploading(false);
        return;
      }

      const questions = [];
      const errors: string[] = [];

      // Parsear datos
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validar datos requeridos
        if (!row.category_title_es) {
          errors.push(`Fila ${i + 1}: Falta el category_title_es`);
          continue;
        }
        if (!row.question_es || !row.question_en) {
          errors.push(`Fila ${i + 1}: Falta pregunta en español o inglés`);
          continue;
        }

        questions.push({
          category_title_es: row.category_title_es,
          icon: row.icon || null,
          sort_order: parseInt(row.sort_order) || 0,
          is_active: row.is_active === 'true' || row.is_active === '1',
          translations: {
            es: row.question_es,
            en: row.question_en,
            pt: row.question_pt || '',
            fr: row.question_fr || '',
            it: row.question_it || '',
          }
        });
      }

      if (questions.length === 0) {
        setToast({ message: 'No se encontraron preguntas válidas en el CSV', type: 'error' });
        setIsUploading(false);
        return;
      }

      setUploadProgress({ current: 0, total: questions.length, errors });

      let successCount = 0;
      const insertErrors: string[] = [...errors];

      // Insertar preguntas una por una
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        setUploadProgress(prev => ({ ...prev, current: i + 1 }));

        try {
          // 1. Buscar el deep_talk por el título en español
          const { data: deepTalkData, error: deepTalkError } = await supabase
            .from('deep_talk_translations')
            .select('deep_talk_id')
            .eq('language_code', 'es')
            .eq('title', question.category_title_es)
            .single();

          if (deepTalkError || !deepTalkData) {
            insertErrors.push(`Pregunta ${i + 1}: No se encontró categoría con título "${question.category_title_es}"`);
            continue;
          }

          const deepTalkId = (deepTalkData as any).deep_talk_id;

          // 2. Recorrer los sort_order existentes dentro de este deep_talk
          const { data: existingQuestions } = await supabase
            .from('deep_talk_questions')
            .select('id, sort_order')
            .eq('deep_talk_id', deepTalkId)
            .gte('sort_order', question.sort_order)
            .order('sort_order', { ascending: false });

          // Actualizar cada uno incrementando su sort_order en 1
          if (existingQuestions && existingQuestions.length > 0) {
            for (const existing of existingQuestions) {
              const newSortOrder = (existing as { id: string; sort_order: number }).sort_order + 1;
              const existingId = (existing as { id: string; sort_order: number }).id;

              await supabase
                .from('deep_talk_questions')
                .update({ sort_order: newSortOrder } as any)
                .eq('id', existingId);
            }
          }

          // 3. Insertar las preguntas en todos los idiomas
          const questionsToInsert = Object.entries(question.translations)
            .filter(([_, questionText]) => questionText.trim() !== '')
            .map(([lang, questionText]) => ({
              deep_talk_id: deepTalkId,
              language_code: lang,
              question: questionText,
              icon: question.icon,
              sort_order: question.sort_order,
              is_active: question.is_active,
            }));

          const { error: questionsError } = await supabase
            .from('deep_talk_questions')
            .insert(questionsToInsert as any);

          if (questionsError) {
            insertErrors.push(`Pregunta ${i + 1}: Error al insertar - ${questionsError.message}`);
            continue;
          }

          successCount++;
        } catch (error: any) {
          insertErrors.push(`Pregunta ${i + 1}: ${error.message}`);
        }
      }

      setUploadProgress(prev => ({ ...prev, errors: insertErrors }));

      if (successCount > 0) {
        setSuccessUploadMessage(`${successCount} pregunta(s) subida(s) exitosamente`);
        setShowSuccessUploadModal(true);
        // Refrescar la lista (opcional, las preguntas no se muestran en esta vista)
        await fetchFilters();
      } else {
        setToast({ message: 'No se pudo insertar ninguna pregunta. Revisa los errores.', type: 'error' });
      }

    } catch (error: any) {
      console.error('Error:', error);
      setToast({ message: `Error al procesar el archivo: ${error.message}`, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      setIsLoading(true);

      // Obtener filtros con sus traducciones
      const { data: filtersData, error: filtersError } = await supabase
        .from('deep_talk_categories')
        .select(`
          id,
          label,
          icon,
          color,
          route,
          sort_order,
          is_active,
          is_premium,
          deep_talk_categories_translations (
            language_code,
            name
          )
        `)
        .order('sort_order', { ascending: true });

      if (filtersError) {
        console.error('Error fetching filters:', filtersError);
        return;
      }

      // Obtener todas las categorías (deep_talks) con sus traducciones
      const { data: deepTalksData, error: deepTalksError } = await supabase
        .from('deep_talks')
        .select(`
          id,
          deep_talk_category_id,
          icon,
          gradient_colors,
          estimated_time,
          is_active,
          sort_order,
          deep_talk_translations (
            language_code,
            title,
            subtitle,
            description,
            intensity
          ),
          deep_talk_categories (
            id,
            label,
            color,
            is_premium,
            deep_talk_categories_translations (
              language_code,
              name
            )
          )
        `)
        .order('sort_order', { ascending: true });

      if (deepTalksError) {
        console.error('Error fetching deep talks:', deepTalksError);
      } else {
        // Formatear deep talks
        const formattedDeepTalks: DeepTalk[] = (deepTalksData || []).map((dt: any) => ({
          id: dt.id,
          deep_talk_category_id: dt.deep_talk_category_id,
          icon: dt.icon,
          gradient_colors: dt.gradient_colors,
          estimated_time: dt.estimated_time,
          is_active: dt.is_active,
          is_premium: dt.deep_talk_categories?.is_premium ?? false,
          sort_order: dt.sort_order,
          deep_talk_translations: dt.deep_talk_translations || [],
          category: dt.deep_talk_categories,
        }));
        setDeepTalks(formattedDeepTalks);
      }

      // Obtener conteo de categorías (deep_talks) por filtro
      const counts: Record<string, number> = {};
      deepTalksData?.forEach((item: any) => {
        counts[item.deep_talk_category_id] = (counts[item.deep_talk_category_id] || 0) + 1;
      });

      // Formatear datos
      const formattedFilters: Filter[] = (filtersData || []).map((filter: any) => {
        const translations: Record<string, { name: string }> = {};

        filter.deep_talk_categories_translations.forEach((trans: any) => {
          translations[trans.language_code] = {
            name: trans.name,
          };
        });

        return {
          id: filter.id,
          label: filter.label || '',
          icon: filter.icon,
          color: filter.color,
          route: filter.route,
          sort_order: filter.sort_order,
          is_active: filter.is_active,
          is_premium: filter.is_premium,
          deep_talk_count: counts[filter.id] || 0,
          translations,
        };
      });

      setFilters(formattedFilters);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
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
        {/* Header */}
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B46F8]/20 to-[#7B46F8]/5 border border-[#7B46F8]/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#7B46F8]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      Pláticas Profundas
                    </h1>
                    <p className="text-xs text-[#999999] font-medium">
                      Gestiona los filtros y categorías
                    </p>
                  </div>
                </div>
              </div>
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
                Upload .csv
              </button>
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
              ¡Administra tus Conversaciones!
            </h2>
            <p className="text-base text-[#CCCCCC]">
              Crea, edita y organiza los filtros y categorías de Deep Talks
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#7B46F8] mb-2">{filters.length}</div>
              <div className="text-sm text-[#999999]">Total de Filtros</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#7B46F8] mb-2">
                {filters.filter((c) => c.is_active).length}
              </div>
              <div className="text-sm text-[#999999]">Filtros Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#FF6B9D] mb-2">
                {filters.filter((c) => c.is_premium).length}
              </div>
              <div className="text-sm text-[#999999]">Premium</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#7B46F8] mb-2">
                {filters.reduce((sum, cat) => sum + cat.deep_talk_count, 0)}
              </div>
              <div className="text-sm text-[#999999]">Total de Categorías</div>
            </div>
          </div>

          {/* Lista de filtros */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#7B46F8]/30 border-t-[#7B46F8] rounded-full animate-spin"></div>
                <p className="text-[#999999]">Cargando...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Filtros */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white">
                      Todos los Filtros
                    </h3>

                    {/* Search input - solo mostrar si hay filtros */}
                    {filters.length > 0 && (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar filtro..."
                          value={filterSearchTerm}
                          onChange={(e) => setFilterSearchTerm(e.target.value)}
                          className="w- px-4 py-2 pl-10 bg-[#2A2A2A]/80 border border-[#333333] rounded-xl text-white placeholder:text-[#666666] focus:outline-none focus:border-[#7B46F8]/50 transition-all duration-200"
                        />
                        <svg
                          className="w-5 h-5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Filter toggle buttons - solo mostrar si hay filtros */}
                    {filters.length > 0 && (
                      <div className="flex items-center gap-2 bg-[#2A2A2A]/80 border border-[#333333] rounded-lg p-1">
                        <button
                          onClick={() => setFilterStatus('all')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            filterStatus === 'all'
                              ? 'bg-[#7B46F8] text-white shadow-md'
                              : 'text-[#666666] hover:text-white'
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          onClick={() => setFilterStatus('active')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            filterStatus === 'active'
                              ? 'bg-[#10B981] text-white shadow-md'
                              : 'text-[#666666] hover:text-white'
                          }`}
                        >
                          Activos
                        </button>
                        <button
                          onClick={() => setFilterStatus('inactive')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            filterStatus === 'inactive'
                              ? 'bg-red-500 text-white shadow-md'
                              : 'text-[#666666] hover:text-white'
                          }`}
                        >
                          Inactivos
                        </button>
                      </div>
                    )}

                    <Link href="/deep-talks/categories/new">
                      <button className="px-5 py-2.5 bg-[#7B46F8] hover:bg-[#7B46F8]/90 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#7B46F8]/20 hover:shadow-[#7B46F8]/30">
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
                        Nuevo Filtro
                      </button>
                    </Link>
                  </div>
                </div>

                  {(() => {
                    const filteredFilters = filters.filter((category) => {
                      // Filtrar por estado activo/inactivo
                      if (filterStatus === 'active' && !category.is_active) return false;
                      if (filterStatus === 'inactive' && category.is_active) return false;

                      // Filtrar por término de búsqueda
                      if (filterSearchTerm.trim() !== '') {
                        const searchLower = filterSearchTerm.toLowerCase();
                        const nameMatch = category.translations?.es?.name?.toLowerCase().includes(searchLower);
                        const labelMatch = category.label?.toLowerCase().includes(searchLower);
                        return nameMatch || labelMatch;
                      }

                      return true;
                    });

                    if (filteredFilters.length === 0) {
                      return (
                        <div className="col-span-full bg-[#2A2A2A] border border-[#333333] rounded-2xl p-12 text-center shadow-lg shadow-black/20">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#7B46F8]/20 to-[#7B46F8]/5 border border-[#7B46F8]/30 flex items-center justify-center">
                            <svg
                              className="w-10 h-10 text-[#7B46F8]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-3">
                            No se encontraron filtros
                          </h3>
                          <p className="text-[#CCCCCC] mb-8 max-w-md mx-auto leading-relaxed">
                            {filterSearchTerm.trim() !== ''
                              ? `No hay filtros que coincidan con "${filterSearchTerm}"`
                              : filterStatus === 'active'
                              ? 'No hay filtros activos'
                              : filterStatus === 'inactive'
                              ? 'No hay filtros inactivos'
                              : 'No hay filtros disponibles'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredFilters.map((category) => {
                        const IconComponent = getIonIcon(category.icon);

                        return (
                          <div
                            key={category.id}
                            className={`group bg-[#2A2A2A] border border-[#333333] rounded-2xl overflow-hidden shadow-lg shadow-black/20 hover:border-[#7B46F8]/30 transition-all duration-300 ${
                              !category.is_active ? 'opacity-60 blur-[0.5px]' : ''
                            }` }
                          >
                    {/* Header con color - más compacto */}
                    <div
                      className="relative h-20 flex items-center justify-center"
                      style={{
                        backgroundColor: category.color || '#8B5CF6',
                      }}
                    >
                      {/* Icono dinámico de Ionicons */}
                      <div className="relative z-10">
                        {IconComponent ? (
                          <IconComponent className="w-10 h-10 text-white drop-shadow-lg" />
                        ) : (
                          <svg
                            className="w-10 h-10 text-white drop-shadow-lg"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Badges en el header */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        {category.is_premium && (
                          <span className="px-2 py-0.5 bg-black/30 backdrop-blur-sm text-white border border-white/30 rounded-md text-[10px] font-bold shadow-lg">
                            PREMIUM
                          </span>
                        )}
                        {category.is_active ? (
                          <span className="px-2 py-0.5 bg-success/90 backdrop-blur-sm text-white border border-white/30 rounded-md text-[10px] font-bold shadow-lg">
                            ACTIVA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-black/30 backdrop-blur-sm text-white/70 border border-white/20 rounded-md text-[10px] font-bold">
                            INACTIVA
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenido más compacto */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#7B46F8] transition-colors line-clamp-1">
                        {category.translations.es.name}
                      </h3>

                      {/* Label e Icono para copiar */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#666666] uppercase">Label:</span>
                          <div className="flex-1 flex items-center gap-2 bg-[#7B46F8]/10 border border-[#7B46F8]/30 rounded-lg px-3 py-2">
                            <code className="flex-1 text-sm font-mono font-bold text-[#7B46F8]">
                              {category.label}
                            </code>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigator.clipboard.writeText(category.label);
                                setToast({ message: 'Label copiado!', type: 'success' });
                              }}
                              className="p-1.5 hover:bg-[#7B46F8]/20 rounded transition-colors"
                              title="Copiar label"
                            >
                              <svg className="w-4 h-4 text-[#7B46F8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {category.icon && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#666666] uppercase">Icono:</span>
                            <div className="flex-1 flex items-center gap-2 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg px-3 py-2">
                              <code className="flex-1 text-sm font-mono font-bold text-[#3B82F6]">
                                {category.icon}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(category.icon || '');
                                  setToast({ message: 'Icono copiado!', type: 'success' });
                                }}
                                className="p-1.5 hover:bg-[#3B82F6]/20 rounded transition-colors"
                                title="Copiar icono"
                              >
                                <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Metadata más compacta */}
                      <div className="flex items-center justify-between mb-4 text-xs">
                        <div className="flex items-center gap-1.5 text-[#999999]">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span className="font-medium">{category.deep_talk_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-[#999999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                            />
                          </svg>
                          {Object.keys(category.translations).map((lang, idx) => (
                            <span
                              key={lang}
                              className="text-xs font-medium text-[#999999]"
                            >
                              {lang.toUpperCase()}{idx < Object.keys(category.translations).length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Acciones reorganizadas */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/deep-talks/categories/${category.id}`}
                          className="flex-1 px-4 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] hover:border-[#7B46F8]/30 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/30"
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
                          href={`/deep-talks/categories/${category.id}/deep-talks`}
                          className="flex-1 px-4 py-2.5 bg-[#7B46F8] hover:bg-[#7B46F8]/90 text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#7B46F8]/20"
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
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          Ver Categorías
                        </Link>
                        <button
                          onClick={() => handleDeleteFilterClick(category.id)}
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
                      );
                    })}
                      </div>
                    );
                  })()}
              </div>

              {/* Categorías (Deep Talks) */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white">
                      Todas las Categorías
                    </h3>

                    {/* Search input - solo mostrar si hay categorías */}
                    {deepTalks.length > 0 && (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar categoría..."
                          value={categorySearchTerm}
                          onChange={(e) => setCategorySearchTerm(e.target.value)}
                          className="w-64 px-4 py-2 pl-10 bg-[#2A2A2A]/80 border border-[#333333] rounded-xl text-white placeholder:text-[#666666] focus:outline-none focus:border-[#7B46F8]/50 transition-all duration-200"
                        />
                        <svg
                          className="w-5 h-5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Filter toggle buttons - solo mostrar si hay categorías */}
                    {deepTalks.length > 0 && (
                      <div className="flex items-center gap-2 bg-[#2A2A2A]/80 border border-[#333333] rounded-lg p-1">
                        <button
                          onClick={() => setCategoryFilterStatus('all')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            categoryFilterStatus === 'all'
                              ? 'bg-[#7B46F8] text-white shadow-md'
                              : 'text-[#666666] hover:text-white'
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          onClick={() => setCategoryFilterStatus('active')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            categoryFilterStatus === 'active'
                              ? 'bg-[#10B981] text-white shadow-md'
                              : 'text-[#666666] hover:text-white'
                          }`}
                        >
                          Activos
                        </button>
                        <button
                          onClick={() => setCategoryFilterStatus('inactive')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            categoryFilterStatus === 'inactive'
                              ? 'bg-red-500 text-white shadow-md'
                              : 'text-[#666666] hover:text-white'
                          }`}
                        >
                          Inactivos
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setShowFilterSelector(true)}
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Crear Nueva Categoría
                    </button>
                  </div>
                </div>

                {deepTalks.length === 0 ? (
                  <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-12 text-center shadow-lg shadow-black/10">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/30 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-brand-yellow"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                      No hay categorías aún
                    </h3>
                    <p className="text-[#CCCCCC] mb-6">
                      Crea tu primera categoría de pláticas profundas seleccionando un filtro y haciendo clic en &quot;Crear Nueva Categoría&quot;
                    </p>
                  </div>
                ) : (() => {
                    const filteredCategories = deepTalks.filter((deepTalk) => {
                      // Filtrar por estado activo/inactivo
                      if (categoryFilterStatus === 'active' && !deepTalk.is_active) return false;
                      if (categoryFilterStatus === 'inactive' && deepTalk.is_active) return false;

                      // Filtrar por término de búsqueda
                      if (categorySearchTerm.trim() !== '') {
                        const translation = deepTalk.deep_talk_translations.find(
                          (t) => t.language_code === 'es'
                        );
                        const searchLower = categorySearchTerm.toLowerCase();
                        const titleMatch = translation?.title?.toLowerCase().includes(searchLower);
                        const descMatch = translation?.description?.toLowerCase().includes(searchLower);
                        return titleMatch || descMatch;
                      }

                      return true;
                    });

                    if (filteredCategories.length === 0) {
                      return (
                        <div className="col-span-full bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-12 text-center shadow-lg shadow-black/10">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-purple/20 to-brand-purple/5 border border-brand-purple/30 flex items-center justify-center">
                            <svg
                              className="w-10 h-10 text-brand-purple"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-text-primary mb-2">
                            No se encontraron categorías
                          </h3>
                          <p className="text-text-secondary">
                            {categorySearchTerm.trim() !== ''
                              ? `No hay categorías que coincidan con "${categorySearchTerm}"`
                              : categoryFilterStatus === 'active'
                              ? 'No hay categorías activas'
                              : categoryFilterStatus === 'inactive'
                              ? 'No hay categorías inactivas'
                              : 'No hay categorías disponibles'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCategories.map((deepTalk) => {
                        const translation = deepTalk.deep_talk_translations.find(
                        (t) => t.language_code === 'es'
                      );
                      const categoryTranslation = deepTalk.category?.deep_talk_categories_translations?.find(
                        (t) => t.language_code === 'es'
                      );
                      const gradientColors = deepTalk.gradient_colors || ['#8B5CF6', '#6366F1'];
                      const DeepTalkIcon = getIonIcon(deepTalk.icon);

                      return (
                        <div
                          key={deepTalk.id}
                          className={`bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-brand-purple/50 transition-all duration-200 hover:shadow-lg hover:shadow-brand-purple/10 group ${
                            !deepTalk.is_active ? 'opacity-60 blur-[0.5px]' : ''
                          }`}
                        >
                          {/* Header with icon and filter tag */}
                          <div className="flex items-start justify-between mb-4">
                            <div
                              className="w-14 h-14 rounded-xl flex items-center justify-center"
                              style={{
                                background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1] || gradientColors[0]})`,
                              }}
                            >
                              {DeepTalkIcon ? (
                                <DeepTalkIcon className="w-7 h-7 text-white" />
                              ) : (
                                <span className="text-2xl">{deepTalk.icon || '💬'}</span>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {deepTalk.category && (
                                <span
                                  className="px-2 py-1 text-xs rounded-lg font-medium border"
                                  style={{
                                    backgroundColor: deepTalk.category.color ? `${deepTalk.category.color}20` : '#8B5CF620',
                                    borderColor: deepTalk.category.color ? `${deepTalk.category.color}50` : '#8B5CF650',
                                    color: deepTalk.category.color || '#8B5CF6',
                                  }}
                                >
                                  {categoryTranslation?.name || deepTalk.category.label}
                                </span>
                              )}
                              {deepTalk.is_premium ? (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 text-xs rounded-lg border border-yellow-500/30 font-bold flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  PREMIUM
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-green-500/20 text-green-600 text-xs rounded-lg border border-green-500/30 font-bold">
                                  GRATIS
                                </span>
                              )}
                              {!deepTalk.is_active && (
                                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-lg border border-gray-500/30">
                                  Inactiva
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="mb-4">
                            <h3 className="text-lg font-bold text-text-primary mb-1 line-clamp-2">
                              {translation?.title || 'Sin título'}
                            </h3>
                            {translation?.subtitle && (
                              <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                                {translation.subtitle}
                              </p>
                            )}

                            {/* Label e Icono para copiar */}
                            <div className="mt-3 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-text-tertiary uppercase">Filtro:</span>
                                <code className="px-2 py-1 bg-bg-tertiary border border-border rounded text-xs font-mono text-brand-purple select-all">
                                  {deepTalk.category?.label || 'N/A'}
                                </code>
                              </div>
                              {deepTalk.icon && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-text-tertiary uppercase">Icono:</span>
                                  <code className="px-2 py-1 bg-bg-tertiary border border-border rounded text-xs font-mono text-brand-blue select-all">
                                    {deepTalk.icon}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 mb-4 text-xs text-text-tertiary">
                            {deepTalk.estimated_time && (
                              <div className="flex items-center gap-1">
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
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {deepTalk.estimated_time} min
                              </div>
                            )}
                            {translation?.intensity && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  {translation.intensity === 'LOW' && '🟢 Baja'}
                                  {translation.intensity === 'MEDIUM' && '🟡 Media'}
                                  {translation.intensity === 'HIGH' && '🔴 Alta'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                            <div className="flex gap-2">
                              <Link
                                href={`/deep-talks/categories/${deepTalk.deep_talk_category_id}/deep-talks/${deepTalk.id}/questions`}
                                onClick={saveScrollPosition}
                                className="flex-1 px-3 py-2 bg-brand-purple/10 hover:bg-brand-purple/20 border border-brand-purple/30 text-brand-purple rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
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
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                                Temas Profundos
                              </Link>
                              <Link
                                href={`/deep-talks/categories/${deepTalk.deep_talk_category_id}/deep-talks/${deepTalk.id}`}
                                onClick={saveScrollPosition}
                                className="flex-1 px-3 py-2 bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/30 text-brand-blue rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
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
                            </div>
                            <button
                              onClick={() => handleDeleteCategoryClick(deepTalk.id)}
                              className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
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
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                      </div>
                    );
                  })()
                }
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal de Selección de Filtro */}
      {showFilterSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Seleccionar Filtro</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Elige el filtro al que pertenecerá la nueva categoría
                  </p>
                </div>
                <button
                  onClick={() => setShowFilterSelector(false)}
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Lista de Filtros */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 gap-3">
                {filters.map((filter) => {
                  const FilterIcon = getIonIcon(filter.icon);

                  return (
                    <Link
                      key={filter.id}
                      href={`/deep-talks/categories/${filter.id}/deep-talks/new`}
                      onClick={() => setShowFilterSelector(false)}
                      className="group flex items-center gap-4 p-4 bg-bg-tertiary hover:bg-border border border-border rounded-xl transition-all duration-200 hover:border-brand-purple/50"
                    >
                      {/* Icono */}
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: filter.color || '#8B5CF6' }}
                      >
                        {FilterIcon ? (
                          <FilterIcon className="w-7 h-7 text-white" />
                        ) : (
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Información */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-text-primary group-hover:text-brand-purple transition-colors">
                          {filter.translations.es?.name || filter.label}
                        </h3>
                        <p className="text-sm text-text-tertiary font-mono mt-0.5">
                          {filter.label}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-tertiary">
                            {filter.deep_talk_count} categorías
                          </span>
                          {filter.is_premium && (
                            <span className="px-1.5 py-0.5 bg-brand-pink/20 text-brand-pink text-[10px] font-bold rounded">
                              PREMIUM
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Flecha */}
                      <svg
                        className="w-5 h-5 text-text-tertiary group-hover:text-brand-purple transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upload CSV */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowUploadModal(false);
            setCsvFile(null);
            setActiveTab('filters');
          }}
        >
          <div
            className="bg-bg-secondary border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-bg-secondary border-b border-border p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Upload Masivo - Deep Talks</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Carga datos mediante archivos CSV
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setCsvFile(null);
                    setActiveTab('filters');
                  }}
                  className="w-10 h-10 rounded-xl bg-bg-tertiary hover:bg-border border border-border flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border bg-bg-tertiary/50">
              <div className="flex gap-1 px-6">
                <button
                  onClick={() => {
                    setActiveTab('filters');
                    setCsvFile(null);
                  }}
                  className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === 'filters'
                      ? 'border-brand-purple text-brand-purple'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    Agregar Filtros
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('categories');
                    setCsvFile(null);
                  }}
                  className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === 'categories'
                      ? 'border-brand-blue text-brand-blue'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Agregar Categorías
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('questions');
                    setCsvFile(null);
                  }}
                  className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                    activeTab === 'questions'
                      ? 'border-brand-pink text-brand-pink'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Agregar Preguntas
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Tab: Agregar Filtros */}
              {activeTab === 'filters' && (
                <div className="space-y-6">
                  <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-xl p-4">
                    <h3 className="font-bold text-brand-purple mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Formato del CSV para Filtros
                    </h3>
                    <p className="text-sm text-text-secondary mb-2">El archivo debe incluir estas columnas en este orden exacto:</p>
                    <div className="text-sm text-text-secondary space-y-2">
                      <div>
                        <p className="font-bold text-text-primary mb-1">Campos Obligatorios:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>label:</strong> Identificador interno único en minúsculas con guiones bajos (ej: relationships, personal_growth)</li>
                          <li><strong>sort_order:</strong> Orden de visualización (número entero, ej: 1, 2, 3)</li>
                          <li><strong>is_premium:</strong> true o false (indica si es contenido premium)</li>
                          <li><strong>is_active:</strong> true o false (indica si está activo)</li>
                          <li><strong>name_es:</strong> Nombre del filtro en español</li>
                          <li><strong>name_en:</strong> Nombre del filtro en inglés</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-text-primary mb-1">Campos Opcionales:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>icon:</strong> Nombre del ícono Ionicons o emoji (ej: heart, rocket, 🔥, ❤️)</li>
                          <li><strong>color:</strong> Color hexadecimal con # (ej: #8B5CF6, #EC4899, #F59E0B)</li>
                          <li><strong>route:</strong> Ruta de navegación (ej: /deep-talks/relationships)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-text-secondary">
                            <strong className="text-brand-yellow">📋 Ejemplo de archivo CSV:</strong><br/>
                            <code className="text-xs bg-bg-tertiary px-2 py-1 rounded mt-1 block whitespace-pre-wrap break-all">
                              label,sort_order,is_premium,is_active,name_es,name_en,icon,color,route{'\n'}
                              relationships,1,false,true,Relaciones,Relationships,heart,#EC4899,/deep-talks/relationships
                            </code>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const csvExample = `label,sort_order,is_premium,is_active,name_es,name_en,icon,color,route
relationships,1,false,true,Relaciones,Relationships,heart,#EC4899,/deep-talks/relationships`;
                            navigator.clipboard.writeText(csvExample);
                            setToast({ message: 'Ejemplo CSV copiado!', type: 'success' });
                          }}
                          className="flex-shrink-0 p-2 hover:bg-brand-yellow/20 rounded-lg transition-colors"
                          title="Copiar ejemplo CSV"
                        >
                          <svg className="w-5 h-5 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Archivo CSV
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-text-secondary file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-purple file:text-white hover:file:bg-brand-purple/90 file:cursor-pointer cursor-pointer"
                      disabled={isUploading}
                    />
                    {csvFile && (
                      <p className="mt-2 text-sm text-text-secondary">
                        Archivo seleccionado: <span className="font-medium text-text-primary">{csvFile.name}</span>
                      </p>
                    )}
                  </div>

                  {uploadProgress.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-text-secondary">
                        <span>Progreso: {uploadProgress.current} / {uploadProgress.total}</span>
                        <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-bg-tertiary rounded-full h-2">
                        <div
                          className="bg-brand-purple h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      {uploadProgress.errors.length > 0 && (
                        <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-xl max-h-60 overflow-y-auto">
                          <h4 className="font-bold text-error mb-2">Errores encontrados:</h4>
                          <ul className="text-sm text-error space-y-1">
                            {uploadProgress.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleUploadFilters}
                    disabled={!csvFile || isUploading}
                    className="w-full px-6 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Subiendo filtros...
                      </span>
                    ) : (
                      'Subir Filtros'
                    )}
                  </button>
                </div>
              )}

              {/* Tab: Agregar Categorías */}
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl p-4">
                    <h3 className="font-bold text-brand-blue mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Formato del CSV para Categorías (Deep Talks)
                    </h3>
                    <p className="text-sm text-text-secondary mb-2">El archivo debe incluir estas columnas:</p>
                    <div className="text-sm text-text-secondary space-y-2">
                      <div>
                        <p className="font-bold text-text-primary mb-1">Campos Obligatorios:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong className="text-red-500">filter_label:</strong> Label EXACTO del filtro padre (ej: relationships, personal_growth) - IMPORTANTE: Debe coincidir exactamente con el label de un filtro existente</li>
                          <li><strong>sort_order:</strong> Orden de visualización (número entero)</li>
                          <li><strong>is_active:</strong> true o false</li>
                          <li><strong>title_es:</strong> Título en español</li>
                          <li><strong>title_en:</strong> Título en inglés</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-text-primary mb-1">Campos Opcionales:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>icon:</strong> Nombre del ícono Ionicons (ej: heart, rocket, bulb)</li>
                          <li><strong>gradient_colors:</strong> Colores separados por pipe | (ej: #8B5CF6|#EC4899)</li>
                          <li><strong>estimated_time:</strong> Tiempo estimado (ej: 15 min, 20 min)</li>
                          <li><strong>is_premium:</strong> true o false (indica si es contenido premium)</li>
                          <li><strong>subtitle_es, subtitle_en:</strong> Subtítulo en español e inglés</li>
                          <li><strong>description_es, description_en:</strong> Descripción en español e inglés</li>
                          <li><strong>intensity_es, intensity_en:</strong> Intensidad: LOW, MEDIUM, HIGH</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-text-secondary">
                            <strong className="text-brand-yellow">📋 Ejemplo de archivo CSV:</strong><br/>
                            <code className="text-xs bg-bg-tertiary px-2 py-1 rounded mt-1 block whitespace-pre-wrap break-all">
                              filter_label,sort_order,is_active,is_premium,title_es,title_en,icon,gradient_colors,estimated_time{'\n'}
                              relationships,1,true,false,Amor y Pareja,Love and Relationships,heart,#EC4899|#F97316,15 min
                            </code>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const csvExample = `filter_label,sort_order,is_active,is_premium,title_es,title_en,icon,gradient_colors,estimated_time
relationships,1,true,false,Amor y Pareja,Love and Relationships,heart,#EC4899|#F97316,15 min`;
                            navigator.clipboard.writeText(csvExample);
                            setToast({ message: 'Ejemplo CSV copiado!', type: 'success' });
                          }}
                          className="flex-shrink-0 p-2 hover:bg-brand-yellow/20 rounded-lg transition-colors"
                          title="Copiar ejemplo CSV"
                        >
                          <svg className="w-5 h-5 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Archivo CSV
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-text-secondary file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-blue/90 file:cursor-pointer cursor-pointer"
                      disabled={isUploading}
                    />
                    {csvFile && (
                      <p className="mt-2 text-sm text-text-secondary">
                        Archivo seleccionado: <span className="font-medium text-text-primary">{csvFile.name}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleUploadCategories}
                    disabled={!csvFile || isUploading}
                    className="w-full px-6 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Subiendo categorías...' : 'Subir Categorías'}
                  </button>
                </div>
              )}

              {/* Tab: Agregar Preguntas */}
              {activeTab === 'questions' && (
                <div className="space-y-6">
                  <div className="bg-brand-pink/5 border border-brand-pink/20 rounded-xl p-4">
                    <h3 className="font-bold text-brand-pink mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Formato del CSV para Preguntas
                    </h3>
                    <p className="text-sm text-text-secondary mb-2">El archivo debe incluir estas columnas:</p>
                    <div className="text-sm text-text-secondary space-y-2">
                      <div>
                        <p className="font-bold text-text-primary mb-1">Campos Obligatorios:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong className="text-red-500">title_es:</strong> Título EXACTO en español de la categoría (ej: Amor y Pareja, Metas y Sueños) - IMPORTANTE: Debe coincidir exactamente con el título de una categoría existente</li>
                          <li><strong>sort_order:</strong> Orden de visualización (número entero)</li>
                          <li><strong>is_active:</strong> true o false</li>
                          <li><strong>question_es:</strong> Pregunta en español</li>
                          <li><strong>question_en:</strong> Pregunta en inglés</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-text-primary mb-1">Campos Opcionales:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>icon:</strong> Nombre del ícono Ionicons (ej: help-circle, heart, star)</li>
                          <li><strong>question_pt:</strong> Pregunta en portugués</li>
                          <li><strong>question_fr:</strong> Pregunta en francés</li>
                          <li><strong>question_it:</strong> Pregunta en italiano</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-text-secondary">
                            <strong className="text-brand-yellow">📋 Ejemplo de archivo CSV:</strong><br/>
                            <code className="text-xs bg-bg-tertiary px-2 py-1 rounded mt-1 block whitespace-pre-wrap break-all">
                              title_es,sort_order,is_active,question_es,question_en,icon{'\n'}
                              Amor y Pareja,1,true,¿Qué es lo que más valoras en una relación?,What do you value most in a relationship?,heart
                            </code>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const csvExample = `title_es,sort_order,is_active,question_es,question_en,icon
Amor y Pareja,1,true,¿Qué es lo que más valoras en una relación?,What do you value most in a relationship?,heart`;
                            navigator.clipboard.writeText(csvExample);
                            setToast({ message: 'Ejemplo CSV copiado!', type: 'success' });
                          }}
                          className="flex-shrink-0 p-2 hover:bg-brand-yellow/20 rounded-lg transition-colors"
                          title="Copiar ejemplo CSV"
                        >
                          <svg className="w-5 h-5 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Archivo CSV
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-text-secondary file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-pink file:text-white hover:file:bg-brand-pink/90 file:cursor-pointer cursor-pointer"
                      disabled={isUploading}
                    />
                    {csvFile && (
                      <p className="mt-2 text-sm text-text-secondary">
                        Archivo seleccionado: <span className="font-medium text-text-primary">{csvFile.name}</span>
                      </p>
                    )}
                  </div>

                  {uploadProgress.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-text-secondary">
                        <span>Progreso: {uploadProgress.current} / {uploadProgress.total}</span>
                        <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-bg-tertiary rounded-full h-2">
                        <div
                          className="bg-brand-pink h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      {uploadProgress.errors.length > 0 && (
                        <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-xl max-h-60 overflow-y-auto">
                          <h4 className="font-bold text-error mb-2">Errores encontrados:</h4>
                          <ul className="text-sm text-error space-y-1">
                            {uploadProgress.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleUploadQuestions}
                    disabled={!csvFile || isUploading}
                    className="w-full px-6 py-3 bg-brand-pink hover:bg-brand-pink/90 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Subiendo preguntas...
                      </span>
                    ) : (
                      'Subir Preguntas'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de filtro */}
      {showDeleteFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteFilterModal(false)} />
          <div className="relative z-10 bg-bg-secondary border-2 border-red-500/50 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-red-500 mb-2">¿Eliminar Filtro?</h3>
              <p className="text-text-secondary mb-6">
                Esta acción eliminará el filtro y todas sus categorías y preguntas asociadas. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteFilterModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-bg-tertiary hover:bg-border text-text-primary font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteFilter}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar categoría */}
      {showDeleteCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isDeletingCategory && setShowDeleteCategoryModal(false)} />
          <div className="relative z-10 bg-bg-secondary border-2 border-red-500/50 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-red-500 mb-2">¿Eliminar Categoría?</h3>
              <p className="text-text-secondary mb-6">
                Esta acción eliminará la categoría y todas sus preguntas asociadas. El filtro al que pertenece no se eliminará. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteCategoryModal(false)}
                  disabled={isDeletingCategory}
                  className="flex-1 px-6 py-3 bg-bg-tertiary hover:bg-border text-text-primary font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteCategory}
                  disabled={isDeletingCategory}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeletingCategory ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito del upload */}
      {showSuccessUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSuccessUploadModal(false)} />
          <div className="relative z-10 bg-bg-secondary border-2 border-success rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-success mb-2">¡Éxito!</h3>
              <p className="text-text-secondary mb-6">{successUploadMessage}</p>
              <button
                onClick={() => {
                  setShowSuccessUploadModal(false);
                  setShowUploadModal(false);
                  setCsvFile(null);
                  setUploadProgress({ current: 0, total: 0, errors: [] });
                }}
                className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white font-bold rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de notificación */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
