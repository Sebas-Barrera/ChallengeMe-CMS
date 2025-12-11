'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import SuccessModal from '@/components/ui/SuccessModal';

interface Challenge {
  id: string;
  challenge_category_id: string;
  icon: string | null;
  is_active: boolean;
  is_premium: boolean;
  translations: {
    [key: string]: {
      content: string;
    };
  };
}

interface Category {
  id: string;
  icon: string;
  gradient_colors: string[];
  translations: {
    [key: string]: {
      title: string;
    };
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CategoryChallengesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const categoryId = resolvedParams.id;
  const { supabase } = useAuth();

  const [category, setCategory] = useState<Category | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'free'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchCategoryAndChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchCategoryAndChallenges = async () => {
    try {
      setIsLoading(true);

      // 1. Obtener información de la categoría
      const { data: categoryData, error: categoryError } = await supabase
        .from('challenge_categories')
        .select(`
          id,
          icon,
          gradient_colors,
          challenge_category_translations (
            language_code,
            title
          )
        `)
        .eq('id', categoryId)
        .single();

      if (categoryError) {
        console.error('Error fetching category:', categoryError);
        return;
      }

      // Transformar datos de categoría
      const categoryTranslations: Record<string, { title: string }> = {};
      categoryData.challenge_category_translations.forEach((trans: any) => {
        categoryTranslations[trans.language_code] = {
          title: trans.title,
        };
      });

      setCategory({
        id: categoryData.id,
        icon: categoryData.icon || 'party-popper',
        gradient_colors: categoryData.gradient_colors || ['#FF6B6B', '#FF8E53'],
        translations: categoryTranslations,
      });

      // 2. Obtener retos de esta categoría, ordenados por ID para mantener consistencia
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select(`
          id,
          challenge_category_id,
          icon,
          is_active,
          is_premium,
          challenge_translations (
            language_code,
            content
          )
        `)
        .eq('challenge_category_id', categoryId)
        .order('id', { ascending: true });

      if (challengesError) {
        console.error('Error fetching challenges:', challengesError);
        return;
      }

      // Transformar datos de retos
      const formattedChallenges: Challenge[] = (challengesData || []).map((challenge: any) => {
        const translations: Record<string, { content: string }> = {};

        challenge.challenge_translations.forEach((trans: any) => {
          translations[trans.language_code] = {
            content: trans.content,
          };
        });

        return {
          id: challenge.id,
          challenge_category_id: challenge.challenge_category_id,
          icon: challenge.icon,
          is_active: challenge.is_active,
          is_premium: challenge.is_premium,
          translations,
        };
      });

      setChallenges(formattedChallenges);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (challenge: Challenge) => {
    setChallengeToDelete(challenge);
  };

  const handleConfirmDelete = async () => {
    if (!challengeToDelete) return;

    try {
      setDeletingId(challengeToDelete.id);

      // Usar Server Action para eliminar el reto
      const { deleteChallenge } = await import('@/actions/challenges');
      const result = await deleteChallenge(challengeToDelete.id);

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar el reto');
      }

      // Actualizar la lista local
      setChallenges((prev) => prev.filter((c) => c.id !== challengeToDelete.id));

      // Cerrar modal de confirmación
      setChallengeToDelete(null);

      // Mostrar modal de éxito
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error al eliminar reto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Intenta de nuevo';
      alert('Error al eliminar el reto: ' + errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setChallengeToDelete(null);
  };

  // Filtrar y paginar retos
  const filteredChallenges = challenges.filter((challenge) => {
    // Filtro de búsqueda
    const content = challenge.translations.es?.content ||
                   challenge.translations[Object.keys(challenge.translations)[0]]?.content || '';
    const matchesSearch = content.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtro de estado
    const matchesStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? challenge.is_active :
      !challenge.is_active;

    // Filtro de tipo
    const matchesType =
      filterType === 'all' ? true :
      filterType === 'premium' ? challenge.is_premium :
      !challenge.is_premium;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Paginación
  const totalPages = Math.ceil(filteredChallenges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedChallenges = filteredChallenges.slice(startIndex, endIndex);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterType]);

  if (isLoading || !category) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#BDF522]/30 border-t-[#BDF522] rounded-full animate-spin"></div>
          <p className="text-[#999999]">Cargando retos...</p>
        </div>
      </div>
    );
  }

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
                    {category.translations.es?.title || 'Categoría'}
                  </h1>
                  <p className="text-xs text-[#999999] font-medium">
                    {challenges.length} {challenges.length === 1 ? 'reto' : 'retos'} en total
                  </p>
                </div>
              </div>
            </div>
            <Link href={`/challenges/categories/${categoryId}/challenges/new`}>
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
                <span className="hidden sm:inline">Nuevo Reto</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-10">
          <p className="text-lg text-[#999999] mb-2 font-medium">
            Gestión de Retos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
            ¡Administra tus Retos!
          </h2>
          <p className="text-base text-[#CCCCCC]">
            Crea, edita y organiza los retos de esta categoría
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#BDF522] mb-2">{challenges.length}</div>
            <div className="text-sm text-[#999999]">Total de Retos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#BDF522] mb-2">
              {challenges.filter((c) => c.is_active).length}
            </div>
            <div className="text-sm text-[#999999]">Retos Activos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#7B46F8] mb-2">
              {challenges.filter((c) => c.is_premium).length}
            </div>
            <div className="text-sm text-[#999999]">Premium</div>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]"
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
                <input
                  type="text"
                  placeholder="Buscar retos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#BDF522]/50 focus:border-[#BDF522] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filtro de Estado */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterStatus === 'all'
                    ? 'bg-[#BDF522] text-black'
                    : 'bg-[#1A1A1A] border border-[#333333] text-[#999999] hover:border-[#BDF522]/50 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterStatus === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-[#1A1A1A] border border-[#333333] text-[#999999] hover:border-green-500/50 hover:text-white'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterStatus === 'inactive'
                    ? 'bg-[#666666] text-white'
                    : 'bg-[#1A1A1A] border border-[#333333] text-[#999999] hover:border-[#666666]/50 hover:text-white'
                }`}
              >
                Inactivos
              </button>
            </div>

            {/* Filtro de Tipo */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterType === 'all'
                    ? 'bg-[#BDF522] text-black'
                    : 'bg-[#1A1A1A] border border-[#333333] text-[#999999] hover:border-[#BDF522]/50 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('premium')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterType === 'premium'
                    ? 'bg-[#7B46F8] text-white'
                    : 'bg-[#1A1A1A] border border-[#333333] text-[#999999] hover:border-[#7B46F8]/50 hover:text-white'
                }`}
              >
                Premium
              </button>
              <button
                onClick={() => setFilterType('free')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterType === 'free'
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1A1A1A] border border-[#333333] text-[#999999] hover:border-blue-500/50 hover:text-white'
                }`}
              >
                Gratis
              </button>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-[#999999]">
              Mostrando <span className="font-semibold text-white">{paginatedChallenges.length}</span> de{' '}
              <span className="font-semibold text-white">{filteredChallenges.length}</span> retos
              {searchQuery && ` (filtrados de ${challenges.length} totales)`}
            </p>
            {(searchQuery || filterStatus !== 'all' || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterType('all');
                }}
                className="text-[#BDF522] hover:text-[#BDF522]/80 font-medium transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Challenges List */}
        {filteredChallenges.length > 0 ? (
          <div>
            <div className="space-y-3">
              {paginatedChallenges.map((challenge, index) => (
                <div
                  key={challenge.id}
                  className="group bg-[#2A2A2A] border border-[#333333] rounded-xl p-4 shadow-lg shadow-black/20 hover:border-[#BDF522]/30 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    {/* Número */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#BDF522]/20 to-[#BDF522]/5 border border-[#BDF522]/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#BDF522]">
                        {startIndex + index + 1}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm text-white font-medium leading-relaxed">
                          {challenge.translations.es?.content || challenge.translations[Object.keys(challenge.translations)[0]]?.content || 'Sin contenido'}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {challenge.is_premium && (
                            <span className="px-2 py-0.5 bg-[#7B46F8]/10 border border-[#7B46F8]/30 text-[#7B46F8] rounded-md text-xs font-bold">
                              PRO
                            </span>
                          )}
                          {challenge.is_active ? (
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-[#666666]"></span>
                          )}
                        </div>
                      </div>

                      {/* Actions and Languages */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-[#999999]">
                          {Object.keys(challenge.translations).map((lang) => (
                            <span key={lang} className="font-medium">
                              {lang.toUpperCase()}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/challenges/categories/${categoryId}/challenges/${challenge.id}`}
                            className="p-2 bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] hover:border-[#BDF522]/30 text-white rounded-lg text-sm font-medium transition-all"
                            title="Editar"
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
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(challenge)}
                            disabled={deletingId !== null}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-500 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar"
                          >
                            {deletingId === challenge.id ? (
                              <svg
                                className="w-4 h-4 animate-spin"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            ) : (
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
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#2A2A2A] border border-[#333333] text-white rounded-xl text-sm font-medium transition-all hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20"
                >
                  Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Mostrar solo páginas cercanas a la actual
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-all shadow-lg shadow-black/20 ${
                            currentPage === page
                              ? 'bg-[#BDF522] text-black'
                              : 'bg-[#2A2A2A] border border-[#333333] text-white hover:bg-[#333333]'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-[#666666]">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#2A2A2A] border border-[#333333] text-white rounded-xl text-sm font-medium transition-all hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        ) : searchQuery || filterStatus !== 'all' || filterType !== 'all' ? (
          /* No results from filters */
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-12 text-center shadow-lg shadow-black/20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#666666]/20 to-[#666666]/5 border border-[#666666]/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[#999999]"
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
              No se encontraron retos
            </h3>
            <p className="text-[#CCCCCC] mb-8 max-w-md mx-auto leading-relaxed">
              No hay retos que coincidan con los filtros seleccionados. Intenta ajustar tu búsqueda o limpiar los filtros.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterType('all');
              }}
              className="px-6 py-3 bg-[#BDF522] hover:bg-[#BDF522]/90 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#BDF522]/20 hover:shadow-[#BDF522]/30"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          /* Empty state */
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              No hay retos aún
            </h3>
            <p className="text-[#CCCCCC] mb-8 max-w-md mx-auto leading-relaxed">
              Crea el primer reto para esta categoría y comienza a desafiar a tus usuarios
            </p>
            <Link href={`/challenges/categories/${categoryId}/challenges/new`}>
              <button className="px-6 py-3 bg-[#BDF522] hover:bg-[#BDF522]/90 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg shadow-[#BDF522]/20 hover:shadow-[#BDF522]/30">
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
                Crear Primer Reto
              </button>
            </Link>
          </div>
        )}
      </main>
      </div>

      {/* Modal de confirmación de eliminación */}
      {challengeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] border-2 border-red-500 rounded-2xl max-w-md w-full shadow-2xl shadow-red-500/30">
            {/* Header */}
            <div className="p-6 border-b border-red-500/30">
              <div className="flex items-center gap-3">
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
                  <h3 className="text-xl font-bold text-red-500">¿Eliminar reto?</h3>
                  <p className="text-sm text-red-500/80">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-white mb-4">
                Estás a punto de eliminar el siguiente reto:
              </p>
              <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-4">
                <p className="text-white font-medium leading-relaxed">
                  {challengeToDelete.translations.es?.content ||
                   challengeToDelete.translations[Object.keys(challengeToDelete.translations)[0]]?.content ||
                   'Reto sin contenido'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-red-500/30 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={deletingId !== null}
                className="px-4 py-3 bg-[#1A1A1A] hover:bg-[#333333] border border-[#333333] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/30"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
                className="px-4 py-3 bg-red-500 hover:bg-red-500/80 text-white rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 border-2 border-red-500"
              >
                {deletingId === challengeToDelete.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Eliminando...
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
                    Sí, eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Reto eliminado exitosamente"
      />
    </div>
  );
}
