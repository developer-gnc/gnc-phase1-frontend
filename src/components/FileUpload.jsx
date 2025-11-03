import { motion } from 'framer-motion';
import { useState } from 'react';

function FileUpload({ file, loading, progress, allPagesData, error, processingStatus, onFileChange, onUpload, onCancel }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (loading) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      onFileChange({ target: { files: [droppedFile] } });
    }
  };

  // Calculate statistics - only count actual errors
  const pagesWithData = allPagesData.filter(p => !p.error).length;
  const pagesWithErrors = allPagesData.filter(p => p.error).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl"
    >
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Invoice Data Extractor</h1>
      
      <div className="space-y-4">
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors bg-zinc-800 bg-opacity-50 ${
            isDragging ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-zinc-700 hover:border-blue-500'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={onFileChange}
            className="hidden"
            id="file-upload"
            disabled={loading}
          />
          <label htmlFor="file-upload" className={`cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm text-gray-300">
                {file ? file.name : 'Click to upload PDF or drag and drop'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Only PDF files are supported (Max 100MB)
              </p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onUpload}
            disabled={!file || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold disabled:bg-zinc-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Extract Data'}
          </button>
          
          {loading && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onCancel}
              className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </motion.button>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-900 bg-opacity-30 border border-red-800 text-red-400 px-4 py-3 rounded-lg"
          >
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {!loading && !error && processingStatus === 'Processing cancelled' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-900 bg-opacity-30 border border-blue-800 text-blue-400 px-4 py-3 rounded-lg"
          >
            <p className="font-semibold">Processing Cancelled</p>
            <p className="text-sm">You cancelled the processing. You can upload a new file to start again.</p>
          </motion.div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-300 font-semibold">
              {processingStatus || `Processing page ${progress.current} of ${progress.total}...`}
            </p>
            {progress.total > 0 && (
              <>
                <div className="w-full bg-zinc-800 rounded-full h-3 mt-4">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {Math.round((progress.current / progress.total) * 100)}% Complete
                </p>
              </>
            )}
          </div>
        )}

        {loading && allPagesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-900 bg-opacity-30 border border-green-800 p-4 rounded-lg"
          >
            <p className="text-green-400 font-semibold mb-2">Processing Progress:</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {allPagesData.map(page => (
                <span 
                  key={page.pageNumber} 
                  className={`${page.error ? 'bg-red-600' : 'bg-green-600'} text-white px-3 py-1 rounded-full text-sm`}
                  title={page.error || 'Success'}
                >
                  Page {page.pageNumber} {page.error ? '❌' : '✅'}
                </span>
              ))}
            </div>
          </motion.div>
        )}
        
        {!loading && allPagesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-900 bg-opacity-30 border border-blue-800 p-4 rounded-lg"
          >
            <p className="text-blue-400 font-semibold mb-2">✅ Processing Complete</p>
            <div className="text-sm text-blue-300 space-y-1">
              <p>📄 Total Pages: {allPagesData.length}</p>
              <p>✓ Successfully Processed: {pagesWithData}</p>
              {pagesWithErrors > 0 && (
                <p className="text-red-400">❌ Failed Pages: {pagesWithErrors}</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default FileUpload;