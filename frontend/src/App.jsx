import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import "./index.css";
import apiClient from "./helpers/apiClient";
import Layout from "./components/Layout";
import Admin from "./pages/Dashboard/Admin";
import LeadDashboard from "./pages/Dashboard/Lead";
import EmployeeDashboard from "./pages/Dashboard/Employee";
import Login from "./pages/Auth/Login";
import ResetPassword from "./pages/Auth/ResetPassword";
import Profile from "./pages/Profile";
import Users from "./pages/Roles/Users";
import Roles from "./pages/Roles/Roles";
import Permissions from "./pages/Roles/Permissions";
import Loading from "./components/Loading";
import { PermissionProvider, usePermission } from "./context/PermissionContext";
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
import ProjectTemplate from "./pages/Operations/Projects/ProjectTemplate";
import ProjectTemplateAdd from "./pages/Operations/Projects/ProjectTemplateAdd";
import ProjectArchive from "./pages/Operations/Projects/ProjectArchive";
import ProjectEdit from "./pages/Operations/Projects/ProjectEdit";
import ProjectDetails from "./pages/Operations/Projects/ProjectDetails";
import TaskView from "./pages/Operations/Tasks/TaskView";
import TaskLabel from "./pages/Operations/Tasks/TaskLabel";
import CreateTaskLabel from "./pages/Operations/Tasks/CreateTaskLabel";
import TaskEdit from "./pages/Operations/Tasks/TaskEdit";
import TaskBoard from "./pages/Operations/Tasks/TaskBoard";
import TaskArchive from "./pages/Operations/Tasks/TaskArchive";
import NewTask from "./pages/Operations/Tasks/NewTask";
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
import ContractEdit from "./pages/Operations/Contracts/ContractEdit";
import CommonCalendar from "./pages/CommonCalendar";



const ProtectedRoute = ({
 children,
 requiredPage,
 requiredAction = "view",
}) => {
 const { hasPermission, isLoaded, isAuthenticated } = usePermission();

 if (!isLoaded) {
 return (
 <div className="flex justify-center items-center min-h-screen">
 <Loading />
 </div>
 );
 }

 // If not logged in, go to login
 if (!isAuthenticated) {
 return <Navigate to="/login" replace />;
 }

 // If logged in but no permission, go to home
 if (requiredPage) {
 const pages = Array.isArray(requiredPage) ? requiredPage : [requiredPage];
 const hasAnyPermission = pages.some(page => hasPermission(page, requiredAction));
 if (!hasAnyPermission) {
 return <Navigate to="/" replace />;
 }
 }

 return children;
};

