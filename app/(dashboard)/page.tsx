'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Formas decorativas de fondo */}
      <div className="absolute top-0 left-0 w-full pointer-events-none opacity-20">
        <Image
          src="/resources/top-shapes.png"
          alt=""
          width={1920}
          height={300}
          className="w-full h-auto"
          priority
        />
      </div>
      <div className="absolute bottom-0 left-0 w-full pointer-events-none opacity-20">
        <Image
          src="/resources/bottom-shapes.png"
          alt=""
          width={1920}
          height={300}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-bg-secondary/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo y título */}
              <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <Image
                    src="/logos/ChallengeMe-05.png"
                    alt="ChallengeMe"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-text-primary tracking-tight">
                    ChallengeMe
                  </h1>
                  <p className="text-xs text-text-secondary font-medium">
                    Content Management System
                  </p>
                </div>
              </Link>

              {/* User info y logout */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-text-primary">Admin</p>
                  <p className="text-xs text-text-secondary">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 bg-bg-tertiary hover:bg-border border border-border text-text-primary rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-black/20"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Bienvenida */}
          <div className="mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-text-primary mb-3 tracking-tight">
              ¡Bienvenido de vuelta!
            </h2>
            <p className="text-lg text-text-secondary">
              Gestiona todo el contenido de ChallengeMe desde aquí
            </p>
          </div>

          {/* Módulos Principales - Cards grandes y destacadas */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-text-primary mb-6">Módulos Principales</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Card Retos - Activa y clickeable */}
              <Link href="/challenges/categories">
                <div className="group bg-gradient-to-br from-brand-yellow/10 via-bg-secondary to-bg-secondary backdrop-blur-sm border-2 border-brand-yellow/30 rounded-2xl p-8 hover:border-brand-yellow hover:shadow-2xl hover:shadow-brand-yellow/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-yellow/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-yellow to-brand-yellow/80 flex items-center justify-center shadow-lg shadow-brand-yellow/30 group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-10 h-10 text-black"
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
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-brand-yellow text-black text-xs font-bold rounded-lg shadow-lg">
                          ACTIVO
                        </span>
                        <svg className="w-6 h-6 text-brand-yellow group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary mb-3 group-hover:text-brand-yellow transition-colors">
                      Retos (Challenges)
                    </h3>
                    <p className="text-text-secondary mb-6">
                      Gestiona categorías y retos para desafiar a tus usuarios. Crea, edita y organiza contenido multiidioma.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-yellow"></div>
                        <span className="text-text-tertiary">5 Categorías</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-yellow"></div>
                        <span className="text-text-tertiary">Multiidioma</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Card Deep Talks - Activa y clickeable */}
              <Link href="/deep-talks/categories">
                <div className="group bg-gradient-to-br from-brand-purple/10 via-bg-secondary to-bg-secondary backdrop-blur-sm border-2 border-brand-purple/30 rounded-2xl p-8 hover:border-brand-purple hover:shadow-2xl hover:shadow-brand-purple/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-purple/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-purple/80 flex items-center justify-center shadow-lg shadow-brand-purple/30 group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-brand-purple text-white text-xs font-bold rounded-lg shadow-lg">
                          ACTIVO
                        </span>
                        <svg className="w-6 h-6 text-brand-purple group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary mb-3 group-hover:text-brand-purple transition-colors">
                      Pláticas Profundas (Deep Talks)
                    </h3>
                    <p className="text-text-secondary mb-6">
                      Crea y gestiona categorías de conversaciones profundas con preguntas personalizadas para conectar con otros.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-purple"></div>
                        <span className="text-text-tertiary">Con preguntas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-purple"></div>
                        <span className="text-text-tertiary">Multiidioma</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Card Consejos del Día - Activa y clickeable */}
              <Link href="/daily-tips">
                <div className="group bg-gradient-to-br from-brand-blue/10 via-bg-secondary to-bg-secondary backdrop-blur-sm border-2 border-brand-blue/30 rounded-2xl p-8 hover:border-brand-blue hover:shadow-2xl hover:shadow-brand-blue/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-blue/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-blue/80 flex items-center justify-center shadow-lg shadow-brand-blue/30 group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-brand-blue text-white text-xs font-bold rounded-lg shadow-lg">
                          ACTIVO
                        </span>
                        <svg className="w-6 h-6 text-brand-blue group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary mb-3 group-hover:text-brand-blue transition-colors">
                      Consejos del Día
                    </h3>
                    <p className="text-text-secondary mb-6">
                      Crea y gestiona consejos motivacionales diarios para inspirar a tus usuarios cada día.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                        <span className="text-text-tertiary">Motivacional</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                        <span className="text-text-tertiary">Multiidioma</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Módulos en Desarrollo */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-text-primary mb-6">Próximamente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Drinking Games - En desarrollo */}
              <div className="group relative bg-bg-secondary/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 cursor-not-allowed overflow-hidden">
                {/* Tooltip */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="px-3 py-1.5 bg-brand-orange text-white text-xs font-bold rounded-lg shadow-lg whitespace-nowrap">
                    En desarrollo
                  </div>
                </div>

                <div className="relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 border border-brand-orange/30 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-brand-orange"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-text-primary mb-2">Juegos de Shot</h4>
                      <p className="text-sm text-text-secondary">
                        Juegos para animar tus fiestas con amigos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Próximamente</span>
                  </div>
                </div>
              </div>

              {/* Card Ideas para Citas - En desarrollo */}
              <div className="group relative bg-bg-secondary/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 cursor-not-allowed overflow-hidden">
                {/* Tooltip */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="px-3 py-1.5 bg-brand-pink text-white text-xs font-bold rounded-lg shadow-lg whitespace-nowrap">
                    En desarrollo
                  </div>
                </div>

                <div className="relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-pink/20 to-brand-pink/5 border border-brand-pink/30 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-brand-pink"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-text-primary mb-2">Ideas para Citas</h4>
                      <p className="text-sm text-text-secondary">
                        Sugerencias para citas románticas y divertidas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Próximamente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-lg shadow-black/10">
            <h3 className="text-xl font-bold text-text-primary mb-6">Estadísticas del Sistema</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-yellow mb-2">5</div>
                <div className="text-sm text-text-secondary">Categorías de Retos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-purple mb-2">2</div>
                <div className="text-sm text-text-secondary">Filtros Deep Talks</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-blue mb-2">5</div>
                <div className="text-sm text-text-secondary">Idiomas</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-success mb-2">100%</div>
                <div className="text-sm text-text-secondary">Sistema Activo</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
