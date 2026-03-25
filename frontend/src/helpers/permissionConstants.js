export const PAGE_GROUPS = [
  {
    name: "Dashboard",
    pages: ["admin", "lead_dashboard", "employee_dashboard"]
  },
  {
    name: "Profile",
    pages: ["profile"]
  },
  {
    name: "Operations",
    pages: ["projects", "tasks", "task_board", "timelogs", "task_calendar", "common_calendar", "scrum", "contracts"]
  },
  {
    name: "HR",
    pages: ["employees", "departments", "designations", "attendance", "holidays", "leaves", "overtime", "recruitment", "performance"]
  },
  {
    name: "Sales",
    pages: ["leads", "pipeline", "communication_tools", "invoices", "reports", "customer"]
  },
  {
    name: "Lead",
    pages: ["team_listing", "lead_attendance", "lead_leaves", "lead_timelogs", "lead_projects", "lead_tasks", "lead_scrum"]
  },
  {
    name: "Employee",
    pages: ["employee_projects", "employee_tasks", "employee_attendance", "employee_holidays", "employee_leaves", "employee_timelogs", "employee_scrum", "employee_taskcalendar"]
  },
  {
    name: "System",
    pages: ["roles", "users", "permissions"]
  }
];

export const PAGE_NAME_MAP = {
  // Common / Home
  admin: { apiName: "admin", displayName: "Dashboard", route: "/dashboard", module: "Dashboard" },

  // HR Management
  employees: { apiName: "employees", displayName: "Employees", route: "/hr/employees", module: "HR Management" },
  departments: { apiName: "departments", displayName: "Departments", route: "/hr/departments", module: "HR Management" },
  designations: { apiName: "designations", displayName: "Designations", route: "/hr/designations", module: "HR Management" },
  attendance: { apiName: "attendance", displayName: "Attendance", route: "/hr/attendance", module: "HR Management" },
  holidays: { apiName: "holidays", displayName: "Holidays", route: "/hr/holidays", module: "HR Management" },
  leaves: { apiName: "leaves", displayName: "Leaves", route: "/hr/leaves", module: "HR Management" },
  overtime: { apiName: "overtime", displayName: "Overtime", route: "/hr/overtime", module: "HR Management" },
  recruitment: { apiName: "recruitment", displayName: "Recruitment", route: "/hr/recruitment", module: "HR Management" },
  performance: { apiName: "performance", displayName: "Performance", route: "/hr/performance", module: "HR Management" },

  // Operations
  projects: { apiName: "projects", displayName: "Projects", route: "/operations/projects", module: "Operations" },
  tasks: { apiName: "tasks", displayName: "Tasks", route: "/operations/tasks", module: "Operations" },
  task_board: { apiName: "task_board", displayName: "Task Board", route: "/operations/task-board", module: "Operations" },
  timelogs: { apiName: "timelogs", displayName: "Time Log", route: "/operations/time-logs", module: "Operations" },
  task_calendar: { apiName: "task_calendar", displayName: "Task Calendar", route: "/operations/task-calendar", module: "Operations" },
  common_calendar: { apiName: "common_calendar", displayName: "Common Calendar", route: "/operations/common-calendar", module: "Operations" },
  scrum: { apiName: "scrum", displayName: "Scrum", route: "/operations/scrum", module: "Operations" },
  contracts: { apiName: "contracts", displayName: "Contracts", route: "/operations/contracts", module: "Operations" },

  // Sales
  leads: { apiName: "leads", displayName: "Leads", route: "/sales/leads", module: "Sales" },
  pipeline: { apiName: "pipeline", displayName: "Pipeline", route: "/sales/pipeline", module: "Sales" },
  communication_tools: { apiName: "communication_tools", displayName: "Communication Tools", route: "/sales/communication-tools", module: "Sales" },
  invoices: { apiName: "invoices", displayName: "Invoices", route: "/sales/invoices", module: "Sales" },
  reports: { apiName: "reports", displayName: "Reports", route: "/sales/reports", module: "Sales" },
  customer: { apiName: "customer", displayName: "Clients & Companies", route: "/sales/customer", module: "Sales" },

  // User Roles
  roles: { apiName: "roles", displayName: "Roles", route: "/user-roles/roles", module: "System" },
  users: { apiName: "users", displayName: "Users", route: "/user-roles/users", module: "System" },
  permissions: { apiName: "permissions", displayName: "Permissions", route: "/user-roles/permissions", module: "System" },

  // Profile
  profile: { apiName: "profile", displayName: "Profile", route: "/profile", module: "Profile" },

  // Lead Section
  lead_dashboard: { apiName: "lead_dashboard", displayName: "Lead Dashboard", route: "/lead-dashboard", module: "Dashboard" },
  team_listing: { apiName: "team_listing", displayName: "Team Members", route: "/team/employees", module: "Lead" },
  lead_attendance: { apiName: "lead_attendance", displayName: "Team Attendance", route: "/lead/attendance", module: "Lead" },
  lead_leaves: { apiName: "lead_leaves", displayName: "Team Leaves", route: "/lead/leaves", module: "Lead" },
  lead_timelogs: { apiName: "lead_timelogs", displayName: "Team Timelogs", route: "/lead/time-logs", module: "Lead" },
  lead_projects: { apiName: "lead_projects", displayName: "Lead Projects", route: "/lead/projects", module: "Lead" },
  lead_tasks: { apiName: "lead_tasks", displayName: "Lead Tasks", route: "/lead/tasks", module: "Lead" },
  lead_scrum: { apiName: "lead_scrum", displayName: "Team Scrum", route: "/lead/scrum", module: "Lead" },

  // Employee Section
  employee_dashboard: { apiName: "employee_dashboard", displayName: "My Dashboard", route: "/employee-dashboard", module: "Dashboard" },
  employee_projects: { apiName: "employee_projects", displayName: "My Projects", route: "/employee/projects", module: "Employee" },
  employee_tasks: { apiName: "employee_tasks", displayName: "My Tasks", route: "/employee/tasks", module: "Employee" },
  employee_attendance: { apiName: "employee_attendance", displayName: "My Attendance", route: "/employee/attendance", module: "Employee" },
  employee_holidays: { apiName: "employee_holidays", displayName: "My Holidays", route: "/employee/holidays", module: "Employee" },
  employee_leaves: { apiName: "employee_leaves", displayName: "My Leaves", route: "/employee/leaves", module: "Employee" },
  employee_timelogs: { apiName: "employee_timelogs", displayName: "My Time Logs", route: "/employee/time-logs", module: "Employee" },
  employee_scrum: { apiName: "employee_scrum", displayName: "My Scrum", route: "/employee/scrum", module: "Employee" },
  employee_taskcalendar: { apiName: "employee_taskcalendar", displayName: "Task Calendar", route: "/employee/task-calendar", module: "Employee" },
};
