import React, { useState, useEffect } from 'react';
import { getProfitAndLoss, downloadExport } from '../services/financeService';
import SummaryCard from './SummaryCard';

const FinancePLDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(""); // Format: "YYYY-MM"

  useEffect(() => {
    fetchDashboardData(selectedMonth);
  }, [selectedMonth]);

  const fetchDashboardData = async (month) => {
    setLoading(true);
    try {
      const result = await getProfitAndLoss(month);
      setData(result);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    downloadExport(selectedMonth);
  };

  if (loading) return <div>Loading financial data...</div>;
  if (!data) return <div>Error loading dashboard.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Profit & Loss</h1>
        
        <div className="flex gap-4">
          {/* AC4: Month selection filter */}
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border p-2 rounded"
          />
          {/* AC5: Excel Export */}
          <button 
            onClick={handleExport}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Export to Excel
          </button>
        </div>
      </div>

      <p className="text-gray-500 mb-6">
        {data.monthToDate ? "Month-to-Date" : `Displaying data for ${data.month}`} 
        (Generated: {new Date(data.generatedAt).toLocaleString()})
      </p>

      {/* AC1: Summary Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard data={data.revenue} />
        <SummaryCard data={data.costOfSales} />
        <SummaryCard data={data.grossMargin} />
        <SummaryCard data={data.netProfitPostTax} />
      </div>

      {/* AC2: Product Breakdown */}
      <div className="bg-white p-6 border rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-4">Revenue Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500">Hotel Revenue</p>
            <p className="text-lg font-semibold">LKR {data.productBreakdown.hotelRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Adventure Revenue</p>
            <p className="text-lg font-semibold">LKR {data.productBreakdown.adventureRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Third-Party Commissions</p>
            <p className="text-lg font-semibold text-red-600">
              - LKR {data.productBreakdown.thirdPartyCommission.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* AC6: Tax Summary */}
      <div className="bg-gray-50 p-6 border rounded-lg">
        <h2 className="text-lg font-bold mb-2">Tax Calculation ({data.taxSummary.taxRatePercent}%)</h2>
        <div className="flex justify-between max-w-md">
          <span>Pre-Tax Profit: LKR {data.taxSummary.netProfitPreTax.toLocaleString()}</span>
          <span className="text-red-600">- LKR {data.taxSummary.taxAmount.toLocaleString()}</span>
          <span className="font-bold">Post-Tax: LKR {data.taxSummary.netProfitPostTax.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default FinancePLDashboard;