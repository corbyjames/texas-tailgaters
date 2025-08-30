import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetSuccess(false);

    console.log('🔐 Auth attempt:', { email, isSignUp, isResetMode });

    try {
      if (isResetMode) {
        const { error } = await resetPassword(email);
        if (error) {
          console.error('Reset error:', error);
          setError(error.message);
        } else {
          console.log('✅ Reset email sent');
          setResetSuccess(true);
          setError('');
        }
        setLoading(false);
        return;
      } else if (isSignUp) {
        const { error } = await signUp(email, password, name);
        if (error) {
          console.error('Signup error:', error);
          setError(error.message);
        } else {
          console.log('✅ Signup successful');
          // Success - navigate to home page
          navigate('/');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Signin error:', error);
          // Provide more helpful error messages
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please confirm your email address before signing in.');
          } else if (error.message.includes('rate_limit')) {
            setError('Too many login attempts. Please wait a few minutes and try again.');
          } else {
            setError(error.message || 'Unable to sign in. Please try again.');
          }
        } else {
          console.log('✅ Signin successful');
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ut-light-gray px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔥</div>
          <h1 className="text-3xl font-bold text-ut-text mb-2">
            Texas Tailgaters
          </h1>
          <p className="text-gray-600">
            {isResetMode ? 'Reset your password' : isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <div className="card p-8">
          {resetSuccess ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-5xl">✅</div>
              <h2 className="text-xl font-semibold text-ut-text">Check Your Email</h2>
              <p className="text-gray-600">
                We've sent a password reset link to {email}
              </p>
              <button
                onClick={() => {
                  setIsResetMode(false);
                  setResetSuccess(false);
                }}
                className="btn-primary w-full"
              >
                Back to Login
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && !isResetMode && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-ut-text mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your full name"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ut-text mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>

            {!isResetMode && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ut-text mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isResetMode ? 'Sending Reset Email...' : isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                isResetMode ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>
          )}

          <div className="mt-6 text-center space-y-2">
            {!isResetMode && (
              <>
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-ut-orange hover:text-orange-700 text-sm font-medium block w-full"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
                <button
                  onClick={() => {
                    setIsResetMode(true);
                    setIsSignUp(false);
                    setError('');
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium block w-full"
                >
                  Forgot your password?
                </button>
              </>
            )}
            {isResetMode && (
              <button
                onClick={() => {
                  setIsResetMode(false);
                  setError('');
                  setResetSuccess(false);
                }}
                className="text-ut-orange hover:text-orange-700 text-sm font-medium"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Hook 'em! 🤘
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


