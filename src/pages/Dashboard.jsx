import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Dashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
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
                <Link 
                  to="/dashboard" 
                  className="text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/invoice-extractor" 
                  className="text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Invoice Extractor
                </Link>
                <a 
                  href="/unitrateextractor" 
                  className="text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Unit Rate Explorer
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
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
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Welcome to GNC Group Tools
          </h1>
          <p className="text-gray-400 text-lg">
            Select a tool below to get started
          </p>
        </motion.div>

        {/* Tools Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Invoice Extractor Tool */}
          <Link to="/invoice-extractor">
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all cursor-pointer shadow-xl"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-zinc-800 rounded-xl mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Invoice Extractor</h3>
              <p className="text-gray-400 text-sm">
                Extract and process invoice data from PDF files with AI-powered analysis
              </p>
            </motion.div>
          </Link>

          {/* Unit Rate Explorer Tool */}
          <a href="/unitrateextractor">
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all cursor-pointer shadow-xl"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-zinc-800 rounded-xl mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Unit Rate Explorer</h3>
              <p className="text-gray-400 text-sm">
                Explore and analyze unit rates by province, city, year, and month
              </p>
            </motion.div>
          </a>

          {/* Placeholder for future tools */}
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-zinc-900 bg-opacity-50 border border-zinc-800 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px]"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-zinc-800 bg-opacity-50 rounded-xl mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-500 mb-2">Coming Soon</h3>
            <p className="text-gray-600 text-sm text-center">
              More tools will be added here
            </p>
          </motion.div>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-xl">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{user.name}</h3>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;