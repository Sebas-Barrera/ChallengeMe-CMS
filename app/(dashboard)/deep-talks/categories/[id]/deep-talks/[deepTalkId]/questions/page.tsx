'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import * as IoIcons from 'react-icons/io5';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SuccessModal from '@/components/ui/SuccessModal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import EmojiOrIconPicker from '@/components/ui/EmojiOrIconPicker';
import Toast from '@/components/ui/Toast';

interface DeepTalkQuestion {
  id: string;
  deep_talk_id: string;
  language_code: string;
  question: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

interface QuestionTranslations {
  [language_code: string]: {
    id: string;
    question: string;
  };
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
  estimated_time: string | null;
  is_active: boolean;
  deep_talk_translations: DeepTalkTranslation[];
  deep_talk_questions: DeepTalkQuestion[];
}

interface FilterCategory {
  id: string;
  label: string;
  color: string | null;
  deep_talk_categories_translations: { language_code: string; name: string }[];
}

interface PageProps {
  params: Promise<{ id: string; deepTalkId: string }>;
}

// Helper para obtener el icono de Ionicons dinámicamente
const getIonIcon = (iconName: string | null) => {
  if (!iconName) return null;

  // Convertir nombre de icono a formato PascalCase para Ionicons v5
  // Ejemplos: trophy -> IoTrophy, game-controller -> IoGameController
  const pascalCase = 'Io' + iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const IconComponent = (IoIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase];

  return IconComponent || null;
};

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Español',
  en: 'Inglés'
};

const LANGUAGE_FLAGS: Record<string, string> = {
  es: '🇪🇸',
  en: '🇬🇧'
};

