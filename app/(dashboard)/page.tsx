'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function DashboardPage() {

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

      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-[#2A2A2A]/80 backdrop-blur-sm border-b border-[#333333] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
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
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    ChallengeMe
                  </h1>
                  <p className="text-xs text-[#999999] font-medium">
                    Content Management System
                  </p>
                </div>
              </Link>

              {/* Admin badge */}
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-[#BDF522]/10 border border-[#BDF522]/30 rounded-xl">
                  <p className="text-sm font-semibold text-[#BDF522]">CMS Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Bienvenida */}
          <div className="mb-10">
            <p className="text-lg text-[#999999] mb-2 font-medium">
              ¡Hola de nuevo!
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              ¿Cómo te gustaría divertirte hoy?
            </h2>
            <p className="text-base text-[#CCCCCC]">
              Gestiona todo el contenido de ChallengeMe desde aquí
            </p>
          </div>

          {/* Módulos Principales */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-white mb-5">Modos de Juego</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card Retos - Color amarillo-verde neón (#BDF522) */}
              <Link
                href="/challenges/categories"
                className="group bg-[#BDF522] rounded-2xl p-6 hover:shadow-2xl hover:shadow-[#BDF522]/20 transition-all duration-300 cursor-pointer relative overflow-hidden block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-black/10 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <svg className="w-5 h-5 text-black/60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">
                  Retos
                </h3>
                <p className="text-sm text-black/70 mb-4 leading-relaxed">
                  Gestiona categorías y retos para desafiar a tus usuarios
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-black/60">5 Categorías</span>
                  <div className="w-1 h-1 rounded-full bg-black/40"></div>
                  <span className="text-black/60">Multiidioma</span>
                </div>
              </Link>

              {/* Card Deep Talks - Color morado (#7B46F8) */}
              <Link
                href="/deep-talks/categories"
                className="group bg-[#7B46F8] rounded-2xl p-6 hover:shadow-2xl hover:shadow-[#7B46F8]/20 transition-all duration-300 cursor-pointer relative overflow-hidden block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <svg className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Pláticas Profundas
                </h3>
                <p className="text-sm text-white/70 mb-4 leading-relaxed">
                  Conversaciones profundas con preguntas personalizadas
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-white/60">Con preguntas</span>
                  <div className="w-1 h-1 rounded-full bg-white/40"></div>
                  <span className="text-white/60">Multiidioma</span>
                </div>
              </Link>

              {/* Card Consejos del Día - Color naranja (#FD8616) */}
              <Link
                href="/daily-tips"
                className="group bg-[#FD8616] rounded-2xl p-6 hover:shadow-2xl hover:shadow-[#FD8616]/20 transition-all duration-300 cursor-pointer relative overflow-hidden block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <svg className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Consejos del Día
                </h3>
                <p className="text-sm text-white/70 mb-4 leading-relaxed">
                  Consejos motivacionales diarios para inspirar a tus usuarios
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-white/60">Motivacional</span>
                  <div className="w-1 h-1 rounded-full bg-white/40"></div>
                  <span className="text-white/60">Multiidioma</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Módulos en Desarrollo */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-white mb-5">Próximamente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card Drinking Games - En desarrollo */}
              <div className="group relative bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 cursor-not-allowed overflow-hidden">
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 bg-[#FD8616]/20 text-[#FD8616] text-xs font-semibold rounded-lg border border-[#FD8616]/30">
                    Próximamente
                  </div>
                </div>

                <div className="relative z-10 opacity-50">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-[#FD8616]/10 border border-[#FD8616]/20 flex items-center justify-center">
                      <svg
                        className="w-7 h-7 text-[#FD8616]"
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
                      <h4 className="text-lg font-bold text-white mb-1.5">Juegos de Shot</h4>
                      <p className="text-sm text-[#CCCCCC] leading-relaxed">
                        Juegos para animar tus fiestas con amigos
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Ideas para Citas - En desarrollo */}
              <div className="group relative bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 cursor-not-allowed overflow-hidden">
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 bg-[#FF6B9D]/20 text-[#FF6B9D] text-xs font-semibold rounded-lg border border-[#FF6B9D]/30">
                    Próximamente
                  </div>
                </div>

                <div className="relative z-10 opacity-50">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-[#FF6B9D]/10 border border-[#FF6B9D]/20 flex items-center justify-center">
                      <svg
                        className="w-7 h-7 text-[#FF6B9D]"
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
                      <h4 className="text-lg font-bold text-white mb-1.5">Ideas para Citas</h4>
                      <p className="text-sm text-[#CCCCCC] leading-relaxed">
                        Sugerencias para citas románticas y divertidas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="bg-[#2A2A2A] border border-[#333333] rounded-2xl p-6 shadow-lg shadow-black/20">
            <h3 className="text-xl font-bold text-white mb-6">Resumen del Sistema</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#BDF522] mb-2">5</div>
                <div className="text-sm text-[#999999]">Categorías de Retos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#7B46F8] mb-2">2</div>
                <div className="text-sm text-[#999999]">Filtros Deep Talks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#FD8616] mb-2">5</div>
                <div className="text-sm text-[#999999]">Idiomas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#BDF522] mb-2">100%</div>
                <div className="text-sm text-[#999999]">Sistema Activo</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
