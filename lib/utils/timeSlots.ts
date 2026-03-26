import { format, addMinutes, parseISO, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface AvailableSlot {
  time: string;
  displayTime: string;
}

export function generateTimeSlots(
  date: Date,
  dayAvailability: { isAvailable: boolean; slots: TimeSlot[] },
  duration: number,
  bookedSlots: { startTime: Date; endTime: Date }[],
  timeZone: string
): AvailableSlot[] {
  if (!dayAvailability.isAvailable || dayAvailability.slots.length === 0) {
    return [];
  }

  const availableSlots: AvailableSlot[] = [];
  const selectedDate = startOfDay(date);

  dayAvailability.slots.forEach((slot) => {
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    const [endHour, endMinute] = slot.end.split(':').map(Number);

    let currentTime = new Date(selectedDate);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const slotEndTime = new Date(selectedDate);
    slotEndTime.setHours(endHour, endMinute, 0, 0);

    while (isBefore(currentTime, slotEndTime)) {
      const slotEnd = addMinutes(currentTime, duration);

      // Check if slot end is within working hours
      if (isAfter(slotEnd, slotEndTime)) {
        break;
      }

      // Check if slot is not in the past
      const now = new Date();
      if (isBefore(currentTime, now)) {
        currentTime = addMinutes(currentTime, 15); // Move to next 15-min interval
        continue;
      }

      // Check if slot conflicts with existing bookings
      const isBooked = bookedSlots.some((booking) => {
        return (
          (isBefore(currentTime, booking.endTime) && isAfter(slotEnd, booking.startTime))
        );
      });

      if (!isBooked) {
        availableSlots.push({
          time: currentTime.toISOString(),
          displayTime: format(currentTime, 'h:mm a'),
        });
      }

      currentTime = addMinutes(currentTime, 15); // Move to next 15-min interval
    }
  });

  return availableSlots;
}

export function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}