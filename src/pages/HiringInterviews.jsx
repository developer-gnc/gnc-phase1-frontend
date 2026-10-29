import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// The hiring interview dashboard runs on its own server (the GNC-Hiring-Automation project) and is
// shown here in a frame. It has no login of its own: when it needs one, it asks this page, and this
// page answers with the user's gnctools.ca sign-in, sent only to the hiring server's exact address.
const HIRING_URL = (import.meta.env.VITE_HIRING_URL || 'https://interview.gnctools.ca').replace(/\/$/, '');
const HIRING_ORIGIN = new URL(HIRING_URL).origin;

function HiringInterviews({ user, onLogout }) {
  const frame = useRef(null);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== HIRING_ORIGIN || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type !== 'gnc-hiring:need-sign-in') return;
      const token = localStorage.getItem('authToken');
      event.source.postMessage({ type: 'gnc-hiring:sign-in', token: token || null }, HIRING_ORIGIN);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Navbar */}
      <nav className="bg-black border-b border-zinc-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link to="/dashboard">
                <img
                  src="https://gncgroup.ca/wp-content/uploads/2025/02/gnc-logo.png"
                  alt="GNC Group Logo"
                  className="h-10 sm:h-12 w-auto"
                />
              </Link>
              <div className="hidden md:flex gap-4">
                <Link
                  to="/dashboard"
                  className="text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <span className="text-white font-medium">Hiring Interviews</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 hidden sm:block">
                {user.email}
              </span>
              <button
                onClick={onLogout}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-zinc-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <iframe
        ref={frame}
        src={`${HIRING_URL}/hr`}
        title="Hiring Interviews"
        className="w-full grow border-0 bg-black"
        allow="clipboard-write; fullscreen"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default HiringInterviews;
