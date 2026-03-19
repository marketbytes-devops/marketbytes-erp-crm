from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from authapp.permissions import HasPermission
from .models import CalendarEvent
from .serializers import CalendarEventSerializer
from hr.models import Holiday, Leave
from hr.serializers import HolidaySerializer, LeaveSerializer
from django.db.models import Q

class CalendarEventViewSet(viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer
    permission_classes = [HasPermission]
    page_name = 'common_calendar'

    def get_queryset(self):
        # All authenticated users can see events
        return self.queryset

class CommonCalendarView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # Fetching all events and holidays
        events = CalendarEvent.objects.all()
        holidays = Holiday.objects.all()

        event_serializer = CalendarEventSerializer(events, many=True, context={'request': request})
        holiday_serializer = HolidaySerializer(holidays, many=True)

        return Response({
            'events': event_serializer.data,
            'holidays': holiday_serializer.data
        })
