import { Link } from 'react-router-dom';

export default function TopNav({ loggedInUser, onLogout, currentRole }) {
  const roleLabel = currentRole === 'director' ? 'Director' : currentRole === 'manager' ? 'Manager' : 'Consultant';
  const roleBadgeClass = currentRole === 'director' ? 'role-badge-director' : currentRole === 'manager' ? 'role-badge-manager' : 'role-badge-consultant';

  return (
    <nav className="bg-black border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <img
              src="https://gncgroup.ca/wp-content/uploads/2025/02/gnc-logo.png"
              alt="GNC Group Logo"
              className="h-10 sm:h-12 w-auto"
            />
            <div className="hidden md:flex gap-4">
              <Link to="/dashboard" className="text-gray-400 hover:text-white font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/invoice-extractor" className="text-gray-400 hover:text-white font-medium transition-colors">
                Invoice Extractor
              </Link>
              <Link to="/unitrateextractor" className="text-gray-400 hover:text-white font-medium transition-colors">
                Unit Rate Explorer
              </Link>
              <Link to="/claims-dashboard" className="text-white font-medium transition-colors">
                Claims Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentRole && <span className={`role-badge ${roleBadgeClass}`}>{roleLabel}</span>}
            <span className="text-sm text-gray-400 hidden sm:block">{loggedInUser?.email}</span>
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
  );
}