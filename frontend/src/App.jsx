import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import "./index.css";
import apiClient from "./helpers/apiClient";
import Layout from "./components/Layout";
import Admin from "./pages/Dashboard/Admin";
import Login from "./pages/Auth/Login";
import ResetPassword from "./pages/Auth/ResetPassword";
import Profile from "./pages/Profile";
import Users from "./pages/Roles/Users";
import Roles from "./pages/Roles/Roles";
import Permissions from "./pages/Roles/Permissions";
import Loading from "./components/Loading";
import EmployeeView from "./pages/HR/Employees/EmployeeView";
import Attendance from "./pages/HR/Attendance";
import HolidayView from "./pages/HR/Holidays/HolidayView";
import Leaves from "./pages/HR/Leaves";
import Overtime from "./pages/HR/Overtime";
import Recruitment from "./pages/HR/Recruitment";
import Performance from "./pages/HR/Performance";
import EmployeeCreate from "./pages/HR/Employees/EmployeeCreate";
import EmployeeProfile from "./pages/HR/Employees/EmployeeProfile";
import EmployeeEdit from "./pages/HR/Employees/EmployeeEdit";
import DepartmentView from "./pages/HR/Departments/DepartmentView";
import DepartmentCreate from "./pages/HR/Departments/DepartmentCreate";
import DepartmentEdit from "./pages/HR/Departments/DepartmentEdit";
import DesignationView from "./pages/HR/Designations/DesignationView";
import DesignationEdit from "./pages/HR/Designations/DesignationEdit";
import DesignationCreate from "./pages/HR/Designations/DesignationCreate";
import AssignLeave from "./pages/HR/Leaves/AssignLeave";
import Projects from "./pages/Operations/Projects/ProjectView";
import ProjectCreate from "./pages/Operations/Projects/ProjectCreate";
import ProjectTemplate from "./pages/Operations/projects/ProjectTemplate";
import ProjectTemplateAdd from "./pages/Operations/projects/ProjectTemplateAdd";
import ProjectArchive from "./pages/Operations/projects/ProjectArchive";
import ProjectEdit from "./pages/Operations/Projects/ProjectEdit";
import ProjectDetails from "./pages/Operations/Projects/ProjectDetails";
import TaskView from "./pages/Operations/Tasks/TaskView";
import TaskLabel from "./pages/Operations/tasks/TaskLabel";
import CreateTaskLabel from "./pages/Operations/tasks/CreateTaskLabel";
import TaskEdit from "./pages/Operations/Tasks/TaskEdit";
import TaskBoard from "./pages/Operations/Tasks/TaskBoard";
import TaskArchive from "./pages/Operations/Tasks/TaskArchive";
import NewTask from "./pages/operations/tasks/NewTask";
import ScrumView from "./pages/Operations/Scrum/ScrumView";
import Leads from "./pages/Sales/Leads";
import Invoice from "./pages/Sales/Invoice";
import Reports from "./pages/Sales/Reports";
import Communication from "./pages/Sales/Communication";
import Pipeline from "./pages/Sales/SalesPipeline";
import TimeLogs from "./pages/Operations/TimeLogs/TimeLogsView";
import Customers from "./pages/Sales/Customer";
import EmployeeTimeLogs from "./pages/Operations/TimeLogs/EmployeeTimeLogs";
import CalendarView from "./pages/Operations/TimeLogs/CalendarView";
import ActiveTimers from "./pages/Operations/TimeLogs/ActiveTimers";
import TaskCalendarPage from "./pages/Operations/Tasks/TaskCalendar";
import EditScrumPage from "./pages/Operations/Scrum/EditScrum";
import ContractsList from "./pages/Operations/Contracts/ContractsList";
import ContractCreate from "./pages/Operations/Contracts/ContractCreate";

