'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignIn, useSignUp } from '@/api/authApi';

// ═══════════════════════════════════════════════════════════
// COMPOSANT RÉUTILISABLE (DÉFINI À L'EXTÉRIEUR pour éviter les re-montages)
// ═══════════════════════════════════════════════════════════

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  required?: boolean;
  minLength?: number;
}

function PasswordInput({ 
  label, 
  value, 
  onChange, 
  show, 
  onToggle, 
  placeholder,
  required = true,
  minLength = 6
}: PasswordInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2 pr-10 bg-metal-black/50 border border-metal-gray rounded-lg text-gray-200 focus:border-metal-fire focus:outline-none focus:ring-1 focus:ring-metal-fire transition-all"
          placeholder={placeholder}
          minLength={minLength}
          required={required}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-metal-fire transition-colors focus:outline-none"
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL DE LA PAGE
// ═══════════════════════════════════════════════════════════

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isSignUp && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      if (isSignUp) {
        if (!username.trim()) throw new Error('Le nom d\'utilisateur est requis.');
        if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
        
        await signUpMutation.mutateAsync({ email, password, username });
        setSuccessMessage('Compte créé avec succès ! Vérifie tes emails pour confirmer ton compte, ou connecte-toi directement.');
      } else {
        await signInMutation.mutateAsync({ email, password });
        router.push('/profile');
      }
    } catch (err: any) {
      const msg = err.message || 'Une erreur est survenue. Vérifie tes identifiants.';
      setError(msg.includes('Invalid login credentials') ? 'Email ou mot de passe incorrect.' : msg);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="metal-card w-full max-w-md p-8 border border-metal-gray">
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nom de Métalleux</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-metal-black/50 border border-metal-gray rounded-lg text-gray-200 focus:border-metal-fire focus:outline-none focus:ring-1 focus:ring-metal-fire transition-all"
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
              className="w-full px-4 py-2 bg-metal-black/50 border border-metal-gray rounded-lg text-gray-200 focus:border-metal-fire focus:outline-none focus:ring-1 focus:ring-metal-fire transition-all"
              placeholder="ton@email.com"
              required
            />
          </div>

          <PasswordInput
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            show={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            placeholder="••••••••"
          />

          {isSignUp && (
            <PasswordInput
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              placeholder="••••••••"
            />
          )}

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={signInMutation.isPending || signUpMutation.isPending}
            className="w-full py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-metal-fire/20 flex items-center justify-center gap-2"
          >
            {(signInMutation.isPending || signUpMutation.isPending) && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {signInMutation.isPending || signUpMutation.isPending 
              ? 'Chargement...' 
              : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMessage('');
                setConfirmPassword('');
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
              className="text-metal-fire hover:underline font-semibold transition-colors"
            >
              {isSignUp ? 'Se connecter' : 'S\'inscrire'}
            </button>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Retour à l'encyclopédie
          </Link>
        </div>
      </div>
    </div>
  );
}
