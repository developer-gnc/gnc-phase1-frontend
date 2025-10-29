import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx-js-style';
import FileUpload from '../components/FileUpload';
import ImageSelection from '../components/ImageSelection';
import DataTable from '../components/DataTable';
import TotalsSummary from '../components/TotalsSummary';
import ConsolidatedView from '../components/ConsolidatedView';
import { API_URL } from '../config/api';
import api from '../config/api';
import InvoiceExtractorSecondHalf from './InvoiceExtractorSecondHalf';

function InvoiceExtractor({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [allPagesData, setAllPagesData] = useState([]);
  const [collectedResult, setCollectedResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('labour');
  const [viewMode, setViewMode] = useState('collected');
  const [selectedPage, setSelectedPage] = useState(1);
  const [showRaw, setShowRaw] = useState(false);
  const [showImage, setShowImage] = useState(true);
  const [selectedRowImage, setSelectedRowImage] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  // OPTIMIZED: Image selection state with real-time streaming
  const [showImageSelection, setShowImageSelection] = useState(false);
  const [availableImages, setAvailableImages] = useState([]);
  const [processingPhase, setProcessingPhase] = useState('upload'); // 'upload', 'converting', 'selection', 'processing', 'complete'
  const [conversionProgress, setConversionProgress] = useState({ converted: 0, total: 0 });
  const [conversionStatus, setConversionStatus] = useState({ conversionComplete: false, allConverted: false });

  const abortControllerRef = useRef(null);
  const readerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const currentSessionIdRef = useRef(null);

  // Function to add authentication token to image URLs
  const getAuthenticatedImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    const token = localStorage.getItem('authToken');
    if (!token) return imageUrl;
    
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}token=${token}`;
  };

  // Reset to upload state
  const resetToUpload = () => {
    setFile(null);
    setLoading(false);
    setProgress({ current: 0, total: 0 });
    setAllPagesData([]);
    setCollectedResult(null);
    setError(null);
    setActiveTab('labour');
    setViewMode('collected');
    setSelectedPage(1);
    setShowRaw(false);
    setShowImage(true);
    setSelectedRowImage(null);
    setProcessingStatus('');
    setSessionId(null);
    setShowImageSelection(false);
    setAvailableImages([]);
    setProcessingPhase('upload');
    setConversionProgress({ converted: 0, total: 0 });
    setConversionStatus({ conversionComplete: false, allConverted: false });
    if (currentSessionIdRef.current) {
      cleanupCurrentSession();
    }
  };

  // Cleanup session images when component unmounts or session changes
  const cleanupCurrentSession = async () => {
    if (currentSessionIdRef.current) {
      try {
        await api.post('/api/cleanup-session-images', { 
          sessionId: currentSessionIdRef.current 
        });
        console.log(`Cleaned up images for session: ${currentSessionIdRef.current}`);
      } catch (error) {
        console.log(`Could not cleanup session images: ${error.message}`);
      }
      currentSessionIdRef.current = null;
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProcessingRef.current) {
        e.preventDefault();
        e.returnValue = 'Processing is in progress. Are you sure you want to leave?';
        return e.returnValue;
      } else if (currentSessionIdRef.current) {
        cleanupCurrentSession();
      }
    };

    const handlePopState = (e) => {
      if (isProcessingRef.current) {
        e.preventDefault();
        window.history.pushState(null, '', location.pathname);
        setShowCancelConfirm(true);
      } else if (currentSessionIdRef.current) {
        cleanupCurrentSession();
      }
    };

    window.history.pushState(null, '', location.pathname);

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      
      if (isProcessingRef.current && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      cleanupCurrentSession();
    };
  }, [location.pathname]);

  useEffect(() => {
    isProcessingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (sessionId) {
      if (currentSessionIdRef.current && currentSessionIdRef.current !== sessionId) {
        cleanupCurrentSession();
      }
      currentSessionIdRef.current = sessionId;
    }
  }, [sessionId]);

  // Fix: Update selectedPage when switching to individual view or when allPagesData changes
  useEffect(() => {
    if (viewMode === 'individual' && allPagesData.length > 0) {
      const availablePageNumbers = allPagesData.map(p => p.pageNumber).sort((a, b) => a - b);
      if (!availablePageNumbers.includes(selectedPage)) {
        setSelectedPage(availablePageNumbers[0]);
      }
    }
  }, [viewMode, allPagesData, selectedPage]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      // Reset all states when new file is selected
      setAllPagesData([]);
      setCollectedResult(null);
      setShowImageSelection(false);
      setAvailableImages([]);
      setProcessingPhase('upload');
      setConversionProgress({ converted: 0, total: 0 });
      setConversionStatus({ conversionComplete: false, allConverted: false });
      if (currentSessionIdRef.current) {
        cleanupCurrentSession();
      }
      setSessionId(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const cancelProcessing = async () => {
    console.log('Cancelling PDF processing...');
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        console.log('Reader already closed');
      }
    }

    if (sessionId) {
      try {
        await api.post('/api/cancel-processing', { sessionId });
      } catch (error) {
        console.log('Cancel request failed:', error.message);
      }
    }

    setLoading(false);
    setProcessingStatus('Processing cancelled');
    setError(null);
    isProcessingRef.current = false;
    setSessionId(null);
    setShowImageSelection(false);
    setProcessingPhase('upload');
    setConversionProgress({ converted: 0, total: 0 });

    console.log('Processing cancelled successfully');
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
    await cancelProcessing();
    setShowCancelConfirm(false);
  };

  const handleNavigateBack = async () => {
    await cancelProcessing();
    await cleanupCurrentSession();
    setShowCancelConfirm(false);
    navigate('/dashboard');
  };

  // NEW: Handle upload new file - cancel current process and reset
  const handleUploadNew = async () => {
    console.log('Upload new file requested - canceling current process...');
    
    // Cancel any ongoing processing
    if (loading || isProcessingRef.current) {
      await cancelProcessing();
    }
    
    // Cleanup current session
    await cleanupCurrentSession();
    
    // Reset to upload state
    resetToUpload();
    
    console.log('Reset to upload state complete');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError(null);
    setAllPagesData([]);
    setCollectedResult(null);
    setAvailableImages([]);
    setProgress({ current: 0, total: 0 });
    setConversionProgress({ converted: 0, total: 0 });
    setProcessingStatus('Starting optimized processing...');
    isProcessingRef.current = true;
    setSessionId(null);
    setProcessingPhase('converting');

    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('userId', user.id);

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/api/process-pdf`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              
              const data = JSON.parse(jsonStr);

              if (data.sessionId && !sessionId) {
                setSessionId(data.sessionId);
              }

              if (data.type === 'status') {
                setProgress({ current: data.currentPage, total: data.totalPages });
                setProcessingStatus(data.message);
              } else if (data.type === 'progress') {
                setProgress({ current: data.currentPage, total: data.totalPages });
                setProcessingStatus(data.message);
              } else if (data.type === 'images_batch_ready') {
                // OPTIMIZED: Real-time streaming of converted images
                const newImages = data.batchImages;
                setAvailableImages(prev => {
                  const combined = [...prev, ...newImages];
                  return combined.sort((a, b) => a.pageNumber - b.pageNumber);
                });
                setConversionProgress({ 
                  converted: data.totalConverted, 
                  total: data.totalPages 
                });
                setProcessingStatus(data.message);
                
                // Show image selection as soon as first batch is ready
                if (!showImageSelection) {
                  setShowImageSelection(true);
                  setProcessingPhase('selection');
                  setLoading(false);
                  isProcessingRef.current = false;
                }
              } else if (data.type === 'images_ready') {
                // Final images ready for selection - mark conversion as complete
                setAvailableImages(data.allImages);
                setShowImageSelection(true);
                setProcessingPhase('selection');
                setLoading(false);
                isProcessingRef.current = false;
                setProcessingStatus('All images ready for selection');
                // Mark conversion as complete to enable extract buttons
                setConversionStatus({ 
                  conversionComplete: data.conversionComplete || true, 
                  allConverted: true 
                });
              } else if (data.type === 'page_complete') {
                setAllPagesData(prev => {
                  const newData = [...prev, {
                    pageNumber: data.pageNumber,
                    data: data.pageData,
                    rawOutput: data.rawOutput,
                    imageUrl: data.imageUrl,
                    error: data.error
                  }];
                  return newData;
                });
                
                setProcessingStatus(data.message);
              } else if (data.type === 'complete') {
                setCollectedResult(data.collectedResult);
                setAllPagesData(data.allPagesData);
                setLoading(false);
                isProcessingRef.current = false;
                setProcessingStatus('Processing complete!');
                setProcessingPhase('complete');
              } else if (data.type === 'error') {
                setError(data.error);
                setLoading(false);
                isProcessingRef.current = false;
                setProcessingStatus('Error occurred');
                setProcessingPhase('upload');
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
      
      if (buffer.trim().startsWith('data: ')) {
        try {
          const jsonStr = buffer.slice(6).trim();
          if (jsonStr) {
            const data = JSON.parse(jsonStr);
            if (data.type === 'complete') {
              setCollectedResult(data.collectedResult);
              setAllPagesData(data.allPagesData);
              setProcessingPhase('complete');
            }
          }
        } catch (e) {
          console.error('Error parsing final buffer:', e);
        }
      }
      
      setLoading(false);
      isProcessingRef.current = false;
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request was cancelled');
        setError('Processing was cancelled');
        setProcessingStatus('Cancelled');
      } else {
        console.error('Upload error:', err);
        setError(err.message || 'An error occurred while processing the PDF');
        setProcessingStatus('Error occurred');
      }
      setLoading(false);
      isProcessingRef.current = false;
      setProcessingPhase('upload');
    } finally {
      readerRef.current = null;
      abortControllerRef.current = null;
    }
  };

  // OPTIMIZED: Handle selected images processing with model selection
  const handleProcessSelected = async (selectedImages, selectedModel = 'gemini-2.0-flash') => {
    if (!selectedImages || selectedImages.length === 0) {
      setError('No images selected for processing');
      return;
    }

    setLoading(true);
    setError(null);
    setAllPagesData([]);
    setCollectedResult(null);
    setProcessingStatus(`Starting AI analysis with ${selectedModel}...`);
    setProcessingPhase('processing');
    isProcessingRef.current = true;

    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('authToken');
      const selectedPageNumbers = selectedImages.map(img => img.pageNumber);

      const response = await fetch(`${API_URL}/api/process-selected-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          selectedPageNumbers: selectedPageNumbers,
          sessionId: sessionId,
          model: selectedModel  // Add model parameter
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              
              const data = JSON.parse(jsonStr);

              if (data.type === 'status') {
                setProcessingStatus(data.message);
              } else if (data.type === 'progress') {
                setProgress({ current: data.currentPage, total: data.totalPages });
                setProcessingStatus(data.message);
              } else if (data.type === 'page_complete') {
                setAllPagesData(prev => {
                  const newData = [...prev, {
                    pageNumber: data.pageNumber,
                    data: data.pageData,
                    rawOutput: data.rawOutput,
                    imageUrl: data.imageUrl,
                    error: data.error
                  }];
                  return newData.sort((a, b) => a.pageNumber - b.pageNumber);
                });
                setProcessingStatus(data.message);
              } else if (data.type === 'complete') {
                setCollectedResult(data.collectedResult);
                setAllPagesData(data.allPagesData);
                setLoading(false);
                isProcessingRef.current = false;
                setProcessingStatus('AI analysis complete!');
                setProcessingPhase('complete');
              } else if (data.type === 'error') {
                setError(data.error);
                setLoading(false);
                isProcessingRef.current = false;
                setProcessingStatus('Error occurred');
                setProcessingPhase('selection');
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      if (buffer.trim().startsWith('data: ')) {
        try {
          const jsonStr = buffer.slice(6).trim();
          if (jsonStr) {
            const data = JSON.parse(jsonStr);
            if (data.type === 'complete') {
              setCollectedResult(data.collectedResult);
              setAllPagesData(data.allPagesData);
              setProcessingPhase('complete');
            }
          }
        } catch (e) {
          console.error('Error parsing final buffer:', e);
        }
      }
      
      setLoading(false);
      isProcessingRef.current = false;
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('AI analysis was cancelled');
        setError('Analysis was cancelled');
        setProcessingStatus('Cancelled');
      } else {
        console.error('AI analysis error:', err);
        setError(err.message || 'An error occurred during AI analysis');
        setProcessingStatus('Error occurred');
      }
      setLoading(false);
      isProcessingRef.current = false;
      setProcessingPhase('selection');
    } finally {
      readerRef.current = null;
      abortControllerRef.current = null;
    }
  };

  // Handle extract all (shortcut for all valid images)
  const handleExtractAll = async () => {
    const allValidImages = availableImages.filter(img => !img.conversionError);
    await handleProcessSelected(allValidImages);
  };

  // Pass all props to second half
  return (
    <InvoiceExtractorSecondHalf 
      // All state
      file={file}
      loading={loading}
      progress={progress}
      allPagesData={allPagesData}
      collectedResult={collectedResult}
      error={error}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      viewMode={viewMode}
      setViewMode={setViewMode}
      selectedPage={selectedPage}
      setSelectedPage={setSelectedPage}
      showRaw={showRaw}
      setShowRaw={setShowRaw}
      showImage={showImage}
      setShowImage={setShowImage}
      selectedRowImage={selectedRowImage}
      setSelectedRowImage={setSelectedRowImage}
      processingStatus={processingStatus}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      sessionId={sessionId}
      showImageSelection={showImageSelection}
      availableImages={availableImages}
      processingPhase={processingPhase}
      conversionProgress={conversionProgress}
      conversionStatus={conversionStatus}
      
      // All functions
      getAuthenticatedImageUrl={getAuthenticatedImageUrl}
      handleFileChange={handleFileChange}
      handleUpload={handleUpload}
      handleUploadNew={handleUploadNew}
      handleCancelClick={handleCancelClick}
      confirmCancel={confirmCancel}
      handleProcessSelected={handleProcessSelected}
      handleExtractAll={handleExtractAll}
      user={user}
      onLogout={onLogout}
    />
  );
}

export default InvoiceExtractor;