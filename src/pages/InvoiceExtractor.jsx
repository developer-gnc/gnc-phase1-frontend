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
  const [showExportMenu, setShowExportMenu] = useState(false);
  
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

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

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

  // Calculate grand totals like the old system
  const calculateGrandTotals = () => {
    if (!collectedResult) return null;

    const calculateTotal = (data) => data.reduce((sum, item) => {
      // Handle both TOTALAMOUNT (CAPITAL) and totalAmount (camelCase)
      const amount = parseFloat(item.TOTALAMOUNT || item.totalAmount) || 0;
      return sum + amount;
    }, 0);

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

  // CONSOLIDATED EXPORT - All data in single sheet WITH TOTAL ROW
  const exportToConsolidatedExcel = () => {
    if (!collectedResult) return;

    const wb = XLSX.utils.book_new();

    const titleStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "0586ba" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 , name: "Source Sans Pro" },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    const headerStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "0586ba" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 , name: "Source Sans Pro"},
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
    
    const dataStyle = {
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } }
      }
    };

    // NEW: Total row style - similar to other sheets
    const totalStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "FFFBF0" } },
      font: { bold: true, color: { rgb: "000000" }, sz: 12 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thick", color: { rgb: "000000" } },
        bottom: { style: "thick", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Combine all categories into single dataset
    const categories = ['labour', 'labourTimesheet', 'material', 'equipment', 'equipmentLog', 'consumables', 'subtrade'];
    const allData = [];
    
    categories.forEach(category => {
      const categoryData = collectedResult[category];
      if (categoryData && categoryData.length > 0) {
        categoryData.forEach(row => {
          allData.push({
            category: category === 'labourTimesheet' ? 'Labour Timesheet' :
                     category === 'equipmentLog' ? 'Equipment Log' :
                     category.charAt(0).toUpperCase() + category.slice(1),
            ...row
          });
        });
      }
    });

    if (allData.length === 0) {
      alert('No data to export');
      return;
    }

    // Get all unique keys from combined data
    const allKeys = [...new Set(allData.flatMap(row => Object.keys(row)))].filter(key => 
      key !== 'userId' && 
      key !== 'sessionId'
    );

    // Reorder: category first, then other fields, then pageNumber and referenceDocument at end
    let orderedKeys = ['category'];
    allKeys.forEach(key => {
      if (key !== 'category' && key !== 'pageNumber') {
        orderedKeys.push(key);
      }
    });
    if (allKeys.includes('pageNumber')) {
      orderedKeys.push('pageNumber');
    }
    orderedKeys.push('referenceDocument');

    // Create consolidated sheet
    const sheetData = [
      ['GNC Invoice - Consolidated Data'],
      [''],
      [`Document: ${file?.name || 'Unknown'}`],
      [`Processed by: ${user.email}`],
      [`Total Items: ${allData.length}`],
      [''],
      orderedKeys.map(key => {
        if (key === 'category') return 'Category';
        if (key === 'pageNumber') return 'Page Number';
        if (key === 'referenceDocument') return 'Reference Document';
        return key.replace(/([A-Z])/g, ' $1').trim();
      })
    ];

    // Add all data rows
    allData.forEach(row => {
      sheetData.push(orderedKeys.map(key => {
        if (key === 'referenceDocument') return file?.name || 'Document.pdf';
        return row[key] !== null && row[key] !== undefined ? row[key] : '';
      }));
    });

    // NEW: Calculate and add total row
    const grandTotal = allData.reduce((sum, item) => {
      const amount = parseFloat(item.TOTALAMOUNT || item.totalAmount) || 0;
      return sum + amount;
    }, 0);

    // Add empty separator row
    sheetData.push(['']);
    
    // Add total row
    const totalRow = orderedKeys.map((key, index) => {
      if (index === 0) return 'GRAND TOTAL'; // First column shows "GRAND TOTAL"
      if (key === 'TOTALAMOUNT' || key === 'totalAmount') {
        return `$${grandTotal.toFixed(2)}`;
      }
      if (index === 1) return `${allData.length} items`; // Second column shows item count
      return ''; // All other columns empty
    });
    sheetData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Apply styling
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(2, orderedKeys.length - 1) } });

    if (ws['A1']) ws['A1'].s = titleStyle;

    // Header row styles
    orderedKeys.forEach((_, idx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 6, c: idx });
      if (ws[cellRef]) ws[cellRef].s = headerStyle;
    });

    // Data row styles (excluding the total row)
    for (let rowIdx = 7; rowIdx < sheetData.length - 2; rowIdx++) {
      orderedKeys.forEach((_, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
        if (ws[cellRef]) ws[cellRef].s = dataStyle;
      });
    }

    // NEW: Apply total row styles
    const totalRowIndex = sheetData.length - 1;
    orderedKeys.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: colIdx });
      if (ws[cellRef]) ws[cellRef].s = totalStyle;
    });

    // Column widths
    ws['!cols'] = orderedKeys.map(key => {
      if (key === 'category') return { wch: 18 };
      if (key === 'pageNumber') return { wch: 12 };
      if (key === 'referenceDocument') return { wch: 30 };
      if (key === 'ITEMDESCRIPTION' || key === 'itemDescription') return { wch: 40 };
      if (key === 'EMPLOYEENAME' || key === 'employeeName') return { wch: 25 };
      if (key === 'TOTALAMOUNT' || key === 'totalAmount') return { wch: 15 };
      return { wch: 20 };
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Consolidated Data');

    const fileName = `GNC_Invoice_Consolidated_${user.email.split('@')[0]}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    if (!collectedResult) return;

    const wb = XLSX.utils.book_new();
    const totals = calculateGrandTotals();

    // Enhanced styling to match your old system
    const titleStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "0586ba" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    const headerStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "0586ba" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 , name: "Source Sans Pro"},
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
    
    const dataStyle = {
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } }
      }
    };
    
    const totalStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "FFFBF0" } },
      font: { bold: true, color: { rgb: "000000" }, sz: 12 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thick", color: { rgb: "000000" } },
        bottom: { style: "thick", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Simplified Totals Summary sheet
    const totalsData = [
      ['GNC Invoice'],
      [''],
      [`Document: ${file?.name || 'Unknown'}`],
      [`Processed by: ${user.email}`],
      [''],
      ['Category', 'Total Items', 'Total Amount ($)'],
      ['Labour', collectedResult.labour.length, totals.labour.toFixed(2)],
      ['Labour Timesheet', collectedResult.labourTimesheet.length, totals.labourTimesheet.toFixed(2)],
      ['Material', collectedResult.material.length, totals.material.toFixed(2)],
      ['Equipment', collectedResult.equipment.length, totals.equipment.toFixed(2)],
      ['Equipment Log', collectedResult.equipmentLog.length, totals.equipmentLog.toFixed(2)],
      ['Consumables', collectedResult.consumables.length, totals.consumables.toFixed(2)],
      ['Subtrade', collectedResult.subtrade.length, totals.subtrade.toFixed(2)],
      [''],
      ['GRAND TOTAL', 
        collectedResult.labour.length + collectedResult.labourTimesheet.length +
        collectedResult.material.length + collectedResult.equipment.length + 
        collectedResult.equipmentLog.length + collectedResult.consumables.length + 
        collectedResult.subtrade.length,
        totals.grandTotal.toFixed(2)
      ]
    ];

    const totalsWS = XLSX.utils.aoa_to_sheet(totalsData);
    
    // Enhanced merging and styling for totals sheet
    if (!totalsWS['!merges']) totalsWS['!merges'] = [];
    totalsWS['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }); // Title
    
    // Apply enhanced styles
    if (totalsWS['A1']) totalsWS['A1'].s = titleStyle;
    
    // Header row styles
    ['A6', 'B6', 'C6'].forEach(cell => {
      if (totalsWS[cell]) totalsWS[cell].s = headerStyle;
    });
    
    // Grand total row styles - simple black styling
    ['A15', 'B15', 'C15'].forEach(cell => {
      if (totalsWS[cell]) totalsWS[cell].s = totalStyle;
    });

    // Enhanced column widths
    totalsWS['!cols'] = [
      { wch: 25 }, // Category
      { wch: 15 }, // Items  
      { wch: 20 }  // Amount
    ];

    // Add Totals sheet first
    XLSX.utils.book_append_sheet(wb, totalsWS, 'Summary');

    // Create enhanced worksheets for each category
    const categories = ['labour', 'labourTimesheet', 'material', 'equipment', 'equipmentLog', 'consumables', 'subtrade'];
    
    categories.forEach(category => {
      const data = collectedResult[category];
      if (data && data.length > 0) {
        // Filter out userId and sessionId, keep pageNumber
        const allKeys = [...new Set(data.flatMap(row => Object.keys(row)))].filter(key => 
          key !== 'userId' && 
          key !== 'sessionId'
        );
        
        // Add referenceDocument column at the end
        const orderedKeys = [...allKeys, 'referenceDocument'];
        
        // Simplified sheet header
        const sheetData = [
          ['GNC Invoice'],
          [''],
          [`Document: ${file?.name || 'Unknown'}`],
          [`Processed by: ${user.email}`],
          [`Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`],
          [`Items Count: ${data.length}`],
          [''],
          // Headers with proper formatting
          orderedKeys.map(key => {
            if (key === 'pageNumber') return 'Page Number';
            if (key === 'referenceDocument') return 'Reference Document';
            return key.replace(/([A-Z])/g, ' $1').trim();
          })
        ];
        
        // Add data rows
        data.forEach(row => {
          sheetData.push(orderedKeys.map(key => {
            if (key === 'referenceDocument') return file?.name || 'Document.pdf';
            return row[key] !== null && row[key] !== undefined ? row[key] : '';
          }));
        });

        // Enhanced total section
        const categoryTotal = data.reduce((sum, item) => {
          const amount = parseFloat(item.TOTALAMOUNT || item.totalAmount) || 0;
          return sum + amount;
        }, 0);

        if (categoryTotal > 0) {
          sheetData.push(['']); // Separator
          sheetData.push(['']); // Extra space
          
          // Category total summary section
          const totalHeaderRow = orderedKeys.map((key, index) => {
            if (index === 0) return `${category.toUpperCase()} CATEGORY TOTAL`;
            else if (index === 1) return 'SUMMARY';
            return '';
          });
          sheetData.push(totalHeaderRow);
          
          const totalDataRow = orderedKeys.map((key, index) => {
            if (key === 'TOTALAMOUNT' || key === 'totalAmount') {
              return `$${categoryTotal.toFixed(2)}`;
            } else if (index === 1) {
              return `${data.length} items`;
            } else if (index === 2) {
              return `Total: $${categoryTotal.toFixed(2)}`;
            }
            return '';
          });
          sheetData.push(totalDataRow);
        }
        
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        
        // Enhanced merging
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(2, orderedKeys.length - 1) } });
        
        // Apply enhanced styles
        if (ws['A1']) ws['A1'].s = titleStyle;
        
        // Header row styles
        orderedKeys.forEach((_, idx) => {
          const cellRef = XLSX.utils.encode_cell({ r: 7, c: idx });
          if (ws[cellRef]) ws[cellRef].s = headerStyle;
        });
        
        // Data row styles
        for (let rowIdx = 8; rowIdx < sheetData.length - (categoryTotal > 0 ? 4 : 0); rowIdx++) {
          orderedKeys.forEach((_, colIdx) => {
            const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
            if (ws[cellRef]) ws[cellRef].s = dataStyle;
          });
        }
        
        // Total section styles
        if (categoryTotal > 0) {
          const totalRowStart = sheetData.length - 2;
          orderedKeys.forEach((_, colIdx) => {
            const cellRef1 = XLSX.utils.encode_cell({ r: totalRowStart - 1, c: colIdx });
            const cellRef2 = XLSX.utils.encode_cell({ r: totalRowStart, c: colIdx });
            if (ws[cellRef1]) ws[cellRef1].s = totalStyle;
            if (ws[cellRef2]) ws[cellRef2].s = totalStyle;
          });
        }
        
        // Enhanced column widths
        ws['!cols'] = orderedKeys.map(key => {
          if (key === 'pageNumber') return { wch: 12 };
          if (key === 'referenceDocument') return { wch: 30 };
          if (key === 'ITEMDESCRIPTION' || key === 'itemDescription') return { wch: 40 };
          if (key === 'EMPLOYEENAME' || key === 'employeeName') return { wch: 25 };
          if (key === 'TOTALAMOUNT' || key === 'totalAmount') return { wch: 15 };
          return { wch: 20 };
        });
        
        // Create proper sheet name
        const sheetName = category === 'labourTimesheet' ? 'LabourTimesheet' :
                         category === 'equipmentLog' ? 'EquipmentLog' :
                         category.charAt(0).toUpperCase() + category.slice(1);
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    });

    const fileName = `GNC_Invoice_${user.email.split('@')[0]}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportMenu(false);
  };

  const getCurrentData = () => {
    if (viewMode === 'collected') {
      return collectedResult;
    } else {
      const pageData = allPagesData.find(p => p.pageNumber === selectedPage);
      return pageData ? pageData.data : null;
    }
  };

  const getCurrentRawOutput = () => {
    if (viewMode === 'individual') {
      const pageData = allPagesData.find(p => p.pageNumber === selectedPage);
      return pageData ? pageData.rawOutput : 'No data available';
    }
    return 'Raw output only available in individual page view';
  };

  const getCurrentImageUrl = () => {
    if (viewMode === 'individual') {
      const pageData = allPagesData.find(p => p.pageNumber === selectedPage);
      return pageData ? pageData.imageUrl : null;
    }
    return null;
  };

  const availablePages = allPagesData.map(p => p.pageNumber).sort((a, b) => a - b);

  const handleViewPageReference = (pageNumber) => {
    const pageData = allPagesData.find(p => p.pageNumber === pageNumber);
    if (pageData && pageData.imageUrl) {
      setSelectedRowImage(pageData.imageUrl);
    } else {
      alert(`Image not available for page ${pageNumber}`);
    }
  };

  return (
    <div className="min-h-screen bg-black">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload - Only show when in upload phase */}
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

        {/* Processing Status during conversion */}
        {processingPhase === 'converting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl"
          >
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <h2 className="text-2xl font-bold text-white mt-4 mb-2">Converting PDF to Images</h2>
              <p className="text-gray-300 mb-4">{processingStatus}</p>
              
              {progress.total > 0 && (
                <>
                  <div className="w-full bg-zinc-800 rounded-full h-3 mt-4">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    {Math.round((progress.current / progress.total) * 100)}% Complete ({progress.current}/{progress.total} pages)
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

        {/* OPTIMIZED: Image Selection with Real-time Streaming */}
        {showImageSelection && processingPhase === 'selection' && (
          <ImageSelection
            images={availableImages}
            onProcessSelected={handleProcessSelected}
            onSelectAll={handleExtractAll}
            loading={loading}
            onUploadNew={handleUploadNew}
            conversionStatus={conversionStatus}
          />
        )}

        {/* Processing Status - Show during AI analysis phase */}
        {processingPhase === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl"
          >
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <h2 className="text-2xl font-bold text-white mt-4 mb-2">AI Analysis in Progress</h2>
              <p className="text-gray-300 mb-4">{processingStatus}</p>
              
              {progress.total > 0 && (
                <>
                  <div className="w-full bg-zinc-800 rounded-full h-3 mt-4">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    {Math.round((progress.current / progress.total) * 100)}% Complete ({progress.current}/{progress.total} pages)
                  </p>
                </>
              )}
              
              <button
                onClick={handleCancelClick}
                className="mt-6 bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
              >
                Cancel Analysis
              </button>
            </div>
          </motion.div>
        )}

        {/* Results Display */}
        {processingPhase === 'complete' && collectedResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Header with controls */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Extraction Results</h2>
                  <p className="text-gray-400">Document: <span className="text-blue-400 font-medium">{file?.name || 'Unknown Document'}</span></p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleUploadNew}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-lg font-medium transition-colors border border-zinc-700"
                  >
                    📄 Upload New File
                  </button>
                  
                  {/* Export Dropdown Menu */}
                  <div className="relative export-menu-container">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export to Excel
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showExportMenu && (
                      <div className="absolute right-0 mt-2 w-72 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50">
                        <button
                          onClick={exportToConsolidatedExcel}
                          className="w-full text-left px-4 py-3 hover:bg-zinc-700 transition-colors text-white border-b border-zinc-700"
                        >
                          <div className="font-semibold mb-1">📊 Consolidated (Single Sheet)</div>
                          <div className="text-xs text-gray-400">All data in one sheet with category column</div>
                        </button>
                        <button
                          onClick={exportToExcel}
                          className="w-full text-left px-4 py-3 hover:bg-zinc-700 transition-colors text-white rounded-b-lg"
                        >
                          <div className="font-semibold mb-1">📑 Separate Sheets</div>
                          <div className="text-xs text-gray-400">Each category in its own sheet + summary</div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* View Mode Toggle */}
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setViewMode('collected')}
                  className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                    viewMode === 'collected'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
                >
                  📊 All Data Combined
                </button>
                <button
                  onClick={() => setViewMode('individual')}
                  className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                    viewMode === 'individual'
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
                >
                  📄 Individual Pages
                </button>
                
                {viewMode === 'individual' && availablePages.length > 0 && (
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(parseInt(e.target.value))}
                    className="bg-zinc-800 border border-zinc-700 text-white py-2 px-4 rounded-lg"
                  >
                    {availablePages.map(pageNum => (
                      <option key={pageNum} value={pageNum}>
                        Page {pageNum}
                      </option>
                    ))}
                  </select>
                )}
                
                {viewMode === 'individual' && (
                  <>
                    <button
                      onClick={() => setShowRaw(!showRaw)}
                      className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                        showRaw
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700'
                      }`}
                    >
                      {showRaw ? '🔍 Hide Raw' : '🔍 Show Raw'}
                    </button>
                    <button
                      onClick={() => setShowImage(!showImage)}
                      className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                        showImage
                          ? 'bg-orange-600 text-white'
                          : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700'
                      }`}
                    >
                      {showImage ? '🖼️ Hide Image' : '🖼️ Show Image'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Row image modal */}
            {selectedRowImage && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-4xl max-h-full overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Page Reference Image</h3>
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

            {/* Show image in individual view - ensure it works for single pages */}
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

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              {activeTab === 'totals' && viewMode === 'collected' ? (
                <TotalsSummary 
                  collectedResult={collectedResult}
                  pageErrors={allPagesData.filter(p => p.error).map(p => ({ pageNumber: p.pageNumber, error: p.error }))}
                />
              ) : (
                <DataTable 
                  data={getCurrentData()?.[activeTab] || []}
                  type={activeTab}
                  onViewPageReference={handleViewPageReference}
                  pageErrors={allPagesData.filter(p => p.error).map(p => ({ pageNumber: p.pageNumber, error: p.error }))}
                  documentName={file?.name}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Cancel Confirmation Modal */}
        <AnimatePresence>
          {showCancelConfirm && (
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
                className="bg-zinc-900 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-zinc-800"
              >
                <div className="text-center">
                  <div className="bg-red-900 bg-opacity-30 p-3 rounded-xl mb-4 inline-block">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Cancel Processing?</h3>
                  <p className="text-gray-400 mb-6">
                    This will stop the current processing and you'll lose any progress. Are you sure?
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-semibold border border-zinc-700 transition-colors"
                    >
                      Continue Processing
                    </button>
                    <button
                      onClick={confirmCancel}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                    >
                      Yes, Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default InvoiceExtractor;