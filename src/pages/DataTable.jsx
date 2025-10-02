function DataTable({ data, type, onViewPageReference, pageErrors }) {
    if (!data || data.length === 0) {
      return <p className="text-gray-500 text-center py-8">No {type} data found</p>;
    }
  
    const keys = Object.keys(data[0]);
    
    const calculateCategoryTotal = (data) => {
      return data.reduce((sum, item) => {
        const amount = parseFloat(item.totalAmount) || 0;
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
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                {data.some(row => row.pageNumber) && (
                  <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10">
                    Page Reference
                  </th>
                )}
                {keys.map((key) => (
                  <th key={key} className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {row.pageNumber && (
                    <td className="px-4 py-2 border-b text-sm sticky left-0 bg-white z-10">
                      <button
                        onClick={() => onViewPageReference(row.pageNumber)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 transition-colors"
                      >
                        View Page {row.pageNumber}
                      </button>
                    </td>
                  )}
                  {keys.map((key) => (
                    <td key={key} className="px-4 py-2 border-b text-sm text-gray-600">
                      {row[key] !== null && row[key] !== undefined ? row[key] : '-'}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-yellow-50 font-bold">
                {data.some(row => row.pageNumber) && (
                  <td className="px-4 py-3 border-t-2 border-yellow-400 text-sm sticky left-0 bg-yellow-50 z-10">
                    {type.toUpperCase()} TOTAL
                  </td>
                )}
                {keys.map((key, index) => (
                  <td key={key} className="px-4 py-3 border-t-2 border-yellow-400 text-sm text-gray-800">
                    {key === 'totalAmount' ? `$${categoryTotal.toFixed(2)}` : (index === keys.length - 1 ? `${data.length} items` : '')}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  export default DataTable;