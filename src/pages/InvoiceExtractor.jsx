import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config/api';
import api from '../config/api';
import InvoiceExtractorSecondHalf from './InvoiceExtractorSecondHalf';

// Import PDF.js and configure it to use local worker
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js to use local worker file instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Default extraction prompt - you can modify this or make it configurable
const DEFAULT_EXTRACTION_PROMPT = `You are a data extraction specialist. Extract information from this invoice/document image and categorize it into one of these categories:
1. Labour
2. Material
3. Equipment
4. Consumables
5. Subtrade
6. LabourTimesheet
7. EquipmentLog

For each item found, extract ALL available fields and return a JSON object with:
- category: (Labour/Material/Equipment/Consumables/Subtrade/LabourTimesheet/EquipmentLog)
- data: object containing all extracted fields

CATEGORY CLASSIFICATION RULES:
- Labour: Use when labour data contains price/cost/amount fields (UNITRATE, TOTALAMOUNT, etc.)
- LabourTimesheet: Use when labour data does NOT contain any price/cost/amount fields (just time tracking)
- Equipment: Use when equipment data contains price/cost/amount fields (UNITRATE, TOTALAMOUNT, etc.)
- EquipmentLog: Use when equipment data does NOT contain any price/cost/amount fields (just usage tracking)

LABOUR fields (extract if present - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, INVOICENO, EMPLOYEENAME, EMPLOYEECODE, POSITION, ITEMDESCRIPTION, SUBCATEGORY, AREA, INVOICE DATE
- TOTALHOURS, TOTALHOURSMANUAL, BACKUPHOURS, PR HOURS, OT HOURS, DT HOURS, REG HOURS
- VARIANCE, UOM, UNITRATE, TOTALAMOUNT, O&P, REMOVE, REPLACE, SUBTOTAL, MARK UP, REG RATE, PR RATE

LABOUR TIMESHEET fields (extract if present - NO PRICE FIELDS - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, EMPLOYEENAME, EMPLOYEECODE, POSITION, ITEMDESCRIPTION, SUBCATEGORY, AREA
- TIMEIN, TIMEOUT, LUNCHBREAK, TOTALHOURS, TOTALHOURSMANUAL, BACKUPHOURS, PR HOURS, OT HOURS, DT HOURS, REG HOURS
- VARIANCE, REG RATE, PR RATE

MATERIAL/CONSUMABLES fields (extract if present - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, INVOICENO, ITEM, CATEGORY, ITEMDESCRIPTION, SUBCATEGORY, AREA, INVOICE DATE
- QTY, BACKUPQTY, VARIANCE, UOM, UNITRATE, TOTALAMOUNT, O&P, REMOVE, REPLACE, TAX, SUBTOTAL, PR HOURS, OT HOURS, DT HOURS, REG HOURS, MARK UP, REG RATE, PR RATE

EQUIPMENT fields (extract if present - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, INVOICENO, ITEM, CATEGORY, ITEMDESCRIPTION, SUBCATEGORY, INVOICE DATE, PR HOURS, OT HOURS, DT HOURS, REG HOURS
- QTY, BACKUPQTY, VARIANCE, UOM, UNITRATE, TOTALAMOUNT, O&P, REMOVE, REPLACE, TAX, SUBTOTAL, MARK UP, REG RATE, PR RATE

EQUIPMENT LOG fields (extract if present - NO PRICE FIELDS - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, ITEM, CATEGORY, ITEMDESCRIPTION, OPERATORNAME, SUBCATEGORY, AREA, INVOICE DATE
- QTY, BACKUPQTY, VARIANCE, UOM, HOURSUSED, STARTTIME, ENDTIME, PR HOURS, OT HOURS, DT HOURS, REG HOURS

SUBTRADE fields (extract if present - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, INVOICENO, ITEM, CATEGORY, VENDORNAME, ITEMDESCRIPTION, SUBCATEGORY, AREA, INVOICE DATE, PR HOURS, OT HOURS, DT HOURS, REG HOURS
- QTY, BACKUPQTY, UOM, UNITRATE, TOTALAMOUNT, O&P, REMOVE, REPLACE, TAX, SUBTOTAL, MARK UP, REG RATE, PR RATE

IMPORTANT RULES:
1. Extract ALL text visible in the image
2. If a field is not present, omit it from the JSON
3. Return ONLY valid JSON array format: [{"category": "...", "data": {...}}, ...]
4. If multiple items are present, return multiple objects in the array
5. Use exact field names as specified above (ALL CAPITAL LETTERS)
6. For numeric values, extract as numbers not strings
7. For dates, use format: DD/MM/YYYY 
8. For time fields, use format: HH:MM or as shown in document
9. If the page is blank or has no extractable data, return an empty array: []
10. Sometimes amount is there but quantity is not there than give it as TOTALAMOUNT.
11. If total amount is mention with some other naming convention than give TOTALAMOUNT again with key as TOTALAMOUNT but it should be compulsory to have TOTALAMOUNT key in each json object with precised value.
12. Fetch quantity, unit rate and total amount carefully, but if just unit amount and quantity is there but total amount is not there calculate TOTALAMOUNT and give. But striclty do not calculate any other fields except TOTALAMOUNT.
13. CRITICAL: Check if data contains price/cost/amount fields:
    - If Labour data has TIMEIN and TIMEOUT fields than it will be in "LabourTimesheet" else it will be in normal "Labour" category.
    - If Equipment data has UNITRATE, TOTALAMOUNT, or similar price fields → category: "Equipment"
    - If Equipment data has NO price fields (only usage tracking) → category: "EquipmentLog"
14. Fetch taxes and all other details related to a json for each image.
15. If there is any heading like summary or recap above a table or rows of data in image than do not consider data below that heading into json.
16. CRITICAL: ALL FIELD NAMES IN THE DATA OBJECT MUST BE IN CAPITAL LETTERS (e.g., EMPLOYEENAME, TOTALAMOUNT, UNITRATE)
17. if there a heading on table or category above rows of data and it look like a category than add it as sub category in data json for these rows, and key field for these values should be subcategory not category.
18. Format for all type the date should be DD/MM/YYYY.
19. if there are any invoice date and invoice number is there on image include that in every data json as INVOICE DATE and INVOICE NUMBER object but not as a separate object.
20. If cheques are there in image, striclty do not consider them for data extraction.
21. If any row contains REMOVE or REPLACE values, those values must be strictly extracted without omission. Ensure that whenever REMOVE and/or REPLACE columns appear for a row, their corresponding data is always captured completely and accurately. Under no circumstances should REMOVE or REPLACE values be skipped or missed for any row.
22. AREA - If there is any area deatils and daigram with heading, add that heading as AREA for all json after that diagram and area details, but do not add area details.
23. If a row appears multiple times, include it in JSON each time. Never skip or merge duplicates.
24. If a date is linked to a row, use key DATE. If the date appears in the header or footer, use key INVOICE DATE. Include INVOICE DATE in every JSON row.
25. Sometimes Description is in multiple lines, do not confused and count them as different rows.
26. do not add '_' in any key field. keep space if it contains multiple words.
27. While fetching data from a table, some rows in a column may be empty, or sometimes the entire column might be empty. This does not mean you should use values from the next column to fill in these empty rows.
28. If you identify PR Hours, it is same as overtime hour.
If you identify Reg. Hours, it is the same as normal/regular hour.
Overtime/PR hour can be there with any regular/normal hours.
29.Treat any blank cell as the number 0.
Keep the exact number of columns for every row.
Maintain strict row-column alignment.
If a value is unclear, output as number 0 instead of shifting it into another column.

Return ONLY the JSON array, no explanations or additional text.`;


