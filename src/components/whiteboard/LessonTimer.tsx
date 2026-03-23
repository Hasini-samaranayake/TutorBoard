'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import Button from '@/components/ui/Button';

interface TimerSettings {
  lessonDuration: number;
  breakInterval: number;
  breakDuration: number;
}

export default function LessonTimer() {
  const [settings, setSettings] = useState<TimerSettings>({
    lessonDuration: 60,
    breakInterval: 25,
    breakDuration: 5,
  });
  const [timeRemaining, setTimeRemaining] = useState(settings.lessonDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeSinceBreak, setTimeSinceBreak] = useState(0);
  const [showBreakReminder, setShowBreakReminder] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
        
        if (!isBreak) {
          setTimeSinceBreak((prev) => {
            const newTime = prev + 1;
            if (newTime >= settings.breakInterval * 60 && !showBreakReminder) {
              setShowBreakReminder(true);
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Break Time!', {
                  body: `You've been teaching for ${settings.breakInterval} minutes. Consider taking a ${settings.breakDuration} minute break.`,
                });
              }
            }
            return newTime;
          });
        }
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsRunning(false);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(isBreak ? 'Break Over!' : 'Lesson Complete!', {
          body: isBreak ? 'Time to get back to teaching!' : 'Great job on completing the lesson!',
        });
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, isBreak, settings.breakInterval, settings.breakDuration, showBreakReminder]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(settings.lessonDuration * 60);
    setTimeSinceBreak(0);
    setIsBreak(false);
    setShowBreakReminder(false);
  };

  const handleStartBreak = useCallback(() => {
    setIsRunning(false);
    setIsBreak(true);
    setTimeRemaining(settings.breakDuration * 60);
    setTimeSinceBreak(0);
    setShowBreakReminder(false);
    setIsRunning(true);
  }, [settings.breakDuration]);

  const handleEndBreak = () => {
    setIsBreak(false);
    setTimeRemaining(settings.lessonDuration * 60 - timeSinceBreak);
    setTimeSinceBreak(0);
  };

  const progress = isBreak
    ? ((settings.breakDuration * 60 - timeRemaining) / (settings.breakDuration * 60)) * 100
    : ((settings.lessonDuration * 60 - timeRemaining) / (settings.lessonDuration * 60)) * 100;

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Lesson Timer</h2>

      <div className="relative">
        <div className="w-48 h-48 mx-auto relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke={isBreak ? '#10b981' : '#3b82f6'}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-900">
              {formatTime(timeRemaining)}
            </span>
            <span className={`text-sm ${isBreak ? 'text-green-600' : 'text-gray-500'}`}>
              {isBreak ? 'Break Time' : 'Lesson Time'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={handleStartPause}
          variant={isRunning ? 'secondary' : 'primary'}
          size="lg"
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Button onClick={handleReset} variant="secondary" size="lg">
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {showBreakReminder && !isBreak && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <Coffee className="w-5 h-5" />
            <span className="font-medium">Time for a break!</span>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            You&apos;ve been teaching for {settings.breakInterval} minutes.
          </p>
          <Button onClick={handleStartBreak} size="sm" className="w-full">
            Start {settings.breakDuration} min break
          </Button>
        </div>
      )}

      {isBreak && (
        <Button onClick={handleEndBreak} variant="secondary" className="w-full">
          End Break Early
        </Button>
      )}

      <div className="border-t pt-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Timer Settings</h3>
        
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Lesson Duration (minutes)
          </label>
          <input
            type="number"
            value={settings.lessonDuration}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 60;
              setSettings({ ...settings, lessonDuration: value });
              if (!isRunning && !isBreak) {
                setTimeRemaining(value * 60);
              }
            }}
            min="1"
            max="180"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Break Reminder (every X minutes)
          </label>
          <input
            type="number"
            value={settings.breakInterval}
            onChange={(e) => setSettings({ ...settings, breakInterval: parseInt(e.target.value) || 25 })}
            min="5"
            max="60"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Break Duration (minutes)
          </label>
          <input
            type="number"
            value={settings.breakDuration}
            onChange={(e) => setSettings({ ...settings, breakDuration: parseInt(e.target.value) || 5 })}
            min="1"
            max="30"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  );
}
