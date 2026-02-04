import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { motion,  AnimatePresence } from "framer-motion";
import LayoutComponents from "../../../components/LayoutComponents";
import {
  MdEdit, MdArrowBack, MdWork, MdEmail, MdPhone, MdCalendarToday,
  MdPerson, MdAttachMoney, MdCake, MdTransgender, MdLocationOn,
  MdLightbulb, MdBusiness, MdAccountCircle, MdSecurity, MdAccessTime,
  MdGroups, MdDescription, MdCheckCircle, MdCancel, MdStar,
  MdDownload, MdPrint, MdShare
} from "react-icons/md";
import { FaUserTie, FaIdBadge, FaChartLine } from "react-icons/fa";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";

const EmployeeProfile = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await apiClient.get(`/auth/users/${id}/`);
        setEmployee(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  const fetchPerformance = async () => {
    setPerfLoading(true);
    try {
      const res = await apiClient.get("/hr/performance/", { params: { employee_id: id } });
      const data = res.data.results || res.data || [];
      setPerformanceReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setPerfLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "performance") {
      fetchPerformance();
    }
  }, [activeTab, id]);

  const getRatingMetadata = (ratingStr) => {
    const rating = parseFloat(ratingStr) || 0;
    if (rating >= 4.5) return { label: "Elite", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
    if (rating >= 3.5) return { label: "Strong", color: "bg-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50" };
    if (rating >= 2.5) return { label: "Standard", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
    return { label: "Growth", color: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 text-center text-xl text-red-600">
        Employee not found
      </div>
    );
  }

  const getImageUrl = () => {
    if (employee.image_url) return employee.image_url;
    if (employee.image) {
      if (employee.image.startsWith('http')) {
        return employee.image;
      } else {
        return `http://localhost:8000${employee.image}`;
      }
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || employee.email)}&background=000&color=fff&size=300&bold=true&font-size=0.5`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date provided";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stats = [
    {
      icon: <MdWork className="w-6 h-6" />,
      label: "Department",
      value: employee.department?.name || "No department assigned",
      color: "text-blue-600 bg-blue-50",
      iconColor: "text-blue-500"
    },
    {
      icon: <FaUserTie className="w-6 h-6" />,
      label: "Designation",
      value: employee.designation?.name || employee.role?.name || "No designation assigned",
      color: "text-purple-600 bg-purple-50",
      iconColor: "text-purple-500"
    },
    {
      icon: <MdAccessTime className="w-6 h-6" />,
      label: "Tenure",
      value: employee.joining_date ?
        `${Math.floor((new Date() - new Date(employee.joining_date)) / (1000 * 60 * 60 * 24 * 30))} months` :
        "No joining date provided",
      color: "text-green-600 bg-green-50",
      iconColor: "text-green-500"
    },
    {
      icon: <FaChartLine className="w-6 h-6" />,
      label: "Hourly Rate",
      value: employee.hourly_rate ? `$${parseFloat(employee.hourly_rate).toFixed(2)}` : "Not set",
      color: "text-amber-600 bg-amber-50",
      iconColor: "text-amber-500"
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <LayoutComponents
        title="Employee Profile"
        subtitle={`Complete profile details`}
        variant="card"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <Link
            to="/hr/employees"
            className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all group"
          >
            <MdArrowBack className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Employees</span>
          </Link>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all">
              <MdPrint className="w-5 h-5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all">
              <MdDownload className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <Link
              to={`/hr/employees/${id}/edit`}
              className="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-black to-gray-800 text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
            >
              <MdEdit className="w-5 h-5" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-black rounded-xl p-6 text-white shadow-2xl">
              <div className="relative">
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-white/20 p-1 shadow-2xl">
                  <img
                    src={getImageUrl()}
                    alt={employee.name}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || employee.email)}&background=000&color=fff&size=300`;
                    }}
                  />
                </div>
                <div className={`absolute bottom-2 right-1/4 w-5 h-5 rounded-full border-2 border-white ${employee.status === 'active' ? 'bg-green-500' : employee.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              </div>

              <div className="text-center mt-6">
                <h2 className="text-2xl font-medium">{employee.name || "Unknown"}</h2>
                <p className="text-gray-300 mt-1 flex items-center justify-center gap-2">
                  <FaIdBadge className="w-4 h-4" />
                  {employee.employee_id}
                </p>
                <div className="mt-4">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${employee.status === "active"
                    ? "bg-green-500/20 text-green-300"
                    : employee.status === "inactive"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-red-500/20 text-red-300"
                    }`}>
                    {employee.status?.toUpperCase() || "Unknown Status"}
                  </span>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-start p-3 bg-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MdEmail className="w-5 h-5 text-gray-300" />
                    <span className="text-sm mr-1">Email:</span>
                  </div>
                  <span className="text-xs text-gray-300 truncate max-w-[150px]">
                    {employee.email}
                  </span>
                </div>

                <div className="flex items-center justify-start p-3 bg-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MdPhone className="w-5 h-5 text-gray-300" />
                    <span className="text-sm mr-1">Contact:</span>
                  </div>
                  <span className="text-sm font-medium">
                    {employee.mobile || "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <div className={stat.iconColor}>
                        {stat.icon}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="font-semibold">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
              {["overview", "documents", "performance", "activity"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium text-center transition-all min-w-[120px] ${activeTab === tab
                    ? "bg-black text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-medium text-gray-900 flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <MdPerson className="w-6 h-6 text-blue-600" />
                          </div>
                          Personal Information
                        </h3>
                        <p className="text-gray-500 mt-1">Basic details and contact information</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdAccountCircle className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Username</p>
                            <p className="font-semibold">@{employee.username || "—"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdCake className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
                            <p className="font-semibold">{formatDate(employee.dob)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdTransgender className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Gender</p>
                            <p className="font-semibold capitalize">{employee.gender || "—"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdLocationOn className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Address</p>
                            <p className="font-semibold">{employee.address || "—"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdLightbulb className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Skills</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {employee.skills ? (
                                employee.skills.split(',').map((skill, index) => (
                                  <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    {skill.trim()}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500">No skills listed</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdDescription className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Country Code</p>
                            <p className="font-semibold">{employee.country_code || "+91"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-medium text-gray-900 flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <MdWork className="w-6 h-6 text-green-600" />
                          </div>
                          Employment Details
                        </h3>
                        <p className="text-gray-500 mt-1">Professional information and work details</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-green-50/50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdCalendarToday className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Joining Date</p>
                            <p className="font-medium text-green-700">{formatDate(employee.joining_date)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-green-50/50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdAccessTime className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Probation Period</p>
                            <p className="font-semibold">
                              {employee.probation_period ? `${employee.probation_period} months` : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-green-50/50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdGroups className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Reports To</p>
                            <p className="font-semibold">{employee.reports_to?.name || "None (Top Level)"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-purple-50/50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdSecurity className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">System Role</p>
                            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              {employee.role?.name || "No Role Assigned"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-purple-50/50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdAttachMoney className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Hourly Rate</p>
                            <p className="font-medium text-purple-700">
                              {employee.hourly_rate ? `$${parseFloat(employee.hourly_rate).toFixed(2)}/hr` : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-purple-50/50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MdStar className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-1">Account Status</p>
                            <div className="flex items-center gap-3">
                              <span className={`font-semibold ${employee.login_enabled ? "text-green-600" : "text-red-600"}`}>
                                {employee.login_enabled ? "Login Enabled" : "Login Disabled"}
                              </span>
                              {employee.login_enabled ? (
                                <MdCheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <MdCancel className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${employee.email_notifications ? "text-green-600" : "text-gray-500"}`}>
                              {employee.email_notifications ? "✓ Email notifications enabled" : "✗ Email notifications disabled"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "performance" && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-medium text-gray-900 flex items-center gap-3">
                          <div className="p-2 bg-amber-50 rounded-lg">
                            <MdStar className="w-6 h-6 text-amber-600" />
                          </div>
                          Performance Metrics
                        </h3>
                        <p className="text-gray-500 mt-1">Review history and talent analysis</p>
                      </div>
                    </div>

                    {perfLoading ? (
                      <div className="py-20 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mb-4"></div>
                        <p className="text-sm text-gray-500 font-medium">Synchronizing talent metrics...</p>
                      </div>
                    ) : performanceReviews.length === 0 ? (
                      <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-4xl">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <MdTrendingUp className="text-gray-300 w-10 h-10" />
                        </div>
                        <h4 className="text-lg font-medium text-black">No Audit History</h4>
                        <p className="text-gray-500 text-sm mt-2">This employee hasn't been reviewed in the current cycle.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {performanceReviews.map((r, i) => {
                          const meta = getRatingMetadata(r.rating);
                          return (
                            <div key={r.id || i} className="p-6 rounded-3xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all group">
                              <div className="flex flex-wrap justify-between items-start gap-4">
                                <div className="flex gap-4">
                                  <div className={`w-14 h-14 rounded-2xl ${meta.bg} flex items-center justify-center ${meta.text} font-bold text-lg shadow-sm group-hover:scale-110 transition-transform`}>
                                    {(parseFloat(r.rating) || 0).toFixed(1)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-black uppercase tracking-widest text-xs mb-1">{r.review_period || "Monthly Review"}</h4>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-3 py-1 rounded-full ${meta.bg} ${meta.text} text-[10px] font-bold uppercase tracking-widest`}>{meta.label}</span>
                                      <span className="text-[10px] text-gray-400 font-medium">{formatDate(r.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 font-medium">Audited by</p>
                                  <p className="text-sm font-bold text-black font-syne uppercase tracking-tighter">
                                    {r.reviewed_by?.name || "System Executive"}
                                  </p>
                                </div>
                              </div>
                              {r.comments && (
                                <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-50 text-sm text-gray-600 leading-relaxed italic">
                                  "{r.comments}"
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {(activeTab === "documents" || activeTab === "activity") && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white rounded-xl p-16 text-center border-2 border-dashed border-gray-100 flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <MdDescription className="text-gray-300 w-10 h-10" />
                  </div>
                  <h4 className="text-lg font-medium text-black capitalize">{activeTab} Ledger</h4>
                  <p className="text-gray-500 text-sm mt-2">Integration pending. This module is undergoing synchronization.</p>
                </motion.div>
              )}
            </AnimatePresence>
            {employee.exit_date && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-linear-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-8"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <MdCancel className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-red-800">Employment Ended</h3>
                    <p className="text-red-600 mt-1">
                      This employee's employment was terminated on{" "}
                      <span className="font-medium">{formatDate(employee.exit_date)}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default EmployeeProfile;