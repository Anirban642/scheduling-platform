'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AvailabilityInput, availabilitySchema } from '@/lib/validations/availability';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus, Trash2 } from 'lucide-react';

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

export default function AvailabilityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control,
  } = useForm<AvailabilityInput>({
    resolver: zodResolver(availabilitySchema),
  });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await fetch('/api/availability');
      const data = await res.json();

      if (data.availability) {
        reset({
          monday: data.availability.monday,
          tuesday: data.availability.tuesday,
          wednesday: data.availability.wednesday,
          thursday: data.availability.thursday,
          friday: data.availability.friday,
          saturday: data.availability.saturday,
          sunday: data.availability.sunday,
        });
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AvailabilityInput) => {
    setIsSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.error || 'Failed to update availability');
        return;
      }

      setMessage('Availability updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDayAvailability = (day: string) => {
    const currentValue = watch(`${day}.isAvailable` as any);
    setValue(`${day}.isAvailable` as any, !currentValue);
  };

  const addTimeSlot = (day: string) => {
    const currentSlots = watch(`${day}.slots` as any) || [];
    setValue(`${day}.slots` as any, [...currentSlots, { start: '09:00', end: '17:00' }]);
  };

  const removeTimeSlot = (day: string, index: number) => {
    const currentSlots = watch(`${day}.slots` as any) || [];
    setValue(
      `${day}.slots` as any,
      currentSlots.filter((_: any, i: number) => i !== index)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
        <p className="text-gray-600 mt-2">
          Set your weekly hours to let people know when you're available
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {message && (
          <div
            className={`px-4 py-3 rounded-md text-sm ${
              message.includes('success')
                ? 'bg-green-50 border border-green-200 text-green-600'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-4">
          {daysOfWeek.map(({ key, label }) => {
            const isAvailable = watch(`${key}.isAvailable`);
            const slots = watch(`${key}.slots`) || [];

            return (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{label}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Label
                        htmlFor={`${key}-toggle`}
                        className="text-sm cursor-pointer"
                      >
                        {isAvailable ? 'Available' : 'Unavailable'}
                      </Label>
                      <input
                        type="checkbox"
                        id={`${key}-toggle`}
                        checked={isAvailable}
                        onChange={() => toggleDayAvailability(key)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                </CardHeader>

                {isAvailable && (
                  <CardContent className="space-y-4">
                    {slots.map((slot: any, index: number) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`${key}-start-${index}`}>Start Time</Label>
                            <Input
                              id={`${key}-start-${index}`}
                              type="time"
                              {...register(`${key}.slots.${index}.start` as any)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${key}-end-${index}`}>End Time</Label>
                            <Input
                              id={`${key}-end-${index}`}
                              type="time"
                              {...register(`${key}.slots.${index}.end` as any)}
                            />
                          </div>
                        </div>
                        {slots.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeTimeSlot(key, index)}
                            className="mt-8"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addTimeSlot(key)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Time Slot
                    </Button>

                    {errors[key]?.slots && (
                      <p className="text-sm text-red-600">
                        Please check the time slots for errors
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <Clock className="inline h-4 w-4 mr-1" />
            All times are in your local timezone
          </p>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </form>
    </div>
  );
}