const ProtectedRoute = ({
  children,
  isAuthenticated,
  requiredPage,
  requiredAction = "view",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get("/auth/profile/");
        const user = response.data;

        if (user.is_superuser || user.role?.name === "Superadmin") {
          setHasPermission(true);
          setIsLoading(false);
          return;
        }

        const roleId = user.role?.id;
        if (!roleId) {
          setHasPermission(false);
          setIsLoading(false);
          return;
        }

        const roleResponse = await apiClient.get(`/auth/roles/${roleId}/`);
        const perms = roleResponse.data.permissions || [];
        const pagePerm = perms.find((p) => p.page === requiredPage);

        if (!requiredPage || (pagePerm && pagePerm[`can_${requiredAction}`])) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [isAuthenticated, requiredPage, requiredAction]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  const router = createBrowserRouter([
    {
      path: "/login",
      element: <Login setIsAuthenticated={setIsAuthenticated} />,
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="admin">
          <Layout
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
          />
        </ProtectedRoute>
      ),
      errorElement: (
        <div className="flex justify-center items-center min-h-screen text-black">
          Something went wrong. Please try again or contact support.
        </div>
      ),
      children: [
        { index: true, element: <Admin /> },
        {
          path: "/hr/employees",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="employees"
              requiredAction="view"
            >
              <EmployeeView />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/employees/create",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="employees"
              requiredAction="add"
            >
              <EmployeeCreate />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/employees/:id",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="employees"
              requiredAction="view"
            >
              <EmployeeProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/employees/:id/edit",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="employees"
              requiredAction="edit"
            >
              <EmployeeEdit />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/departments",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="departments"
              requiredAction="view"
            >
              <DepartmentView />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/departments/create",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="departments"
              requiredAction="add"
            >
              <DepartmentCreate />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/departments/:id/edit",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="departments"
              requiredAction="edit"
            >
              <DepartmentEdit />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/designations",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="designations"
              requiredAction="view"
            >
              <DesignationView />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/designations/create",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="designations"
              requiredAction="add"
            >
              <DesignationCreate />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/designations/:id/edit",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="designations"
              requiredAction="edit"
            >
              <DesignationEdit />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/attendance",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="attendance"
              requiredAction="view"
            >
              <Attendance />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/holidays",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="holidays"
              requiredAction="view"
            >
              <HolidayView />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/leaves",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="leaves"
              requiredAction="view"
            >
              <Leaves />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/leaves/assign",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="leaves"
              requiredAction="add"
            >
              <AssignLeave />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/overtime",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="overtime"
              requiredAction="view"
            >
              <Overtime />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/recruitment",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="recruitment"
              requiredAction="view"
            >
              <Recruitment />
            </ProtectedRoute>
          ),
        },
        {
          path: "/hr/performance",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="performance"
              requiredAction="view"
            >
              <Performance />
            </ProtectedRoute>
          ),
        },
        {
          path: "/sales/leads",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="leads"
              requiredAction="view"
            >
              <Leads />
            </ProtectedRoute>
          ),
        },
        {
          path: "/sales/communication-tools",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="communication_tools"
            >
              <Communication />
            </ProtectedRoute>
          ),
        },
        {
          path: "/sales/pipeline",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="pipeline"
            >
              <Pipeline />
            </ProtectedRoute>
          ),
        },
        {
          path: "/sales/invoices",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="invoices"
            >
              <Invoice />
            </ProtectedRoute>
          ),
        },
        {
          path: "/sales/reports",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="reports"
            >
              <Reports />
            </ProtectedRoute>
          ),
        },
        {
          path: "/sales/customer",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="reports"
            >
              <Customers />
            </ProtectedRoute>
          ),
        },
        {
          path: "/profile",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="profile"
              requiredAction="view"
            >
              <Profile />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/projects",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <Projects />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/projects/:id",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <ProjectDetails />
            </ProtectedRoute>
          ),
        },

        {
          path: "/operations/projects/projectcreate",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <ProjectCreate />
            </ProtectedRoute>
          ),
        },

        {
          path: "/operations/projects/edit/:id",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <ProjectEdit />
            </ProtectedRoute>
          ),
        },

        {
          path: "/operations/projects/project-template",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <ProjectTemplate />
            </ProtectedRoute>
          ),
        },

        {
          path: "/operations/projects/project-template-add",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <ProjectTemplateAdd />
            </ProtectedRoute>
          ),
        },

        {
          path: "/operations/projects/project-archive",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <ProjectArchive />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/tasks",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <TaskView />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/tasks/task-label",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <TaskLabel />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/tasks/task-label-create",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <CreateTaskLabel />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/tasks/new-task",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <NewTask />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/tasks/edit/:id",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <TaskEdit />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/task-board",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <TaskBoard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/time-logs",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <TimeLogs />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/time-logs/active-timers",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <ActiveTimers />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/time-logs/calendar-view",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <CalendarView />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/time-logs/emplyees-time",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <EmployeeTimeLogs />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/task-calendar",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <TaskCalendarPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/scrum",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <ScrumView />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/scrum/edit/:id",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <EditScrumPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/contracts",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="contracts"
              requiredAction="view"
            >
              <ContractsList />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/contracts/create",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="contracts"
              requiredAction="add"
            >
              <ContractCreate />
            </ProtectedRoute>
          ),
        },
        {
          path: "/user-roles/users",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="users"
              requiredAction="view"
            >
              <Users />
            </ProtectedRoute>
          ),
        },
        {
          path: "/user-roles/roles",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="roles"
              requiredAction="view"
            >
              <Roles />
            </ProtectedRoute>
          ),
        },
        {
          path: "/user-roles/permissions",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <Permissions />
            </ProtectedRoute>
          ),
        },
        {
          path: "/operations/tasks/archive",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
              <TaskArchive />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
