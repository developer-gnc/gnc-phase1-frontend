import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ImageSelection({ images, onProcessSelected, onSelectAll, loading }) {
  const [selectionMode, setSelectionMode] = useState('all'); // 'all', 'exclude', 'include'
  const [pageInput, setPageInput] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [inputError, setInputError] = useState('');

  const getAuthenticatedImageUrl = useCallback((imageUrl) => {
    if (!imageUrl) return null;
    const token = localStorage.getItem('authToken');
    if (!token) return imageUrl;
    
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}token=${token}`;
  }, []);

  // Parse page input like "1,4,6-10,15" into array of page numbers
  const parsePageInput = useCallback((input) => {
    if (!input.trim()) return [];
    
    const pages = new Set();
    const parts = input.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Handle range like "6-10"
        const rangeParts = part.split('-');
        if (rangeParts.length !== 2) {
          throw new Error(`Invalid range format: ${part}`);
        }
        const [start, end] = rangeParts.map(num => parseInt(num.trim()));
        if (isNaN(start) || isNaN(end) || start > end || start < 1) {
          throw new Error(`Invalid range: ${part}`);
        }
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      } else {
        // Handle single page number
        const pageNum = parseInt(part);
        if (isNaN(pageNum) || pageNum < 1) {
          throw new Error(`Invalid page number: ${part}`);
        }
        pages.add(pageNum);
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  }, []);

  // Memoize all page numbers to prevent recalculation
  const allPageNumbers = useMemo(() => {
    return images.map(img => img.pageNumber).sort((a, b) => a - b);
  }, [images]);

  // Memoize parsed input pages to prevent infinite loops
  const parsedInputPages = useMemo(() => {
    if (!pageInput.trim()) return [];
    
    try {
      return parsePageInput(pageInput);
    } catch (error) {
      return [];
    }
  }, [pageInput, parsePageInput]);

  // Memoize final page list to prevent infinite re-renders
  const finalPageList = useMemo(() => {
    if (selectionMode === 'all') {
      return allPageNumbers;
    }
    
    if (!pageInput.trim()) {
      return selectionMode === 'exclude' ? allPageNumbers : [];
    }

    try {
      const inputPages = parsePageInput(pageInput);
      
      // Validate that input pages exist in the document
      const invalidPages = inputPages.filter(page => !allPageNumbers.includes(page));
      if (invalidPages.length > 0) {
        return [];
      }
      
      if (selectionMode === 'exclude') {
        return allPageNumbers.filter(page => !inputPages.includes(page));
      } else if (selectionMode === 'include') {
        return inputPages.filter(page => allPageNumbers.includes(page));
      }
    } catch (error) {
      return [];
    }
    
    return allPageNumbers;
  }, [selectionMode, pageInput, allPageNumbers, parsePageInput]);

  // Memoize validation result to prevent constant recalculation
  const validationResult = useMemo(() => {
    if (selectionMode === 'all' || !pageInput.trim()) {
      return { isValid: true, error: '' };
    }

    try {
      const inputPages = parsePageInput(pageInput);
      const invalidPages = inputPages.filter(page => !allPageNumbers.includes(page));
      
      if (invalidPages.length > 0) {
        return { 
          isValid: false, 
          error: `Pages not found in document: ${invalidPages.join(', ')}` 
        };
      }
      
      return { isValid: true, error: '' };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }, [selectionMode, pageInput, allPageNumbers, parsePageInput]);

  const handlePageInputChange = useCallback((value) => {
    setPageInput(value);
    setInputError('');
  }, []);

  const handleModeChange = useCallback((mode) => {
    setSelectionMode(mode);
    setPageInput('');
    setInputError('');
  }, []);

  const handleProcessSelected = useCallback(() => {
    if (!validationResult.isValid) {
      setInputError(validationResult.error);
      return;
    }

    if (finalPageList.length === 0 && selectionMode !== 'all') {
      setInputError('No valid pages to process');
      return;
    }
    
    const selectedImageData = images.filter(img => finalPageList.includes(img.pageNumber));
    onProcessSelected(selectedImageData);
  }, [validationResult, finalPageList, selectionMode, images, onProcessSelected]);

  const handleExtractAll = useCallback(() => {
    onSelectAll(images);
  }, [images, onSelectAll]);

  const navigateImage = useCallback((direction) => {
    if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (direction === 'next' && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  }, [currentImageIndex, images.length]);

  const currentImage = images[currentImageIndex];
  const isCurrentPageIncluded = finalPageList.includes(currentImage?.pageNumber);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl"
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Select Pages to Process</h2>
          <p className="text-gray-400 text-sm">
            Choose which pages you want to extract data from. Use the controls below to specify pages and preview them.
          </p>
        </div>

        {/* ==================== SEPARATOR ==================== */}
        <div className="border-t border-zinc-700 my-2"></div>

        {/* Selection Mode Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Processing Mode</h3>
          
          {/* Mode Selection Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleModeChange('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectionMode === 'all'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
              }`}
            >
              Process All Pages
            </button>
            <button
              onClick={() => handleModeChange('exclude')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectionMode === 'exclude'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
              }`}
            >
              Exclude Pages
            </button>
            <button
              onClick={() => handleModeChange('include')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectionMode === 'include'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
              }`}
            >
              Include Only
            </button>
          </div>

          {/* Page Input for Exclude/Include modes */}
          <AnimatePresence>
            {(selectionMode === 'exclude' || selectionMode === 'include') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <label className="block text-sm font-medium text-gray-300">
                  Enter page numbers to {selectionMode}:
                </label>
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => handlePageInputChange(e.target.value)}
                  placeholder="e.g., 1,4,6-10,15"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-400">
                  <p>Examples:</p>
                  <p>• Single pages: <span className="text-blue-400">1,4,7</span></p>
                  <p>• Ranges: <span className="text-blue-400">6-10</span> (includes 6,7,8,9,10)</p>
                  <p>• Mixed: <span className="text-blue-400">1,4,6-10,15</span></p>
                </div>
                {(inputError || !validationResult.isValid) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-sm bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-3"
                  >
                    {inputError || validationResult.error}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ==================== SEPARATOR ==================== */}
        <div className="border-t border-zinc-700 my-2"></div>

        {/* Image Viewer */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Page Preview</h3>
            <div className="text-sm text-gray-400">
              Page {currentImageIndex + 1} of {images.length}
            </div>
          </div>

          {/* Large Image Display */}
          <div className="relative bg-zinc-800 rounded-xl overflow-hidden">
            {currentImage && !currentImage.conversionError ? (
              <div className="relative">
                <img
                  src={getAuthenticatedImageUrl(currentImage.imageUrl)}
                  alt={`Page ${currentImage.pageNumber}`}
                  className="w-full h-auto min-h-[600px] max-h-[800px] object-contain cursor-zoom-in"
                  onClick={(e) => {
                    // Optional: Add zoom functionality on click
                    const img = e.target;
                    if (img.style.transform === 'scale(1.5)') {
                      img.style.transform = 'scale(1)';
                      img.style.cursor = 'zoom-in';
                    } else {
                      img.style.transform = 'scale(1.5)';
                      img.style.cursor = 'zoom-out';
                      img.style.transformOrigin = 'center';
                    }
                  }}
                />
                
                {/* Page Status Indicator */}
                <div className="absolute top-4 left-4">
                  <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    isCurrentPageIncluded
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    Page {currentImage.pageNumber} - {isCurrentPageIncluded ? 'WILL PROCESS' : 'WILL SKIP'}
                  </div>
                </div>

                {/* Navigation Arrows */}
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <button
                    onClick={() => navigateImage('prev')}
                    disabled={currentImageIndex === 0}
                    className="ml-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    onClick={() => navigateImage('next')}
                    disabled={currentImageIndex === images.length - 1}
                    className="mr-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-[3/4] flex items-center justify-center bg-red-900 bg-opacity-30 p-8">
                <div className="text-center">
                  <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-400 font-medium">Error Loading Page {currentImage?.pageNumber}</p>
                  <p className="text-red-300 text-sm mt-2">{currentImage?.conversionError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Page Navigation Dots */}
          <div className="flex justify-center space-x-2 max-h-20 overflow-y-auto">
            <div className="flex space-x-1 py-2">
              {images.map((image, index) => {
                const isIncluded = finalPageList.includes(image.pageNumber);
                return (
                  <button
                    key={image.pageNumber}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                      index === currentImageIndex
                        ? 'bg-blue-600 text-white scale-110'
                        : isIncluded
                        ? 'bg-green-600 text-white hover:scale-105'
                        : 'bg-red-600 text-white hover:scale-105'
                    }`}
                    title={`Page ${image.pageNumber} - ${isIncluded ? 'Will Process' : 'Will Skip'}`}
                  >
                    {image.pageNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================== SEPARATOR ==================== */}
        <div className="border-t border-zinc-700 my-2"></div>

        {/* Summary and Action Buttons */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Processing Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Pages:</span>
                <span className="text-white ml-2 font-semibold">{images.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Will Process:</span>
                <span className="text-green-400 ml-2 font-semibold">{finalPageList.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Will Skip:</span>
                <span className="text-red-400 ml-2 font-semibold">{images.length - finalPageList.length}</span>
              </div>
            </div>
            
            {selectionMode === 'exclude' && pageInput && (
              <div className="mt-3 text-xs text-red-300">
                Excluding pages: <span className="font-mono bg-zinc-700 px-2 py-1 rounded">{pageInput}</span>
              </div>
            )}
            
            {selectionMode === 'include' && pageInput && (
              <div className="mt-3 text-xs text-blue-300">
                Including only pages: <span className="font-mono bg-zinc-700 px-2 py-1 rounded">{pageInput}</span>
              </div>
            )}
            
            {finalPageList.length === 0 && selectionMode !== 'all' && (
              <div className="mt-3 text-yellow-400 text-sm">
                ⚠️ No pages selected for processing
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap justify-end">
            <button
              onClick={handleExtractAll}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Quick: Extract All Pages'}
            </button>
            <button
              onClick={handleProcessSelected}
              disabled={finalPageList.length === 0 || loading || !validationResult.isValid}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Extract Selected (${finalPageList.length})`}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ImageSelection;