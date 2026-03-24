import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import apiClient from "../../helpers/apiClient";
import { usePermission } from "../../context/PermissionContext";
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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
        let backgroundColor = '#4f46e5'; // Indigo 600
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
        <div className="p-8 h-[calc(100vh-100px)] flex flex-col bg-gray-50/50">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Events</h1>
                    <p className="text-gray-500 mt-1">Manage and view all company events and holidays</p>
                </div>
                {canAddEvent && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5 stroke-2" />
                        Add Event
                    </button>
                )}
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={event => {
                            if (event.resource) {
                                toast(
                                    `Event: ${event.resource.title}\n` +
                                    `Type: ${event.resource.event_type}\n` +
                                    `Location: ${event.resource.location || 'N/A'}\n` +
                                    `Description: ${event.resource.description || 'N/A'}`,
                                    { duration: 4000 }
                                );
                            }
                        }}
                    />
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">Add New Event</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <PlusIcon className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleAddEvent} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Quarterly Review"
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Type</label>
                                <select
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all appearance-none bg-no-repeat bg-[right_1rem_center]"
                                    value={newEvent.event_type}
                                    onChange={e => setNewEvent({ ...newEvent, event_type: e.target.value })}
                                >
                                    <option value="meeting">Meeting</option>
                                    <option value="event">Company Event</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                                        value={newEvent.start_datetime}
                                        onChange={e => setNewEvent({ ...newEvent, start_datetime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                                        value={newEvent.end_datetime}
                                        onChange={e => setNewEvent({ ...newEvent, end_datetime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                                <input
                                    type="text"
                                    placeholder="Conference Room A / Zoom"
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                                    value={newEvent.location}
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                <textarea
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all resize-none"
                                    rows="3"
                                    placeholder="Add more details about this event..."
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                >
                                    Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommonCalendar;
