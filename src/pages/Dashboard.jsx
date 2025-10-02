import { Link } from 'react-router-dom';

function Dashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">GNC Group</h1>
            <nav className="flex gap-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link to="/invoice-extractor" className="text-gray-600 hover:text-gray-900 font-medium">
                Invoice Extractor
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={onLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Welcome, {user.name}!</h2>
          <p className="text-gray-600">Email: {user.email}</p>
        </div>

        <div className="mt-6 bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500">Your content goes here</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;