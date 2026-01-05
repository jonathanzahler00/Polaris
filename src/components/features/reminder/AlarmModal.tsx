"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function AlarmModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";

      // Try to go fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Fullscreen failed, that's okay
        });
      }
    } else {
      document.body.style.overflow = "";

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          // Exit fullscreen failed, that's okay
        });
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      // Exit fullscreen when closing
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }, 300);
  };

  const handleSetOrientation = () => {
    handleClose();
    router.push("/");
    router.refresh();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-neutral-900 transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-lg px-6 text-center">
        {/* Polaris logo/branding */}
        <div className="mb-8">
          <div className="text-sm font-medium tracking-wide text-neutral-400 mb-2">
            Polaris
          </div>
          <div className="text-6xl mb-4">⭐</div>
        </div>

        {/* Main message */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Time to Set Your Orientation
        </h1>

        <p className="text-lg text-neutral-300 mb-12 leading-relaxed">
          Take a moment to define how you want to show up today.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSetOrientation}
            className="w-full h-14 rounded-lg bg-white text-neutral-900 text-lg font-semibold hover:bg-neutral-100 transition-colors"
          >
            Set Today's Orientation
          </button>

          <button
            onClick={handleClose}
            className="w-full h-12 rounded-lg border-2 border-neutral-700 text-neutral-300 text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Dismiss hint */}
        <p className="mt-8 text-xs text-neutral-500">
          Press ESC or tap outside to dismiss
        </p>
      </div>
    </div>
  );
}
