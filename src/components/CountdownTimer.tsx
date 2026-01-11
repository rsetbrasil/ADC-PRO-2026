
'use client';

import { useState, useEffect } from 'react';
import { TimerIcon } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
}

const calculateTimeLeft = (endDate: string) => {
  const difference = +new Date(endDate) - +new Date();
  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
};

export default function CountdownTimer({ endDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearTimeout(timer);
  });
  
  const hasTimeLeft = timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0;
  
  if (!hasTimeLeft) {
      return null;
  }

  return (
    <div className="mt-4 p-3 rounded-lg border bg-destructive/10 text-destructive-foreground">
      <div className="flex items-center justify-center gap-2 mb-2">
        <TimerIcon className="h-5 w-5 text-destructive" />
        <h4 className="font-semibold text-destructive">A promoção termina em:</h4>
      </div>
      <div className="flex justify-center gap-2 text-center">
        <div className="p-2 rounded-md bg-destructive/20 w-16">
          <div className="text-xl font-bold">{String(timeLeft.days).padStart(2, '0')}</div>
          <div className="text-xs">Dias</div>
        </div>
        <div className="p-2 rounded-md bg-destructive/20 w-16">
          <div className="text-xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs">Horas</div>
        </div>
        <div className="p-2 rounded-md bg-destructive/20 w-16">
          <div className="text-xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs">Min</div>
        </div>
        <div className="p-2 rounded-md bg-destructive/20 w-16">
          <div className="text-xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs">Seg</div>
        </div>
      </div>
    </div>
  );
}
