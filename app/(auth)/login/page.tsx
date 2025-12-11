'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          console.error('Sign up error:', error);
          setError(error.message || 'Error al crear cuenta');
        } else {
          alert('Cuenta creada exitosamente. Ya puedes iniciar sesión.');
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        console.log('Attempting sign in...');
        const { error } = await signIn(email, password);
        console.log('Sign in result:', { error });

        if (error) {
          console.error('Sign in error:', error);
          setError(error.message || 'Credenciales incorrectas');
        } else {
          console.log('Sign in successful, redirecting...');
          // Esperar un momento para que el estado se actualice
          await new Promise((resolve) => setTimeout(resolve, 500));
          router.push('/');
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error('Exception:', err);
      setError(err.message || 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center relative overflow-hidden p-4">
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

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#2A2A2A]/80 backdrop-blur-sm border border-[#333333] rounded-2xl p-8 shadow-2xl shadow-black/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-40 h-40 mx-auto mb-6 flex items-center justify-center">
              <Image
                src="/logos/ChallengeMe-05.png"
                alt="ChallengeMe"
                width={160}
                height={160}
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {isSignUp ? 'Crear Cuenta' : 'Bienvenido de vuelta'}
            </h1>
            <p className="text-sm text-[#999999] font-medium">
              {isSignUp
                ? 'Crea tu cuenta de administrador'
                : 'Inicia sesión en el CMS de ChallengeMe'}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@challengeme.com"
              required
              autoComplete="email"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              helperText={isSignUp ? 'Mínimo 6 caracteres' : undefined}
            />

            {isSignUp && (
              <Input
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-500 font-medium flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full">
              {isLoading
                ? isSignUp
                  ? 'Creando cuenta...'
                  : 'Iniciando sesión...'
                : isSignUp
                ? 'Crear cuenta'
                : 'Iniciar sesión'}
            </Button>
          </form>

          {/* Toggle entre login y signup */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setConfirmPassword('');
              }}
              className="text-sm text-[#999999] hover:text-[#BDF522] transition-colors"
            >
              {isSignUp ? (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <span className="font-semibold">Inicia sesión</span>
                </>
              ) : (
                <>
                  ¿No tienes cuenta?{' '}
                  <span className="font-semibold">Crear una</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-[#666666]">
          ChallengeMe CMS © 2025. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
