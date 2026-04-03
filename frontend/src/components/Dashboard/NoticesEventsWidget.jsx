import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../helpers/apiClient";
import Loading from "../Loading";
import { MdCalendarToday, MdChevronRight, MdInfoOutline } from "react-icons/md";

const toDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatWhen = (d) =>
  d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const NoticesEventsWidget = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/events/common-calendar/");
        const backendEvents = res.data?.events || [];
        const holidays = res.data?.holidays || [];

        const mapped = [
          ...backendEvents.map((e) => ({
            id: `event-${e.id}`,
            kind: "event",
            title: e.title,
            when: toDate(e.start_datetime),
            raw: e,
          })),
          ...holidays.map((h) => ({
            id: `holiday-${h.id}`,
            kind: "holiday",
            title: h.occasion,
            when: toDate(h.date),
            raw: h,
          })),
        ].filter((x) => x.when);

        mapped.sort((a, b) => a.when - b.when);

        if (mounted) setItems(mapped);
      } catch (e) {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const upcoming = useMemo(() => {
    const now = new Date();
    return items.filter((x) => x.when >= now).slice(0, 5);
  }, [items]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-2.5 text-sm border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800">Notices &amp; Events</h2>
          <p className="text-sm text-gray-500">Upcoming company schedule</p>
        </div>
        <button
          onClick={() => navigate("/operations/common-calendar")}
          className="bg-black text-white hover:bg-gray-100 hover:text-black transition-all flex items-center gap-2 px-4 py-3 text-sm rounded-xl font-medium"
        >
          View <MdChevronRight />
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loading />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-gray-400">
            <MdInfoOutline className="text-4xl mb-2 opacity-50" />
            <p className="text-sm font-medium">No events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((x) => (
              <div
                key={x.id}
                className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    x.kind === "holiday"
                      ? "bg-red-50 text-red-600"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <MdCalendarToday className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{x.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatWhen(x.when)}
                    {x.kind === "holiday" ? " • Holiday" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticesEventsWidget;

