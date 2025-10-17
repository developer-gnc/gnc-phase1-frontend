function TotalsSummary({ collectedResult, pageErrors }) {
  // Calculate totals only from totalAmount field
  const calculateCategoryTotal = (categoryData) => {
    return categoryData.reduce((sum, item) => {
      const amount = parseFloat(item.totalAmount) || 0;
      return sum + amount;
    }, 0);
  };

  const totals = {
    labour: calculateCategoryTotal(collectedResult.labour),
    material: calculateCategoryTotal(collectedResult.material),
    equipment: calculateCategoryTotal(collectedResult.equipment),
    consumables: calculateCategoryTotal(collectedResult.consumables),
    subtrade: calculateCategoryTotal(collectedResult.subtrade),
    labourTimesheet: calculateCategoryTotal(collectedResult.labourTimesheet),
    equipmentLog: calculateCategoryTotal(collectedResult.equipmentLog)
  };

  const grandTotal = totals.labour + totals.material + totals.equipment + 
                    totals.consumables + totals.subtrade + totals.labourTimesheet + 
                    totals.equipmentLog;

  return (
    <div className="space-y-4">
      {pageErrors && pageErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">
            ⚠️ Data Extraction Warnings ({pageErrors.length} pages)
          </h3>
          <ul className="text-xs text-yellow-700 space-y-1 max-h-40 overflow-y-auto">
            {pageErrors.map(err => (
              <li key={err.pageNumber}>
                • Page {err.pageNumber}: {err.error}
              </li>
            ))}
          </ul>
          <p className="text-xs text-yellow-600 mt-2">
            Note: Data from other pages has been preserved and is included in the totals below.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 border-b text-right text-sm font-semibold text-gray-700">Items</th>
              <th className="px-6 py-3 border-b text-right text-sm font-semibold text-gray-700">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b text-sm text-gray-800 font-medium">Labour</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right">{collectedResult.labour.length}</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right font-semibold">
                ${totals.labour > 0 ? totals.labour.toFixed(2) : '0.00'}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b text-sm text-gray-800 font-medium">Labour Timesheet</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right">{collectedResult.labourTimesheet.length}</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right font-semibold">
                ${totals.labourTimesheet > 0 ? totals.labourTimesheet.toFixed(2) : '0.00'}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b text-sm text-gray-800 font-medium">Material</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right">{collectedResult.material.length}</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right font-semibold">
                ${totals.material > 0 ? totals.material.toFixed(2) : '0.00'}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b text-sm text-gray-800 font-medium">Equipment</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right">{collectedResult.equipment.length}</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right font-semibold">
                ${totals.equipment > 0 ? totals.equipment.toFixed(2) : '0.00'}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b text-sm text-gray-800 font-medium">Equipment Log</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right">{collectedResult.equipmentLog.length}</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right font-semibold">
                ${totals.equipmentLog > 0 ? totals.equipmentLog.toFixed(2) : '0.00'}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b text-sm text-gray-800 font-medium">Consumables</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right">{collectedResult.consumables.length}</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right font-semibold">
                ${totals.consumables > 0 ? totals.consumables.toFixed(2) : '0.00'}
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b text-sm text-gray-800 font-medium">Subtrade</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right">{collectedResult.subtrade.length}</td>
              <td className="px-6 py-4 border-b text-sm text-gray-600 text-right font-semibold">
                ${totals.subtrade > 0 ? totals.subtrade.toFixed(2) : '0.00'}
              </td>
            </tr>
            <tr className="bg-green-50">
              <td className="px-6 py-4 border-t-2 border-green-600 text-sm text-gray-900 font-bold">GRAND TOTAL</td>
              <td className="px-6 py-4 border-t-2 border-green-600 text-sm text-gray-900 font-bold text-right">
                {collectedResult.labour.length + collectedResult.labourTimesheet.length +
                  collectedResult.material.length + collectedResult.equipment.length + 
                  collectedResult.equipmentLog.length + collectedResult.consumables.length + 
                  collectedResult.subtrade.length}
              </td>
              <td className="px-6 py-4 border-t-2 border-green-600 text-lg text-green-700 font-bold text-right">
                ${grandTotal > 0 ? grandTotal.toFixed(2) : '0.00'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TotalsSummary;