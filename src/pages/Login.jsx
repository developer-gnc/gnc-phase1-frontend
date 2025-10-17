import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config/api';

function Login() {
  const [searchParams] = useSearchParams();
  const [showError, setShowError] = useState(false);
  const error = searchParams.get('error');

  useEffect(() => {
    if (error === 'domain_not_allowed') {
      setShowError(true);
    }
  }, [error]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const closeError = () => {
    setShowError(false);
    window.history.replaceState({}, document.title, "/login");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-20 bg-black border-b border-zinc-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <img 
              src="https://gncgroup.ca/wp-content/uploads/2025/02/gnc-logo.png" 
              alt="GNC Group Logo" 
              className="h-10 sm:h-12 w-auto"
            />
          </div>
        </div>
      </motion.nav>

      {/* Error Modal */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-900 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-6">
                <div className="bg-red-900 bg-opacity-30 p-3 rounded-xl mr-4 border border-red-800">
                  <svg className="w-6 sm:w-7 h-6 sm:h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Access Denied</h3>
              </div>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm sm:text-base">
                Only users with <span className="font-semibold text-white">@gncgroup.ca</span> email addresses are allowed to access this system.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={closeError}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-semibold border border-zinc-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 bg-zinc-900 p-8 sm:p-12 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800"
        >
          {/* Logo Section */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <img 
              src="https://gncgroup.ca/wp-content/uploads/2025/02/gnc-logo.png" 
              alt="GNC Group Logo" 
              className="h-20 sm:h-24 w-auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-10"
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
              Welcome Back
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Sign in to access your GNC Group tools
            </p>
          </motion.div>

          {/* Google Login Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 hover:border-zinc-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3"
          >
            <svg className="w-5 sm:w-6 h-5 sm:h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm sm:text-base">Continue with Google</span>
          </motion.button>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="my-8 flex items-center"
          >
            <div className="flex-1 border-t border-zinc-800"></div>
            <span className="px-4 text-xs sm:text-sm text-gray-500 font-medium">SECURE LOGIN</span>
            <div className="flex-1 border-t border-zinc-800"></div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-4"
          >
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-200 font-medium mb-1">Authorized Access Only</p>
                <p className="text-xs text-gray-400">Only <span className="font-semibold">@gncgroup.ca</span> email addresses can access this portal</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;