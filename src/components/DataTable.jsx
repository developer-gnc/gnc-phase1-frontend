function DataTable({ data, type, onViewPageReference, pageErrors, documentName }) {
    if (!data || data.length === 0) {
      return <p className="text-gray-500 text-center py-8">No {type} data found</p>;
    }
  
    // Get all unique keys and filter out userId, sessionId, and pageNumber
    const allKeys = [...new Set(data.flatMap(row => Object.keys(row)))];
    const keys = allKeys.filter(key => 
      key !== 'userId' && 
      key !== 'sessionId' && 
      key !== 'pageNumber'
    );
    
    // Add pageNumber and referenceDocument at the END
    const orderedKeys = [...keys, 'pageNumber', 'referenceDocument'];
    
    const calculateCategoryTotal = (data) => {
      return data.reduce((sum, item) => {
        const amount = parseFloat(item.TOTALAMOUNT || item.totalAmount) || 0;
        return sum + amount;
      }, 0);
    };
  
    const categoryTotal = calculateCategoryTotal(data);
  
    const pagesInCategory = [...new Set(data.map(item => item.pageNumber))].filter(Boolean);
    
    const relevantErrors = pageErrors ? pageErrors.filter(err => 
      pagesInCategory.includes(err.pageNumber)
    ) : [];
  
    return (
      <div>
        {relevantErrors.length > 0 && (
          <div className="mb-4 space-y-2">
            {relevantErrors.map(err => (
              <div key={err.pageNumber} className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 font-medium">Partial Data Recovery</p>
                    <p className="text-xs text-yellow-700 mt-1">Page {err.pageNumber}: {err.error}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
  
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr>
                {data.some(row => row.pageNumber) && (
                  <th className="px-4 py-3 border-b text-left text-sm font-bold text-gray-700 sticky left-0 bg-gray-100 z-10">
                    Page View
                  </th>
                )}
                {orderedKeys.map((key) => (
                  <th key={key} className="px-4 py-3 border-b text-left text-sm font-bold text-gray-700 whitespace-nowrap">
                    {key === 'pageNumber' ? 'Page Number' :
                     key === 'referenceDocument' ? 'Reference Document' :
                     key.replace(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  {row.pageNumber && (
                    <td className="px-4 py-3 border-b text-sm sticky left-0 bg-white z-10">
                      <button
                        onClick={() => onViewPageReference(row.pageNumber)}
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        📄 View
                      </button>
                    </td>
                  )}
                  {orderedKeys.map((key) => (
                    <td key={key} className="px-4 py-3 border-b text-sm text-gray-700 whitespace-nowrap">
                      {key === 'referenceDocument' ? (
                        <span className="text-blue-600 font-medium">
                          {documentName || 'Document.pdf'}
                        </span>
                      ) : key === 'pageNumber' ? (
                        row[key] !== null && row[key] !== undefined ? row[key] : '-'
                      ) : (
                        row[key] !== null && row[key] !== undefined ? row[key] : '-'
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-400">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-lg font-bold text-yellow-800">{type.toUpperCase()} CATEGORY TOTAL</p>
              <p className="text-sm text-yellow-700 mt-1">Summary for all {type} items</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              <p className="text-sm text-gray-600">total items</p>
            </div>
            {categoryTotal > 0 && (
              <div className="text-right">
                <p className="text-3xl font-bold text-green-700">${categoryTotal.toFixed(2)}</p>
                <p className="text-sm text-green-600 font-semibold">TOTAL AMOUNT</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  export default DataTable;