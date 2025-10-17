import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx-js-style';
import FileUpload from '../components/FileUpload';
import ImageSelection from '../components/ImageSelection';
import DataTable from '../components/DataTable';
import TotalsSummary from '../components/TotalsSummary';
import { API_URL } from '../config/api';
import api from '../config/api';

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
  
  // NEW: Image selection state
  const [showImageSelection, setShowImageSelection] = useState(false);
  const [availableImages, setAvailableImages] = useState([]);
  const [processingPhase, setProcessingPhase] = useState('upload'); // 'upload', 'selection', 'processing', 'complete'

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

  // Cleanup session images when component unmounts or session changes
  const cleanupCurrentSession = async () => {
    if (currentSessionIdRef.current) {
      try {
        await api.post('/api/cleanup-session-images', { 
          sessionId: currentSessionIdRef.current 
        });
        console.log(`✅ Cleaned up images for session: ${currentSessionIdRef.current}`);
      } catch (error) {
        console.log(`⚠️ Could not cleanup session images: ${error.message}`);
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
      if (currentSessionIdRef.current) {
        cleanupCurrentSession();
      }
      setSessionId(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const cancelProcessing = async () => {
    console.log('🛑 Cancelling PDF processing...');
    
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

    console.log('✅ Processing cancelled successfully');
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

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError(null);
    setAllPagesData([]);
    setCollectedResult(null);
    setProgress({ current: 0, total: 0 });
    setProcessingStatus('Starting...');
    isProcessingRef.current = true;
    setSessionId(null);
    setProcessingPhase('processing');

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
              } else if (data.type === 'images_ready') {
                // NEW: Images are ready for selection
                setAvailableImages(data.allImages);
                setShowImageSelection(true);
                setProcessingPhase('selection');
                setLoading(false);
                isProcessingRef.current = false;
                setProcessingStatus('Images ready for selection');
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

  // NEW: Handle selected images processing
  // NEW: Handle selected images processing - FIXED to send only page numbers
  const handleProcessSelected = async (selectedImages) => {
    if (!selectedImages || selectedImages.length === 0) {
      setError('No images selected for processing');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: selectedImages.length });
    setProcessingStatus('Processing selected images...');
    isProcessingRef.current = true;
    setShowImageSelection(false);
    setProcessingPhase('processing');

    try {
      const token = localStorage.getItem('authToken');
      
      // FIXED: Only send page numbers, not the full image data
      const selectedPageNumbers = selectedImages.map(img => img.pageNumber);
      
      const response = await fetch(`${API_URL}/api/process-selected-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: sessionId,
          selectedPageNumbers: selectedPageNumbers // Only send page numbers
        })
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
                setProgress({ current: data.currentPage, total: data.totalPages });
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
                setProcessingPhase('selection');
                setShowImageSelection(true);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
      
    } catch (err) {
      console.error('Selected processing error:', err);
      setError(err.message || 'An error occurred while processing selected images');
      setLoading(false);
      isProcessingRef.current = false;
      setProcessingPhase('selection');
      setShowImageSelection(true);
    } finally {
      readerRef.current = null;
    }
  };

  // NEW: Handle extract all - FIXED to send only page numbers
  const handleExtractAll = async (allImages) => {
    const selectedPageNumbers = allImages.map(img => img.pageNumber);
    const pageNumberObjects = selectedPageNumbers.map(pageNum => ({ pageNumber: pageNum }));
    await handleProcessSelected(pageNumberObjects);
  };

  // NEW: Handle extract all (same as before but with new endpoint)
 

  // All other functions remain the same...
  const calculateGrandTotals = () => {
    if (!collectedResult) return null;

    const calculateTotal = (data) => data.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);

    const labourTotal = calculateTotal(collectedResult.labour);
    const labourTimesheetTotal = calculateTotal(collectedResult.labourTimesheet);
    const materialTotal = calculateTotal(collectedResult.material);
    const equipmentTotal = calculateTotal(collectedResult.equipment);
    const equipmentLogTotal = calculateTotal(collectedResult.equipmentLog);
    const consumablesTotal = calculateTotal(collectedResult.consumables);
    const subtradeTotal = calculateTotal(collectedResult.subtrade);

    return {
      labour: labourTotal,
      labourTimesheet: labourTimesheetTotal,
      material: materialTotal,
      equipment: equipmentTotal,
      equipmentLog: equipmentLogTotal,
      consumables: consumablesTotal,
      subtrade: subtradeTotal,
      grandTotal: labourTotal + labourTimesheetTotal + materialTotal + equipmentTotal + 
                  equipmentLogTotal + consumablesTotal + subtradeTotal
    };
  };

  const downloadJSON = () => {
    const dataToDownload = {
      collectedResult,
      allPagesData,
      totals: calculateGrandTotals(),
      metadata: {
        fileName: file?.name,
        processedBy: user.email,
        processedAt: new Date().toISOString()
      }
    };
    const dataStr = JSON.stringify(dataToDownload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_data_${Date.now()}.json`;
    link.click();
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const totals = calculateGrandTotals();

    const totalsData = [
      ['GNC Invoice Data'],
      [`Processed by: ${user.email}`],
      [`File: ${file?.name || 'Unknown'}`],
      [`Date: ${new Date().toLocaleDateString()}`],
      [],
      ['Category', 'Items', 'Total Amount'],
      ['Labour', collectedResult.labour.length, `${totals.labour.toFixed(2)}`],
      ['Labour Timesheet', collectedResult.labourTimesheet.length, `${totals.labourTimesheet.toFixed(2)}`],
      ['Material', collectedResult.material.length, `${totals.material.toFixed(2)}`],
      ['Equipment', collectedResult.equipment.length, `${totals.equipment.toFixed(2)}`],
      ['Equipment Log', collectedResult.equipmentLog.length, `${totals.equipmentLog.toFixed(2)}`],
      ['Consumables', collectedResult.consumables.length, `${totals.consumables.toFixed(2)}`],
      ['Subtrade', collectedResult.subtrade.length, `${totals.subtrade.toFixed(2)}`],
      ['', '', ''],
      ['GRAND TOTAL', 
        collectedResult.labour.length + collectedResult.labourTimesheet.length +
        collectedResult.material.length + collectedResult.equipment.length + 
        collectedResult.equipmentLog.length + collectedResult.consumables.length + 
        collectedResult.subtrade.length,
        `${totals.grandTotal.toFixed(2)}`
      ]
    ];

    const totalsWS = XLSX.utils.aoa_to_sheet(totalsData);
    
    if (!totalsWS['!merges']) totalsWS['!merges'] = [];
    totalsWS['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });
    
    const cellStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "006666" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    const headerCellStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "006666" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    if (totalsWS['A1']) totalsWS['A1'].s = cellStyle;
    
    ['A6', 'B6', 'C6'].forEach(cell => {
      if (totalsWS[cell]) totalsWS[cell].s = headerCellStyle;
    });

    totalsWS['!cols'] = [
      { wch: 40 },
      { wch: 30 },
      { wch: 40 }
    ];

    XLSX.utils.book_append_sheet(wb, totalsWS, 'Totals');

    const categories = ['labour', 'labourTimesheet', 'material', 'equipment', 'equipmentLog', 'consumables', 'subtrade'];
    
    categories.forEach(category => {
      const data = collectedResult[category];
      if (data && data.length > 0) {
        const allKeys = [...new Set(data.flatMap(row => Object.keys(row)))];
        
        const sheetData = [
          ['GNC Invoice Data'],
          [`Processed by: ${user.email}`],
          [`Category: ${category}`],
          [],
          allKeys
        ];
        
        data.forEach(row => {
          sheetData.push(allKeys.map(key => row[key] || ''));
        });
        
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: allKeys.length - 1 } });
        
        if (ws['A1']) ws['A1'].s = cellStyle;
        
        allKeys.forEach((_, idx) => {
          const cellRef = XLSX.utils.encode_cell({ r: 4, c: idx });
          if (ws[cellRef]) ws[cellRef].s = headerCellStyle;
        });
        
        ws['!cols'] = allKeys.map(() => ({ wch: 20 }));
        
        const sheetName = category === 'labourTimesheet' ? 'LabourTimesheet' :
                         category === 'equipmentLog' ? 'EquipmentLog' :
                         category.charAt(0).toUpperCase() + category.slice(1);
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    });

    const fileName = `invoice_data_${user.email.split('@')[0]}_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleViewPageReference = (pageNumber) => {
    const pageData = allPagesData.find(p => p.pageNumber === pageNumber);
    if (pageData) {
      setSelectedRowImage(pageData.imageUrl);
    }
  };

  const getCurrentData = () => {
    if (viewMode === 'collected') {
      return collectedResult;
    } else {
      const pageData = allPagesData.find(p => p.pageNumber === selectedPage);
      return pageData?.data || null;
    }
  };

  const getCurrentRawOutput = () => {
    if (viewMode === 'individual') {
      const pageData = allPagesData.find(p => p.pageNumber === selectedPage);
      return pageData?.rawOutput || 'No raw output available';
    }
    return null;
  };

  const getCurrentImageUrl = () => {
    if (viewMode === 'individual') {
      const pageData = allPagesData.find(p => p.pageNumber === selectedPage);
      return pageData?.imageUrl || null;
    }
    return null;
  };

  const totals = calculateGrandTotals();
  const pagesWithErrors = allPagesData.filter(p => p.error);

  return (
    <div className="min-h-screen bg-black">
      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm px-4"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-900 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-6">
                <div className="bg-yellow-900 bg-opacity-30 p-3 rounded-xl mr-4 border border-yellow-800">
                  <svg className="w-6 sm:w-7 h-6 sm:h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Cancel Processing?</h3>
              </div>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm sm:text-base">
                Processing is currently in progress. Are you sure you want to cancel? 
                <span className="block mt-2 font-semibold text-white">
                  All progress will be lost.
                </span>
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-semibold border border-zinc-700 transition-colors"
                >
                  Continue Processing
                </button>
                <button
                  onClick={location.state?.fromBack ? handleNavigateBack : confirmCancel}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  {location.state?.fromBack ? 'Cancel & Go Back' : 'Cancel Processing'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="bg-black border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <img 
                src="https://gncgroup.ca/wp-content/uploads/2025/02/gnc-logo.png" 
                alt="GNC Group Logo" 
                className="h-10 sm:h-12 w-auto"
              />
              <div className="hidden md:flex gap-4">
                <Link 
                  to="/dashboard" 
                  className="text-gray-400 hover:text-white font-medium transition-colors"
                  onClick={(e) => {
                    if (isProcessingRef.current) {
                      e.preventDefault();
                      setShowCancelConfirm(true);
                    } else if (currentSessionIdRef.current) {
                      cleanupCurrentSession();
                    }
                  }}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/invoice-extractor" 
                  className="text-white font-medium"
                >
                  Invoice Extractor
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
              <button
                onClick={onLogout}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-zinc-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload - Show when in upload phase */}
        {processingPhase === 'upload' && (
          <FileUpload
            file={file}
            loading={loading}
            progress={progress}
            allPagesData={allPagesData}
            error={error}
            processingStatus={processingStatus}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
            onCancel={handleCancelClick}
          />
        )}

        {/* NEW: Image Selection - Show when images are ready for selection */}
        {showImageSelection && processingPhase === 'selection' && (
          <ImageSelection
            images={availableImages}
            onProcessSelected={handleProcessSelected}
            onSelectAll={handleExtractAll}
            loading={loading}
          />
        )}

        {/* Processing Status - Show during processing phase */}
        {processingPhase === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl"
          >
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="mt-4 text-gray-300 font-semibold">
                {processingStatus || `Processing page ${progress.current} of ${progress.total}...`}
              </p>
              {progress.total > 0 && (
                <>
                  <div className="w-full bg-zinc-800 rounded-full h-3 mt-4 max-w-md mx-auto">
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
              
              <button
                onClick={handleCancelClick}
                className="mt-6 bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
              >
                Cancel Processing
              </button>
            </div>
          </motion.div>
        )}

        {/* Results - Show when processing is complete */}
        {collectedResult && processingPhase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl mt-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Extracted Data</h2>
                <p className="text-sm text-gray-400 mt-1">Processed by {user.email}</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={downloadJSON}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  Download JSON
                </button>
                <button
                  onClick={downloadExcel}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  Download Excel
                </button>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-4 flex-wrap">
              <div className="flex bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode('collected');
                    setShowRaw(false);
                    setActiveTab('totals');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'collected'
                      ? 'bg-zinc-700 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All Pages Combined
                </button>
                <button
                  onClick={() => setViewMode('individual')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'individual'
                      ? 'bg-zinc-700 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Individual Pages
                </button>
              </div>

              {viewMode === 'individual' && allPagesData.length > 0 && (
                <>
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(Number(e.target.value))}
                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allPagesData.map(page => (
                      <option key={page.pageNumber} value={page.pageNumber}>
                        Page {page.pageNumber} {page.error ? 'X' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowImage(!showImage)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showImage
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-gray-400 hover:text-white border border-zinc-700'
                    }`}
                  >
                    {showImage ? 'Hide' : 'Show'} Image
                  </button>

                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showRaw
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-gray-400 hover:text-white border border-zinc-700'
                    }`}
                  >
                    {showRaw ? 'Hide' : 'Show'} Raw Output
                  </button>
                </>
              )}
            </div>

            {selectedRowImage && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedRowImage(null)}
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-5xl max-h-full overflow-auto p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Page Reference</h3>
                    <button
                      onClick={() => setSelectedRowImage(null)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                  <img 
                    src={getAuthenticatedImageUrl(selectedRowImage)} 
                    alt="Page Reference"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            )}

            {showImage && viewMode === 'individual' && getCurrentImageUrl() && (
              <div className="mb-6 bg-zinc-800 border border-zinc-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Page {selectedPage} Image</h3>
                <div className="overflow-auto max-h-96">
                  <img 
                    src={getAuthenticatedImageUrl(getCurrentImageUrl())} 
                    alt={`Page ${selectedPage}`}
                    className="max-w-full h-auto border border-zinc-700 rounded"
                  />
                </div>
              </div>
            )}

            {showRaw && viewMode === 'individual' && (
              <div className="mb-6 bg-zinc-950 text-green-400 p-4 rounded-lg overflow-auto border border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Raw Output - Page {selectedPage}</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getCurrentRawOutput());
                      alert('Copied to clipboard!');
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-xs whitespace-pre-wrap">{getCurrentRawOutput()}</pre>
              </div>
            )}

            <div className="border-b border-zinc-800 mb-6">
              <nav className="flex space-x-4 overflow-x-auto">
                {viewMode === 'collected' && (
                  <button
                    onClick={() => setActiveTab('totals')}
                    className={`py-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === 'totals'
                        ? 'border-b-2 border-green-500 text-green-500'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Totals Summary
                  </button>
                )}
                {['labour', 'labourTimesheet', 'material', 'equipment', 'equipmentLog', 'consumables', 'subtrade'].map((tab) => {
                  const currentData = getCurrentData();
                  const count = currentData?.[tab]?.length || 0;
                  const displayName = tab === 'labourTimesheet' ? 'Labour Timesheet' : 
                                    tab === 'equipmentLog' ? 'Equipment Log' :
                                    tab.charAt(0).toUpperCase() + tab.slice(1);
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-b-2 border-blue-500 text-blue-500'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {displayName} ({count})
                    </button>
                  );
                })}
              </nav>
            </div>

            {activeTab === 'totals' && viewMode === 'collected' && totals && (
              <TotalsSummary 
                collectedResult={collectedResult} 
                pageErrors={pagesWithErrors}
              />
            )}

            {activeTab !== 'totals' && (
              <div className="mt-4">
                {getCurrentData() && (
                  <DataTable
                    data={getCurrentData()[activeTab]}
                    type={activeTab}
                    onViewPageReference={handleViewPageReference}
                  />
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default InvoiceExtractor;