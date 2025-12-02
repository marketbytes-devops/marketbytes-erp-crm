import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdAdd, MdDownload } from "react-icons/md";

const Recruitment = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/hr/candidates/")
      .then((res) => {
        let data = res.data;

        if (data && data.results) {
          data = data.results;
        }

        const candidatesArray = Array.isArray(data) ? data : [];
        setCandidates(candidatesArray);
      })
      .catch((err) => {
        console.error("Failed to load candidates:", err);
        setCandidates([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const statusColor = {
    screening: "bg-gray-100 text-gray-800",
    interview: "bg-blue-100 text-blue-800",
    technical: "bg-purple-100 text-purple-800",
    hr_round: "bg-indigo-100 text-indigo-800",
    selected: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    on_hold: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Recruitment" subtitle="Manage hiring pipeline" variant="card">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex justify-between items-center">
          <h3 className="text-xl font-bold">Candidates</h3>
          <div className="flex gap-3">
            <button className="flex items-center gap-3 px-6 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
              <MdDownload className="w-5 h-5" /> Export
            </button>
            <button className="flex items-center gap-3 px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition font-medium">
              <MdAdd className="w-5 h-5" /> Add Candidate
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center text-gray-500">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <MdAdd className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-medium">No candidates yet</p>
            <p className="text-sm mt-2">Start building your talent pipeline</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((c, i) => (
              <motion.div
                key={c.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="h-32 bg-linear-to-r from-indigo-500 to-purple-600"></div>
                <div className="p-6 -mt-16">
                  <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-xl mx-auto mb-4 overflow-hidden">
                    <img
                      src={
                        c.image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || "Candidate")}&background=6366f1&color=fff&bold=true`
                      }
                      alt={c.name || "Candidate"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-xl font-bold text-center text-gray-900">{c.name || "Unnamed"}</h4>
                  <p className="text-center text-gray-600 mt-1">
                    {c.designation || "—"} • {c.department?.name || "—"}
                  </p>
                  <div className="mt-5 flex justify-center">
                    <span
                      className={`px-5 py-2 rounded-full text-sm font-bold ${
                        statusColor[c.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {(c.status || "unknown").replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  {c.offered && (
                    <div className="mt-4 text-center">
                      <span className="px-4 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                        Offer Extended
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </LayoutComponents>
    </div>
  );
};

export default Recruitment;