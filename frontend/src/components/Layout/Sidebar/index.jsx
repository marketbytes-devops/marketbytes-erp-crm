import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router";
import {
  MdAdminPanelSettings,
  MdPerson,
  MdShield,
  MdVerifiedUser,
  MdLock,
  MdExpandMore,
  MdWork,
  MdGroup,
  MdAccountTree,
  MdAccessTime,
  MdCalendarToday,
  MdAssignmentLate,
  MdTimer,
  MdDescription,
  MdPersonSearch,
  MdTrendingUp,
  MdDashboard,
  MdSettings,
  MdAssignment,
  MdReceipt,
  MdAttachMoney,
  MdViewKanban,
  MdPendingActions,
} from "react-icons/md";
import { SiDraugiemdotlv } from "react-icons/si";
import logo from "../../../assets/images/img-logo.png";
import { usePermission } from "../../../context/PermissionContext";

const Sidebar = ({ toggleSidebar }) => {
  const location = useLocation();
  const { hasPermission, isLoaded, isSuperadmin, user } = usePermission();

  const [openDropdown, setOpenDropdown] = useState("");

  const handleToggle = (label) => {
    setOpenDropdown((prev) => (prev === label ? "" : label));
  };

  const isMobile = () => window.innerWidth < 768;

  // Helper to check if a path is active (supports sub-routes)
  const isPathActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Auto-open parent dropdown when a child route is active
  useEffect(() => {
    const dropdownGroups = [
      { label: "HR Management", paths: ["/hr/"] },
      { label: "Lead Management", paths: ["/team/", "/lead/"] },
      { label: "Sales Management", paths: ["/sales/"] },
      { label: "Self Management", paths: ["/employee/"] },
      { label: "Operations", paths: ["/operations/"] },
      { label: "User Roles", paths: ["/user-roles/"] },

    ];
    for (const group of dropdownGroups) {
      if (group.paths.some((p) => location.pathname.startsWith(p))) {
        setOpenDropdown(group.label);
        break;
      }
    }
  }, [location.pathname]);

  const menuItems = [
    {
      to: "/",
      label: "Admin Dashboard",
      icon: <MdAdminPanelSettings className="w-6 h-6" />,
      page: "admin",
      action: "view",
    },
    {
      to: "/hr-dashboard",
      label: "HR Dashboard",
      icon: <MdDashboard className="w-6 h-6" />,
      page: "hr_dashboard",
      action: "view",
    },
    {
      label: "HR Management",
      icon: <MdWork className="w-6 h-6" />,
      isOpen: openDropdown === "HR Management",
      toggle: () => handleToggle("HR Management"),
      subItems: [
        {
          to: "/hr/employees",
          label: "Employees",
          icon: <MdGroup className="w-6 h-6" />,
          page: "employees",
          action: "view",
        },
        {
          to: "/hr/departments",
          label: "Departments",
          icon: <MdAccountTree className="w-6 h-6" />,
          page: "departments",
          action: "view",
        },
        {
          to: "/hr/designations",
          label: "Designations",
          icon: <SiDraugiemdotlv className="w-6 h-6" />,
          page: "designations",
          action: "view",
        },
        {
          to: "/hr/attendance",
          label: "Attendance",
          icon: <MdAccessTime className="w-6 h-6" />,
          page: "attendance",
          action: "view",
        },
        {
          to: "/hr/holidays",
          label: "Holidays",
          icon: <MdCalendarToday className="w-6 h-6" />,
          page: "holidays",
          action: "view",
        },
        {
          to: "/hr/leaves",
          label: "Leaves",
          icon: <MdAssignmentLate className="w-6 h-6" />,
          page: "leaves",
          action: "view",
        },
        {
          to: "/hr/overtime",
          label: "Overtime",
          icon: <MdTimer className="w-6 h-6" />,
          page: "overtime",
          action: "view",
        },
        {
          to: "/hr/recruitment",
          label: "Recruitment",
          icon: <MdPersonSearch className="w-6 h-6" />,
          page: "recruitment",
          action: "view",
        },
        {
          to: "/hr/performance",
          label: "Performance",
          icon: <MdTrendingUp className="w-6 h-6" />,
          page: "performance",
          action: "view",
        },
      ].filter((item) => hasPermission(item.page, item.action)),
    },
    {
      to: "/sales-dashboard",
      label: "Sales Dashboard",
      icon: <MdDashboard className="w-6 h-6" />,
      page: "sales_dashboard",
      action: "view",
    },
    {
      label: "Sales Management",
      icon: <MdAttachMoney className="w-6 h-6" />,
      isOpen: openDropdown === "Sales Management",
      toggle: () => handleToggle("Sales Management"),
      subItems: [
        {
          to: "/sales/leads",
          label: "Leads",
          icon: <MdPersonSearch className="w-6 h-6" />,
          page: "leads",
          action: "view",
        },
        {
          to: "/sales/pipeline",
          label: "Pipeline",
          icon: <MdDashboard className="w-6 h-6" />,
          page: "pipeline",
          action: "view",
        },
        {
          to: "/sales/communication-tools",
          label: "Communication Tools",
          icon: <MdAssignment className="w-6 h-6" />,
          page: "communication_tools",
          action: "view",
        },
        {
          to: "/sales/invoices",
          label: "Invoices",
          icon: <MdReceipt className="w-6 h-6" />,
          page: "invoices",
          action: "view",
        },
        {
          to: "/sales/reports",
          label: "Reports",
          icon: <MdTrendingUp className="w-6 h-6" />,
          page: "reports",
          action: "view",
        },
        {
          to: "/sales/customer",
          label: "Customer",
          icon: <MdGroup className="w-6 h-6" />,
          page: "customers",
          action: "view",
        },
      ].filter((item) => hasPermission(item.page, item.action)),
    },
    {
      to: "/lead-dashboard",
      label: "Lead Dashboard",
      icon: <MdDashboard className="w-6 h-6" />,
      page: "lead_dashboard",
      action: "view",
    },
    {
      label: "Lead Management",
      icon: <MdGroup className="w-6 h-6" />,
      page: "lead_management",
      action: "view",
      isOpen: openDropdown === "Lead Management",
      toggle: () => handleToggle("Lead Management"),
      subItems: [
        {
          to: "/team/employees",
          label: "Team Members",
          icon: <MdGroup className="w-6 h-6" />,
          page: "lead_management",
          action: "view",
        },
        {
          to: "/lead/attendance",
          label: "Team Attendance",
          icon: <MdAccessTime className="w-6 h-6" />,
          page: "lead_attendance",
          action: "view",
        },
        {
          to: "/lead/time-logs",
          label: "Team Timelogs",
          icon: <MdAssignment className="w-6 h-6" />,
          page: "lead_time_logs",
          action: "view",
        },
        {
          to: "/lead/leaves",
          label: "Team Leaves",
          icon: <MdAssignmentLate className="w-6 h-6" />,
          page: "lead_leaves",
          action: "view",
        },
        {
          to: "/lead/scrum",
          label: "Team Scrum",
          icon: <MdPendingActions className="w-6 h-6" />,
          page: "lead_scrum",
          action: "view",
        },
      ].filter((item) => hasPermission(item.page, item.action)),
    },
    {
      to: "/employee-dashboard",
      label: "My Dashboard",
      icon: <MdDashboard className="w-6 h-6" />,
      page: "employee_dashboard",
      action: "view",
    },
    {
      label: "Self Management",
      icon: <MdPerson className="w-6 h-6" />,
      page: "employee_dashboard", // Using a parent page check
      action: "view",
      isOpen: openDropdown === "Self Management",
      toggle: () => handleToggle("Self Management"),
      subItems: [
        {
          to: "/employee/projects",
          label: "My Projects",
          icon: <MdWork className="w-6 h-6" />,
          page: "employee_projects",
          action: "view",
        },
        {
          to: "/employee/tasks",
          label: "My Tasks",
          icon: <MdAssignment className="w-6 h-6" />,
          page: "employee_tasks",
          action: "view",
        },
        {
          to: "/employee/attendance",
          label: "My Attendance",
          icon: <MdAccessTime className="w-6 h-6" />,
          page: "employee_attendance",
          action: "view",
        },
        {
          to: "/employee/holidays",
          label: "My Holidays",
          icon: <MdCalendarToday className="w-6 h-6" />,
          page: "employee_holidays",
          action: "view",
        },
        {
          to: "/employee/leaves",
          label: "My Leaves",
          icon: <MdAssignmentLate className="w-6 h-6" />,
          page: "employee_leaves",
          action: "view",
        },
        {
          to: "/employee/time-logs",
          label: "My Time Logs",
          icon: <MdAccessTime className="w-6 h-6" />,
          page: "employee_time_logs",
          action: "view",
        },
        {
          to: "/employee/scrum",
          label: "My Scrum",
          icon: <MdPendingActions className="w-6 h-6" />,
          page: "employee_scrum",
          action: "view",
        },
        {
          to: "/employee/task-calendar",
          label: "Task Calendar",
          icon: <MdCalendarToday className="w-6 h-6" />,
          page: "employee_task_calendar",
          action: "view",
        },
      ].filter((item) => hasPermission(item.page, item.action)),
    },
    {
      label: "Operations",
      icon: <MdSettings className="w-6 h-6" />,
      isOpen: openDropdown === "Operations",
      toggle: () => handleToggle("Operations"),
      subItems: [
        {
          to: "/operations/projects",
          label: "Projects",
          icon: <MdDashboard className="w-6 h-6" />,
          page: "projects",
          action: "view",
        },
        {
          to: "/operations/tasks",
          label: "Tasks",
          icon: <MdAssignment className="w-5 h-5" />,
          page: "tasks",
          action: "view",
        },
        {
          to: "/operations/task-board",
          label: "Task Board",
          icon: <MdViewKanban className="w-5 h-5" />,
          page: "task_board",
          action: "view",
        },
        {
          to: "/operations/time-logs",
          label: "Timelogs",
          icon: <MdAssignment className="w-5 h-5" />,
          page: "time_logs",
          action: "view",
        },
        {
          to: "/operations/task-calendar",
          label: "Task Calendar",
          icon: <MdCalendarToday className="w-5 h-5" />,
          page: "task_calendar",
          action: "view",
        },
        {
          to: "/operations/common-calendar",
          label: "Events",
          icon: <MdCalendarToday className="w-5 h-5" />,
          page: "common_calendar",
          action: "view",
        },
        {
          to: "/operations/scrum",
          label: "Scrum",
          icon: <MdPendingActions className="w-5 h-5" />,
          page: "scrum",
          action: "view",
        },
        {
          to: "/operations/contracts",
          label: "Contracts",
          icon: <MdDescription className="w-5 h-5" />,
          page: "contracts",
          action: "view",
        },
      ].filter((item) => hasPermission(item.page, item.action)),
    },
    {
      label: "User Roles",
      icon: <MdShield className="w-6 h-6" />,
      isOpen: openDropdown === "User Roles",
      toggle: () => handleToggle("User Roles"),
      subItems: [
        {
          to: "/user-roles/roles",
          label: "Roles",
          icon: <MdVerifiedUser className="w-6 h-6" />,
          page: "roles",
          action: "view",
        },
        {
          to: "/user-roles/users",
          label: "Users",
          icon: <MdGroup className="w-6 h-6" />,
          page: "users",
          action: "view",
        },
        {
          to: "/user-roles/permissions",
          label: "Permissions",
          icon: <MdLock className="w-6 h-6" />,
          page: "permissions",
          action: "view",
        },
      ].filter((item) => hasPermission(item.page, item.action)),
    },
    {
      to: "/profile",
      label: "Profile",
      icon: <MdPerson className="w-6 h-6" />,
      page: null,   // always visible to any authenticated user
      action: null,
    },
  ].filter((item) => {
    const isCEO = user?.role?.name?.toLowerCase() === 'ceo';
    const isLead = hasPermission("lead_dashboard", "view") && !isSuperadmin && !isCEO;
    const isHR = hasPermission("hr_dashboard", "view") && !isSuperadmin && !isCEO;
    const isSales = hasPermission("sales_dashboard", "view") && !isSuperadmin && !isCEO;
    const isRegularEmployee = hasPermission("employee_dashboard", "view") && !isLead && !isHR && !isSales && !isSuperadmin && !isCEO;

    const dashboards = ["Admin Dashboard", "HR Dashboard", "Sales Dashboard", "Lead Dashboard", "My Dashboard"];

    // Ensure users only see their primary dashboard if they aren't Superadmin/CEO
    if (isLead && dashboards.includes(item.label) && item.label !== "Lead Dashboard") return false;
    if (isHR && dashboards.includes(item.label) && item.label !== "HR Dashboard") return false;
    if (isSales && dashboards.includes(item.label) && item.label !== "Sales Dashboard") return false;

    // For employees, show ONLY My Dashboard, Self Management, and Profile
    if (isRegularEmployee) {
      const allowed = ["My Dashboard", "Self Management", "Profile"];
      if (!allowed.includes(item.label)) return false;
    }

    if (item.subItems) return item.subItems.length > 0;
    if (!item.page) return true; // always show items with no permission guard
    return hasPermission(item.page, item.action);
  });

  if (!isLoaded) {
    return (
      <div
        className="fixed inset-y-0 left-0 w-72 bg-white shadow-inner z-50 flex flex-col"
      >
        <div className="p-8 border-b border-gray-100">
          <div className="h-12 bg-gray-200 rounded-xl mx-auto" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-y-0 left-0 w-72 bg-white shadow-inner flex flex-col z-50 overflow-hidden"
    >
      <div className="p-8 border-b border-gray-100">
        <img
          src={logo}
          alt="Logo"
          className="h-12 object-contain mx-auto"
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li
              key={item.label}
            >
              {item.subItems ? (
                <>
                  <button
                    onClick={item.toggle}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${item.isOpen
                      ? "bg-black text-white"
                      : "text-black hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-3.5 relative z-10">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    <div className={`transition-transform duration-200 ${item.isOpen ? 'rotate-180' : ''}`}>
                      <MdExpandMore className="w-6 h-6" />
                    </div>
                  </button>

                  {item.isOpen && (
                    <ul
                      className="mt-2 ml-6 space-y-1.5 overflow-hidden"
                    >
                      {item.subItems.map((subItem) => (
                        <li key={subItem.to}>
                          <NavLink
                            to={subItem.to}
                            onClick={() => isMobile() && toggleSidebar?.()}
                            className={() =>
                              `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${isPathActive(subItem.to)
                                ? "bg-black text-white shadow-inner"
                                : "text-gray-700 hover:bg-gray-100 hover:text-black"
                              }`
                            }
                          >
                            <span className="relative z-10">
                              {subItem.icon}
                            </span>
                            <span className="relative z-10">
                              {subItem.label}
                            </span>
                            {isPathActive(subItem.to) && (
                              <div
                                className="absolute inset-0 bg-black rounded-xl"
                              />
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => isMobile() && toggleSidebar?.()}
                  className={() =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${isPathActive(item.to)
                      ? "bg-black text-white shadow-inner"
                      : "text-black hover:bg-gray-100"
                    }`
                  }
                >
                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                  {isPathActive(item.to) && (
                    <div
                      className="absolute inset-0 bg-black rounded-xl"
                    />
                  )}
                </NavLink>
              )}
            </li>
          ))}
        </ul>

      </nav>
    </div>
  );
};

export default Sidebar;