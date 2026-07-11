// src/components/Onboarding.tsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ArrowRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface OnboardingProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    title: "Organize your life",
    description: "Quickly add, manage, and prioritize your daily tasks with Korgix.",
  },
  {
    title: "Find your focus",
    description: "Stay in the zone and complete your goals without distractions.",
  },
  {
    title: "Access anywhere",
    description: "Create an account to securely sync your progress across all devices.",
  }
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleNextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowAuthForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onComplete();
    } catch (err: any) {
      const friendlyMessage = getFirebaseErrorMessage(err.code, err.message);
      setError(friendlyMessage);
    }
  };

  const getFirebaseErrorMessage = (code: string, rawMessage: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Try signing up instead.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Check your internet connection.';
      case 'auth/invalid-api-key':
        return 'Configuration error. Please contact support.';
      case 'auth/app-not-authorized':
        return 'This app is not authorized. Please contact support.';
      default:
        if (rawMessage?.includes('Firebase')) {
          return 'Something went wrong. Please try again.';
        }
        return rawMessage || 'An unexpected error occurred. Please try again.';
    }
  };

  // --- RENDER: INTRO SLIDES ---
  if (!showAuthForm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="absolute top-4 right-4">
          <ThemeToggle compact />
        </div>
        <div className="w-full max-w-sm flex flex-col items-center text-center">

          {/* Main Hero Logo */}
          <img
            src="/icons/Korgix.png"
            alt="Korgix Logo"
            className="w-28 h-28 mx-auto rounded-3xl shadow-xl mb-10"
          />

          {/* Slide Text */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight">{SLIDES[currentSlide].title}</h2>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {SLIDES[currentSlide].description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex space-x-2 mb-10">
            {SLIDES.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'w-8' : 'w-2'
                }`}
                style={{
                  background: currentSlide === index ? 'var(--info)' : 'var(--border-light)',
                }}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextSlide}
            className="w-full py-4 px-4 font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
            style={{ background: 'var(--inverse-bg)', color: 'var(--inverse-text)' }}
          >
            {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Skip Button */}
          <button
            onClick={() => setShowAuthForm(true)}
            className="font-medium mt-6 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Skip intro
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: AUTH FORM ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="absolute top-4 right-4">
        <ThemeToggle compact />
      </div>
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center">
          {/* Logo on Auth Form */}
          <img
            src="/icons/Korgix.png"
            alt="Korgix Logo"
            className="w-24 h-24 mx-auto rounded-3xl shadow-xl mb-4"
          />
          <h2 className="text-3xl font-bold tracking-tight">Welcome to Korgix</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
          {error && (
            <div
              className="p-3 text-sm rounded-lg"
              style={{ color: 'var(--danger)', background: 'var(--danger-dim)' }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full px-4 py-3 rounded-xl outline-none focus:ring-2"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-4 py-3 rounded-xl outline-none focus:ring-2"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 font-semibold rounded-xl transition-colors mt-6"
            style={{ background: 'var(--inverse-bg)', color: 'var(--inverse-text)' }}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

      </div>
    </div>
  );
}
