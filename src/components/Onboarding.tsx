// src/components/Onboarding.tsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ArrowRight } from 'lucide-react'; // We only need the arrow now!

interface OnboardingProps {
  onComplete: () => void;
}

// Removed the 'icon' properties from the slides
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
      setError(err.message);
    }
  };

  // --- RENDER: INTRO SLIDES ---
  if (!showAuthForm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm flex flex-col items-center text-center animate-fade-in">
          
          {/* Main Hero Logo */}
          <img 
            src="/icons/Korgix.png" 
            alt="Korgix Logo" 
            className="w-28 h-28 mx-auto rounded-3xl shadow-xl mb-10" 
          />
          
          {/* Slide Text */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight">{SLIDES[currentSlide].title}</h2>
            <p className="text-gray-400 mt-4 text-lg leading-relaxed">
              {SLIDES[currentSlide].description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex space-x-2 mb-10">
            {SLIDES.map((_, index) => (
              <div 
                key={index} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'w-8 bg-blue-500' : 'w-2 bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button 
            onClick={handleNextSlide}
            className="w-full py-4 px-4 bg-white text-black font-semibold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-lg"
          >
            {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="w-5 h-5" />
          </button>
          
          {/* Skip Button */}
          <button 
            onClick={() => setShowAuthForm(true)}
            className="text-gray-500 font-medium mt-6 hover:text-white transition-colors"
          >
            Skip intro
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: AUTH FORM ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white animate-fade-in" style={{ background: 'var(--bg)' }}>
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
          {error && <div className="p-3 text-sm text-red-400 bg-red-900/20 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <input 
              type="email" 
              required
              className="mt-1 block w-full px-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <input 
              type="password" 
              required
              className="mt-1 block w-full px-4 py-3 bg-[#1a1a1a] border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors mt-6"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

      </div>
    </div>
  );
}