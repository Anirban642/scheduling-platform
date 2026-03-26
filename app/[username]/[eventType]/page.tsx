'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isPast, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';

const bookingFormSchema = z.object({
  guestName: z.string().min(2, 'Name must be at least 2 characters'),
  guestEmail: z.string().email('Invalid email address'),
  guestNotes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface EventTypeData {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  color?: string;
  user: {
    name: string;
    username: string;
    image?: string;
  };
}

interface TimeSlot {
  time: string;
  displayTime: string;
}

export default function PublicBookingPage() {
  const params = useParams(); // ← Use useParams hook instead
  const router = useRouter();
  const username = params.username as string; // ← Extract from params
  const eventSlug = params.eventType as string; // ← Extract from params

  // Rest of your component stays exactly the same...
  const [eventType, setEventType] = useState<EventTypeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
  });

  useEffect(() => {
    fetchEventType();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchEventType = async () => {
    try {
      const res = await fetch(`/api/public/event-types?username=${username}&slug=${eventSlug}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Event type not found');
        setIsLoading(false);
        return;
      }

      setEventType(data.eventType);
    } catch (err) {
      setError('Failed to load event type');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async (date: Date) => {
    setIsLoadingSlots(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch(
        `/api/bookings/available-slots?username=${username}&eventSlug=${eventSlug}&date=${dateStr}`
      );
      const data = await res.json();

      setAvailableSlots(data.slots || []);
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedTime) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          eventSlug,
          startTime: selectedTime,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestNotes: data.guestNotes || '',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to create booking');
        setIsSubmitting(false);
        return;
      }

      router.push(`/booking-confirmed?id=${result.booking.id}`);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const previousMonth = () => {
    setCurrentMonth((prev) => addDays(startOfMonth(prev), -1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => addDays(endOfMonth(prev), 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !eventType) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!eventType) return null;

  const days = getDaysInMonth();
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Event Info */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{eventType.user.name}</p>
                    <p className="text-xs text-gray-500">@{eventType.user.username}</p>
                  </div>
                </div>
                <CardTitle className="text-2xl">{eventType.title}</CardTitle>
                <CardDescription className="flex items-center mt-2">
                  <Clock className="h-4 w-4 mr-2" />
                  {eventType.duration} minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eventType.description && (
                  <p className="text-gray-700 mb-6">{eventType.description}</p>
                )}

                {selectedDate && selectedTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm font-medium text-blue-900 mb-2">Selected Time:</p>
                    <p className="text-blue-700">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-blue-700">
                      {format(new Date(selectedTime), 'h:mm a')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedTime && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Enter Your Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="guestName">Your Name *</Label>
                      <Input
                        id="guestName"
                        placeholder="John Doe"
                        {...register('guestName')}
                      />
                      {errors.guestName && (
                        <p className="text-sm text-red-600">{errors.guestName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestEmail">Your Email *</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        placeholder="john@example.com"
                        {...register('guestEmail')}
                      />
                      {errors.guestEmail && (
                        <p className="text-sm text-red-600">{errors.guestEmail.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestNotes">Additional Notes (Optional)</Label>
                      <Input
                        id="guestNotes"
                        placeholder="Any special requests?"
                        {...register('guestNotes')}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Side - Calendar & Time Slots */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Select a Date & Time</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Calendar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={previousMonth}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={nextMonth}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-medium text-gray-600 py-2"
                      >
                        {day}
                      </div>
                    ))}

                    {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                      <div key={`empty-${index}`} />
                    ))}

                    {days.map((day) => {
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isPastDay = isPast(startOfDay(day)) && !isSameDay(day, new Date());
                      const isToday = isSameDay(day, new Date());

                      return (
                        <button
                          key={day.toString()}
                          type="button"
                          onClick={() => {
                            if (!isPastDay) {
                              setSelectedDate(day);
                              setSelectedTime(null);
                            }
                          }}
                          disabled={isPastDay}
                          className={`
                            p-2 text-sm rounded-lg transition-colors
                            ${isPastDay ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
                            ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                            ${isToday && !isSelected ? 'border-2 border-blue-600' : ''}
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <h4 className="font-semibold mb-3">
                      Available Times - {format(selectedDate, 'EEEE, MMM d')}
                    </h4>

                    {isLoadingSlots ? (
                      <div className="text-center py-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No available times on this date
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            variant={selectedTime === slot.time ? 'default' : 'outline'}
                            onClick={() => setSelectedTime(slot.time)}
                            className="w-full"
                          >
                            {slot.displayTime}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}