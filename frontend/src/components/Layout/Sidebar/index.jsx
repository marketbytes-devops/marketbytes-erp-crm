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
  MdPersonSearch,
  MdTrendingUp,
  MdDashboard,
  MdSettings,
  MdAssignment,
  MdReceipt,
  MdAttachMoney,
  MdViewKanban,
} from "react-icons/md";
import { SiDraugiemdotlv } from "react-icons/si";
import logo from "../../../assets/images/img-logo.png";
import apiClient from "../../../helpers/apiClient";

const Sidebar = ({ toggleSidebar }) => {
  const location = useLocation();

  const [isHROpen, setIsHROpen] = useState(false);
  const [isOperationOpen, setOperationOpen] = useState(false);
  const [isTasksOpen, setTasksOpen] = useState(false);
  const [isUserRolesOpen, setIsUserRolesOpen] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalesOpen, setSalesOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile/");
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");

        const roleId = user.role?.id;
        if (roleId) {
          const roleRes = await apiClient.get(`/auth/roles/${roleId}/`);
          setPermissions(roleRes.data.permissions || []);
        }
      } catch (error) {
        console.error("Failed to load user profile or permissions:", error);
        setPermissions([]);
        setIsSuperadmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const isMobile = () => window.innerWidth < 768;

  const menuItems = [
    {
      to: "/",
      label: "Admin",
      icon: <MdAdminPanelSettings className="w-6 h-6" />,
      page: "admin",
      action: "view",
    },
    {
      label: "HR Management",
      icon: <MdWork className="w-6 h-6" />,
      isOpen: isHROpen,
      toggle: () => setIsHROpen((prev) => !prev),
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
      label: "Operations",
      icon: <MdSettings className="w-6 h-6" />,
      isOpen: isOperationOpen,
      toggle: () => setOperationOpen((prev) => !prev),
      subItems: [
        {
          to: "/Operations/projects",
          label: "Projects",
          icon: <MdDashboard className="w-6 h-6" />,
          page: "Projects",
          action: "view",
        },
        {
          to: "/Operations/tasks",
          label: "Tasks",
          icon: <MdAssignment className="w-5 h-5" />,
          page: "Tasks",
          action: "view",
        },
        {
          to: "/Operations/taskboard",
          label: "Task Board",
          icon: <MdViewKanban className="w-5 h-5" />,
          page: "Task Board",
          action: "view",
        },
         {
          to: "/Operations/taskcalendar",
          label: "Task Calendar",
          icon: <MdCalendarToday className="w-5 h-5" />,
          page: "Task Calendar",
          action: "view",
        },
      ].filter((item) => hasPermission(item.page, item.action)),
    },

    {
      label: "Sales",
      icon: <MdAttachMoney className="w-6 h-6" />,
      isOpen: isSalesOpen,
      toggle: () => setSalesOpen((prev) => !prev),
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
          page: "customer",
          action: "view",
        },
      ].filter((item) => hasPermission(item.page, item.action)),
    },

    {
      label: "User Roles",
      icon: <MdShield className="w-6 h-6" />,
      isOpen: isUserRolesOpen,
      toggle: () => setIsUserRolesOpen((prev) => !prev),
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
      page: "profile",
      action: "view",
    },
  ].filter((item) => {
    if (item.subItems) return item.subItems.length > 0;
    return hasPermission(item.page, item.action);
  });

  if (isLoading) {
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
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${item.isOpen
                      ? "bg-linear-to-r from-indigo-50 to-purple-50 text-black shadow-md"
                      : "text-black hover:bg-gray-50"
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
                            end
                            onClick={() => isMobile() && toggleSidebar?.()}
                            className={({ isActive }) =>
                              `flex items-center gap-3.5 px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${isActive
                                ? "bg-black text-white shadow-inner"
                                : "text-gray-700 hover:bg-linear-to-r hover:from-gray-50 hover:to-indigo-50 hover:text-black"
                              }`
                            }
                          >
                            <span className="relative z-10">
                              {subItem.icon}
                            </span>
                            <span className="relative z-10">
                              {subItem.label}
                            </span>
                            {location.pathname === subItem.to && (
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
                  end
                  onClick={() => isMobile() && toggleSidebar?.()}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-5 py-4 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${isActive
                      ? "bg-black text-white shadow-inner"
                      : "text-black hover:bg-linear-to-r hover:from-gray-50 hover:to-indigo-50"
                    }`
                  }
                >
                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                  {location.pathname === item.to && (
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