// NEW FRESH PROMPT - EXACTLY AS YOU SPECIFIED
const DEFAULT_EXTRACTION_FRESH_PROMPT = `You are a data extraction specialist. Extract information from this invoice/document image and categorize it into one of these categories:
1. Labour
2. Material
3. Equipment
4. Consumables
5. Subtrade
6. LabourTimesheet
7. EquipmentLog

For each item found, extract ALL available fields and return a JSON object with:
- category: (Labour/Material/Equipment/Consumables/Subtrade/LabourTimesheet/EquipmentLog)
- data: object containing all extracted fields

CATEGORY CLASSIFICATION RULES:
- Labour: Use when labour data contains price/cost/amount fields (UNITRATE, TOTALAMOUNT, etc.)
- LabourTimesheet: Use when labour data does NOT contain any price/cost/amount fields (just time tracking)
- Equipment: Use when equipment data contains price/cost/amount fields (UNITRATE, TOTALAMOUNT, etc.)
- EquipmentLog: Use when equipment data does NOT contain any price/cost/amount fields (just usage tracking)

LABOUR fields (extract if present - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, INVOICENO, EMPLOYEENAME, EMPLOYEECODE, POSITION, ITEMDESCRIPTION, SUBCATEGORY, AREA, INVOICE DATE
- TOTALHOURS, TOTALHOURSMANUAL, BACKUPHOURS, PR HOURS, OT HOURS, DT HOURS, REG HOURS
- VARIANCE, UOM, UNITRATE, TOTALAMOUNT, O&P, REMOVE, REPLACE, SUBTOTAL, MARK UP, REG RATE, PR RATE

LABOUR TIMESHEET fields (extract if present - NO PRICE FIELDS - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, EMPLOYEENAME, EMPLOYEECODE, POSITION, ITEMDESCRIPTION, SUBCATEGORY, AREA
- TIMEIN, TIMEOUT, LUNCHBREAK, TOTALHOURS, TOTALHOURSMANUAL, BACKUPHOURS, PR HOURS, OT HOURS, DT HOURS, REG HOURS
- VARIANCE, REG RATE, PR RATE

MATERIAL/CONSUMABLES fields (extract if present - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, INVOICENO, ITEM, CATEGORY, ITEMDESCRIPTION, SUBCATEGORY, AREA, INVOICE DATE
- QTY, BACKUPQTY, VARIANCE, UOM, UNITRATE, TOTALAMOUNT, O&P, REMOVE, REPLACE, TAX, SUBTOTAL, PR HOURS, OT HOURS, DT HOURS, REG HOURS, MARK UP, REG RATE, PR RATE

EQUIPMENT fields (extract if present - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, INVOICENO, ITEM, CATEGORY, ITEMDESCRIPTION, SUBCATEGORY, INVOICE DATE, PR HOURS, OT HOURS, DT HOURS, REG HOURS
- QTY, BACKUPQTY, VARIANCE, UOM, UNITRATE, TOTALAMOUNT, O&P, REMOVE, REPLACE, TAX, SUBTOTAL, MARK UP, REG RATE, PR RATE

EQUIPMENT LOG fields (extract if present - NO PRICE FIELDS - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, ITEM, CATEGORY, ITEMDESCRIPTION, OPERATORNAME, SUBCATEGORY, AREA, INVOICE DATE
- QTY, BACKUPQTY, VARIANCE, UOM, HOURSUSED, STARTTIME, ENDTIME, PR HOURS, OT HOURS, DT HOURS, REG HOURS

SUBTRADE fields (extract if present - ALL FIELD NAMES MUST BE CAPITAL):
- SRNO, DATE, DAY, INVOICENO, ITEM, CATEGORY, VENDORNAME, ITEMDESCRIPTION, SUBCATEGORY, AREA, INVOICE DATE, PR HOURS, OT HOURS, DT HOURS, REG HOURS
- QTY, BACKUPQTY, UOM, UNITRATE, TOTALAMOUNT, O&P, REMOVE, REPLACE, TAX, SUBTOTAL, MARK UP, REG RATE, PR RATE

IMPORTANT RULES:
1. Extract ALL text visible in the image
2. If a field is not present, omit it from the JSON
3. Return ONLY valid JSON array format: [{"category": "...", "data": {...}}, ...]
4. If multiple items are present, return multiple objects in the array
5. Use exact field names as specified above (ALL CAPITAL LETTERS)
6. For numeric values, extract as numbers not strings
7. For dates, use format: DD/MM/YYYY 
8. For time fields, use format: HH:MM or as shown in document
9. If the page is blank or has no extractable data, return an empty array: []
10. Sometimes amount is there but quantity is not there than give it as TOTALAMOUNT.`;



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
  
  // Image selection state with client-side conversion
  const [showImageSelection, setShowImageSelection] = useState(false);
  const [availableImages, setAvailableImages] = useState([]);
  const [processingPhase, setProcessingPhase] = useState('upload'); // 'upload', 'converting', 'selection', 'processing', 'complete'
  const [conversionProgress, setConversionProgress] = useState({ converted: 0, total: 0 });
  const [conversionStatus, setConversionStatus] = useState({ conversionComplete: false, allConverted: false });

  // New state for prompt management
  const [useFreshPrompt, setUseFreshPrompt] = useState(false);
  const [freshCustomRules, setFreshCustomRules] = useState([]);

  const [extractionPrompt, setExtractionPrompt] = useState(DEFAULT_EXTRACTION_PROMPT);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [availableModels, setAvailableModels] = useState([
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Fast and efficient (Current)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Faster with improved accuracy' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Most accurate, slower processing' }
  ]);
  
  // Custom prompts state
  const [customPrompts, setCustomPrompts] = useState([]);

