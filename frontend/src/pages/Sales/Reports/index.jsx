import { useState } from "react";
import LayoutComponents from "../../../components/LayoutComponents";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("pipeline");

  // Mock data for charts
  const pipelineData = {
    stages: ["New Lead", "Connected", "Proposal Sent", "Closed Won", "Closed Lost", "Lost"],
    counts: [12, 8, 6, 4, 3, 2],
    values: [1200000, 800000, 600000, 400000, 0, 0]
  };

  const performanceData = {
    agents: ["Alex", "Jordan", "Taylor", "Casey"],
    won: [5, 3, 4, 2],
    lost: [2, 4, 1, 3],
    revenue: [500000, 300000, 400000, 200000]
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Sales Reports" subtitle="Analytics and performance insights" variant="card">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveReport("pipeline")}
              className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeReport === "pipeline" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Pipeline Report
            </button>
            <button
              onClick={() => setActiveReport("performance")}
              className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeReport === "performance" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Performance Report
            </button>
          </div>

          {activeReport === "pipeline" && (
            <div className="space-y-12">
              <div>
                <h3 className="text-xl font-semibold mb-6">Leads by Stage</h3>
                <div className="h-80 bg-gray-50 rounded-xl flex items-end justify-around p-8">
                  {pipelineData.stages.map((stage, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="bg-blue-600 w-20 rounded-t-lg transition-all" style={{ height: `${pipelineData.counts[i] * 20}px` }}></div>
                      <p className="mt-4 text-sm font-medium">{pipelineData.counts[i]}</p>
                      <p className="text-xs text-gray-600 mt-2 text-center">{stage}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-6">Deal Value Funnel</h3>
                <div className="h-80 bg-gradient-to-b from-blue-50 to-transparent rounded-xl flex items-end justify-center p-8">
                  <div className="flex items-end gap-8">
                    {pipelineData.values.map((value, i) => (
                      <div key={i} className="text-center">
                        <div className="bg-purple-600 rounded-t-lg transition-all" style={{ width: '100px', height: `${value / 10000}px` }}></div>
                        <p className="mt-4 text-lg font-bold">₹{ (value / 100000).toFixed(1) }L</p>
                        <p className="text-xs text-gray-600">{pipelineData.stages[i]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReport === "performance" && (
            <div className="space-y-12">
              <div>
                <h3 className="text-xl font-semibold mb-6">Agent Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {performanceData.agents.map((agent, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-lg mb-4">{agent}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Closed Won</span>
                          <span className="font-bold text-green-600">{performanceData.won[i]}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Closed Lost</span>
                          <span className="font-bold text-red-600">{performanceData.lost[i]}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t">
                          <span className="text-gray-600">Revenue Generated</span>
                          <span className="font-bold text-black">₹{performanceData.revenue[i].toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </LayoutComponents>
    </div>
  );
};

export default Reports;