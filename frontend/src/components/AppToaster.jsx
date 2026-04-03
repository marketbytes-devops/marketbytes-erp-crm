import { Toaster } from "react-hot-toast";

/** Single app-wide toast host — mount once (e.g. in Layout) to avoid duplicate messages. */
const AppToaster = () => (
  <Toaster
    position="top-right"
    containerStyle={{ 
      top: 90,
      right: 25,
    }}
    toastOptions={{
      duration: 3000,
      style: {
        background: "#000",
        color: "#fff",
        fontSize: "14px",
      },
      success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
      error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
    }}
  />
);

export default AppToaster;