export default function DeepTalkQuestionsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const categoryId = resolvedParams.id;
  const deepTalkId = resolvedParams.deepTalkId;
  const router = useRouter();
  const { supabase } = useAuth();

  const [deepTalk, setDeepTalk] = useState<DeepTalk | null>(null);
  const [filter, setFilter] = useState<FilterCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('es');
  const [questionFilterStatus, setQuestionFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estados para modales y acciones
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [selectedSortOrder, setSelectedSortOrder] = useState<number>(0);

  // Estados para edición de pregunta
  const [editingQuestions, setEditingQuestions] = useState<QuestionTranslations>({});
  const [editingIcon, setEditingIcon] = useState<string>('');
  const [editingIsActive, setEditingIsActive] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [availableLanguagesToAdd, setAvailableLanguagesToAdd] = useState<string[]>([]);

  // Estados para creación de pregunta
  const [newQuestions, setNewQuestions] = useState<Record<string, string>>({});
  const [newIcon, setNewIcon] = useState<string>('');
  const [newIsActive, setNewIsActive] = useState<boolean>(true);
  const [isTranslatingNew, setIsTranslatingNew] = useState(false);
  const [optionalLanguages, setOptionalLanguages] = useState<string[]>([]);

  // Estados para Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  useEffect(() => {
    fetchData();
  }, [deepTalkId]);

  // Bloquear scroll del body cuando el modal esté abierto
  useEffect(() => {
    if (showEditModal || showCreateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup: restaurar scroll cuando el componente se desmonte
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEditModal, showCreateModal]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch filter info
      const { data: filterData, error: filterError } = await supabase
        .from('deep_talk_categories')
        .select(`
          id,
          label,
          color,
          deep_talk_categories_translations (
            language_code,
            name
          )
        `)
        .eq('id', categoryId)
        .single();

      if (filterError) throw filterError;
      setFilter(filterData);

      // Fetch deep talk with questions
      const { data: deepTalkData, error: deepTalkError } = await supabase
        .from('deep_talks')
        .select(`
          id,
          deep_talk_category_id,
          icon,
          gradient_colors,
          estimated_time,
          is_active,
          deep_talk_translations (
            language_code,
            title,
            subtitle,
            description,
            intensity
          ),
          deep_talk_questions (
            id,
            deep_talk_id,
            language_code,
            question,
            icon,
            sort_order,
            is_active
          )
        `)
        .eq('id', deepTalkId)
        .single();

      if (deepTalkError) throw deepTalkError;
      setDeepTalk(deepTalkData);

      // Set default language from available translations
      if (deepTalkData.deep_talk_translations.length > 0) {
        const hasSpanish = deepTalkData.deep_talk_translations.some((t) => t.language_code === 'es');
        setSelectedLanguage(hasSpanish ? 'es' : deepTalkData.deep_talk_translations[0].language_code);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ message: 'Error al cargar los datos', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para abrir el modal de edición
  const handleEditClick = (sortOrder: number) => {
    if (!deepTalk) return;

    // Buscar todas las traducciones de la pregunta con ese sort_order
    const questionsForOrder = deepTalk.deep_talk_questions.filter((q) => q.sort_order === sortOrder);

    if (questionsForOrder.length === 0) return;

    // Crear el objeto de traducciones
    const translations: QuestionTranslations = {};
    questionsForOrder.forEach((q) => {
      translations[q.language_code] = {
        id: q.id,
        question: q.question,
      };
    });

    // Calcular idiomas disponibles para agregar
    const allLanguages = ['es', 'en'];
    const existingLanguages = questionsForOrder.map((q) => q.language_code);
    const languagesToAdd = allLanguages.filter((lang) => !existingLanguages.includes(lang));

    setEditingQuestions(translations);
    setEditingIcon(questionsForOrder[0].icon || '');
    setEditingIsActive(questionsForOrder[0].is_active);
    setSelectedSortOrder(sortOrder);
    setAvailableLanguagesToAdd(languagesToAdd);
    setShowEditModal(true);
  };

  // Función para agregar un nuevo idioma
  const handleAddLanguage = (languageCode: string) => {
    setEditingQuestions({
      ...editingQuestions,
      [languageCode]: {
        id: '', // Nuevo idioma, no tiene ID todavía
        question: '',
      },
    });
    setAvailableLanguagesToAdd(availableLanguagesToAdd.filter((lang) => lang !== languageCode));
  };

  // Función para eliminar un idioma agregado
  const handleRemoveLanguage = (languageCode: string) => {
    const updatedQuestions = { ...editingQuestions };
    delete updatedQuestions[languageCode];
    setEditingQuestions(updatedQuestions);
    setAvailableLanguagesToAdd([...availableLanguagesToAdd, languageCode].sort());
  };

  // Función para auto-traducir desde español
  const handleAutoTranslate = async () => {
    const spanishQuestion = editingQuestions['es']?.question;

    if (!spanishQuestion || !spanishQuestion.trim()) {
      setToast({ message: 'Por favor, completa primero la pregunta en español', type: 'warning' });
      return;
    }

    if (!deepTalk) return;

    setIsTranslating(true);

    try {
      // Obtener todos los idiomas disponibles excepto español
      const availableLanguages = Array.from(
        new Set(deepTalk.deep_talk_questions.map((q) => q.language_code))
      ).filter((lang) => lang !== 'es');

      if (availableLanguages.length === 0) {
        setToast({ message: 'No hay otros idiomas disponibles para traducir', type: 'warning' });
        setIsTranslating(false);
        return;
      }

      // Traducir a todos los idiomas
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spanishQuestion,
          targetLanguages: availableLanguages,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const updatedQuestions = { ...editingQuestions };

        availableLanguages.forEach((lang) => {
          if (result.translations[lang]) {
            updatedQuestions[lang] = {
              id: updatedQuestions[lang]?.id || '',
              question: result.translations[lang],
            };
          }
        });

        setEditingQuestions(updatedQuestions);
        setToast({ message: 'Pregunta traducida exitosamente a todos los idiomas', type: 'success' });
      } else {
        setToast({ message: 'Error al traducir. Intenta de nuevo.', type: 'error' });
      }
    } catch (error) {
      console.error('Error al auto-traducir:', error);
      setToast({ message: 'Error al traducir. Intenta de nuevo.', type: 'error' });
    } finally {
      setIsTranslating(false);
    }
  };

  // Función para guardar los cambios de la pregunta
  const handleSaveQuestion = async () => {
    if (!deepTalk) return;

    // Validar que todas las traducciones editadas tengan contenido
    const editingLanguages = Object.keys(editingQuestions);

    const missingTranslations = editingLanguages.filter(
      (lang) => !editingQuestions[lang]?.question || !editingQuestions[lang].question.trim()
    );

    if (missingTranslations.length > 0) {
      setToast({
        message: `Por favor, completa la pregunta en todos los idiomas o elimina los idiomas vacíos: ${missingTranslations.join(', ').toUpperCase()}`,
        type: 'warning'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Separar actualizaciones de inserciones
      const questionsToUpdate: string[] = [];
      const questionsToInsert: { language_code: string; question: string }[] = [];

      editingLanguages.forEach((lang) => {
        const questionData = editingQuestions[lang];
        if (questionData.id) {
          // Tiene ID, es una actualización
          questionsToUpdate.push(lang);
        } else {
          // No tiene ID, es una nueva traducción
          questionsToInsert.push({
            language_code: lang,
            question: questionData.question,
          });
        }
      });

      // Actualizar preguntas existentes
      for (const lang of questionsToUpdate) {
        const questionData = editingQuestions[lang];

        const { error } = await (supabase
          .from('deep_talk_questions') as any)
          .update({
            question: questionData.question,
            icon: editingIcon || null,
            is_active: editingIsActive,
          })
          .eq('id', questionData.id);

        if (error) throw error;
      }

      // Insertar nuevas traducciones
      if (questionsToInsert.length > 0) {
        // Recorrer los sort_order existentes dentro de este deep_talk
        const { data: existingQuestions } = await supabase
          .from('deep_talk_questions')
          .select('id, sort_order')
          .eq('deep_talk_id', deepTalkId)
          .gte('sort_order', selectedSortOrder)
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

        const newQuestions = questionsToInsert.map((q) => ({
          deep_talk_id: deepTalkId,
          language_code: q.language_code,
          question: q.question,
          icon: editingIcon || null,
          sort_order: selectedSortOrder,
          is_active: editingIsActive,
        }));

        const { error: insertError } = await supabase
          .from('deep_talk_questions')
          .insert(newQuestions as any);

        if (insertError) throw insertError;
      }

      // Recargar datos
      await fetchData();

      // Mostrar mensaje de éxito
      setShowEditModal(false);
      setSuccessMessage(
        questionsToInsert.length > 0
          ? `Pregunta actualizada y ${questionsToInsert.length} traducción(es) agregada(s) exitosamente`
          : 'Pregunta actualizada exitosamente'
      );
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error al actualizar pregunta:', error);
      setToast({ message: 'Error al actualizar la pregunta. Intenta de nuevo.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para toggle activar/desactivar
  const handleToggleActive = async (sortOrder: number) => {
    if (!deepTalk) return;

    const questionsForOrder = deepTalk.deep_talk_questions.filter((q) => q.sort_order === sortOrder);

    if (questionsForOrder.length === 0) return;

    const newIsActive = !questionsForOrder[0].is_active;

    setIsProcessing(true);

    try {
      // Actualizar el estado de todas las traducciones de la pregunta
      for (const question of questionsForOrder) {
        const { error } = await supabase
          .from('deep_talk_questions')
          .update({ is_active: newIsActive })
          .eq('id', question.id);

        if (error) throw error;
      }

      // Recargar datos
      await fetchData();

      setSuccessMessage(`Pregunta ${newIsActive ? 'activada' : 'desactivada'} exitosamente`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setToast({ message: 'Error al cambiar el estado. Intenta de nuevo.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para eliminar pregunta
  const handleDeleteClick = (sortOrder: number) => {
    setSelectedSortOrder(sortOrder);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deepTalk) return;

    const questionsForOrder = deepTalk.deep_talk_questions.filter((q) => q.sort_order === selectedSortOrder);

    if (questionsForOrder.length === 0) return;

    setIsProcessing(true);

    try {
      // Eliminar todas las traducciones de la pregunta
      for (const question of questionsForOrder) {
        const { error } = await supabase
          .from('deep_talk_questions')
          .delete()
          .eq('id', question.id);

        if (error) throw error;
      }

      // Recargar datos
      await fetchData();

      setShowDeleteModal(false);
      setSuccessMessage('Pregunta eliminada exitosamente');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error al eliminar pregunta:', error);
      setToast({ message: 'Error al eliminar la pregunta. Intenta de nuevo.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para abrir el modal de creación
  const handleOpenCreateModal = () => {
    if (!deepTalk) return;

    // Obtener idiomas disponibles del deep talk
    const availableLanguages = Array.from(
      new Set(deepTalk.deep_talk_translations.map((t) => t.language_code))
    );

    // Inicializar con español si está disponible
    const initialQuestions: Record<string, string> = {};
    if (availableLanguages.includes('es')) {
      initialQuestions.es = '';
    }

    // Calcular el siguiente sort_order
    const maxSortOrder = deepTalk.deep_talk_questions.length > 0
      ? Math.max(...deepTalk.deep_talk_questions.map((q) => q.sort_order))
      : 0;

    setNewQuestions(initialQuestions);
    setNewIcon('');
    setNewIsActive(true);
    setOptionalLanguages(availableLanguages.filter((lang) => lang !== 'es'));
    setSelectedSortOrder(maxSortOrder + 1);
    setShowCreateModal(true);
  };

  // Función para agregar un idioma opcional en el modal de creación
  const handleAddOptionalLanguage = (languageCode: string) => {
    setNewQuestions({
      ...newQuestions,
      [languageCode]: '',
    });
    setOptionalLanguages(optionalLanguages.filter((lang) => lang !== languageCode));
  };

  // Función para eliminar un idioma opcional en el modal de creación
  const handleRemoveOptionalLanguage = (languageCode: string) => {
    const updatedQuestions = { ...newQuestions };
    delete updatedQuestions[languageCode];
    setNewQuestions(updatedQuestions);
    setOptionalLanguages([...optionalLanguages, languageCode].sort());
  };

  // Función para auto-traducir en el modal de creación
  const handleAutoTranslateNew = async () => {
    const spanishQuestion = newQuestions['es'];

    if (!spanishQuestion || !spanishQuestion.trim()) {
      setToast({ message: 'Por favor, completa primero la pregunta en español', type: 'warning' });
      return;
    }

    setIsTranslatingNew(true);

    try {
      // Obtener todos los idiomas disponibles excepto español
      const targetLanguages = Object.keys(newQuestions).filter((lang) => lang !== 'es');

      if (targetLanguages.length === 0) {
        setToast({ message: 'No hay otros idiomas para traducir. Agrega al menos un idioma adicional.', type: 'warning' });
        setIsTranslatingNew(false);
        return;
      }

      // Traducir a todos los idiomas
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spanishQuestion,
          targetLanguages: targetLanguages,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const updatedQuestions = { ...newQuestions };

        targetLanguages.forEach((lang) => {
          if (result.translations[lang]) {
            updatedQuestions[lang] = result.translations[lang];
          }
        });

        setNewQuestions(updatedQuestions);
        setToast({ message: 'Pregunta traducida exitosamente a todos los idiomas', type: 'success' });
      } else {
        setToast({ message: 'Error al traducir. Intenta de nuevo.', type: 'error' });
      }
    } catch (error) {
      console.error('Error al auto-traducir:', error);
      setToast({ message: 'Error al traducir. Intenta de nuevo.', type: 'error' });
    } finally {
      setIsTranslatingNew(false);
    }
  };

  // Función para crear una nueva pregunta
  const handleCreateQuestion = async () => {
    if (!deepTalk) return;

    // Validar que al menos haya una traducción
    const languages = Object.keys(newQuestions);

    if (languages.length === 0) {
      setToast({ message: 'Por favor, agrega al menos un idioma', type: 'warning' });
      return;
    }

    // Validar que todas las traducciones tengan contenido
    const missingTranslations = languages.filter(
      (lang) => !newQuestions[lang] || !newQuestions[lang].trim()
    );

    if (missingTranslations.length > 0) {
      setToast({
        message: `Por favor, completa la pregunta en todos los idiomas o elimina los idiomas vacíos: ${missingTranslations.join(', ').toUpperCase()}`,
        type: 'warning'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Reordenar preguntas existentes si es necesario
      // Obtener todas las preguntas con sort_order >= selectedSortOrder
      const questionsToReorder = deepTalk.deep_talk_questions.filter(
        (q) => q.sort_order >= selectedSortOrder
      );

      // Si hay preguntas que reordenar, incrementar su sort_order en 1
      if (questionsToReorder.length > 0) {
        for (const question of questionsToReorder) {
          await supabase
            .from('deep_talk_questions')
            .update({ sort_order: question.sort_order + 1 })
            .eq('id', question.id);
        }
      }

      // 2. Crear las preguntas en todos los idiomas
      const questionsToInsert = languages.map((lang) => ({
        deep_talk_id: deepTalkId,
        language_code: lang,
        question: newQuestions[lang],
        icon: newIcon || null,
        sort_order: selectedSortOrder,
        is_active: newIsActive,
      }));

      const { error } = await (supabase
        .from('deep_talk_questions') as any)
        .insert(questionsToInsert);

      if (error) throw error;

      // 3. Recargar datos
      await fetchData();

      // Mostrar mensaje de éxito
      setShowCreateModal(false);
      setSuccessMessage(`Pregunta creada exitosamente en ${languages.length} idioma(s)`);
      setShowSuccessModal(true);

      // Limpiar estados
      setNewQuestions({});
      setNewIcon('');
      setNewIsActive(true);
      setOptionalLanguages([]);
    } catch (error) {
      console.error('Error al crear pregunta:', error);
      setToast({ message: 'Error al crear la pregunta. Intenta de nuevo.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#BDF522]/30 border-t-[#BDF522] rounded-full animate-spin"></div>
          <p className="text-[#999999]">Cargando temas profundos...</p>
        </div>
      </div>
    );
  }

  if (!deepTalk || !filter) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <p className="text-[#999999]">No se encontró la información</p>
      </div>
    );
  }

  const translation = deepTalk.deep_talk_translations.find((t) => t.language_code === 'es') || deepTalk.deep_talk_translations[0];
  const filterTranslation = filter.deep_talk_categories_translations.find((t) => t.language_code === 'es');
  const gradientColors = deepTalk.gradient_colors || ['#8B5CF6', '#6366F1'];
  const DeepTalkIcon = getIonIcon(deepTalk.icon);

  // Get available languages
  const availableLanguages = Array.from(
    new Set(deepTalk.deep_talk_questions.map((q) => q.language_code))
  ).sort();

  // Filter questions
  let filteredQuestions = deepTalk.deep_talk_questions.filter(
    (q) => q.language_code === selectedLanguage
  );

  // Filtrar por estado
  if (questionFilterStatus === 'active') {
    filteredQuestions = filteredQuestions.filter((q) => q.is_active);
  } else if (questionFilterStatus === 'inactive') {
    filteredQuestions = filteredQuestions.filter((q) => !q.is_active);
  }

  // Filtrar por término de búsqueda
  if (searchTerm.trim() !== '') {
    const searchLower = searchTerm.toLowerCase();
    filteredQuestions = filteredQuestions.filter((q) =>
      q.question.toLowerCase().includes(searchLower)
    );
  }

  // Sort by sort_order
  filteredQuestions.sort((a, b) => a.sort_order - b.sort_order);

  // Calculate stats
  const totalQuestions = deepTalk.deep_talk_questions.filter((q) => q.language_code === selectedLanguage).length;
  const activeQuestions = deepTalk.deep_talk_questions.filter((q) => q.language_code === selectedLanguage && q.is_active).length;
  const inactiveQuestions = totalQuestions - activeQuestions;

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
              <Link
                href={`/deep-talks/categories/${categoryId}/deep-talks`}
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
              <div className="h-10 w-px bg-[#333333]"></div>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
                  }}
                >
                  {DeepTalkIcon ? (
                    <DeepTalkIcon className="w-6 h-6 text-white" />
                  ) : (
                    <span className="text-2xl">{deepTalk.icon || '💬'}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">{translation.title}</h1>
                  <p className="text-xs text-[#999999] font-medium">Temas Profundos</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenCreateModal}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-[#BDF522] hover:bg-[#BDF522]/90 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#BDF522]/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span className="hidden sm:inline">Nueva Pregunta</span>
                <span className="sm:hidden">Nueva</span>
              </button>
              <Link
                href={`/deep-talks/categories/${categoryId}/deep-talks/${deepTalkId}`}
                className="px-4 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] hover:border-[#BDF522]/30 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="hidden sm:inline">Editar Categoría</span>
                <span className="sm:hidden">Editar</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Category Info Card */}
        <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 mb-8 shadow-lg shadow-black/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-3 py-1 text-sm rounded-lg font-medium border"
                  style={{
                    backgroundColor: filter.color ? `${filter.color}20` : '#BDF52220',
                    borderColor: filter.color ? `${filter.color}50` : '#BDF52250',
                    color: filter.color || '#BDF522',
                  }}
                >
                  {filterTranslation?.name || filter.label}
                </span>
                {deepTalk.estimated_time && (
                  <span className="text-sm text-[#999999]">
                    ⏱️ {deepTalk.estimated_time}
                  </span>
                )}
                {translation.intensity && (
                  <span className="text-sm">
                    {translation.intensity === 'LOW' && '🟢 Baja'}
                    {translation.intensity === 'MEDIUM' && '🟡 Media'}
                    {translation.intensity === 'HIGH' && '🔴 Alta'}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{translation.title}</h2>
              {translation.subtitle && (
                <p className="text-[#CCCCCC] mb-3">{translation.subtitle}</p>
              )}
              {translation.description && (
                <p className="text-sm text-[#999999]">{translation.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#BDF522] mb-2">{totalQuestions}</div>
            <div className="text-sm text-[#999999]">Total Preguntas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#BDF522] mb-2">{activeQuestions}</div>
            <div className="text-sm text-[#999999]">Activas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#999999] mb-2">{inactiveQuestions}</div>
            <div className="text-sm text-[#999999]">Inactivas</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 mb-8 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-4">
            {/* Language Selector */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-2">
                Seleccionar Idioma
              </label>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedLanguage === lang
                        ? 'bg-[#BDF522] text-black shadow-lg shadow-[#BDF522]/20'
                        : 'bg-[#1A1A1A] text-white border border-[#333333] hover:border-[#BDF522]/50'
                    }`}
                  >
                    <span className="text-lg">{LANGUAGE_FLAGS[lang] || '🌐'}</span>
                    <span>{LANGUAGE_NAMES[lang] || lang.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Questions Header with Filters - Always visible */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            Preguntas ({filteredQuestions.length})
          </h3>

          <div className="flex items-center gap-4">
            {/* Active Filter Toggle */}
            <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#333333] rounded-lg p-1">
              <button
                type="button"
                onClick={() => setQuestionFilterStatus('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  questionFilterStatus === 'all'
                    ? 'bg-[#BDF522] text-black shadow-md'
                    : 'text-[#999999] hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setQuestionFilterStatus('active')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  questionFilterStatus === 'active'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'text-[#999999] hover:text-white'
                }`}
              >
                Activas
              </button>
              <button
                type="button"
                onClick={() => setQuestionFilterStatus('inactive')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  questionFilterStatus === 'inactive'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-[#999999] hover:text-white'
                }`}
              >
                Inactivas
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar pregunta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white placeholder:text-[#999999] focus:outline-none focus:border-[#BDF522]/50 transition-all duration-200"
              />
              <svg
                className="w-5 h-5 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2"
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
          </div>
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              No hay preguntas{questionFilterStatus === 'active' ? ' activas' : questionFilterStatus === 'inactive' ? ' inactivas' : ''} para este idioma
            </h3>
            <p className="text-[#CCCCCC] max-w-md mx-auto leading-relaxed">
              {questionFilterStatus !== 'all'
                ? 'Intenta cambiar el filtro para ver más preguntas'
                : 'Edita la categoría para agregar preguntas'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredQuestions.map((question, index) => {
                const QuestionIcon = getIonIcon(question.icon);

                return (
                  <div
                    key={question.id}
                    className={`bg-[#2A2A2A] border border-[#333333] rounded-xl p-5 hover:border-[#BDF522]/50 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 group ${
                      !question.is_active ? 'opacity-50 blur-[0.5px] grayscale' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Question Number */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
                        }}
                      >
                        {QuestionIcon ? (
                          <QuestionIcon className="w-6 h-6 text-white" />
                        ) : (
                          <span className="text-white font-bold text-lg">{index + 1}</span>
                        )}
                      </div>

                      {/* Question Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-base text-white font-medium leading-relaxed">
                            {question.question}
                          </p>
                          {!question.is_active && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-lg border border-gray-500/30 whitespace-nowrap">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#999999] mb-3">
                          <span>Orden: {question.sort_order}</span>
                          {question.icon && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                />
                              </svg>
                              Icono: {question.icon}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-[#333333]/50">
                          <button
                            onClick={() => handleEditClick(question.sort_order)}
                            disabled={isProcessing}
                            className="flex-1 px-3 py-2 bg-[#BDF522]/10 hover:bg-[#BDF522]/20 border border-[#BDF522]/30 text-[#BDF522] rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Editar
                          </button>

                          <button
                            onClick={() => handleToggleActive(question.sort_order)}
                            disabled={isProcessing}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                              question.is_active
                                ? 'bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-500'
                                : 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-500'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {question.is_active ? (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                              ) : (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              )}
                            </svg>
                            {question.is_active ? 'Desactivar' : 'Activar'}
                          </button>

                          <button
                            onClick={() => handleDeleteClick(question.sort_order)}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </main>

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-8">
            {/* Header */}
            <div className="sticky top-0 bg-[#2A2A2A] border-b border-[#333333] p-6 z-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">Editar Pregunta</h2>
                  <p className="text-sm text-[#999999] mt-1">
                    Modifica la pregunta en todos los idiomas disponibles
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Botón de Traducir */}
                  {editingQuestions['es']?.question?.trim() && Object.keys(editingQuestions).length > 1 && (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAutoTranslate}
                      isLoading={isTranslating}
                      disabled={isProcessing || isTranslating}
                      className="whitespace-nowrap"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      {isTranslating ? 'Traduciendo...' : 'Traducir'}
                    </Button>
                  )}
                  {/* Botón de Cerrar */}
                  <button
                    onClick={() => setShowEditModal(false)}
                    disabled={isProcessing}
                    className="w-10 h-10 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Icon */}
              <EmojiOrIconPicker
                label="Emoji o Icono (opcional)"
                value={editingIcon}
                onChange={setEditingIcon}
                helperText="Emoji o icono que aparecerá en la pregunta"
              />

              {/* Active Status */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Estado</label>
                <div className="h-12 flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingIsActive}
                      onChange={(e) => setEditingIsActive(e.target.checked)}
                      className="w-5 h-5 rounded border-[#333333] text-[#BDF522] focus:ring-2 focus:ring-[#BDF522]/50 bg-[#1A1A1A]"
                    />
                    <span className="text-sm text-white font-medium">
                      {editingIsActive ? 'Pregunta Activa' : 'Pregunta Inactiva'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Translations */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Traducciones</h3>

                {/* Idiomas disponibles para agregar */}
                {availableLanguagesToAdd.length > 0 && (
                  <div className="bg-[#BDF522]/5 border border-[#BDF522]/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-white mb-3">
                      Agregar traducción en otro idioma (opcional):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableLanguagesToAdd.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleAddLanguage(lang)}
                          disabled={isProcessing}
                          className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#BDF522]/10 border border-[#333333] hover:border-[#BDF522]/50 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-lg">{LANGUAGE_FLAGS[lang] || '🌐'}</span>
                          <span className="text-white">{LANGUAGE_NAMES[lang] || lang.toUpperCase()}</span>
                          <svg className="w-4 h-4 text-[#BDF522]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de traducciones */}
                {Object.keys(editingQuestions).sort().map((lang) => {
                  const isNewLanguage = !editingQuestions[lang]?.id;

                  return (
                    <div key={lang} className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{LANGUAGE_FLAGS[lang] || '🌐'}</span>
                          <span className="text-sm font-bold text-white">
                            {LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                          </span>
                          {isNewLanguage && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-bold rounded border border-green-500/30">
                              NUEVO
                            </span>
                          )}
                        </div>
                        {isNewLanguage && (
                          <button
                            onClick={() => handleRemoveLanguage(lang)}
                            disabled={isProcessing}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar idioma"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <Input
                        label="Pregunta"
                        placeholder={`Ingresa la pregunta en ${LANGUAGE_NAMES[lang] || lang}`}
                        value={editingQuestions[lang]?.question || ''}
                        onChange={(e) =>
                          setEditingQuestions({
                            ...editingQuestions,
                            [lang]: {
                              ...editingQuestions[lang],
                              question: e.target.value,
                            },
                          })
                        }
                        required
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#2A2A2A] border-t border-[#333333] p-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowEditModal(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveQuestion} isLoading={isProcessing}>
                {isProcessing ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-8">
            {/* Header */}
            <div className="sticky top-0 bg-[#2A2A2A] border-b border-[#333333] p-6 z-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">Crear Nueva Pregunta</h2>
                  <p className="text-sm text-[#999999] mt-1">
                    Agrega una nueva pregunta en uno o más idiomas
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Botón de Traducir */}
                  {Object.keys(newQuestions).length > 0 && newQuestions['es']?.trim() && (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAutoTranslateNew}
                      isLoading={isTranslatingNew}
                      disabled={isProcessing || isTranslatingNew}
                      className="whitespace-nowrap"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      {isTranslatingNew ? 'Traduciendo...' : 'Traducir'}
                    </Button>
                  )}
                  {/* Botón de Cerrar */}
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={isProcessing}
                    className="w-10 h-10 rounded-xl bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Sort Order and Active Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Orden</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedSortOrder}
                    onChange={(e) => setSelectedSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full h-12 px-4 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#BDF522]/50 focus:border-[#BDF522]"
                  />
                  <p className="text-xs text-[#999999] mt-1">
                    Total de preguntas: {Array.from(new Set(deepTalk.deep_talk_questions.map(q => q.sort_order))).length}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Estado</label>
                  <div className="h-12 flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newIsActive}
                        onChange={(e) => setNewIsActive(e.target.checked)}
                        className="w-5 h-5 rounded border-[#333333] text-[#BDF522] focus:ring-2 focus:ring-[#BDF522]/50 bg-[#1A1A1A]"
                      />
                      <span className="text-sm text-white font-medium">
                        {newIsActive ? 'Pregunta Activa' : 'Pregunta Inactiva'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Icon */}
              <EmojiOrIconPicker
                label="Emoji o Icono (opcional)"
                value={newIcon}
                onChange={setNewIcon}
                helperText="Emoji o icono que aparecerá en la pregunta"
              />

              {/* Translations */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Traducciones</h3>

                {/* Idiomas opcionales para agregar */}
                {optionalLanguages.length > 0 && (
                  <div className="bg-[#BDF522]/5 border border-[#BDF522]/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-white mb-3">
                      Agregar traducción en otro idioma (opcional):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {optionalLanguages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleAddOptionalLanguage(lang)}
                          disabled={isProcessing}
                          className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#BDF522]/10 border border-[#333333] hover:border-[#BDF522]/50 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-lg">{LANGUAGE_FLAGS[lang] || '🌐'}</span>
                          <span className="text-white">{LANGUAGE_NAMES[lang] || lang.toUpperCase()}</span>
                          <svg className="w-4 h-4 text-[#BDF522]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de traducciones */}
                {Object.keys(newQuestions).sort().map((lang) => (
                  <div key={lang} className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{LANGUAGE_FLAGS[lang] || '🌐'}</span>
                        <span className="text-sm font-bold text-white">
                          {LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                        </span>
                        {lang === 'es' && (
                          <span className="px-2 py-0.5 bg-[#BDF522]/20 text-[#BDF522] text-xs font-bold rounded border border-[#BDF522]/30">
                            REQUERIDO
                          </span>
                        )}
                      </div>
                      {lang !== 'es' && (
                        <button
                          onClick={() => handleRemoveOptionalLanguage(lang)}
                          disabled={isProcessing}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Eliminar idioma"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <Input
                      label="Pregunta"
                      placeholder={`Ingresa la pregunta en ${LANGUAGE_NAMES[lang] || lang}`}
                      value={newQuestions[lang] || ''}
                      onChange={(e) =>
                        setNewQuestions({
                          ...newQuestions,
                          [lang]: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                ))}

                {Object.keys(newQuestions).length === 0 && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-orange-600 font-medium">
                      No hay idiomas seleccionados. Agrega al menos un idioma para crear la pregunta.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#2A2A2A] border-t border-[#333333] p-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleCreateQuestion} isLoading={isProcessing}>
                {isProcessing ? 'Creando...' : 'Crear Pregunta'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSortOrder(0);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar pregunta"
        message="¿Estás seguro de que deseas eliminar esta pregunta? Esta acción eliminará la pregunta en todos los idiomas y no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isProcessing}
      />

      {/* Modal de Éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Operación exitos!"
        message={successMessage}
      />

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      </div>
    </div>
  );
}
