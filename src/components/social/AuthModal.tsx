'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSignIn, useSignUp } from '@/api/authApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const signIn = useSignIn();
  const signUp = useSignUp();

  // Reset lors de la fermeture
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setUsername('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      if (mode === 'signin') {
        await signIn.mutateAsync({ email, password });
      } else {
        if (username.length < 3) {
          setError('Le pseudo doit contenir au moins 3 caractères');
          return;
        }
        await signUp.mutateAsync({ email, password, username });
        setSuccess(true);
        setTimeout(onClose, 2000);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur d\'authentification');
    }
  };

  const isLoading = signIn.isPending || signUp.isPending;

  return (
    <div
      className="fixed inset-0 z-modal bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'signin' ? 'Connexion' : 'Inscription'}
    >
      <div
        className="metal-card max-w-md w-full p-8 animate-level-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🤘</div>
          <h2 className="font-metal text-3xl text-metal-rust">
            {mode === 'signin' ? 'Connexion' : 'Rejoindre la Horde'}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {mode === 'signin'
              ? 'Retournez dans les ténèbres'
              : 'Créez votre légende métallique'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Pseudo de métalleux"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="metal-input"
              required
              minLength={3}
              maxLength={30}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="metal-input"
            required
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Mot de passe (min. 6 caractères)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="metal-input"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />

          {error && (
            <div className="p-3 rounded-md bg-red-900/30 border border-red-800 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-md bg-green-900/30 border border-green-800 text-green-300 text-sm">
              ✅ Compte créé ! Vérifiez votre email pour confirmer.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="metal-button w-full py-3"
          >
            {isLoading
              ? '⏳ Invocation en cours...'
              : mode === 'signin'
              ? '⚔️ Se connecter'
              : '🔥 Créer mon compte'}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
            className="text-sm text-metal-fire hover:text-metal-rust transition-colors"
          >
            {mode === 'signin'
              ? 'Pas encore de compte ? Rejoindre la horde →'
              : 'Déjà membre ? Se connecter →'}
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors text-2xl"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  );
}
