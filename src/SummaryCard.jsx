import React from 'react';

const SummaryCard = ({ data }) => {
  if (!data) return null;

  // Determine the CSS class based on the color the backend sent
  const varianceClass = data.varianceColor === "green" ? "text-green-600" : "text-red-600";

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-gray-500 text-sm font-medium">{data.title}</h3>
      <p className="text-2xl font-bold mt-1">LKR {data.actual.toLocaleString()}</p>
      
      <div className="mt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Budget: LKR {data.budget.toLocaleString()}</span>
          {/* AC3: Color coding actual vs budget variance */}
          <span className={`font-semibold ${varianceClass}`}>
            {data.variance > 0 ? "+" : ""}LKR {data.variance.toLocaleString()}
          </span>
        </div>
        
        {/* AC4: Month over Month % change */}
        <div className="flex justify-between mt-1 pt-1 border-t">
          <span className="text-gray-500">vs Last Month:</span>
          <span className="font-medium">
            {data.monthOverMonthChangePercent > 0 ? "+" : ""}{data.monthOverMonthChangePercent}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;