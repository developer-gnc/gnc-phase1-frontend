function DataTable({ data, type, onViewPageReference }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-500 text-lg">No {type} data found</p>
        <p className="text-gray-600 text-sm mt-2">This is normal if the PDF doesn't contain {type} items</p>
      </div>
    );
  }

  // Get all unique keys from all rows to handle dynamic columns
  const allKeys = [...new Set(data.flatMap(row => Object.keys(row)))];
  
  // Filter out pageNumber from regular columns since it's handled separately
  const dataKeys = allKeys.filter(key => key !== 'pageNumber');

  const calculateCategoryTotal = (data) => {
    return data.reduce((sum, item) => {
      const amount = parseFloat(item.totalAmount) || 0;
      return sum + amount;
    }, 0);
  };

  const categoryTotal = calculateCategoryTotal(data);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
            <tr>
              {data.some(row => row.pageNumber) && (
                <th className="px-4 py-3 border-b text-left text-sm font-bold text-gray-700 sticky left-0 bg-gray-100 z-10">
                  Page Reference
                </th>
              )}
              {dataKeys.map((key) => (
                <th key={key} className="px-4 py-3 border-b text-left text-sm font-bold text-gray-700 whitespace-nowrap">
                  {key}
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
                      📄 Page {row.pageNumber}
                    </button>
                  </td>
                )}
                {dataKeys.map((key) => (
                  <td key={key} className="px-4 py-3 border-b text-sm text-gray-700 whitespace-nowrap">
                    {row[key] !== null && row[key] !== undefined ? row[key] : '-'}
                  </td>
                ))}
              </tr>
            ))}
            {categoryTotal > 0 && (
              <tr className="bg-gradient-to-r from-yellow-50 to-yellow-100 font-bold border-t-2 border-yellow-400">
                {data.some(row => row.pageNumber) && (
                  <td className="px-4 py-4 text-sm sticky left-0 bg-yellow-50 z-10">
                    <span className="text-yellow-800 font-bold">{type.toUpperCase()} TOTAL</span>
                  </td>
                )}
                {dataKeys.map((key, index) => (
                  <td key={key} className="px-4 py-4 text-sm text-gray-900">
                    {key === 'totalAmount' 
                      ? <span className="text-green-700 font-bold text-base">${categoryTotal.toFixed(2)}</span>
                      : (index === dataKeys.length - 1 ? <span className="text-gray-600">{data.length} items</span> : '')
                    }
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">Category Summary</p>
            <p className="text-xs text-gray-500 mt-1">Total items in {type}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{data.length}</p>
            <p className="text-sm text-gray-500">items</p>
          </div>
          {categoryTotal > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">${categoryTotal.toFixed(2)}</p>
              <p className="text-sm text-gray-500">total amount</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataTable;