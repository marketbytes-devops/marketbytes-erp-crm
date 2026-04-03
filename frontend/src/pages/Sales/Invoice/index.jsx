import { useEffect } from "react";
import LayoutComponents from "../../../components/LayoutComponents";

// Bridge page: keep permissions and sidebar entry inside ERP,
// but actually use the dedicated external invoicing app.
const Invoices = () => {
  useEffect(() => {
    const url = "https://invoice.marketbytes.in";
    // Open external invoice portal in a new tab/window.
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="p-6 min-h-screen">
      <LayoutComponents
        title="Invoices"
        subtitle="Invoices are now managed in the dedicated MarketBytes invoicing system."
        variant="table"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            The integrated ERP invoicing module has been moved to our dedicated
            billing platform.
          </p>
          <a
            href="https://invoice.marketbytes.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-900 transition"
          >
            Open Invoice Portal
          </a>
        </div>
      </LayoutComponents>
    </div>
  );
};

export default Invoices;

