import { motion } from 'framer-motion';
import { useState } from 'react';

function FileUpload({ 
  file, 
  loading, 
  progress, 
  allPagesData, 
  error, 
  processingStatus, 
  onFileChange, 
  onUpload, 
  onCancel,
  processingPhase,
  conversionProgress,
  conversionStatus,
  customPrompts,
  onCustomPromptsChange,
  buildFinalPrompt,
  // NEW PROPS FOR FRESH PROMPT
  useFreshPrompt,
  onUseFreshPromptChange,
  freshCustomRules,
  onFreshCustomRulesChange
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showCustomPrompts, setShowCustomPrompts] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');

  // NEW STATE FOR FRESH CUSTOM RULES
  const [newFreshRule, setNewFreshRule] = useState('');

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (loading) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      onFileChange({ target: { files: [droppedFile] } });
    }
  };

  // Custom prompts management functions
  const addCustomPrompt = () => {
    if (newPrompt.trim()) {
      onCustomPromptsChange([...customPrompts, newPrompt.trim()]);
      setNewPrompt('');
    }
  };

  const removeCustomPrompt = (index) => {
    const updatedPrompts = customPrompts.filter((_, i) => i !== index);
    onCustomPromptsChange(updatedPrompts);
  };

  // NEW FUNCTIONS FOR FRESH CUSTOM RULES
  const addFreshCustomRule = () => {
    if (newFreshRule.trim()) {
      onFreshCustomRulesChange([...freshCustomRules, newFreshRule.trim()]);
      setNewFreshRule('');
    }
  };

  const removeFreshCustomRule = (index) => {
    const updatedRules = freshCustomRules.filter((_, i) => i !== index);
    onFreshCustomRulesChange(updatedRules);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addCustomPrompt();
    }
  };

  // NEW FUNCTION FOR FRESH RULES KEY PRESS
  const handleFreshKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addFreshCustomRule();
    }
  };

  // Calculate statistics for completed processing
  const pagesWithData = allPagesData.filter(p => !p.error).length;
  const pagesWithErrors = allPagesData.filter(p => p.error).length;

  // Show conversion progress if we're converting
  const showConversionProgress = processingPhase === 'converting' && conversionProgress.total > 0;
  
  // Show analysis progress if we're processing
  const showAnalysisProgress = processingPhase === 'processing' && progress.total > 0;

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
            {loading && processingPhase === 'converting' ? 'Converting PDF...' : 
             loading && processingPhase === 'processing' ? 'Processing...' : 
             'Convert to Images'}
          </button>
          
          {/* NEW PROMPT MODE SWITCH */}
          <div className="flex items-center gap-3 bg-zinc-800 px-4 py-3 rounded-lg">
            <span className={`text-sm font-medium transition-colors ${!useFreshPrompt ? 'text-white' : 'text-gray-400'}`}>
              Default
            </span>
            <button
              onClick={() => onUseFreshPromptChange(!useFreshPrompt)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                useFreshPrompt ? 'bg-blue-600' : 'bg-zinc-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useFreshPrompt ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${useFreshPrompt ? 'text-white' : 'text-gray-400'}`}>
              Fresh
            </span>
          </div>
          
          <button
            onClick={() => setShowCustomPrompts(!showCustomPrompts)}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-lg font-semibold disabled:bg-zinc-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Add custom extraction rules"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Custom Rules
            {(useFreshPrompt ? freshCustomRules.length : customPrompts.length) > 0 && (
              <span className="bg-teal-800 text-teal-200 px-2 py-1 rounded-full text-xs">
                {useFreshPrompt ? freshCustomRules.length : customPrompts.length}
              </span>
            )}
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

        {/* PDF Conversion Progress */}
        {showConversionProgress && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-300 font-semibold">
              {processingStatus || `Converting page ${conversionProgress.converted} of ${conversionProgress.total}...`}
            </p>
            <div className="w-full bg-zinc-800 rounded-full h-3 mt-4">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(conversionProgress.converted / conversionProgress.total) * 100}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              {Math.round((conversionProgress.converted / conversionProgress.total) * 100)}% Complete
            </p>
          </div>
        )}

        {/* AI Analysis Progress */}
        {showAnalysisProgress && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-300 font-semibold">
              {processingStatus || `Analyzing page ${progress.current} of ${progress.total}...`}
            </p>
            <div className="w-full bg-zinc-800 rounded-full h-3 mt-4">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              {Math.round((progress.current / progress.total) * 100)}% Complete
            </p>
          </div>
        )}

        {/* Show conversion complete status */}
        {processingPhase === 'selection' && conversionStatus.conversionComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-900 bg-opacity-30 border border-blue-800 p-4 rounded-lg"
          >
            <p className="text-blue-400 font-semibold mb-2">✅ PDF Converted Successfully</p>
            <div className="text-sm text-blue-300 space-y-1">
              <p>📄 Total Pages: {conversionProgress.total}</p>
              <p>✅ Converted Successfully: {conversionProgress.converted}</p>
              <p className="text-gray-300">Select images to process with AI analysis</p>
            </div>
          </motion.div>
        )}

        {/* Show processing results */}
        {loading && processingPhase === 'processing' && allPagesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-900 bg-opacity-30 border border-green-800 p-4 rounded-lg"
          >
            <p className="text-green-400 font-semibold mb-2">AI Analysis Progress:</p>
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
        
        {/* Custom Prompts Section - EXACTLY THE SAME AS BEFORE */}
        {!loading && showCustomPrompts && !useFreshPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-teal-900 bg-opacity-20 border border-teal-800 rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-teal-400 font-semibold">Custom Extraction Rules</h3>
              <button
                onClick={() => setShowCustomPrompts(false)}
                className="text-teal-400 hover:text-teal-300 transition-colors p-1"
                title="Close custom prompts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
             
              
              {/* Current custom prompts list */}
              {customPrompts.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customPrompts.map((prompt, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-teal-800 bg-opacity-30 border border-teal-700 rounded-lg p-3 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <span className="text-teal-400 font-medium text-sm">Point {27 + index}:</span>
                        <p className="text-teal-200 text-sm mt-1">{prompt}</p>
                      </div>
                      <button
                        onClick={() => removeCustomPrompt(index)}
                        className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0 p-1"
                        title="Remove this rule"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add new prompt */}
              <div className="flex gap-2">
                <textarea
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Add new rule...`}
                  className="flex-1 bg-zinc-800 border border-teal-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm resize-none"
                  rows={2}
                />
                <button
                  onClick={addCustomPrompt}
                  disabled={!newPrompt.trim()}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-semibold disabled:bg-zinc-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  Add Rule
                </button>
              </div>

              {customPrompts.length > 0 && buildFinalPrompt && (
                <div className="text-xs text-teal-300 border-t border-teal-800 pt-2">
                  Your custom rules will be appended to the base prompt as points 27-{26 + customPrompts.length}.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* NEW FRESH CUSTOM RULES SECTION */}
        {!loading && showCustomPrompts && useFreshPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-900 bg-opacity-20 border border-purple-800 rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-purple-400 font-semibold">Fresh Prompt Custom Rules</h3>
                <p className="text-purple-300 text-xs mt-1">
                  These rules will be added to the fresh prompt
                </p>
              </div>
              <button
                onClick={() => setShowCustomPrompts(false)}
                className="text-purple-400 hover:text-purple-300 transition-colors p-1"
                title="Close custom rules"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* Current fresh custom rules list */}
              {freshCustomRules.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {freshCustomRules.map((rule, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-purple-800 bg-opacity-30 border border-purple-700 rounded-lg p-3 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <span className="text-purple-400 font-medium text-sm">Fresh Rule {index + 1}:</span>
                        <p className="text-purple-200 text-sm mt-1">{rule}</p>
                      </div>
                      <button
                        onClick={() => removeFreshCustomRule(index)}
                        className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0 p-1"
                        title="Remove this rule"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add new fresh rule */}
              <div className="flex gap-2">
                <textarea
                  value={newFreshRule}
                  onChange={(e) => setNewFreshRule(e.target.value)}
                  onKeyPress={handleFreshKeyPress}
                  placeholder="Add new fresh prompt rule..."
                  className="flex-1 bg-zinc-800 border border-purple-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm resize-none"
                  rows={2}
                />
                <button
                  onClick={addFreshCustomRule}
                  disabled={!newFreshRule.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:bg-zinc-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  Add Rule
                </button>
              </div>

              {freshCustomRules.length > 0 && (
                <div className="text-xs text-purple-300 border-t border-purple-800 pt-2">
                  Your custom rules will be added to the fresh prompt as additional rules.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Final completion status */}
        {!loading && processingPhase === 'complete' && allPagesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-900 bg-opacity-30 border border-blue-800 p-4 rounded-lg"
          >
            <p className="text-blue-400 font-semibold mb-2">✅ Processing Complete</p>
            <div className="text-sm text-blue-300 space-y-1">
              <p>📄 Total Pages: {allPagesData.length}</p>
              <p>✅ Successfully Processed: {pagesWithData}</p>
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