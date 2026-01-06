"use client";

import { useState, useEffect } from "react";

type Props = {
  isOpen: boolean;
  onClose: (selectedTime?: string) => void;
};

export function ReminderPromptModal({ isOpen, onClose }: Props) {
  const [selectedTime, setSelectedTime] = useState<string>("");

  const timeOptions = [
    { value: "05:00", label: "5:00 AM" },
    { value: "06:00", label: "6:00 AM" },
    { value: "07:00", label: "7:00 AM" },
    { value: "08:00", label: "8:00 AM" },
  ];

  const handleConfirm = async () => {
    if (!selectedTime) {
      alert("Please select a time");
      return;
    }

    // Request notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Notification permission is required for daily reminders");
        return;
      }
    }

    onClose(selectedTime);
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">
          Set Your Daily Reminder
        </h2>

        <p className="text-sm text-neutral-600 mb-4">
          Choose a time for your daily orientation reminder (your local time).
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Reminder Time
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:border-neutral-400 focus:outline-none w-full"
              autoFocus
            >
              <option value="">Select a time...</option>
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSkip}
              className="flex-1 h-10 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Skip
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedTime}
              className="flex-1 h-10 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>

          <p className="text-xs text-neutral-500 text-center">
            This can be changed once per month
          </p>
        </div>
      </div>
    </div>
  );
}
