"use client";

type Props = {
  isOpen: boolean;
  onClose: (confirmed?: boolean) => void;
};

export function ReminderPromptModal({ isOpen, onClose }: Props) {
  const handleConfirm = async () => {
    // Request notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        onClose(false);
        return;
      }
    }

    onClose(true);
  };

  const handleSkip = () => {
    onClose(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">
          Daily Reminder
        </h2>

        <p className="text-sm text-neutral-600 mb-6">
          Get a quiet reminder at <strong>6:00 AM</strong> each morning to set your orientation before the day takes over.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            className="flex-1 h-10 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 h-10 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}
