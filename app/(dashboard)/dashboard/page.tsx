'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Link2, Plus } from 'lucide-react';

interface EventType {
  _id: string;
  title: string;
  slug: string;
  duration: number;
  isActive: boolean;
}

interface Booking {
  _id: string;
  guestName: string;
  guestEmail: string;
  startTime: string;
  endTime: string;
  eventTypeId: {
    title: string;
  };
  status: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);


  const fetchDashboardData = async () => {
    try {
      // Fetch event types
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      setEventTypes(eventsData.eventTypes || []);

      // Fetch upcoming bookings
      const bookingsRes = await fetch('/api/bookings/upcoming');
      const bookingsData = await bookingsRes.json();
      setUpcomingBookings(bookingsData.bookings || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyBookingLink = (slug: string) => {
    const link = `${window.location.origin}/${session?.user.username}/${slug}`;
    navigator.clipboard.writeText(link);
    alert('Booking link copied to clipboard!');
  };

  const fetchUserData = async () => {
  try {
    const res = await fetch('/api/user/me');
    const data = await res.json();
    setUser(data.user);
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

const connectGoogleCalendar = async () => {
  try {
    const res = await fetch('/api/calendar/connect');
    const data = await res.json();
    window.location.href = data.authUrl;
  } catch (error) {
    console.error('Error connecting calendar:', error);
  }
};

const disconnectGoogleCalendar = async () => {
  if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;

  try {
    await fetch('/api/calendar/disconnect', { method: 'POST' });
    fetchUserData();
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
  }
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your event types and view upcoming bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              {eventTypes.filter((e) => e.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">
              /{session?.user.username}
            </div>
            <p className="text-xs text-muted-foreground">Public booking page</p>
          </CardContent>
        </Card>
      </div>

      <Card>
  <CardHeader>
    <CardTitle>Google Calendar Integration</CardTitle>
    <CardDescription>
      Sync your bookings with Google Calendar
    </CardDescription>
  </CardHeader>
  <CardContent>
    {user?.googleCalendarToken ? (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-700">Connected</span>
        </div>
        <Button variant="outline" onClick={disconnectGoogleCalendar}>
          Disconnect
        </Button>
      </div>
    ) : (
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Connect your Google Calendar to automatically sync bookings
        </p>
        <Button onClick={connectGoogleCalendar}>
          <Calendar className="mr-2 h-4 w-4" />
          Connect Google Calendar
        </Button>
      </div>
    )}
  </CardContent>
</Card>

      {/* Event Types Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Event Types</h2>
          <Link href="/events">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event Type
            </Button>
          </Link>
        </div>

        {eventTypes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No event types yet
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Create your first event type to start accepting bookings
              </p>
              <Link href="/events">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event Type
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventTypes.map((event) => (
              <Card key={event._id}>
                <CardHeader>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>{event.duration} minutes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {event.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyBookingLink(event.slug)}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Bookings Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Bookings</h2>
        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No upcoming bookings
              </h3>
              <p className="text-gray-600 text-center">
                Your upcoming meetings will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <Card key={booking._id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {booking.eventTypeId.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        with {booking.guestName} ({booking.guestEmail})
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {booking.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}