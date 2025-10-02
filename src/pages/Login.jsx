import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

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
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const closeError = () => {
    setShowError(false);
    window.history.replaceState({}, document.title, "/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Only users with @gncgroup.ca email addresses are allowed to access this system.
            </p>
            <div className="flex justify-end">
              <button
                onClick={closeError}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">GNC Group Login</h1>
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Login with Google
        </button>
        <p className="text-sm text-gray-600 text-center mt-4">
          Only @gncgroup.ca emails are allowed
        </p>
      </div>
    </div>
  );
}

export default Login;