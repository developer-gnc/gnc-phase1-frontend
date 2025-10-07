import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthCallback({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const token = searchParams.get('token');

    if (!token) {
      console.error('No token received');
      setError('Authentication failed - no token received');
      setTimeout(() => {
        navigate('/login?error=no_token', { replace: true });
      }, 2000);
      return;
    }

    try {
      // Store token
      localStorage.setItem('authToken', token);
      console.log('✅ Token stored successfully');

      // Wait a moment to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refresh auth state in parent
      if (onAuthSuccess) {
        await onAuthSuccess();
      }

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error during auth callback:', error);
      setError('Authentication failed');
      localStorage.removeItem('authToken');
      setTimeout(() => {
        navigate('/login?error=callback_failed', { replace: true });
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-500 text-xl mb-4">❌</div>
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-gray-400 text-sm">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white font-semibold mb-2">Completing sign in...</p>
            <p className="text-gray-400 text-sm">Please wait</p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;