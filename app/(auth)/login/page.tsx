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
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden p-4">
      {/* Formas decorativas de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Personaje decorativo */}
      <div className="absolute top-10 right-10 opacity-5 pointer-events-none hidden xl:block">
        <Image
          src="/character/ChallengeMe-16.png"
          alt=""
          width={300}
          height={300}
          className="object-contain"
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl shadow-black/20">
          {/* Logo y header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/30 flex items-center justify-center">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {isSignUp ? 'Crear Cuenta' : 'Bienvenido de vuelta'}
            </h1>
            <p className="text-sm text-text-secondary">
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
              <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-sm text-error">
                {error}
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
              className="text-sm text-text-secondary hover:text-brand-yellow transition-colors"
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
        <p className="text-center mt-6 text-xs text-text-tertiary">
          ChallengeMe CMS © 2024. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
