import { useState } from 'react';
import { motion } from 'framer-motion';

function ImageSelection({ images, onProcessSelected, onSelectAll, loading }) {
  const [selectedImages, setSelectedImages] = useState(new Set(images.map(img => img.pageNumber)));

  const getAuthenticatedImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    const token = localStorage.getItem('authToken');
    if (!token) return imageUrl;
    
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}token=${token}`;
  };

  const toggleImageSelection = (pageNumber) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(pageNumber)) {
      newSelected.delete(pageNumber);
    } else {
      newSelected.add(pageNumber);
    }
    setSelectedImages(newSelected);
  };

  const selectAll = () => {
    const allPages = new Set(images.map(img => img.pageNumber));
    setSelectedImages(allPages);
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  const handleProcessSelected = () => {
    const selectedImageData = images.filter(img => selectedImages.has(img.pageNumber));
    onProcessSelected(selectedImageData);
  };

  const handleExtractAll = () => {
    onSelectAll(images);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Select Pages to Process</h2>
          <p className="text-gray-400 text-sm">
            Choose which pages you want to extract data from. Exclude blank pages, covers, or irrelevant content.
          </p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={selectAll}
            className="bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
        {images.map((image) => {
          const isSelected = selectedImages.has(image.pageNumber);
          const hasError = image.conversionError;
          
          return (
            <motion.div
              key={image.pageNumber}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: image.pageNumber * 0.05 }}
              className={`relative border-4 rounded-lg overflow-hidden cursor-pointer transition-all ${
                hasError 
                  ? 'border-red-500 bg-red-900 bg-opacity-20' 
                  : isSelected 
                    ? 'border-blue-500' 
                    : 'border-zinc-700 hover:border-zinc-600'
              }`}
              onClick={() => !hasError && toggleImageSelection(image.pageNumber)}
            >
              {hasError ? (
                <div className="aspect-[3/4] flex items-center justify-center bg-red-900 bg-opacity-30">
                  <div className="text-center p-4">
                    <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-red-400 text-xs font-medium">Error</p>
                    <p className="text-red-300 text-xs">Page {image.pageNumber}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Image - 100% visible, no overlay */}
                  <img
                    src={getAuthenticatedImageUrl(image.imageUrl)}
                    alt={`Page ${image.pageNumber}`}
                    className="w-full h-auto aspect-[3/4] object-cover"
                  />
                  
                  {/* Selection indicators - positioned outside the image */}
                  <div className="absolute top-2 right-2">
                    <div className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all shadow-lg ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-400 shadow-blue-500/50' 
                        : 'bg-white/90 border-gray-300 shadow-black/30'
                    }`}>
                      {isSelected && (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Selection border effect - only border, no overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none">
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        SELECTED
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Page number - positioned at bottom */}
              <div className="absolute bottom-2 left-2">
                <span className="bg-black/80 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                  Page {image.pageNumber}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary and action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-zinc-800">
        <div className="text-sm text-gray-400">
          <span className="font-medium text-white">{selectedImages.size}</span> of {images.length} pages selected
          {selectedImages.size === 0 && (
            <span className="text-yellow-400 ml-2">⚠️ No pages selected</span>
          )}
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExtractAll}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white py-2 px-6 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Extract All Pages'}
          </button>
          <button
            onClick={handleProcessSelected}
            disabled={selectedImages.size === 0 || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white py-2 px-6 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Extract Selected (${selectedImages.size})`}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ImageSelection;