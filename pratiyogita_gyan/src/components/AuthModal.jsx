import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, X } from 'lucide-react';
import { validateEmail, validatePassword, validateDisplayName, sanitizeHtml } from '../utils/validation';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  const { login, loginWithGoogle, signup, currentUser } = useAuth();

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Close modal automatically if user becomes authenticated
  useEffect(() => {
    if (currentUser && isOpen) {
      handleClose();
    }
  }, [currentUser, isOpen]);

  const handleClose = () => {
    setError('');
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);

    if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
    }

    onClose();
  };

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement;
      setTimeout(() => {
        if (modalRef.current) {
          const firstInput = modalRef.current.querySelector('input, button');
          if (firstInput) firstInput.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Handle click outside & escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeHtml(value);

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const emailValidation = validateEmail(formData.email);
        if (!emailValidation) {
          throw new Error('Please enter a valid email address');
        }

        const nameValidation = validateDisplayName(formData.displayName);
        if (!nameValidation.isValid) {
          throw new Error(nameValidation.message);
        }

        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
          throw new Error(passwordValidation.message);
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        await signup(formData.email, formData.password, formData.displayName);
      } else {
        const emailValidation = validateEmail(formData.email);
        if (!emailValidation) {
          throw new Error('Please enter a valid email address');
        }

        if (!formData.password) {
          throw new Error('Password is required');
        }

        await login(formData.email, formData.password);
      }

      handleClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      handleClose();
    } catch (err) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl p-4 sm:p-6 overflow-hidden border border-gray-200 relative my-auto transition-all"
        role="document"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors z-10"
          aria-label="Close modal"
          type="button"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header - Compact for Mobile */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-orange-50 border border-orange-200 text-[#E4572E] flex items-center justify-center mx-auto mb-1.5 shadow-2xs">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h2 id="modal-title" className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Aspirant Account'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {mode === 'login'
              ? 'Sign in to sync your questions, bookmarks & stats'
              : 'Sign up to track progress permanently across devices'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-3 flex items-center text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2 shrink-0" />
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {/* Quick Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 bg-white text-gray-800 border border-gray-300 py-2 px-3 rounded-xl hover:bg-gray-50 hover:border-gray-400 shadow-2xs font-semibold text-xs sm:text-sm transition-all disabled:opacity-50"
          title="Sign in with your Google account"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        {/* Divider */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="px-2 bg-white text-gray-400 font-semibold">Or with email</span>
          </div>
        </div>

        {/* Email/Password Form - Compact & Responsive */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E4572E] focus:border-transparent outline-none transition-all"
                  placeholder="Enter your name"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E4572E] focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-9 pr-10 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E4572E] focus:border-transparent outline-none transition-all"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-10 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E4572E] focus:border-transparent outline-none transition-all"
                  placeholder="Repeat password"
                  required={mode === 'signup'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 bg-[#E4572E] text-white py-2 px-4 rounded-xl font-bold text-xs sm:text-sm hover:bg-[#c9451e] shadow-xs hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In to Account'
              : 'Create My Account'}
          </button>
        </form>

        {/* Toggle between Login and Signup */}
        <div className="mt-3.5 text-center text-xs text-gray-600">
          <span>{mode === 'login' ? "Don't have an account? " : 'Already registered? '}</span>
          <button
            type="button"
            onClick={toggleMode}
            className="text-[#E4572E] hover:underline font-bold"
          >
            {mode === 'login' ? 'Sign up here' : 'Sign in here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
