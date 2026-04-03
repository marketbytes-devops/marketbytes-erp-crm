import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  MdGroups,
  MdTrendingUp,
  MdArrowForward,
  MdAttachMoney,
  MdPersonSearch,
  MdReceipt,
  MdDashboard,
} from "react-icons/md";
import apiClient from "../../../helpers/apiClient";
import Loading from "../../../components/Loading";
import NoticesEventsWidget from "../../../components/Dashboard/NoticesEventsWidget";

const StatCard = ({ title, value, subValue, icon, colorClass, bgClass, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      {subValue && (
        <span className="text-[10px] bg-black text-white transition-all hover:bg-gray-100 hover:text-black cursor-pointer shadow-sm px-4 py-3 text-sm rounded-xl font-medium">
          {subValue}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-3xl font-medium text-gray-800 mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-500">{title}</p>
    </div>
  </div>
);

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalLeads: 0,
    pipelineValue: 0,
    invoicesTotal: 0,
    activeCustomers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, leadsRes, pipelineRes, invoicesRes, customersRes] =
          await Promise.allSettled([
            apiClient.get("/auth/profile/"),
            apiClient.get("/sales/leads/"),
            apiClient.get("/sales/pipeline/"),
            apiClient.get("/sales/invoices/"),
            apiClient.get("/sales/customers/"),
          ]);

        if (profileRes.status === "fulfilled") setProfile(profileRes.value.data);

        // Map results if available, otherwise use defaults
        const totalLeads = leadsRes.status === "fulfilled" ? (leadsRes.value.data?.count || leadsRes.value.data?.length || 0) : 0;
        const activeCustomers = customersRes.status === "fulfilled" ? (customersRes.value.data?.count || customersRes.value.data?.length || 0) : 0;
        
        // Mocking pipeline and invoice totals for now if backend doesn't provide aggregated summary
        setStats({
          totalLeads,
          pipelineValue: "—", // Placeholder until backend summary is ready
          invoicesTotal: "—", // Placeholder until backend summary is ready
          activeCustomers,
        });

      } catch (e) {
        console.error("Dashboard data fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen font-syne">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-800 font-syne">
            Sales Dashboard{profile?.first_name ? `: ${profile.first_name}` : ""}
          </h1>
          <p className="text-gray-500 mt-1">
            Sales pipeline, leads, and customer overview.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-gray-500">{profile?.role?.name || "Sales"}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-medium shadow-md border-2 border-gray-100">
            {profile?.first_name?.charAt(0) || "S"}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          subValue="View All"
          icon={<MdPersonSearch />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
          onClick={() => navigate("/sales/leads")}
        />
        <StatCard
          title="Pipeline Value"
          value={stats.pipelineValue}
          subValue="Pipeline"
          icon={<MdTrendingUp />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          onClick={() => navigate("/sales/pipeline")}
        />
        <StatCard
          title="Invoices Total"
          value={stats.invoicesTotal}
          subValue="Invoices"
          icon={<MdReceipt />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
          onClick={() => navigate("/sales/invoices")}
        />
        <StatCard
          title="Active Customers"
          value={stats.activeCustomers}
          subValue="Customers"
          icon={<MdGroups />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          onClick={() => navigate("/sales/customer")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions / Summary could go here */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MdDashboard className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">Sales Analytics Coming Soon</h2>
            <p className="text-gray-500 max-w-sm">
              We are working on detailed sales charts and performance metrics to help you track your targets.
            </p>
          </div>
        </div>

        {/* Right Sidebar for Widget */}
        <div className="space-y-6">
          <NoticesEventsWidget />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-medium text-gray-800 mb-4">Quick Links</h3>
            <div className="space-y-3">
              {[
                { label: "Pipeline", path: "/sales/pipeline" },
                { label: "Leads", path: "/sales/leads" },
                { label: "Invoices", path: "/sales/invoices" },
                { label: "Customers", path: "/sales/customer" },
                { label: "Reports", path: "/sales/reports" },
              ].map((x) => (
                <button
                  key={x.path}
                  onClick={() => navigate(x.path)}
                  className="w-full flex items-center justify-between bg-black text-white hover:bg-gray-100 hover:text-black transition-all text-left group px-4 py-3 text-sm rounded-xl font-medium"
                >
                  <span className="flex-1">{x.label}</span>
                  <MdArrowForward className="text-gray-400 group-hover:text-black transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