const RootDashboardRedirect = () => {
 const { hasPermission, isSuperadmin, isLoaded, user } = usePermission();

 // Wait for permissions to load before deciding which dashboard to render
 if (!isLoaded) {
 return (
 <div className="flex justify-center items-center min-h-screen">
 <Loading />
 </div>
 );
 }

 const isCEO = user?.role?.name?.toLowerCase() === 'ceo';
 if (!isSuperadmin && !isCEO) {
 if (hasPermission("lead_dashboard", "view")) {
 return <LeadDashboard />;
 }
 if (hasPermission("employee_dashboard", "view")) {
 return <EmployeeDashboard />;
 }
 }

 if (isSuperadmin || hasPermission("admin", "view")) {
 return <Admin />;
 }
 if (hasPermission("lead_dashboard", "view")) {
 return <LeadDashboard />;
 }
 if (hasPermission("employee_dashboard", "view")) {
 return <EmployeeDashboard />;
 }

 return <div className="p-10 text-center">No dashboard access granted.</div>;
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
 <ProtectedRoute>
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
 { index: true, element: <RootDashboardRedirect /> },
 {
 path: "/lead-dashboard",
 element: (
 <ProtectedRoute requiredPage="lead_dashboard">
 <LeadDashboard />
 </ProtectedRoute>
 )
 },
 {
 path: "/employee-dashboard",
 element: (
 <ProtectedRoute requiredPage="employee_dashboard">
 <EmployeeDashboard />
 </ProtectedRoute>
 )
 },
 {
 path: "/hr/employees",
 element: (
 <ProtectedRoute
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
 requiredPage={["attendance", "employee_attendance", "lead_attendance"]}
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
 requiredPage={["leaves", "employee_leaves", "lead_leaves"]}
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
 requiredPage={["leaves", "employee_leaves", "lead_leaves"]}
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
 requiredPage="customer"
 >
 <Customers />
 </ProtectedRoute>
 ),
 },
 {
 path: "/profile",
 element: (
 <ProtectedRoute>
 <Profile />
 </ProtectedRoute>
 ),
 },
 {
 path: "/operations/projects",
 element: (
 <ProtectedRoute
 isAuthenticated={isAuthenticated}
 requiredPage={["projects", "employee_projects", "lead_projects"]}
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
 requiredPage={["projects", "employee_projects", "lead_projects"]}
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
 requiredPage={["projects", "employee_projects", "lead_projects"]}
 requiredAction="add"
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
 requiredPage={["projects", "employee_projects", "lead_projects"]}
 requiredAction="edit"
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
 requiredPage="projects"
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
 requiredPage="projects"
 requiredAction="add"
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
 requiredPage="projects"
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
 requiredPage={["tasks", "employee_tasks", "lead_tasks"]}
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
 requiredPage="tasks"
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
 requiredPage="tasks"
 requiredAction="add"
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
 requiredPage={["tasks", "employee_tasks", "lead_tasks"]}
 requiredAction="add"
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
 requiredPage={["tasks", "employee_tasks", "lead_tasks"]}
 requiredAction="edit"
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
 requiredPage="task_board"
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
 requiredPage={["timelogs", "lead_timelogs"]}
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
 requiredPage={["timelogs", "lead_timelogs"]}
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
 requiredPage={["timelogs", "lead_timelogs"]}
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
 requiredPage={["timelogs", "lead_timelogs"]}
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
 requiredPage="task_calendar"
 requiredAction="view"
 >
 <TaskCalendarPage />
 </ProtectedRoute>
 ),
 },
 {
 path: "/operations/common-calendar",
 element: (
 <ProtectedRoute
 isAuthenticated={isAuthenticated}
 requiredPage="common_calendar"
 requiredAction="view"
 >
 <CommonCalendar />
 </ProtectedRoute>
 ),
 },
 {
 path: "/operations/scrum",
 element: (
 <ProtectedRoute
 isAuthenticated={isAuthenticated}
 requiredPage={["scrum", "employee_scrum", "lead_scrum"]}
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
 requiredPage={["scrum", "employee_scrum", "lead_scrum"]}
 requiredAction="edit"
 >
 <EditScrumPage />
 </ProtectedRoute>
 ),
 },
 {
 path: "/employee/scrum/edit/:id",
 element: (
 <ProtectedRoute requiredPage="employee_scrum" requiredAction="edit">
 <EditScrumPage />
 </ProtectedRoute>
 ),
 },
 {
 path: "/lead/scrum/edit/:id",
 element: (
 <ProtectedRoute requiredPage="lead_scrum" requiredAction="edit">
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
 path: "/operations/contracts/edit/:id",
 element: (
 <ProtectedRoute
 isAuthenticated={isAuthenticated}
 requiredPage="contracts"
 requiredAction="edit"
 >
 <ContractEdit />
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
 requiredPage="tasks"
 requiredAction="view"
 >
 <TaskArchive />
 </ProtectedRoute>
 ),
 },

 /* Lead Scoped Routes */
 {
 path: "/team/employees",
 element: (
 <ProtectedRoute requiredPage="team_listing">
 <EmployeeView leadScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/lead/projects",
 element: (
 <ProtectedRoute requiredPage="lead_projects">
 <Projects leadScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/lead/tasks",
 element: (
 <ProtectedRoute requiredPage="lead_tasks">
 <TaskView leadScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/lead/scrum",
 element: (
 <ProtectedRoute requiredPage="lead_scrum">
 <ScrumView leadScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/lead/time-logs",
 element: (
 <ProtectedRoute requiredPage="lead_timelogs">
 <TimeLogs leadScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/lead/leaves",
 element: (
 <ProtectedRoute requiredPage="lead_leaves">
 <Leaves leadScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/lead/attendance",
 element: (
 <ProtectedRoute requiredPage="lead_attendance">
 <Attendance leadScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/lead/leaves/assign",
 element: (
 <ProtectedRoute requiredPage={["leaves", "employee_leaves", "lead_leaves"]}>
 <AssignLeave leadScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/lead/overtime",
 element: (
 <ProtectedRoute requiredPage="lead_overtime">
 <Overtime leadScope={true} />
 </ProtectedRoute>
 ),
 },

 /* Employee Scoped Routes */
 {
 path: "/employee/projects",
 element: (
 <ProtectedRoute requiredPage="employee_projects">
 <Projects employeeScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/employee/tasks",
 element: (
 <ProtectedRoute requiredPage="employee_tasks">
 <TaskView employeeScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/employee/holidays",
 element: (
 <ProtectedRoute
 isAuthenticated={isAuthenticated}
 requiredPage="employee_holidays"
 requiredAction="view"
 >
 <HolidayView employeeScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/employee/scrum",
 element: (
 <ProtectedRoute requiredPage="employee_scrum">
 <ScrumView employeeScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/employee/time-logs",
 element: (
 <ProtectedRoute requiredPage="employee_timelogs">
 <TimeLogs employeeScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/employee/attendance",
 element: (
 <ProtectedRoute requiredPage="employee_attendance">
 <Attendance employeeScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/employee/leaves",
 element: (
 <ProtectedRoute requiredPage="employee_leaves">
 <Leaves employeeScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/employee/leaves/assign",
 element: (
 <ProtectedRoute requiredPage={["leaves", "employee_leaves", "lead_leaves"]}>
 <AssignLeave employeeScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/employee/task-calendar",
 element: (
 <ProtectedRoute requiredPage="employee_taskcalendar">
 <TaskCalendarPage employeeScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "/employee/holidays",
 element: (
 <ProtectedRoute requiredPage="employee_holidays">
 <HolidayView employeeScope={true} />
 </ProtectedRoute>
 ),
 },
 {
 path: "*",
 element: <Navigate to="/" replace />,
 },
 ],
 },
 ]);

 return (
 <PermissionProvider isAuthenticated={isAuthenticated}>
 <RouterProvider router={router} />
 </PermissionProvider>
 );
}

export default App;
