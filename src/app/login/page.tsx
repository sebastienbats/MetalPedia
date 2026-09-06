'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignIn, useSignUp } from '@/api/authApi';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        if (!username.trim()) throw new Error('Le nom d utilisateur est requis.');
        await signUpMutation.mutateAsync({ email, password, username });
        setSuccessMessage('Compte créé avec succès ! Vérifie tes emails pour confirmer ton compte, ou connecte-toi directement si la confirmation est désactivée.');
      } else {
        await signInMutation.mutateAsync({ email, password });
        router.push('/profile'); // Redirection après connexion réussie
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Vérifie tes identifiants.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="metal-card w-full max-w-md p-8 border border-metal-gray">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="font-metal text-4xl text-metal-rust mb-2">
            {isSignUp ? 'Rejoins la Horde' : 'Accès au Metalverse'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isSignUp 
              ? 'Crée ton compte pour laisser des avis et suivre ta progression.' 
              : 'Connecte-toi pour accéder à toutes les fonctionnalités.'}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nom de Métalleux</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-metal-black/50 border border-metal-gray rounded-lg text-gray-200 focus:border-metal-fire focus:outline-none focus:ring-1 focus:ring-metal-fire"
                placeholder="ex: IronMaidenFan666"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-metal-black/50 border border-metal-gray rounded-lg text-gray-200 focus:border-metal-fire focus:outline-none focus:ring-1 focus:ring-metal-fire"
              placeholder="ton@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-metal-black/50 border border-metal-gray rounded-lg text-gray-200 focus:border-metal-fire focus:outline-none focus:ring-1 focus:ring-metal-fire"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {/* Messages d'erreur ou de succès */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          {/* Bouton d'action */}
          <button
            type="submit"
            disabled={signInMutation.isPending || signUpMutation.isPending}
            className="w-full py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-metal-fire/20"
          >
            {signInMutation.isPending || signUpMutation.isPending 
              ? 'Chargement...' 
              : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
          </button>
        </form>

        {/* Bascule Inscription / Connexion */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMessage('');
              }}
              className="text-metal-fire hover:underline font-semibold"
            >
              {isSignUp ? 'Se connecter' : 'S\'inscrire'}
            </button>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Retour à l'encyclopédie
          </Link>
        </div>
      </div>
    </div>
  );
}
