import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function CustomPointsManager({ customPoints, onCustomPointsChange, isVisible, onToggleVisibility }) {
  const [newPoint, setNewPoint] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingText, setEditingText] = useState('');

  // Load custom points from localStorage on component mount
  useEffect(() => {
    const savedPoints = localStorage.getItem('customExtractionPoints');
    if (savedPoints) {
      try {
        const points = JSON.parse(savedPoints);
        if (Array.isArray(points) && points.length > 0) {
          onCustomPointsChange(points);
        }
      } catch (error) {
        console.error('Error loading saved custom points:', error);
      }
    }
  }, [onCustomPointsChange]);

  // Save custom points to localStorage whenever they change
  useEffect(() => {
    if (customPoints && customPoints.length > 0) {
      localStorage.setItem('customExtractionPoints', JSON.stringify(customPoints));
    } else {
      localStorage.removeItem('customExtractionPoints');
    }
  }, [customPoints]);

  const handleAddPoint = () => {
    if (newPoint.trim() && !customPoints.includes(newPoint.trim())) {
      const updatedPoints = [...customPoints, newPoint.trim()];
      onCustomPointsChange(updatedPoints);
      setNewPoint('');
    }
  };

  const handleRemovePoint = (index) => {
    const updatedPoints = customPoints.filter((_, i) => i !== index);
    onCustomPointsChange(updatedPoints);
  };

  const handleEditPoint = (index) => {
    setEditingIndex(index);
    setEditingText(customPoints[index]);
  };

  const handleSaveEdit = () => {
    if (editingText.trim() && editingIndex >= 0) {
      const updatedPoints = [...customPoints];
      updatedPoints[editingIndex] = editingText.trim();
      onCustomPointsChange(updatedPoints);
      setEditingIndex(-1);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setEditingText('');
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        handleAddPoint();
      } else if (action === 'edit') {
        handleSaveEdit();
      }
    } else if (e.key === 'Escape' && action === 'edit') {
      handleCancelEdit();
    }
  };

  const clearAllPoints = () => {
    if (window.confirm('Are you sure you want to remove all custom points?')) {
      onCustomPointsChange([]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-900 bg-opacity-30 p-2 rounded-xl">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Custom Extraction Points</h3>
            <p className="text-sm text-gray-400">Add your own extraction rules to enhance data capture</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {customPoints.length > 0 && (
            <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              {customPoints.length} active
            </span>
          )}
          <button
            onClick={onToggleVisibility}
            className={`p-2 rounded-lg transition-colors ${
              isVisible 
                ? 'bg-purple-600 text-white' 
                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
            }`}
            title={isVisible ? 'Collapse' : 'Expand'}
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isVisible ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Add new point */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'add')}
                placeholder="Enter a custom extraction rule (e.g., 'Extract contractor license numbers when present')"
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={handleAddPoint}
                disabled={!newPoint.trim() || customPoints.includes(newPoint.trim())}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add
              </button>
            </div>

            {/* Custom points list */}
            {customPoints.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-300">Active Custom Points ({customPoints.length})</h4>
                  {customPoints.length > 0 && (
                    <button
                      onClick={clearAllPoints}
                      className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customPoints.map((point, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 group hover:border-zinc-600 transition-colors"
                    >
                      {editingIndex === index ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, 'edit')}
                            className="flex-1 bg-zinc-900 border border-zinc-600 text-white px-3 py-1 rounded text-sm focus:outline-none focus:border-purple-500"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Save"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Cancel"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium min-w-fit">
                                {20 + index}
                              </span>
                              <p className="text-sm text-gray-300 leading-relaxed">{point}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditPoint(index)}
                              className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                              title="Edit"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRemovePoint(index)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                              title="Remove"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Info section */}
            <div className="bg-purple-900 bg-opacity-20 border border-purple-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-purple-300 mb-1">How Custom Points Work</h5>
                  <ul className="text-xs text-purple-200 space-y-1">
                    <li>• Custom points are added to the AI extraction prompt as numbered rules (starting from 20)</li>
                    <li>• They persist across sessions and are saved locally in your browser</li>
                    <li>• Be specific about what data to extract and when to include it</li>
                    <li>• Examples: "Extract GST/HST tax amounts when visible", "Include signature dates if present"</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default CustomPointsManager;