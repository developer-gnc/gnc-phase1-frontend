import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ImageSelection({ images, onProcessSelected, onSelectAll, loading, onUploadNew, conversionStatus }) {
  const [selectionMode, setSelectionMode] = useState('all'); // 'all', 'exclude', 'include'
  const [pageInput, setPageInput] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [inputError, setInputError] = useState('');
  const [availableImages, setAvailableImages] = useState(images || []);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash'); // Model selection state
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Update available images when new ones come in (real-time streaming)
  useEffect(() => {
    setAvailableImages(images || []);
  }, [images]);

  // Adjust current image index if it becomes invalid
  useEffect(() => {
    if (currentImageIndex >= availableImages.length && availableImages.length > 0) {
      setCurrentImageIndex(availableImages.length - 1);
    }
  }, [availableImages.length, currentImageIndex]);

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

  // Check conversion status
  const conversionStats = useMemo(() => {
    const total = availableImages.length;
    const successful = availableImages.filter(img => !img.conversionError).length;
    const failed = availableImages.filter(img => img.conversionError).length;
    // Mark as all converted when we have processed all pages (regardless of success/failure)
    const allConverted = conversionStatus?.conversionComplete || conversionStatus?.allConverted || false;
    
    return { total, successful, failed, allConverted };
  }, [availableImages, conversionStatus]);

  // Memoize all page numbers to prevent recalculation
  const allPageNumbers = useMemo(() => {
    return availableImages
      .filter(img => !img.conversionError) // Only include successfully converted pages
      .map(img => img.pageNumber)
      .sort((a, b) => a - b);
  }, [availableImages]);

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
      
      // Validate that input pages exist in the document and were converted successfully
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
          error: `Pages not found or failed to convert: ${invalidPages.join(', ')}` 
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
    if (!conversionStats.allConverted) {
      setInputError('Please wait for all pages to finish converting before processing');
      return;
    }

    if (!validationResult.isValid) {
      setInputError(validationResult.error);
      return;
    }

    if (finalPageList.length === 0 && selectionMode !== 'all') {
      setInputError('No valid pages to process');
      return;
    }
    
    // Show model selector before processing
    setShowModelSelector(true);
  }, [validationResult, finalPageList, selectionMode, conversionStats.allConverted]);

  const handleExtractAll = useCallback(() => {
    if (!conversionStats.allConverted) {
      setInputError('Please wait for all pages to finish converting before processing');
      return;
    }
    
    // Show model selector before processing
    setShowModelSelector(true);
  }, [conversionStats.allConverted]);

  // Handle model selection and proceed with processing
  const proceedWithProcessing = useCallback((isExtractAll) => {
    setShowModelSelector(false);
    
    if (isExtractAll) {
      // Only include successfully converted images
      const selectedImageData = availableImages.filter(img => !img.conversionError);
      onProcessSelected(selectedImageData, selectedModel);
    } else {
      // Only include successfully converted images
      const selectedImageData = availableImages.filter(img => 
        finalPageList.includes(img.pageNumber) && !img.conversionError
      );
      onProcessSelected(selectedImageData, selectedModel);
    }
  }, [availableImages, finalPageList, selectedModel, onProcessSelected]);

  // Current image helper
  const currentImage = availableImages[currentImageIndex];
  const isCurrentPageIncluded = currentImage ? finalPageList.includes(currentImage.pageNumber) : false;

  // Navigation
  const navigateImage = useCallback((direction) => {
    if (direction === 'next' && currentImageIndex < availableImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  }, [currentImageIndex, availableImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigateImage]);

  const modelOptions = [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Fast and efficient (Current)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Faster with improved accuracy' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Most accurate, slower processing' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Select Pages to Extract</h2>
          <button
            onClick={onUploadNew}
            disabled={loading}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload New PDF
          </button>
        </div>

        {/* Conversion Status */}
        {!conversionStats.allConverted && (
          <div className="bg-blue-900 bg-opacity-30 border border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
              <div>
                <p className="text-blue-400 font-semibold">Converting PDF to Images...</p>
                <p className="text-blue-300 text-sm">
                  {conversionStats.successful} of {conversionStats.total} pages converted
                  {conversionStats.failed > 0 && ` (${conversionStats.failed} failed)`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selection Mode */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Selection Mode</label>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handleModeChange('all')}
              disabled={loading}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                selectionMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              📄 Extract All Pages
            </button>
            <button
              onClick={() => handleModeChange('include')}
              disabled={loading}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                selectionMode === 'include'
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              ✅ Include Only Specific Pages
            </button>
            <button
              onClick={() => handleModeChange('exclude')}
              disabled={loading}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                selectionMode === 'exclude'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              ❌ Exclude Specific Pages
            </button>
          </div>
        </div>

        {/* Page Input */}
        {selectionMode !== 'all' && (
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              {selectionMode === 'include' ? 'Pages to Include' : 'Pages to Exclude'}
            </label>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              placeholder="e.g., 1,4,6-10,15"
              disabled={loading}
              className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-2">
              Enter page numbers separated by commas. Use hyphens for ranges (e.g., 1,4,6-10,15)
            </p>
            {inputError && (
              <p className="text-red-400 text-sm mt-2">⚠️ {inputError}</p>
            )}
            {!validationResult.isValid && pageInput && (
              <p className="text-red-400 text-sm mt-2">⚠️ {validationResult.error}</p>
            )}
            {validationResult.isValid && pageInput && finalPageList.length > 0 && (
              <p className="text-green-400 text-sm mt-2">
                ✅ {finalPageList.length} pages {selectionMode === 'include' ? 'will be processed' : 'will be skipped'}
              </p>
            )}
          </div>
        )}

        {/* Image Preview */}
        <div className="border-t border-zinc-700 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Preview & Navigate ({currentImageIndex + 1} of {availableImages.length})
          </h3>
          
          <div className="relative bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
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
                    disabled={currentImageIndex === availableImages.length - 1}
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
                  <p className="text-red-200 text-xs mt-2">This page will be automatically excluded from processing</p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Page Navigation Dots with Status */}
          <div className="flex justify-center space-x-2 max-h-20 overflow-y-auto">
            <div className="flex space-x-1 py-2">
              {availableImages.map((image, index) => {
                const isIncluded = finalPageList.includes(image.pageNumber);
                const hasError = image.conversionError;
                return (
                  <motion.button
                    key={image.pageNumber}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                      index === currentImageIndex
                        ? 'bg-blue-600 text-white scale-110'
                        : hasError
                        ? 'bg-red-800 text-red-200 hover:scale-105'
                        : isIncluded
                        ? 'bg-green-600 text-white hover:scale-105'
                        : 'bg-red-600 text-white hover:scale-105'
                    }`}
                    title={`Page ${image.pageNumber} - ${
                      hasError ? 'Conversion Failed' : 
                      isIncluded ? 'Will Process' : 'Will Skip'
                    }`}
                  >
                    {hasError ? '✗' : image.pageNumber}
                  </motion.button>
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Pages:</span>
                <span className="text-white ml-2 font-semibold">{availableImages.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Converted:</span>
                <span className="text-green-400 ml-2 font-semibold">{conversionStats.successful}</span>
              </div>
              <div>
                <span className="text-gray-400">Will Process:</span>
                <span className="text-green-400 ml-2 font-semibold">{finalPageList.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Will Skip:</span>
                <span className="text-red-400 ml-2 font-semibold">{conversionStats.successful - finalPageList.length}</span>
              </div>
            </div>
            
            {conversionStats.failed > 0 && (
              <div className="mt-3 text-xs text-red-300">
                <span className="font-semibold">{conversionStats.failed} pages failed conversion</span> and will be automatically excluded
              </div>
            )}
            
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
            
            {!conversionStats.allConverted && (
              <div className="mt-3 text-blue-400 text-sm">
                ⏳ Conversion in progress... Extract buttons will be enabled when complete
              </div>
            )}
            
            {conversionStats.allConverted && (
              <div className="mt-3 text-green-400 text-sm">
                ✅ All pages processed! Extract buttons are now enabled
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap justify-end">
            <button
              onClick={handleExtractAll}
              disabled={loading || !conversionStats.allConverted || conversionStats.successful === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Quick: Extract All Converted (${conversionStats.successful})`}
            </button>
            <button
              onClick={handleProcessSelected}
              disabled={finalPageList.length === 0 || loading || !validationResult.isValid || !conversionStats.allConverted}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Extract Selected (${finalPageList.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Model Selection Modal */}
      <AnimatePresence>
        {showModelSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-900 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-2xl w-full border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Select AI Model</h3>
                <p className="text-gray-400 text-sm">
                  Choose which Gemini model to use for data extraction
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {modelOptions.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => setSelectedModel(model.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedModel === model.value
                        ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold text-white">{model.label}</h4>
                          {selectedModel === model.value && (
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{model.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-blue-300">
                      <strong>Tip:</strong> Flash models are faster for large documents, while Pro provides higher accuracy for complex invoices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModelSelector(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-semibold border border-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => proceedWithProcessing(selectionMode === 'all')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Start Extraction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ImageSelection;