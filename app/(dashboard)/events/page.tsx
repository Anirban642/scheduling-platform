'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EventTypeInput, eventTypeSchema } from '@/lib/validations/eventType';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Copy, Edit, Link2, Plus, Power, Trash2 } from 'lucide-react';

interface EventType {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  duration: number;
  color?: string;
  isActive: boolean;
}

export default function EventsPage() {
  const { data: session } = useSession();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<EventTypeInput>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: {
      duration: 30,
      color: '#3b82f6',
    },
  });

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEventTypes(data.eventTypes || []);
    } catch (error) {
      console.error('Error fetching event types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EventTypeInput) => {
    setError('');

    try {
      const url = editingEvent ? `/api/events/${editingEvent._id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to save event type');
        return;
      }

      setIsDialogOpen(false);
      reset();
      setEditingEvent(null);
      fetchEventTypes();
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleEdit = (event: EventType) => {
    setEditingEvent(event);
    setValue('title', event.title);
    setValue('slug', event.slug);
    setValue('description', event.description || '');
    setValue('duration', event.duration);
    setValue('color', event.color || '#3b82f6');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event type?')) return;

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchEventTypes();
      }
    } catch (error) {
      console.error('Error deleting event type:', error);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        fetchEventTypes();
      }
    } catch (error) {
      console.error('Error toggling event status:', error);
    }
  };

  const copyBookingLink = (slug: string) => {
    const link = `${window.location.origin}/${session?.user.username}/${slug}`;
    navigator.clipboard.writeText(link);
    alert('Booking link copied to clipboard!');
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Types</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your meeting types
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              reset();
              setEditingEvent(null);
              setError('');
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Event Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Edit Event Type' : 'Create Event Type'}
              </DialogTitle>
              <DialogDescription>
                Set up a new type of meeting that people can book with you
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="30 Minute Meeting"
                  {...register('title')}
                  onChange={(e) => {
                    register('title').onChange(e);
                    if (!editingEvent) {
                      setValue('slug', generateSlug(e.target.value));
                    }
                  }}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    /{session?.user.username}/
                  </span>
                  <Input id="slug" placeholder="30-min-meeting" {...register('slug')} />
                </div>
                {errors.slug && (
                  <p className="text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="A brief 30-minute meeting to discuss..."
                  {...register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                  onValueChange={(value) => setValue('duration', parseInt(value))}
                  defaultValue={watch('duration')?.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
                {errors.duration && (
                  <p className="text-sm text-red-600">{errors.duration.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  {...register('color')}
                  className="h-10 w-20"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Saving...'
                    : editingEvent
                    ? 'Update Event'
                    : 'Create Event'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {eventTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No event types yet
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Create your first event type to start accepting bookings
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTypes.map((event) => (
            <Card key={event._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {event.duration} minutes
                    </CardDescription>
                  </div>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {event.description && (
                  <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Link2 className="h-4 w-4" />
                  <span className="truncate">/{session?.user.username}/{event.slug}</span>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyBookingLink(event.slug)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(event)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(event._id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant={event.isActive ? 'default' : 'outline'}
                  onClick={() => toggleActive(event._id, event.isActive)}
                >
                  <Power className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}