// Function to build final prompt with custom prompts
  const buildFinalPrompt = () => {
    // NEW LOGIC: Check if using fresh prompt
    if (useFreshPrompt) {
      let finalPrompt = DEFAULT_EXTRACTION_FRESH_PROMPT;
      
      if (freshCustomRules.length > 0) {
        // Add fresh custom rules starting from point 10
        freshCustomRules.forEach((rule, index) => {
          const pointNumber = 11 + index;
          finalPrompt += `\n${pointNumber}. ${rule}`;
        });
      }
      
      finalPrompt += `\n\nReturn ONLY the JSON array, no explanations or additional text.`;
      return finalPrompt;
    }
    
    // EXISTING LOGIC: Use default prompt with custom rules
    let finalPrompt = extractionPrompt;
    
    if (customPrompts.length > 0) {
      // Add custom prompts starting from point 29
      customPrompts.forEach((prompt, index) => {
        const pointNumber = 30 + index;
        finalPrompt += `\n${pointNumber}. ${prompt}`;
      });
    }
    
    return finalPrompt;
  };

  // Handle custom prompts change
  const handleCustomPromptsChange = (newCustomPrompts) => {
    setCustomPrompts(newCustomPrompts);
  };
  // NEW HANDLER FOR FRESH PROMPT TOGGLE
  const handleUseFreshPromptChange = (newValue) => {
    setUseFreshPrompt(newValue);
  };

  // NEW HANDLER FOR FRESH CUSTOM RULES
  const handleFreshCustomRulesChange = (newFreshCustomRules) => {
    setFreshCustomRules(newFreshCustomRules);
  };

  const abortControllerRef = useRef(null);
  const readerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const currentSessionIdRef = useRef(null);

  // Client-side PDF to images conversion using PDF.js with real-time streaming
  const convertPDFToImages = async (pdfFile) => {
    try {
      setProcessingStatus('Loading PDF...');
      
      // Read PDF file as ArrayBuffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load PDF document using PDF.js
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        // Use minimal configuration to avoid external dependencies
        cMapUrl: '', // Empty to avoid external cmap loading
        cMapPacked: false,
        disableFontFace: false,
        disableRange: false,
        disableStream: false
      });
      
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      setConversionProgress({ converted: 0, total: numPages });
      setProcessingStatus(`Converting ${numPages} pages to images...`);
      
      // Convert each page and add to array immediately for real-time display
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          setProcessingStatus(`Converting page ${pageNum} of ${numPages}...`);
          
          // Get page
          const page = await pdf.getPage(pageNum);
          
          // Set scale for good quality but not too large (1.5 = 150% scale)
          const viewport = page.getViewport({ scale: 1.5 });
          
          // Create canvas element
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          // Set canvas dimensions
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Render page to canvas
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          await page.render(renderContext).promise;
          
          // Convert canvas to base64 image
          const base64 = canvas.toDataURL('image/png', 0.9); // 90% quality for smaller size
          
          const newImage = {
            pageNumber: pageNum,
            base64: base64,
            selected: true, // Default to selected
            conversionError: null
          };
          
          // Add image immediately to show real-time progress
          setAvailableImages(prevImages => [...prevImages, newImage]);
          setConversionProgress({ converted: pageNum, total: numPages });
          
          // Small delay to prevent UI blocking and allow progress updates
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (pageError) {
          console.error(`Error converting page ${pageNum}:`, pageError);
          
          const errorImage = {
            pageNumber: pageNum,
            base64: null,
            selected: false,
            conversionError: `Failed to convert page ${pageNum}: ${pageError.message}`
          };
          
          // Add error image immediately to show real-time progress
          setAvailableImages(prevImages => [...prevImages, errorImage]);
          setConversionProgress({ converted: pageNum, total: numPages });
        }
      }
      
      // Mark conversion as complete
      setConversionStatus({ conversionComplete: true, allConverted: true });
      setProcessingStatus('PDF converted successfully! Select pages to process.');
      
      // CRITICAL FIX: Reset loading state after conversion is complete
      setLoading(false);
      isProcessingRef.current = false;
      
    } catch (error) {
      console.error('Error converting PDF:', error);
      setError(`Failed to convert PDF: ${error.message}`);
      setProcessingPhase('upload');
      setLoading(false);
      isProcessingRef.current = false;
      setShowImageSelection(false);
      throw error;
    }
  };

  // Function to add authentication token to image URLs (no longer needed but keeping for compatibility)
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
    // Reset prompt to default
    setExtractionPrompt(DEFAULT_EXTRACTION_PROMPT);
    setSelectedModel('gemini-2.0-flash');
  };

  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await api.get('/api/images/available-models');
        if (response.data.success && response.data.models) {
          setAvailableModels(response.data.models);
        }
      } catch (error) {
        console.error('Failed to load models:', error);
        // Keep default models if API fails
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProcessingRef.current) {
        e.preventDefault();
        e.returnValue = 'Processing is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    const handlePopState = (e) => {
      if (isProcessingRef.current) {
        e.preventDefault();
        window.history.pushState(null, '', location.pathname);
        setShowCancelConfirm(true);
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
    };
  }, [location.pathname]);

  useEffect(() => {
    isProcessingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (sessionId) {
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
      setSessionId(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const cancelProcessing = async () => {
    console.log('Cancelling processing...');
    
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
    setShowCancelConfirm(false);
    navigate('/dashboard');
  };

  // Handle upload new file - cancel current process and reset
  const handleUploadNew = async () => {
    console.log('Upload new file requested - canceling current process...');
    
    // Cancel any ongoing processing
    if (loading || isProcessingRef.current) {
      await cancelProcessing();
    }
    
    // Reset to upload state
    resetToUpload();
    
    console.log('Reset to upload state complete');
  };

  // Updated upload handler - go directly to selection with real-time conversion
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError(null);
    isProcessingRef.current = true;
    
    // Go directly to selection page to show real-time conversion
    setShowImageSelection(true);
    setProcessingPhase('selection'); // Show selection page immediately
    setAvailableImages([]); // Start with empty array
    setConversionStatus({ conversionComplete: false, allConverted: false });
    
    try {
      // Convert PDF to images with real-time updates
      await convertPDFToImages(file);
    } catch (error) {
      setError(error.message || 'Failed to process PDF');
      setLoading(false);
      isProcessingRef.current = false;
      setShowImageSelection(false);
      setProcessingPhase('upload');
    }
  };

  // Handle selected images processing with model and prompt
  const handleProcessSelected = async (selectedImages, model = null) => {
    if (!selectedImages || selectedImages.length === 0) {
      setError('No images selected for processing');
      return;
    }

    const modelToUse = model || selectedModel;
    setLoading(true);
    setError(null);
    setAllPagesData([]);
    setCollectedResult(null);
    setProcessingStatus(`Starting AI analysis with ${modelToUse}...`);
    setProcessingPhase('processing');
    isProcessingRef.current = true;

    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('authToken');
      
      // Prepare images data for backend
      const imagesData = selectedImages.map(img => ({
        image: img.base64,
        pageNumber: img.pageNumber
      }));

      const finalPrompt = buildFinalPrompt();
    console.log('🔥 PROMPT BEING SENT TO BACKEND:');
    console.log('Fresh Prompt Mode:', useFreshPrompt);
    console.log('Prompt Length:', finalPrompt.length);
    console.log('Full Prompt:', finalPrompt);
    console.log('Model:', modelToUse);
    console.log('---END PROMPT---');

      // Choose endpoint based on number of images
      const endpoint = imagesData.length === 1 ? '/api/images/process-image' : '/api/images/process-batch-images';
      
      let requestBody;
      if (imagesData.length === 1) {
        // Single image
        requestBody = {
          image: imagesData[0].image,
          pageNumber: imagesData[0].pageNumber,
          model: modelToUse,
          prompt: finalPrompt // Use the prompt with custom additions
        };
      } else {
        // Batch images
        requestBody = {
          images: imagesData,
          model: modelToUse,
          prompt: finalPrompt // Use the prompt with custom additions
        };
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
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
                setSessionId(data.sessionId);
              } else if (data.type === 'analysis_progress') {
                setProgress({ current: data.completed, total: data.total });
                setProcessingStatus(data.message);
              } else if (data.type === 'page_complete') {
                setAllPagesData(prev => {
                  const newData = [...prev, {
                    pageNumber: data.pageNumber,
                    data: data.pageData,
                    rawOutput: data.rawOutput,
                    error: data.error
                  }];
                  return newData.sort((a, b) => a.pageNumber - b.pageNumber);
                });
                setProcessingStatus(data.message);
              } else if (data.type === 'complete') {
                setCollectedResult(data.collectedResult);
                if (data.allPagesData) {
                  setAllPagesData(data.allPagesData);
                } else if (data.pageData) {
                  // Single page response
                  setAllPagesData([{
                    pageNumber: data.pageData.pageNumber,
                    data: data.pageData.data,
                    rawOutput: data.pageData.rawOutput,
                    error: data.pageData.error
                  }]);
                }
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
              if (data.allPagesData) {
                setAllPagesData(data.allPagesData);
              }
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
      
      // New prompt and model state
      extractionPrompt={extractionPrompt}
      setExtractionPrompt={setExtractionPrompt}
      selectedModel={selectedModel}
      setSelectedModel={setSelectedModel}
      availableModels={availableModels}
      
      // Custom prompts state
      customPrompts={customPrompts}
      onCustomPromptsChange={handleCustomPromptsChange}
      buildFinalPrompt={buildFinalPrompt}
      
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
      

      // NEW FRESH PROMPT PROPS
      useFreshPrompt={useFreshPrompt}
      onUseFreshPromptChange={handleUseFreshPromptChange}
      freshCustomRules={freshCustomRules}
      onFreshCustomRulesChange={handleFreshCustomRulesChange}


    />
  );
}

export default InvoiceExtractor;