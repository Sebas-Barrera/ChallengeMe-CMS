'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Translation {
  language_code: string;
  title: string;
  description: string;
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
  challenge_count: number;
  created_at?: string;
  translations: Record<string, Translation>;
}

type FilterStatus = 'all' | 'active' | 'inactive';

export default function CategoriesPage() {
  const { supabase } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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

      // Eliminar traducciones primero
      const { error: translationsError } = await supabase
        .from('challenge_category_translations')
        .delete()
        .eq('challenge_category_id', categoryToDelete.id);

      if (translationsError) {
        console.error('Error deleting translations:', translationsError);
        alert('Error al eliminar las traducciones de la categoría');
        return;
      }

      // Eliminar la categoría
      const { error: categoryError } = await supabase
        .from('challenge_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (categoryError) {
        console.error('Error deleting category:', categoryError);
        alert('Error al eliminar la categoría');
        return;
      }

      // Actualizar la lista de categorías
      setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la categoría');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);

      // Obtener categorías con sus traducciones
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
          challenge_category_translations (
            language_code,
            title,
            description
          )
        `);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      // Transformar los datos al formato esperado
      const formattedCategories: Category[] = (categoriesData || []).map((cat: any) => {
        const translations: Record<string, Translation> = {};

        cat.challenge_category_translations.forEach((trans: any) => {
          translations[trans.language_code] = {
            language_code: trans.language_code,
            title: trans.title,
            description: trans.description || '',
          };
        });

        return {
          id: cat.id,
          icon: cat.icon || 'flash',
          text_color: cat.text_color,
          gradient_colors: cat.gradient_colors,
          is_active: cat.is_active,
          is_premium: cat.is_premium,
          min_players: cat.min_players,
          max_players: cat.max_players,
          challenge_count: 0, // TODO: contar retos cuando se implementen
          translations,
        };
      });

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Formas decorativas de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Personaje decorativo */}
      <div className="absolute top-20 right-10 opacity-5 pointer-events-none hidden xl:block">
        <Image
          src="/character/ChallengeMe-16.png"
          alt=""
          width={300}
          height={300}
          className="object-contain"
        />
      </div>

      <div className="relative z-10">
        {/* Header mejorado */}
        <header className="bg-bg-secondary/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                  <Image
                    src="/logos/ChallengeMe-05.png"
                    alt="ChallengeMe"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </Link>
                <div className="h-10 w-px bg-border"></div>
                <div className="flex items-center gap-3">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-text-primary">
                      Categorías de Retos
                    </h1>
                    <p className="text-xs text-text-secondary">
                      Gestiona las categorías de desafíos
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/challenges/categories/new">
                <button className="px-5 py-2.5 bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-brand-yellow/20 hover:shadow-brand-yellow/30 hover:scale-105">
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
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="flex-1">
                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
                  ¡Administra tus Categorías!
                </h2>
                <p className="text-text-secondary text-lg">
                  Crea, edita y organiza las categorías de retos para tu app
                </p>
              </div>
            </div>
          </div>

          {/* Stats mejoradas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10 hover:border-brand-yellow/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary mb-1">{categories.length}</p>
              <p className="text-sm text-text-secondary">Total de Categorías</p>
            </div>

            <div className="group bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10 hover:border-success/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-6 h-6 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-success mb-1">
                {categories.filter((c) => c.is_active).length}
              </p>
              <p className="text-sm text-text-secondary">Activas</p>
            </div>

            <div className="group bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10 hover:border-brand-purple/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple/20 to-brand-purple/5 border border-brand-purple/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-brand-purple mb-1">
                {categories.filter((c) => c.is_premium).length}
              </p>
              <p className="text-sm text-text-secondary">Premium</p>
            </div>

            <div className="group bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-black/10 hover:border-brand-blue/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 border border-brand-blue/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-6 h-6 text-brand-blue"
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
              </div>
              <p className="text-3xl font-bold text-brand-blue mb-1">
                {categories.reduce((sum, cat) => sum + cat.challenge_count, 0)}
              </p>
              <p className="text-sm text-text-secondary">Retos Totales</p>
            </div>
          </div>

          {/* Lista de categorías mejorada */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-brand-yellow/30 border-t-brand-yellow rounded-full animate-spin"></div>
                <p className="text-text-secondary">Cargando categorías...</p>
              </div>
            </div>
          ) : categories.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary">
                  Todas las Categorías
                </h3>
                <div className="flex items-center gap-2 relative">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="px-3 py-2 bg-bg-tertiary hover:bg-border border border-border text-text-secondary rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
                      <div className="absolute right-0 top-12 z-20 bg-bg-secondary border border-border rounded-xl shadow-2xl shadow-black/50 p-4 min-w-[280px]">
                        {/* Estado */}
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-2">
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
                                  ? 'bg-brand-yellow/20 border-2 border-brand-yellow text-brand-yellow'
                                  : 'bg-bg-tertiary hover:bg-border text-text-primary'
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
                                  ? 'bg-success/20 border-2 border-success text-success'
                                  : 'bg-bg-tertiary hover:bg-border text-text-primary'
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
                                  ? 'bg-error/20 border-2 border-error text-error'
                                  : 'bg-bg-tertiary hover:bg-border text-text-primary'
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
                    className="group bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/10 hover:border-brand-yellow/50 transition-all duration-300 hover:shadow-brand-yellow/10"
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
                      <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-brand-yellow transition-colors">
                        {category.translations.es.title}
                      </h3>
                      <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                        {category.translations.es.description}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center flex-wrap gap-3 mb-4 text-xs">
                        <div className="flex items-center gap-1.5 text-text-tertiary">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{category.min_players}-{category.max_players} jugadores</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-text-tertiary">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>{category.challenge_count} retos</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          {Object.keys(category.translations).map((lang) => (
                            <span
                              key={lang}
                              className="text-xs font-medium text-text-secondary"
                            >
                              {lang.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/challenges/categories/${category.id}`}
                          className="flex-1 px-4 py-2.5 bg-bg-tertiary hover:bg-border border border-border text-text-primary rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                        >
                          <svg
                            className="w-4 h-4 group-hover/btn:text-brand-yellow transition-colors"
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
                          className="flex-1 px-4 py-2.5 bg-brand-yellow/10 hover:bg-brand-yellow/20 border border-brand-yellow/30 text-brand-yellow rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
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
                          className="px-4 py-2.5 bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
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
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Image
                  src="/character/ChallengeMe-20.png"
                  alt=""
                  width={400}
                  height={400}
                  className="object-contain"
                />
              </div>
              <div className="relative bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-12 text-center shadow-lg shadow-black/10">
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
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-3">
                  No hay categorías aún
                </h3>
                <p className="text-text-secondary mb-8 max-w-md mx-auto">
                  Crea tu primera categoría de retos para comenzar a organizar los desafíos de tu app
                </p>
                <Link href="/challenges/categories/new">
                  <button className="px-6 py-3 bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg shadow-brand-yellow/20 hover:scale-105">
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
          <div className="relative z-10 bg-bg-secondary border-2 border-error rounded-2xl shadow-2xl shadow-error/30 p-6 max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-error/30">
              <div className="w-12 h-12 rounded-xl bg-error/30 border-2 border-error flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-error"
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
                <h3 className="text-xl font-bold text-error">
                  ¡CONFIRMAR ELIMINACIÓN!
                </h3>
                <p className="text-sm text-error/80">Esta acción no se puede deshacer</p>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-text-primary mb-4 text-base">
                ¿Estás seguro que quieres eliminar la categoría{' '}
                <span className="font-bold text-error">
                  &ldquo;{categoryToDelete.translations.es?.title || 'Sin título'}&rdquo;
                </span>
                ?
              </p>
              <div className="bg-error/20 border-2 border-error rounded-lg p-4">
                <p className="text-sm text-error font-bold">
                  ⚠️ Esta acción eliminará la categoría y todas sus traducciones de forma permanente.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-bg-tertiary hover:bg-border border border-border text-text-primary rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-error hover:bg-error/80 text-white rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-error/30 hover:shadow-error/50 hover:scale-105 border-2 border-error"
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
    </div>
  );
}
