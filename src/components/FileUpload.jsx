function FileUpload({ file, loading, progress, allPagesData, error, processingStatus, onFileChange, onUpload }) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Invoice Data Extractor</h1>
        <p className="text-gray-600 mb-6">Upload PDF invoices to extract and categorize data automatically using Gemini AI</p>
  
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={onFileChange}
              className="hidden"
              id="file-upload"
              disabled={loading}
            />
            <label htmlFor="file-upload" className={`cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="text-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm">
                  {file ? file.name : 'Click to upload PDF or drag and drop'}
                </p>
              </div>
            </label>
          </div>
  
          <button
            onClick={onUpload}
            disabled={!file || loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Extract Data'}
          </button>
  
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
  
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 font-semibold">
                {processingStatus || `Processing page ${progress.current} of ${progress.total}...`}
              </p>
              {progress.total > 0 && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {Math.round((progress.current / progress.total) * 100)}% Complete
                  </p>
                </>
              )}
            </div>
          )}
  
          {loading && allPagesData.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-700 font-semibold mb-2">Pages Completed:</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {allPagesData.map(page => (
                  <span 
                    key={page.pageNumber} 
                    className={`${page.error ? 'bg-yellow-500' : 'bg-green-600'} text-white px-3 py-1 rounded-full text-sm`}
                    title={page.error || 'Success'}
                  >
                    Page {page.pageNumber} {page.error ? '⚠️' : '✓'}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {!loading && allPagesData.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-blue-700 font-semibold mb-2">Processing Summary:</p>
              <div className="text-sm text-blue-800">
                <p>Total Pages: {allPagesData.length}</p>
                <p>Successful: {allPagesData.filter(p => !p.error).length}</p>
                <p>With Warnings: {allPagesData.filter(p => p.error).length}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  export default FileUpload;