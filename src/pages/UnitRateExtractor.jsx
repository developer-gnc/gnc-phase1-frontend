import { useNavigate } from 'react-router-dom';

function UnitRateExtractor() {
  const navigate = useNavigate();

  const handleExternalLink = () => {
    window.open('https://unitrateextractor-njmmko8xusxzrc7pbbobxe.streamlit.app/', '_blank');
  };

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

      {/* Warning Banner */}
      <div className="bg-amber-900/20 border-b border-amber-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2 text-amber-200">
            <svg 
              className="w-5 h-5 text-amber-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
            <span className="text-sm">
              If you face any issues, click{' '}
              <button
                onClick={handleExternalLink}
                className="underline hover:text-amber-100 transition-colors font-medium"
              >
                here
              </button>
              {' '}to open in a new tab
            </span>
          </div>
        </div>
      </div>

      {/* Streamlit App */}
      <div style={{ height: 'calc(100vh - 122px)' }}>
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