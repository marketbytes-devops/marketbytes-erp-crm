// src/pages/hr/AssignLeave.jsx
import { useState, useEffect } from "react";
import LayoutComponents from "../../../components/LayoutComponents";
import apiClient from "../../../helpers/apiClient";
import { MdClose } from "react-icons/md";
import { format } from "date-fns";

const AssignLeave = () => {
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    employee: "",
    leave_type: "",
    status: "approved",
    duration: "full_day",
    date: "",
    half_day_period: "first_half", // only if half day
    start_date: "",
    end_date: "",
    reason: ""
  });

  useEffect(() => {
    fetchEmployees();
    fetchLeaveTypes();
  }, []);

const fetchEmployees = async () => {
  try {
    const res = await apiClient.get("/auth/users/");
    const data = res.data.results || res.data || [];
    const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
    setEmployees(sorted);
  } catch (err) {
    console.error("Failed to load employees:", err);
  }
};

  const fetchLeaveTypes = async () => {
    try {
      const res = await apiClient.get("/hr/leave-types/");
      setLeaveTypes(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load leave types", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let payload = {
      employee_id: form.employee,
      leave_type: form.leave_type,
      status: form.status,
      reason: form.reason,
    };

    if (form.duration === "half_day") {
      payload.start_date = form.date;
      payload.duration = "half_day";
      payload.half_day_period = form.half_day_period;
    } else if (form.duration === "single") {
      payload.start_date = form.date;
      payload.end_date = form.date;
    } else if (form.duration === "multiple") {
      payload.start_date = form.start_date;
      payload.end_date = form.end_date;
    }

    try {
      await apiClient.post("/hr/leaves/", payload);
      alert("Leave assigned successfully!");
      // Reset form or redirect
      window.history.back();
    } catch (err) {
      alert("Failed to assign leave");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addLeaveType = async () => {
    if (!newTypeName.trim()) return;
    try {
      const res = await apiClient.post("/hr/leave-types/", { name: newTypeName });
      setLeaveTypes([...leaveTypes, res.data]);
      setNewTypeName("");
      setShowAddTypeModal(false);
    } catch (err) {
      alert("Failed to add leave type");
    }
  };

  return (
    <div className="p-6">
      <LayoutComponents title="Assign Leave" subtitle="Manually assign leave to employee">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Choose Member */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
               <select
  required
  value={form.employee}
  onChange={(e) => setForm({ ...form, employee: e.target.value })}
  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
>
  <option value="">Select Employee</option>
  {employees.length === 0 ? (
    <option disabled>Loading...</option>
  ) : (
    employees.map(emp => (
      <option key={emp.id} value={emp.id}>
        {emp.name} ({emp.employee_id || 'No ID'})
      </option>
    ))
  )}
</select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
                  <button
                    type="button"
                    onClick={() => setShowAddTypeModal(true)}
                    className="ml-3 text-xs bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-800"
                  >
                    + Add Type
                  </button>
                </label>
                <select
                  required
                  value={form.leave_type}
                  onChange={(e) => setForm({...form, leave_type: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({...form, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Duration Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Duration</label>
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="duration"
                      value="single"
                      checked={form.duration === "single"}
                      onChange={(e) => setForm({...form, duration: e.target.value})}
                      className="mr-3"
                    />
                    <span>Single Day</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="duration"
                      value="half_day"
                      checked={form.duration === "half_day"}
                      onChange={(e) => setForm({...form, duration: e.target.value})}
                      className="mr-3"
                    />
                    <span>Half Day</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="duration"
                      value="multiple"
                      checked={form.duration === "multiple"}
                      onChange={(e) => setForm({...form, duration: e.target.value})}
                      className="mr-3"
                    />
                    <span>Multiple Days</span>
                  </label>
                </div>
              </div>

              {/* Date Fields */}
              {form.duration === "half_day" || form.duration === "single" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({...form, date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  />
                  {form.duration === "half_day" && (
                    <div className="mt-3 flex gap-6">
                      <label className="flex items-center">
                        <input type="radio" name="period" value="first_half" checked={form.half_day_period === "first_half"} onChange={(e) => setForm({...form, half_day_period: e.target.value})} className="mr-2" />
                        <span>First Half</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="period" value="second_half" checked={form.half_day_period === "second_half"} onChange={(e) => setForm({...form, half_day_period: e.target.value})} className="mr-2" />
                        <span>Second Half</span>
                      </label>
                    </div>
                  )}
                </div>
              ) : form.duration === "multiple" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      required
                      value={form.start_date}
                      onChange={(e) => setForm({...form, start_date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      required
                      value={form.end_date}
                      onChange={(e) => setForm({...form, end_date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>
              ) : null}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Absence</label>
                <textarea
                  rows="4"
                  value={form.reason}
                  onChange={(e) => setForm({...form, reason: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                  placeholder="Optional reason..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-900 transition disabled:opacity-70"
                >
                  {loading ? "Saving..." : "Assign Leave"}
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </LayoutComponents>

      {/* Add Leave Type Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Leave Type</h3>
              <button onClick={() => setShowAddTypeModal(false)}>
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Compassionate, Annual, Unpaid"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={addLeaveType}
                className="flex-1 bg-black text-white py-3 rounded-xl font-medium"
              >
                Add Type
              </button>
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignLeave;