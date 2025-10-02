import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import FileUpload from '../components/FileUpload';
import DataTable from '../components/DataTable';
import TotalsSummary from '../components/TotalsSummary';

function InvoiceExtractor({ user, onLogout }) {
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
  const [pageErrors, setPageErrors] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
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
    setPageErrors([]);
    setProcessingStatus('Starting...');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('http://localhost:5000/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
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
                
                if (data.error) {
                  setPageErrors(prev => [...prev, {
                    pageNumber: data.pageNumber,
                    error: data.error
                  }]);
                }
                
                setProcessingStatus(data.message);
              } else if (data.type === 'complete') {
                setCollectedResult(data.collectedResult);
                setAllPagesData(data.allPagesData);
                setLoading(false);
                setProcessingStatus('Processing complete!');
              } else if (data.type === 'error') {
                setError(data.error);
                setLoading(false);
                setProcessingStatus('Error occurred');
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError, 'Raw line:', line);
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
            }
          }
        } catch (e) {
          console.error('Error parsing final buffer:', e);
        }
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred while processing the PDF');
      setLoading(false);
      setProcessingStatus('Error occurred');
    }
  };

  const calculateGrandTotals = () => {
    if (!collectedResult) return null;

    const calculateTotal = (data) => data.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);

    const labourTotal = calculateTotal(collectedResult.labour);
    const materialTotal = calculateTotal(collectedResult.material);
    const equipmentTotal = calculateTotal(collectedResult.equipment);
    const consumablesTotal = calculateTotal(collectedResult.consumables);
    const subtradeTotal = calculateTotal(collectedResult.subtrade);

    return {
      labour: labourTotal,
      material: materialTotal,
      equipment: equipmentTotal,
      consumables: consumablesTotal,
      subtrade: subtradeTotal,
      grandTotal: labourTotal + materialTotal + equipmentTotal + consumablesTotal + subtradeTotal
    };
  };

  const downloadJSON = () => {
    const dataToDownload = {
      collectedResult,
      allPagesData,
      totals: calculateGrandTotals(),
      errors: pageErrors
    };
    const dataStr = JSON.stringify(dataToDownload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'extracted_data.json';
    link.click();
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const totals = calculateGrandTotals();

    const totalsData = [
      ['GNC file'],
      [],
      [],
      ['Category', 'Items', 'Total Amount'],
      ['Labour', collectedResult.labour.length, `${totals.labour.toFixed(2)}`],
      ['Material', collectedResult.material.length, `${totals.material.toFixed(2)}`],
      ['Equipment', collectedResult.equipment.length, `${totals.equipment.toFixed(2)}`],
      ['Consumables', collectedResult.consumables.length, `${totals.consumables.toFixed(2)}`],
      ['Subtrade', collectedResult.subtrade.length, `${totals.subtrade.toFixed(2)}`],
      ['', '', ''],
      ['GRAND TOTAL', 
        collectedResult.labour.length + collectedResult.material.length + 
        collectedResult.equipment.length + collectedResult.consumables.length + 
        collectedResult.subtrade.length,
        `${totals.grandTotal.toFixed(2)}`
      ]
    ];

    if (pageErrors.length > 0) {
      totalsData.push(['', '', '']);
      totalsData.push(['WARNINGS', '', '']);
      pageErrors.forEach(err => {
        totalsData.push([`Page ${err.pageNumber}`, err.error, '']);
      });
    }

    const totalsWS = XLSX.utils.aoa_to_sheet(totalsData);
    
    if (!totalsWS['!merges']) totalsWS['!merges'] = [];
    totalsWS['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });
    
    if (!totalsWS['A1'].s) totalsWS['A1'].s = {};
    totalsWS['A1'].s = {
      fill: { patternType: "solid", fgColor: { rgb: "006400" }, bgColor: { rgb: "006400" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    ['A4', 'B4', 'C4'].forEach(cell => {
      if (totalsWS[cell]) {
        totalsWS[cell].s = {
          fill: { patternType: "solid", fgColor: { rgb: "006400" }, bgColor: { rgb: "006400" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11, name: "Calibri" },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    });

    XLSX.utils.book_append_sheet(wb, totalsWS, 'Totals');

    const categories = ['labour', 'material', 'equipment', 'consumables', 'subtrade'];
    
    categories.forEach(category => {
      const data = collectedResult[category];
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]);
        
        const sheetData = [
          ['GNC file'],
          [],
          [],
          headers
        ];
        
        data.forEach(row => {
          sheetData.push(headers.map(key => row[key]));
        });
        
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } });
        
        if (!ws['A1'].s) ws['A1'].s = {};
        ws['A1'].s = {
          fill: { patternType: "solid", fgColor: { rgb: "006400" }, bgColor: { rgb: "006400" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14, name: "Calibri" },
          alignment: { horizontal: "center", vertical: "center" }
        };
        
        headers.forEach((_, idx) => {
          const cellRef = XLSX.utils.encode_cell({ r: 3, c: idx });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              fill: { patternType: "solid", fgColor: { rgb: "006400" }, bgColor: { rgb: "006400" } },
              font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11, name: "Calibri" },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
        });
        
        XLSX.utils.book_append_sheet(wb, ws, category.charAt(0).toUpperCase() + category.slice(1));
      }
    });

    XLSX.writeFile(wb, 'invoice_data.xlsx', { cellStyles: true });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="bg-white shadow mb-4">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">GNC Group</h1>
            <nav className="flex gap-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link to="/invoice-extractor" className="text-gray-600 hover:text-gray-900 font-medium">
                Invoice Extractor
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={onLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <FileUpload
          file={file}
          loading={loading}
          progress={progress}
          allPagesData={allPagesData}
          error={error}
          processingStatus={processingStatus}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
        />

        {collectedResult && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Extracted Data</h2>
              <div className="flex gap-3">
                <button
                  onClick={downloadJSON}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Download JSON
                </button>
                <button
                  onClick={downloadExcel}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Download Excel
                </button>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-4 flex-wrap">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode('collected');
                    setShowRaw(false);
                    setActiveTab('totals');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'collected'
                      ? 'bg-white text-indigo-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Pages Combined
                </button>
                <button
                  onClick={() => setViewMode('individual')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'individual'
                      ? 'bg-white text-indigo-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
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
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {allPagesData.map(page => (
                      <option key={page.pageNumber} value={page.pageNumber}>
                        Page {page.pageNumber} {page.error ? '⚠️' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowImage(!showImage)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showImage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {showImage ? 'Hide' : 'Show'} Image
                  </button>

                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showRaw
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {showRaw ? 'Hide' : 'Show'} Raw Output
                  </button>
                </>
              )}
            </div>

            {selectedRowImage && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedRowImage(null)}
              >
                <div className="bg-white rounded-lg max-w-5xl max-h-full overflow-auto p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Page Reference</h3>
                    <button
                      onClick={() => setSelectedRowImage(null)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Close
                    </button>
                  </div>
                  <img 
                    src={selectedRowImage} 
                    alt="Page Reference"
                    className="max-w-full h-auto"
                  />
                </div>
              </div>
            )}

            {showImage && viewMode === 'individual' && getCurrentImageUrl() && (
              <div className="mb-6 bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Page {selectedPage} Image</h3>
                <div className="overflow-auto max-h-96">
                  <img 
                    src={getCurrentImageUrl()} 
                    alt={`Page ${selectedPage}`}
                    className="max-w-full h-auto border border-gray-300 rounded"
                  />
                </div>
              </div>
            )}

            {showRaw && viewMode === 'individual' && (
              <div className="mb-6 bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Raw Gemini Output - Page {selectedPage}</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getCurrentRawOutput());
                      alert('Copied to clipboard!');
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-xs whitespace-pre-wrap">{getCurrentRawOutput()}</pre>
              </div>
            )}

            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-4 overflow-x-auto">
                {viewMode === 'collected' && (
                  <button
                    onClick={() => setActiveTab('totals')}
                    className={`py-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === 'totals'
                        ? 'border-b-2 border-green-600 text-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Totals Summary
                  </button>
                )}
                {['labour', 'material', 'equipment', 'consumables', 'subtrade'].map((tab) => {
                  const currentData = getCurrentData();
                  const count = currentData?.[tab]?.length || 0;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                    </button>
                  );
                })}
              </nav>
            </div>

            {activeTab === 'totals' && viewMode === 'collected' && totals && (
              <TotalsSummary 
                collectedResult={collectedResult} 
                totals={totals}
                pageErrors={pageErrors}
              />
            )}

            {activeTab !== 'totals' && (
              <div className="mt-4">
                {getCurrentData() && (
                  <DataTable
                    data={getCurrentData()[activeTab]}
                    type={activeTab}
                    onViewPageReference={handleViewPageReference}
                    pageErrors={pageErrors}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InvoiceExtractor;