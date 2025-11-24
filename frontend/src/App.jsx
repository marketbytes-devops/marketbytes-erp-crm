import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Layout from "./components/Layout";
import Admin from "./pages/Dashboards/Admin";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Admin />
      },
    ]
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App