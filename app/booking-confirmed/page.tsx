'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock } from 'lucide-react';

export default function BookingConfirmedPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your meeting has been successfully scheduled. A confirmation email has been sent to your email address.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">
              What's Next?
            </p>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              <li>✓ Check your email for meeting details</li>
              <li>✓ Add the event to your calendar</li>
              <li>✓ Prepare any materials for the meeting</li>
            </ul>
          </div>

          <div className="pt-4">
            <Link href="/">
              <Button className="w-full">Back to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}