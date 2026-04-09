import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import apiClient from "../../helpers/apiClient";
import { usePermission } from "../../context/PermissionContext";
import toast from 'react-hot-toast';
import LayoutComponents from "../../components/LayoutComponents";
import Loading from "../../components/Loading";
import { MdAdd, MdClose } from "react-icons/md";

const localizer = momentLocalizer(moment);

const CommonCalendar = () => {
 const [events, setEvents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [newEvent, setNewEvent] = useState({
 title: '',
 description: '',
 start_datetime: '',
 end_datetime: '',
 event_type: 'meeting',
 location: ''
 });

 const { hasPermission } = usePermission();
 const canAddEvent = hasPermission('common_calendar', 'add');

  const eventCount = events.filter((e) => e?.type === 'event').length;
  const holidayCount = events.filter((e) => e?.type === 'holiday').length;
  const totalCount = eventCount + holidayCount;

 useEffect(() => {
 fetchCalendarData();
 }, []);

 const fetchCalendarData = async () => {
 try {
 setLoading(true);
 const response = await apiClient.get('/events/common-calendar/');
 const { events: backendEvents, holidays } = response.data;
 const formattedEvents = [
 ...backendEvents.map(e => ({
 id: `event-${e.id}`,
 title: e.title,
 start: new Date(e.start_datetime),
 end: new Date(e.end_datetime),
 resource: e,
 type: 'event'
 })),
 ...holidays.map(h => ({
 id: `holiday-${h.id}`,
 title: h.occasion,
 start: new Date(h.date),
 end: new Date(h.date),
 allDay: true,
 type: 'holiday'
 }))
 ];

 setEvents(formattedEvents);
 } catch (error) {
 console.error('Error fetching calendar data:', error);
 toast.error('Failed to load calendar data');
 } finally {
 setLoading(false);
 }
 };

 const handleAddEvent = async (e) => {
 e.preventDefault();
 try {
 await apiClient.post('/events/events/', newEvent);
 toast.success('Event added successfully');
 setShowModal(false);
 setNewEvent({
 title: '',
 description: '',
 start_datetime: '',
 end_datetime: '',
 event_type: 'meeting',
 location: ''
 });
 fetchCalendarData();
 } catch (error) {
 console.error('Error adding event:', error);
 toast.error('Failed to add event');
 }
 };

 const eventStyleGetter = (event) => {
 let backgroundColor = '#111827'; // Gray-900
 if (event.type === 'holiday') backgroundColor = '#ef4444'; // Red 500

 return {
 style: {
 backgroundColor,
 borderRadius: '8px',
 opacity: 0.9,
 color: 'white',
 border: 'none',
 display: 'block',
 padding: '2px 8px',
 fontSize: '0.875rem',
 fontWeight: '500',
 boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
 }
 };
 };

    return (
        <div className="p-6 min-h-screen">
          <LayoutComponents
            title="Events"
            subtitle="Manage and view all company events and holidays"
            variant="table"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                  <div className="text-center">
                    <div className="text-3xl font-medium text-gray-900 mb-1">{totalCount}</div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Total</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-medium text-black mb-1">{eventCount}</div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Events</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-medium text-red-600 mb-1">{holidayCount}</div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Holidays</p>
                  </div>
                </div>

                {canAddEvent && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-900 transition whitespace-nowrap px-4 py-3 text-sm rounded-xl font-medium"
                  >
                    <MdAdd className="w-5 h-5" />
                    Add Event
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden h-[calc(100vh-210px)]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loading />
                </div>
              ) : (
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  eventPropGetter={eventStyleGetter}
                  components={{
                    dateHeader: ({ label, date }) => {
                      const day = date.getDay();
                      const isWeekend = day === 0 || day === 6;
                      return (
                        <div className="flex flex-col items-center justify-center p-1">
                          <span className={isWeekend ? 'text-red-600 font-bold text-base' : 'text-gray-900'}>
                            {label}
                          </span>
                          {isWeekend && (
                            <span className="text-[10px] text-red-600 font-bold leading-none mt-0.5 tracking-tighter">
                              (H)
                            </span>
                          )}
                        </div>
                      );
                    }
                  }}
                  dayPropGetter={(date) => {
                    const day = date.getDay();
                    if (day === 0 || day === 6) {
                      return {
                        style: {
                          backgroundColor: '#fef2f2', // Red-50
                          cursor: 'pointer'
                        },
                      };
                    }
                    return {};
                  }}
                  onSelectEvent={(event) => {
                    if (event.resource) {
                      toast(
                        `Event: ${event.resource.title}\n` +
                          `Type: ${event.resource.event_type}\n` +
                          `Location: ${event.resource.location || "N/A"}\n` +
                          `Description: ${event.resource.description || "N/A"}`,
                        { duration: 4000 }
                      );
                    }
                  }}
                />
              )}
            </div>

            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-medium text-gray-900">Add New Event</h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <MdClose className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <form onSubmit={handleAddEvent} className="p-6 space-y-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide ml-1 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Quarterly Review"
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-black outline-none transition px-4 py-3 text-sm rounded-xl font-medium"
                        value={newEvent.title}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, title: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide ml-1 mb-2">
                        Event Type
                      </label>
                      <select
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-black outline-none transition px-4 py-3 text-sm rounded-xl font-medium bg-white"
                        value={newEvent.event_type}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, event_type: e.target.value })
                        }
                      >
                        <option value="meeting">Meeting</option>
                        <option value="event">Company Event</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide ml-1 mb-2">
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          required
                          className="w-full border border-gray-300 focus:ring-2 focus:ring-black outline-none transition px-4 py-3 text-sm rounded-xl font-medium"
                          value={newEvent.start_datetime}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              start_datetime: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide ml-1 mb-2">
                          End Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          required
                          className="w-full border border-gray-300 focus:ring-2 focus:ring-black outline-none transition px-4 py-3 text-sm rounded-xl font-medium"
                          value={newEvent.end_datetime}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              end_datetime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide ml-1 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="Conference Room A / Zoom"
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-black outline-none transition px-4 py-3 text-sm rounded-xl font-medium"
                        value={newEvent.location}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, location: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide ml-1 mb-2">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Add more details about this event..."
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-black outline-none transition resize-none px-4 py-3 text-sm rounded-xl font-medium"
                        value={newEvent.description}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="border border-gray-300 text-gray-700 hover:bg-gray-50 transition px-4 py-3 text-sm rounded-xl font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-black text-white hover:bg-gray-900 transition px-4 py-3 text-sm rounded-xl font-medium"
                      >
                        Create Event
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </LayoutComponents>
        </div>
 );
};

export default CommonCalendar;
