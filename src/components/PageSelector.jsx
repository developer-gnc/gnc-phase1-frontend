import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function PageSelector({ pageCount, onSelectionChange, disabled }) {
  const [selectionMode, setSelectionMode] = useState('all'); // 'all', 'include', 'exclude'
  const [selectedPages, setSelectedPages] = useState([]);
  const [pageInput, setPageInput] = useState('');
  const [error, setError] = useState('');

  // Memoize the callback to prevent infinite re-renders
  const handleSelectionChange = useCallback((pages) => {
    if (onSelectionChange) {
      onSelectionChange(pages);
    }
  }, [onSelectionChange]);

  // Initialize with all pages when component mounts or pageCount changes
  useEffect(() => {
    if (pageCount > 0) {
      const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);
      setSelectedPages(allPages);
      handleSelectionChange(allPages);
      setPageInput('');
      setError('');
    }
  }, [pageCount, handleSelectionChange]);

  // Handle mode changes
  const handleModeChange = (newMode) => {
    setSelectionMode(newMode);
    setPageInput('');
    setError('');
    
    if (newMode === 'all') {
      const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);
      setSelectedPages(allPages);
      handleSelectionChange(allPages);
    } else if (newMode === 'include') {
      setSelectedPages([]);
      handleSelectionChange([]);
    } else if (newMode === 'exclude') {
      const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);
      setSelectedPages(allPages);
      handleSelectionChange(allPages);
    }
  };

  // Parse page input string (e.g., "1,3,5-8,10")
  const parsePageInput = (input) => {
    const pages = new Set();
    const parts = input.split(',').map(part => part.trim()).filter(part => part);
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(num => parseInt(num.trim()));
        if (isNaN(start) || isNaN(end) || start < 1 || end > pageCount || start > end) {
          throw new Error(`Invalid range: ${part}`);
        }
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      } else {
        const pageNum = parseInt(part);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > pageCount) {
          throw new Error(`Invalid page number: ${part}`);
        }
        pages.add(pageNum);
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  };

  // Handle page input change
  const handlePageInputChange = (value) => {
    setPageInput(value);
    setError('');
    
    if (!value.trim()) {
      if (selectionMode === 'include') {
        setSelectedPages([]);
        handleSelectionChange([]);
      } else if (selectionMode === 'exclude') {
        const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);
        setSelectedPages(allPages);
        handleSelectionChange(allPages);
      }
      return;
    }

    try {
      const inputPages = parsePageInput(value);
      
      if (selectionMode === 'include') {
        setSelectedPages(inputPages);
        handleSelectionChange(inputPages);
      } else if (selectionMode === 'exclude') {
        const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);
        const includedPages = allPages.filter(page => !inputPages.includes(page));
        setSelectedPages(includedPages);
        handleSelectionChange(includedPages);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle individual page
  const togglePage = (pageNum) => {
    if (selectionMode === 'all') return;
    
    let newSelectedPages;
    if (selectionMode === 'include') {
      if (selectedPages.includes(pageNum)) {
        newSelectedPages = selectedPages.filter(p => p !== pageNum);
      } else {
        newSelectedPages = [...selectedPages, pageNum].sort((a, b) => a - b);
      }
    } else { // exclude mode
      if (selectedPages.includes(pageNum)) {
        // Remove from selected (add to excluded)
        newSelectedPages = selectedPages.filter(p => p !== pageNum);
      } else {
        // Add to selected (remove from excluded)
        newSelectedPages = [...selectedPages, pageNum].sort((a, b) => a - b);
      }
    }
    
    setSelectedPages(newSelectedPages);
    handleSelectionChange(newSelectedPages);
    
    // Update input field to reflect changes
    updateInputFromSelection(newSelectedPages);
  };

  // Update input field from current selection
  const updateInputFromSelection = (pages) => {
    if (selectionMode === 'include') {
      setPageInput(formatPageRange(pages));
    } else if (selectionMode === 'exclude') {
      const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);
      const excludedPages = allPages.filter(page => !pages.includes(page));
      setPageInput(formatPageRange(excludedPages));
    }
  };

  // Format page array to range string (e.g., [1,2,3,5,6,7] -> "1-3,5-7")
  const formatPageRange = (pages) => {
    if (pages.length === 0) return '';
    
    const ranges = [];
    let start = pages[0];
    let end = pages[0];
    
    for (let i = 1; i < pages.length; i++) {
      if (pages[i] === end + 1) {
        end = pages[i];
      } else {
        if (start === end) {
          ranges.push(start.toString());
        } else {
          ranges.push(`${start}-${end}`);
        }
        start = pages[i];
        end = pages[i];
      }
    }
    
    if (start === end) {
      ranges.push(start.toString());
    } else {
      ranges.push(`${start}-${end}`);
    }
    
    return ranges.join(',');
  };

  // Get status text
  const getStatusText = () => {
    if (selectionMode === 'all') {
      return `All ${pageCount} pages selected`;
    } else if (selectionMode === 'include') {
      return `${selectedPages.length} pages selected`;
    } else {
      const excludedCount = pageCount - selectedPages.length;
      return `${selectedPages.length} pages selected (${excludedCount} excluded)`;
    }
  };

  if (pageCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Page Selection</h3>
      
      {/* Mode Selection */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleModeChange('all')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectionMode === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          All Pages
        </button>
        <button
          onClick={() => handleModeChange('include')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectionMode === 'include'
              ? 'bg-green-600 text-white'
              : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Include Pages
        </button>
        <button
          onClick={() => handleModeChange('exclude')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectionMode === 'exclude'
              ? 'bg-red-600 text-white'
              : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Exclude Pages
        </button>
      </div>

      {/* Page Input for Include/Exclude modes */}
      <AnimatePresence>
        {selectionMode !== 'all' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {selectionMode === 'include' ? 'Pages to Include' : 'Pages to Exclude'}
            </label>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              disabled={disabled}
              placeholder="e.g., 1,3,5-8,10"
              className={`w-full px-3 py-2 bg-zinc-700 border ${
                error ? 'border-red-500' : 'border-zinc-600'
              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            {error && (
              <p className="text-red-400 text-sm mt-1">{error}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              Enter page numbers separated by commas. Use ranges like "1-5" for consecutive pages.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Page Grid */}
      {pageCount <= 50 && (
        <div className="mb-4">
          <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => {
              const isSelected = selectedPages.includes(pageNum);
              const isExcluded = selectionMode === 'exclude' && !isSelected;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => togglePage(pageNum)}
                  disabled={disabled || selectionMode === 'all'}
                  className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                    selectionMode === 'all' 
                      ? 'bg-blue-600 text-white'
                      : isExcluded
                      ? 'bg-red-600 text-white'
                      : isSelected
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={`Page ${pageNum} ${
                    selectionMode === 'all' ? '(included)' : 
                    isExcluded ? '(excluded)' : 
                    isSelected ? '(included)' : '(click to toggle)'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{getStatusText()}</span>
        {pageCount > 50 && (
          <span className="text-gray-400">
            Use text input for large PDFs ({pageCount} pages)
          </span>
        )}
      </div>

      {/* Legend for visual grid */}
      {pageCount <= 50 && selectionMode !== 'all' && (
        <div className="flex gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span className="text-gray-400">Included</span>
          </div>
          {selectionMode === 'exclude' && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span className="text-gray-400">Excluded</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-zinc-700 rounded"></div>
            <span className="text-gray-400">Not selected</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default PageSelector;