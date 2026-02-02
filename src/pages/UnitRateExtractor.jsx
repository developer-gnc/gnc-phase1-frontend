import { useNavigate } from 'react-router-dom';

function UnitRateExtractor() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      {/* Header with Back Button */}
      <div className="bg-black border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold text-white">Unit Rate Explorer</h1>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Streamlit App */}
      <div style={{ height: 'calc(100vh - 73px)' }}>
        <iframe
          src="https://unitrateextractor-njmmko8xusxzrc7pbbobxe.streamlit.app/?embed=true"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Unit Rate Extractor"
          allow="cross-origin-isolated"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}

export default UnitRateExtractor;