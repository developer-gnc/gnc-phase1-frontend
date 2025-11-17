import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx-js-style';
import FileUpload from '../components/FileUpload';
import ImageSelection from '../components/ImageSelection';
import DataTable from '../components/DataTable';
import TotalsSummary from '../components/TotalsSummary';
import ConsolidatedView from '../components/ConsolidatedView';

function InvoiceExtractorSecondHalf(props) {
  // Extract all props
  const {
    file, loading, progress, allPagesData, collectedResult, error, activeTab, setActiveTab,
    viewMode, setViewMode, selectedPage, setSelectedPage, showRaw, setShowRaw,
    showImage, setShowImage, selectedRowImage, setSelectedRowImage, processingStatus,
    showCancelConfirm, setShowCancelConfirm, sessionId, showImageSelection,
    availableImages, processingPhase, conversionProgress, conversionStatus,
    extractionPrompt, setExtractionPrompt, selectedModel, setSelectedModel, availableModels,
    customPrompts, onCustomPromptsChange, buildFinalPrompt,
    getAuthenticatedImageUrl, handleFileChange, handleUpload, handleUploadNew,
    handleCancelClick, confirmCancel, handleProcessSelected, handleExtractAll,
    user, onLogout
  } = props;

  // Helper function to identify currency columns - ONLY FOR EXCEL FORMATTING
  const isCurrencyColumn = (fieldName) => {
    const normalizedField = fieldName.toUpperCase().replace(/[^A-Z]/g, '');
    const currencyColumns = ['UNITRATE', 'TAX', 'OP', 'RCV', 'DEPREC', 'ACV', 'TOTALAMOUNT', 'REMOVE', 'REPLACE', 'SUBTOTAL', 'O&P'];
    return currencyColumns.includes(normalizedField);
  };

  // Helper function to identify date columns - ONLY FOR EXCEL FORMATTING
  const isDateColumn = (fieldName) => {
    const normalizedField = fieldName.toUpperCase().replace(/[^A-Z]/g, '');
    return normalizedField === 'DATE' || normalizedField === 'INVOICEDATE';
  };

  // Helper function to identify time columns - ONLY FOR EXCEL FORMATTING
  const isTimeColumn = (fieldName) => {
    const normalizedField = fieldName.toUpperCase();
    // Check if the field name contains 'TIME' anywhere
    return normalizedField.includes('TIME');
  };

  // Helper function to check if a value is numeric - ONLY FOR EXCEL FORMATTING
  const isNumericValue = (value) => {
    if (value === null || value === undefined || value === '') return false;
    return !isNaN(parseFloat(value)) && isFinite(value);
  };

  // Helper function to check if a value is a date - ONLY FOR EXCEL FORMATTING
  const isDateValue = (value) => {
    if (value === null || value === undefined || value === '') return false;
    // Check if it's already a Date object
    if (value instanceof Date) return !isNaN(value);
    // Check if it's a string that can be parsed as a date
    const dateStr = String(value);
    const parsedDate = new Date(dateStr);
    return !isNaN(parsedDate) && dateStr.length > 0;
  };

  // Helper function to check if a value is a time and convert to Excel time format
  const parseTimeValue = (value) => {
    if (value === null || value === undefined || value === '') return null;
    
    const timeStr = String(value).trim();
    
    // Match various time formats: HH:MM, HH:MM:SS, H:MM AM/PM, etc.
    const time24Regex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    const time12Regex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i;
    
    let hours = 0, minutes = 0, seconds = 0;
    
    // Try 24-hour format first
    let match = timeStr.match(time24Regex);
    if (match) {
      hours = parseInt(match[1]);
      minutes = parseInt(match[2]);
      seconds = match[3] ? parseInt(match[3]) : 0;
    } else {
      // Try 12-hour format
      match = timeStr.match(time12Regex);
      if (match) {
        hours = parseInt(match[1]);
        minutes = parseInt(match[2]);
        seconds = match[3] ? parseInt(match[3]) : 0;
        const meridiem = match[4].toUpperCase();
        
        // Convert to 24-hour format
        if (meridiem === 'PM' && hours !== 12) {
          hours += 12;
        } else if (meridiem === 'AM' && hours === 12) {
          hours = 0;
        }
      }
    }
    
    // Validate time
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
      return null;
    }
    
    // Convert to Excel time format (fraction of a day)
    // Excel time: 0.5 = 12:00:00, 1.0 = 24:00:00
    return (hours + (minutes / 60) + (seconds / 3600)) / 24;
  };

  // Helper function to check if a value should be considered empty/blank
  const isEmptyValue = (value) => {
    return value === null || value === undefined || value === '';
  };

  // Helper function to convert field names to Title Case
  const toTitleCase = (str) => {
    // Check if the string is all uppercase
    const isAllCaps = str === str.toUpperCase() && /[A-Z]/.test(str);
    
    if (isAllCaps) {
      // For ALL CAPS strings, just convert to title case as a single word
      // Then let the user see it and understand it
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    } else {
      // For camelCase or mixed case, add spaces before capitals
      let formatted = str.replace(/([A-Z])/g, ' $1').trim();
      
      // Split by spaces and convert each word to title case
      return formatted
        .split(/\s+/)
        .map(word => {
          const lower = word.toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(' ');
    }
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

  // CRITICAL FIX: Add function to process data for DataTable like ConsolidatedView does
  const getDataTableData = (activeTab) => {
    // For individual category tabs, we need to process raw data like ConsolidatedView does
    // to include page numbers and proper structure
    
    if (!allPagesData || allPagesData.length === 0) {
      // Fallback to collectedResult if no raw data available
      return collectedResult?.[activeTab] || [];
    }
    
    const processedData = [];
    
    // Sort pages by page number to ensure correct order
    const sortedPages = [...allPagesData].sort((a, b) => a.pageNumber - b.pageNumber);
    
    sortedPages.forEach(pageData => {
      if (pageData.rawOutput) {
        try {
          // Parse the raw JSON output
          let rawEntries = [];
          
          if (typeof pageData.rawOutput === 'string') {
            rawEntries = JSON.parse(pageData.rawOutput);
          } else if (Array.isArray(pageData.rawOutput)) {
            rawEntries = pageData.rawOutput;
          }
          
          // Process each entry from the raw JSON and filter by category
          rawEntries.forEach(entry => {
            if (entry.data && entry.category) {
              // Convert category names to match activeTab format
              const normalizedCategory = entry.category.toLowerCase().replace(/\s+/g, '');
              const targetCategory = activeTab === 'labourTimesheet' ? 'labourtimesheet' :
                                   activeTab === 'equipmentLog' ? 'equipmentlog' :
                                   activeTab.toLowerCase();
              
              if (normalizedCategory === targetCategory) {
                const flattenedEntry = {
                  pageNumber: pageData.pageNumber,
                  category: entry.category,
                  referenceDocument: file?.name || 'Document.pdf',
                  ...entry.data // Spread all data properties directly
                };
                processedData.push(flattenedEntry);
              }
            }
          });
        } catch (error) {
          console.error(`Error parsing raw output for page ${pageData.pageNumber}:`, error);
        }
      }
    });
    
    // If no raw data found, fall back to collectedResult
    if (processedData.length === 0) {
      const fallbackData = collectedResult?.[activeTab] || [];
      return fallbackData.map(row => ({
        ...row,
        category: activeTab === 'labourTimesheet' ? 'Labour Timesheet' :
                 activeTab === 'equipmentLog' ? 'Equipment Log' :
                 activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
        referenceDocument: file?.name || 'Document.pdf'
      }));
    }
    
    return processedData;
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
      ['Labour', collectedResult.labour.length, totals.labour],
      ['Labour Timesheet', collectedResult.labourTimesheet.length, totals.labourTimesheet],
      ['Material', collectedResult.material.length, totals.material],
      ['Equipment', collectedResult.equipment.length, totals.equipment],
      ['Equipment Log', collectedResult.equipmentLog.length, totals.equipmentLog],
      ['Consumables', collectedResult.consumables.length, totals.consumables],
      ['Subtrade', collectedResult.subtrade.length, totals.subtrade],
      [''],
      ['GRAND TOTAL', 
        collectedResult.labour.length + collectedResult.labourTimesheet.length +
        collectedResult.material.length + collectedResult.equipment.length + 
        collectedResult.equipmentLog.length + collectedResult.consumables.length + 
        collectedResult.subtrade.length,
        totals.grandTotal
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
    
    // Format currency columns (column C - Total Amount)
    for (let row = 7; row <= 15; row++) { // Rows 7-15 contain the data and grand total
      const cellRef = `C${row}`;
      if (totalsWS[cellRef]) {
        totalsWS[cellRef].z = '"$"#,##0.00'; // Currency format
        if (row === 15) { // Grand total row
          totalsWS[cellRef].s = { ...totalStyle, numFmt: '"$"#,##0.00' };
        }
      }
    }
    
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

    // NEW: Add Consolidated sheet second - using RAW JSON data like the ConsolidatedView
    const processRawDataForExcel = () => {
      // If we don't have allPagesData, fall back to old logic using collectedResult
      if (!allPagesData || allPagesData.length === 0) {
        if (!collectedResult) return [];
        
        // Fall back to the original logic
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
                referenceDocument: file?.name || 'Document.pdf',
                ...row
              });
            });
          }
        });
        
        return allData.sort((a, b) => {
          const pageA = a.pageNumber || 0;
          const pageB = b.pageNumber || 0;
          return pageA - pageB;
        });
      }
      
      const processedData = [];
      
      // Sort pages by page number to ensure correct order
      const sortedPages = [...allPagesData].sort((a, b) => a.pageNumber - b.pageNumber);
      
      sortedPages.forEach(pageData => {
        if (pageData.rawOutput) {
          try {
            // Parse the raw JSON output
            let rawEntries = [];
            
            if (typeof pageData.rawOutput === 'string') {
              rawEntries = JSON.parse(pageData.rawOutput);
            } else if (Array.isArray(pageData.rawOutput)) {
              rawEntries = pageData.rawOutput;
            }
            
            // Process each entry from the raw JSON - NO SORTING, keep original order
            rawEntries.forEach(entry => {
              if (entry.data) {
                const flattenedEntry = {
                  pageNumber: pageData.pageNumber,
                  category: entry.category || 'Unknown',
                  referenceDocument: file?.name || 'Document.pdf',
                  ...entry.data // Spread all data properties directly
                };
                processedData.push(flattenedEntry);
              }
            });
          } catch (error) {
            console.error(`Error parsing raw output for page ${pageData.pageNumber}:`, error);
          }
        }
      });
      
      return processedData;
    };
    
    const allData = processRawDataForExcel();

    if (allData.length > 0) {
      // Get all unique keys from combined data
      const allKeys = [...new Set(allData.flatMap(row => Object.keys(row)))].filter(key => 
        key !== 'userId' && 
        key !== 'sessionId'
      );

      // Reorder: category first, then other fields, then pageNumber second last, then referenceDocument at end
      let orderedKeys = ['category'];
      allKeys.forEach(key => {
        if (key !== 'category' && key !== 'pageNumber' && key !== 'referenceDocument') {
          orderedKeys.push(key);
        }
      });
      orderedKeys.push('pageNumber');
      orderedKeys.push('referenceDocument');

      // Create consolidated sheet with Serial Number as first column
      const consolidatedData = [
        ['GNC Invoice - Consolidated Data'],
        [''],
        [`Document: ${file?.name || 'Unknown'}`],
        [`Processed by: ${user.email}`],
        [`Total Items: ${allData.length}`],
        [''],
        ['Serial Number', ...orderedKeys.map(key => {
          // Only handle the truly special compound cases
          if (key === 'pageNumber') return 'Page Number';
          if (key === 'referenceDocument') return 'Reference Document';
          
          // Apply title case to everything else
          return toTitleCase(key);
        })]
      ];

      // Add all data rows with serial numbers - FIXED: Don't add empty strings for null/undefined values
      allData.forEach((row, index) => {
        consolidatedData.push([
          index + 1, // Serial Number starting from 1
          ...orderedKeys.map(key => {
            if (key === 'referenceDocument') return file?.name || 'Document.pdf';
            if ((key === 'TOTALAMOUNT' || key === 'totalAmount') && row[key] !== null && row[key] !== undefined) {
              return parseFloat(row[key]) || 0; // Keep as number for currency formatting
            }
            // FIXED: Return undefined for truly empty values instead of empty string
            const value = row[key];
            return isEmptyValue(value) ? undefined : value;
          })
        ]);
      });

      // Calculate and add total row
      const grandTotal = allData.reduce((sum, item) => {
        const amount = parseFloat(item.TOTALAMOUNT || item.totalAmount) || 0;
        return sum + amount;
      }, 0);

      // Add empty separator row
      consolidatedData.push([]);
      
      // Add total row with Serial Number column
      const totalRow = [
        '', // Empty for Serial Number column
        ...orderedKeys.map((key, index) => {
          if (index === 0) return 'GRAND TOTAL'; // First column shows "GRAND TOTAL"
          if (key === 'TOTALAMOUNT' || key === 'totalAmount') {
            return grandTotal; // Keep as number for currency formatting
          }
          if (index === 1) return `${allData.length} items`; // Second column shows item count
          return undefined; // All other columns blank (not empty string)
        })
      ];
      consolidatedData.push(totalRow);

      const consolidatedWS = XLSX.utils.aoa_to_sheet(consolidatedData);

      // Apply styling
      if (!consolidatedWS['!merges']) consolidatedWS['!merges'] = [];
      consolidatedWS['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(2, orderedKeys.length) } }); // +1 for Serial Number

      if (consolidatedWS['A1']) consolidatedWS['A1'].s = titleStyle;

      // Header row styles - including Serial Number column
      const cellRefSN = XLSX.utils.encode_cell({ r: 6, c: 0 });
      if (consolidatedWS[cellRefSN]) consolidatedWS[cellRefSN].s = headerStyle;
      
      orderedKeys.forEach((_, idx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 6, c: idx + 1 }); // +1 for Serial Number column
        if (consolidatedWS[cellRef]) consolidatedWS[cellRef].s = headerStyle;
      });

      // Data row styles (excluding the total row)
      for (let rowIdx = 7; rowIdx < consolidatedData.length - 2; rowIdx++) {
        // Style Serial Number column
        const snCellRef = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
        if (consolidatedWS[snCellRef]) {
          consolidatedWS[snCellRef].z = '#,##0'; // Integer format for serial numbers
          consolidatedWS[snCellRef].s = dataStyle;
        }
        
        // Style data columns
        orderedKeys.forEach((key, keyIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: keyIndex + 1 }); // +1 for Serial Number column
          if (consolidatedWS[cellRef]) {
            const cellValue = consolidatedData[rowIdx][keyIndex + 1]; // +1 for Serial Number column
            
            // Skip styling for truly empty cells
            if (isEmptyValue(cellValue)) {
              return;
            }
            
            // Apply specific formatting based on column type
            if (isCurrencyColumn(key) && isNumericValue(cellValue)) {
              consolidatedWS[cellRef].z = '"$"#,##0.00'; // Currency format
            } else if (isTimeColumn(key)) {
              // Check if the value is a valid time
              const timeValue = parseTimeValue(cellValue);
              if (timeValue !== null) {
                consolidatedWS[cellRef].v = timeValue;
                consolidatedWS[cellRef].t = 'n'; // Number type for time
                consolidatedWS[cellRef].z = 'HH:MM:SS'; // 24-hour time format
              } else if (typeof cellValue === 'string' && cellValue.trim() !== '') {
                // Keep as text if not a valid time
                consolidatedWS[cellRef].z = '@'; // Text format
              }
            } else if (isDateColumn(key)) {
              // Force date formatting for date columns regardless of value detection
              consolidatedWS[cellRef].z = 'dd/mm/yyyy'; // Date format
              // Convert string dates to Excel date format if needed
              if (typeof cellValue === 'string' && cellValue.trim() !== '') {
                let dateObj;
                // Handle DD/MM/YYYY format specifically
                if (cellValue.includes('/') && cellValue.length === 10) {
                  const parts = cellValue.split('/');
                  if (parts.length === 3) {
                    // Assume DD/MM/YYYY format and convert to MM/DD/YYYY for parsing
                    dateObj = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
                  }
                } else {
                  dateObj = new Date(cellValue);
                }
                if (dateObj && !isNaN(dateObj)) {
                  consolidatedWS[cellRef].v = dateObj;
                  consolidatedWS[cellRef].t = 'd';
                } else {
                  // If date parsing fails, keep as text but with date format
                  consolidatedWS[cellRef].z = '@'; // Text format
                }
              }
            } else if (key === 'SRNO' || key === 'pageNumber') {
              // Integer format for SRNO and pageNumber - no decimals
              consolidatedWS[cellRef].z = '#,##0'; // Integer format
            } else if (!isCurrencyColumn(key) && !isDateColumn(key) && !isTimeColumn(key) && isNumericValue(cellValue)) {
              consolidatedWS[cellRef].z = '#,##0.00'; // Number format without currency
            }
            consolidatedWS[cellRef].s = dataStyle;
          }
        });
      }

      // Apply total row styles
      const totalRowIndex = consolidatedData.length - 1;
      
      // Style Serial Number column in total row
      const snTotalCellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: 0 });
      if (consolidatedWS[snTotalCellRef]) {
        consolidatedWS[snTotalCellRef].s = totalStyle;
      }
      
      orderedKeys.forEach((key, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: colIdx + 1 }); // +1 for Serial Number column
        if (consolidatedWS[cellRef]) {
          // Check if this is a currency column in total row
          if (isCurrencyColumn(key)) {
            consolidatedWS[cellRef].z = '"$"#,##0.00'; // Currency format
          }
          consolidatedWS[cellRef].s = totalStyle;
        }
      });

      // Column widths - including Serial Number column
      consolidatedWS['!cols'] = [
        { wch: 15 }, // Serial Number column
        ...orderedKeys.map(key => {
          if (key === 'category') return { wch: 18 };
          if (key === 'pageNumber') return { wch: 12 };
          if (key === 'referenceDocument') return { wch: 30 };
          if (key === 'ITEMDESCRIPTION' || key === 'itemDescription') return { wch: 40 };
          if (key === 'EMPLOYEENAME' || key === 'employeeName') return { wch: 25 };
          if (key === 'TOTALAMOUNT' || key === 'totalAmount') return { wch: 15 };
          return { wch: 20 };
        })
      ];

      XLSX.utils.book_append_sheet(wb, consolidatedWS, 'Consolidated');
    }

    // FIXED: Create enhanced worksheets for each category using getDataTableData function
    const categories = ['labour', 'labourTimesheet', 'material', 'equipment', 'equipmentLog', 'consumables', 'subtrade'];
    
    categories.forEach(category => {
      // CRITICAL FIX: Use getDataTableData instead of collectedResult[category]
      const data = getDataTableData(category);
      
      if (data && data.length > 0) {
        // Get all unique keys from data and filter out userId, sessionId
        const allKeys = [...new Set(data.flatMap(row => Object.keys(row)))].filter(key => 
          key !== 'userId' && 
          key !== 'sessionId'
        );

        // Reorder: category first, then other fields, then pageNumber second last, then referenceDocument at end
        let orderedKeys = ['category'];
        allKeys.forEach(key => {
          if (key !== 'category' && key !== 'pageNumber' && key !== 'referenceDocument') {
            orderedKeys.push(key);
          }
        });
        orderedKeys.push('pageNumber');
        orderedKeys.push('referenceDocument');
        
        // Simplified sheet header with Serial Number as first column
        const sheetData = [
          ['GNC Invoice'],
          [''],
          [`Document: ${file?.name || 'Unknown'}`],
          [`Processed by: ${user.email}`],
          [`Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`],
          [`Items Count: ${data.length}`],
          [''],
          // Headers with proper formatting - Serial Number first
          ['Serial Number', ...orderedKeys.map(key => {
            // Only handle the truly special compound cases
            if (key === 'category') return 'Category';
            if (key === 'pageNumber') return 'Page Number';
            if (key === 'referenceDocument') return 'Reference Document';
            
            // Apply title case to everything else
            return toTitleCase(key);
          })]
        ];
        
        // Add data rows with serial numbers - FIXED: Don't add empty strings for null/undefined values
        data.forEach((row, index) => {
          sheetData.push([
            index + 1, // Serial Number starting from 1
            ...orderedKeys.map(key => {
              if (key === 'category') return row[key] || (category === 'labourTimesheet' ? 'Labour Timesheet' : category === 'equipmentLog' ? 'Equipment Log' : category.charAt(0).toUpperCase() + category.slice(1));
              if (key === 'referenceDocument') return file?.name || 'Document.pdf';
              if ((key === 'TOTALAMOUNT' || key === 'totalAmount') && row[key] !== null && row[key] !== undefined) {
                return parseFloat(row[key]) || 0; // Keep as number for currency formatting
              }
              // FIXED: Return undefined for truly empty values instead of empty string
              const value = row[key];
              return isEmptyValue(value) ? undefined : value;
            })
          ]);
        });

        // Enhanced total section
        const categoryTotal = data.reduce((sum, item) => {
          const amount = parseFloat(item.TOTALAMOUNT || item.totalAmount) || 0;
          return sum + amount;
        }, 0);

        if (categoryTotal > 0) {
          sheetData.push([]); // Separator
          sheetData.push([]); // Extra space
          
          // Category total summary section with Serial Number column
          const totalHeaderRow = [
            '', // Empty for Serial Number column
            ...orderedKeys.map((key, index) => {
              if (index === 0) return `${category.toUpperCase()} CATEGORY TOTAL`;
              else if (index === 1) return 'SUMMARY';
              return undefined;
            })
          ];
          sheetData.push(totalHeaderRow);
          
          const totalDataRow = [
            '', // Empty for Serial Number column
            ...orderedKeys.map((key, index) => {
              if (key === 'TOTALAMOUNT' || key === 'totalAmount') {
                return categoryTotal; // Keep as number for currency formatting
              } else if (index === 1) {
                return `${data.length} items`;
              } else if (index === 2) {
                return `Total: $${categoryTotal.toFixed(2)}`;
              }
              return undefined;
            })
          ];
          sheetData.push(totalDataRow);
        }
        
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        
        // Enhanced merging
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(2, orderedKeys.length) } }); // +1 for Serial Number
        
        // Apply enhanced styles
        if (ws['A1']) ws['A1'].s = titleStyle;
        
        // Header row styles - including Serial Number column
        const cellRefSN = XLSX.utils.encode_cell({ r: 7, c: 0 });
        if (ws[cellRefSN]) ws[cellRefSN].s = headerStyle;
        
        orderedKeys.forEach((_, idx) => {
          const cellRef = XLSX.utils.encode_cell({ r: 7, c: idx + 1 }); // +1 for Serial Number column
          if (ws[cellRef]) ws[cellRef].s = headerStyle;
        });
        
        // Data row styles
        for (let rowIdx = 8; rowIdx < sheetData.length - (categoryTotal > 0 ? 4 : 0); rowIdx++) {
          // Style Serial Number column
          const snCellRef = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
          if (ws[snCellRef]) {
            ws[snCellRef].z = '#,##0'; // Integer format for serial numbers
            ws[snCellRef].s = dataStyle;
          }
          
          // Style data columns
          orderedKeys.forEach((key, colIdx) => {
            const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx + 1 }); // +1 for Serial Number column
            if (ws[cellRef]) {
              const cellValue = sheetData[rowIdx][colIdx + 1]; // +1 for Serial Number column
              
              // Skip styling for truly empty cells
              if (isEmptyValue(cellValue)) {
                return;
              }
              
              // Apply specific formatting based on column type
              if (isCurrencyColumn(key) && isNumericValue(cellValue)) {
                ws[cellRef].z = '"$"#,##0.00'; // Currency format
              } else if (isTimeColumn(key)) {
                // Check if the value is a valid time
                const timeValue = parseTimeValue(cellValue);
                if (timeValue !== null) {
                  ws[cellRef].v = timeValue;
                  ws[cellRef].t = 'n'; // Number type for time
                  ws[cellRef].z = 'HH:MM:SS'; // 24-hour time format
                } else if (typeof cellValue === 'string' && cellValue.trim() !== '') {
                  // Keep as text if not a valid time
                  ws[cellRef].z = '@'; // Text format
                }
              } else if (isDateColumn(key)) {
                // Force date formatting for date columns regardless of value detection
                ws[cellRef].z = 'dd/mm/yyyy'; // Date format
                // Convert string dates to Excel date format if needed
                if (typeof cellValue === 'string' && cellValue.trim() !== '') {
                  let dateObj;
                  // Handle DD/MM/YYYY format specifically
                  if (cellValue.includes('/') && cellValue.length === 10) {
                    const parts = cellValue.split('/');
                    if (parts.length === 3) {
                      // Assume DD/MM/YYYY format and convert to MM/DD/YYYY for parsing
                      dateObj = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
                    }
                  } else {
                    dateObj = new Date(cellValue);
                  }
                  if (dateObj && !isNaN(dateObj)) {
                    ws[cellRef].v = dateObj;
                    ws[cellRef].t = 'd';
                  } else {
                    // If date parsing fails, keep as text but with date format
                    ws[cellRef].z = '@'; // Text format
                  }
                }
              } else if (key === 'SRNO' || key === 'pageNumber') {
                // Integer format for SRNO and pageNumber - no decimals
                ws[cellRef].z = '#,##0'; // Integer format
              } else if (!isCurrencyColumn(key) && !isDateColumn(key) && !isTimeColumn(key) && isNumericValue(cellValue)) {
                ws[cellRef].z = '#,##0.00'; // Number format without currency
              }
              ws[cellRef].s = dataStyle;
            }
          });
        }
        
        // Total section styles
        if (categoryTotal > 0) {
          const totalRowStart = sheetData.length - 2;
          
          // Style Serial Number column in total rows
          const snTotalCellRef1 = XLSX.utils.encode_cell({ r: totalRowStart - 1, c: 0 });
          const snTotalCellRef2 = XLSX.utils.encode_cell({ r: totalRowStart, c: 0 });
          if (ws[snTotalCellRef1]) ws[snTotalCellRef1].s = totalStyle;
          if (ws[snTotalCellRef2]) ws[snTotalCellRef2].s = totalStyle;
          
          orderedKeys.forEach((key, colIdx) => {
            const cellRef1 = XLSX.utils.encode_cell({ r: totalRowStart - 1, c: colIdx + 1 }); // +1 for Serial Number
            const cellRef2 = XLSX.utils.encode_cell({ r: totalRowStart, c: colIdx + 1 }); // +1 for Serial Number
            if (ws[cellRef1]) {
              // Apply currency formatting to amount columns in totals
              if (isCurrencyColumn(key)) {
                ws[cellRef1].z = '"$"#,##0.00'; // Currency format
                ws[cellRef2].z = '"$"#,##0.00'; // Currency format
              }
              ws[cellRef1].s = totalStyle;
            }
            if (ws[cellRef2]) ws[cellRef2].s = totalStyle;
          });
        }
        
        // Enhanced column widths - including Serial Number column
        ws['!cols'] = [
          { wch: 15 }, // Serial Number column
          ...orderedKeys.map(key => {
            if (key === 'category') return { wch: 18 };
            if (key === 'pageNumber') return { wch: 12 };
            if (key === 'referenceDocument') return { wch: 30 };
            if (key === 'ITEMDESCRIPTION' || key === 'itemDescription') return { wch: 40 };
            if (key === 'EMPLOYEENAME' || key === 'employeeName') return { wch: 25 };
            if (key === 'TOTALAMOUNT' || key === 'totalAmount') return { wch: 15 };
            return { wch: 20 };
          })
        ];
        
        // Create proper sheet name
        const sheetName = category === 'labourTimesheet' ? 'LabourTimesheet' :
                         category === 'equipmentLog' ? 'EquipmentLog' :
                         category.charAt(0).toUpperCase() + category.slice(1);
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    });

    const fileName = `GNC_Invoice_Complete_${user.email.split('@')[0]}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
      // First check if we have the image in availableImages (client-side converted)
      const availableImage = availableImages.find(img => img.pageNumber === selectedPage);
      if (availableImage && availableImage.base64) {
        return availableImage.base64; // Return base64 data directly
      }
      
      // Fallback to allPagesData for server-side processed images
      const pageData = allPagesData.find(p => p.pageNumber === selectedPage);
      return pageData ? pageData.imageUrl : null;
    }
    return null;
  };

  const availablePages = allPagesData.map(p => p.pageNumber).sort((a, b) => a - b);

  const handleViewPageReference = (pageNumber) => {
    // First check availableImages (client-side converted)
    const availableImage = availableImages.find(img => img.pageNumber === pageNumber);
    if (availableImage && availableImage.base64) {
      setSelectedRowImage(availableImage.base64);
      return;
    }
    
    // Fallback to allPagesData (server-side processed)
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
            processingPhase={processingPhase}
            conversionProgress={conversionProgress}
            conversionStatus={conversionStatus}
            customPrompts={customPrompts}
            onCustomPromptsChange={onCustomPromptsChange}
            buildFinalPrompt={buildFinalPrompt}
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
              
              {conversionProgress.total > 0 && (
                <>
                  <div className="w-full bg-zinc-800 rounded-full h-3 mt-4">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(conversionProgress.converted / conversionProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    {Math.round((conversionProgress.converted / conversionProgress.total) * 100)}% Complete ({conversionProgress.converted}/{conversionProgress.total} pages)
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
            availableImages={availableImages}
            onProcessSelected={handleProcessSelected}
            onExtractAll={handleExtractAll}
            loading={loading}
            onCancel={handleUploadNew}
            conversionStatus={conversionStatus}
            extractionPrompt={extractionPrompt}
            setExtractionPrompt={setExtractionPrompt}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            availableModels={availableModels}
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

              {/* Show processing results */}
              {allPagesData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-900 bg-opacity-30 border border-green-800 p-4 rounded-lg mt-6"
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
                  
                  <button
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Complete Excel Report
                  </button>
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
                    src={
                      selectedRowImage && selectedRowImage.startsWith('data:') 
                        ? selectedRowImage // Use base64 data directly
                        : getAuthenticatedImageUrl(selectedRowImage) // Use authenticated URL for server images
                    }
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
                    src={
                      getCurrentImageUrl().startsWith('data:') 
                        ? getCurrentImageUrl() // Use base64 data directly
                        : getAuthenticatedImageUrl(getCurrentImageUrl()) // Use authenticated URL for server images
                    }
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
                  <>
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
                    <button
                      onClick={() => setActiveTab('consolidated')}
                      className={`py-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'consolidated'
                          ? 'border-b-2 border-purple-500 text-purple-500'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Consolidated View
                    </button>
                  </>
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
              ) : activeTab === 'consolidated' && viewMode === 'collected' ? (
                <ConsolidatedView 
                  collectedResult={collectedResult}
                  allPagesData={allPagesData}
                  pageErrors={allPagesData.filter(p => p.error).map(p => ({ pageNumber: p.pageNumber, error: p.error }))}
                  documentName={file?.name}
                  onViewPageReference={handleViewPageReference}
                />
              ) : (
                <DataTable 
                  data={getDataTableData(activeTab)}
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

export default InvoiceExtractorSecondHalf;