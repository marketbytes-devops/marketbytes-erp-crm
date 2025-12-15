import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import "./index.css";
import apiClient from "./helpers/apiClient";
import Layout from "./components/Layout";
import Admin from "./pages/Dashboards/Admin";
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
import Projects from "./pages/Operations/Projects/ProjectView"
import ProjectCreate from "./pages/Operations/Projects/ProjectCreate";
import ProjectTemplate from "./pages/Operations/Projects/ProjectTemplate";
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
          path:"/hr/projects",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
             <Projects/>
            </ProtectedRoute>
          ),
        },
         
         {
          path:"/hr/projects/projectcreate",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
             <ProjectCreate/>
            </ProtectedRoute>
          ),
        },

         {
          path:"/hr/projects/projecttemplate",
          element: (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              requiredPage="permissions"
              requiredAction="view"
            >
             <ProjectTemplate/>
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
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
