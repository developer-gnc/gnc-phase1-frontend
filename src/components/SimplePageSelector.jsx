import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function SimplePageSelector({ pageCount, onSelectionChange, disabled }) {
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState('all');

  // Initialize with all pages selected
  useEffect(() => {
    if (pageCount > 0) {
      const allPages = new Set(Array.from({ length: pageCount }, (_, i) => i + 1));
      setSelectedPages(allPages);
      onSelectionChange(Array.from(allPages));
    }
  }, [pageCount, onSelectionChange]);

  const togglePage = (pageNum) => {
    if (disabled) return;
    
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }
    setSelectedPages(newSelected);
    onSelectionChange(Array.from(newSelected).sort((a, b) => a - b));
  };

  const selectAll = () => {
    const allPages = new Set(Array.from({ length: pageCount }, (_, i) => i + 1));
    setSelectedPages(allPages);
    onSelectionChange(Array.from(allPages));
    setSelectionMode('all');
  };

  const selectNone = () => {
    setSelectedPages(new Set());
    onSelectionChange([]);
    setSelectionMode('none');
  };

  const handleRangeInput = (value) => {
    if (!value.trim()) return;
    
    try {
      const newSelected = new Set();
      const parts = value.split(',');
      
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
          if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= pageCount && start <= end) {
            for (let i = start; i <= end; i++) {
              newSelected.add(i);
            }
          }
        } else {
          const num = parseInt(trimmed);
          if (!isNaN(num) && num >= 1 && num <= pageCount) {
            newSelected.add(num);
          }
        }
      }
      
      setSelectedPages(newSelected);
      onSelectionChange(Array.from(newSelected).sort((a, b) => a - b));
      setSelectionMode('custom');
    } catch (error) {
      console.error('Invalid range input:', error);
    }
  };

  if (pageCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Select Pages to Process</h3>
        <span className="text-sm text-gray-300">
          {selectedPages.size} of {pageCount} pages selected
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={selectAll}
          disabled={disabled}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50"
        >
          Select All
        </button>
        <button
          onClick={selectNone}
          disabled={disabled}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:opacity-50"
        >
          Select None
        </button>
      </div>

      {/* Range Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">
          Quick Select (e.g., "1,3,5-8,10"):
        </label>
        <input
          type="text"
          placeholder="Enter page numbers or ranges"
          className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRangeInput(e.target.value);
              e.target.value = '';
            }
          }}
        />
        <p className="text-xs text-gray-400 mt-1">Press Enter to apply selection</p>
      </div>

      {/* Visual Page Grid */}
      <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto p-2 bg-zinc-900 rounded border border-zinc-700">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => {
          const isSelected = selectedPages.has(pageNum);
          return (
            <button
              key={pageNum}
              onClick={() => togglePage(pageNum)}
              disabled={disabled}
              className={`
                w-12 h-12 text-sm font-medium rounded transition-all duration-200
                ${isSelected 
                  ? 'bg-blue-600 text-white shadow-lg scale-105' 
                  : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600 hover:scale-105'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                border-2 ${isSelected ? 'border-blue-400' : 'border-transparent'}
              `}
              title={`Page ${pageNum} - Click to ${isSelected ? 'deselect' : 'select'}`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Status */}
      <div className="mt-4 p-3 bg-zinc-900 rounded border border-zinc-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-300">
            Status: {selectedPages.size === pageCount ? 'All pages selected' : 
                    selectedPages.size === 0 ? 'No pages selected' : 
                    `${selectedPages.size} pages selected`}
          </span>
          {selectedPages.size > 0 && selectedPages.size < pageCount && (
            <span className="text-blue-400">
              Pages: {Array.from(selectedPages).sort((a, b) => a - b).join(', ')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default SimplePageSelector;