function ConsolidatedView({ collectedResult, pageErrors, documentName, onViewPageReference }) {
  if (!collectedResult) {
    return <p className="text-gray-500 text-center py-8">No data available</p>;
  }

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
    return <p className="text-gray-500 text-center py-8">No consolidated data found</p>;
  }

  // Sort data by page number first, then by category
  allData.sort((a, b) => {
    const pageA = a.pageNumber || 0;
    const pageB = b.pageNumber || 0;
    if (pageA !== pageB) {
      return pageA - pageB;
    }
    // If same page, sort by category
    return a.category.localeCompare(b.category);
  });

  // Get all unique keys from combined data and filter out userId, sessionId
  const allKeys = [...new Set(allData.flatMap(row => Object.keys(row)))].filter(key => 
    key !== 'userId' && 
    key !== 'sessionId'
  );

  // Reorder: category first, then pageNumber, then other fields, then referenceDocument at end
  let orderedKeys = ['category', 'pageNumber'];
  allKeys.forEach(key => {
    if (key !== 'category' && key !== 'pageNumber' && key !== 'referenceDocument') {
      orderedKeys.push(key);
    }
  });
  orderedKeys.push('referenceDocument');

  // Calculate grand total
  const grandTotal = allData.reduce((sum, item) => {
    const amount = parseFloat(item.TOTALAMOUNT || item.totalAmount) || 0;
    return sum + amount;
  }, 0);

  // Get pages that had errors for display
  const pagesInData = [...new Set(allData.map(item => item.pageNumber))].filter(Boolean);
  const relevantErrors = pageErrors ? pageErrors.filter(err => 
    pagesInData.includes(err.pageNumber)
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
              {allData.some(row => row.pageNumber) && (
                <th className="px-4 py-3 border-b text-left text-sm font-bold text-gray-700 sticky left-0 bg-gray-100 z-10">
                  Page View
                </th>
              )}
              {orderedKeys.map((key) => (
                <th key={key} className="px-4 py-3 border-b text-left text-sm font-bold text-gray-700 whitespace-nowrap">
                  {key === 'category' ? 'Category' :
                   key === 'pageNumber' ? 'Page Number' :
                   key === 'referenceDocument' ? 'Reference Document' :
                   key.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allData.map((row, idx) => (
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

      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-400">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-lg font-bold text-blue-800">CONSOLIDATED DATA SUMMARY</p>
            <p className="text-sm text-blue-700 mt-1">All categories combined (sorted by page number)</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{allData.length}</p>
            <p className="text-sm text-gray-600">total items</p>
          </div>
          {grandTotal > 0 && (
            <div className="text-right">
              <p className="text-3xl font-bold text-green-700">${grandTotal.toFixed(2)}</p>
              <p className="text-sm text-green-600 font-semibold">GRAND TOTAL</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConsolidatedView;

//updated