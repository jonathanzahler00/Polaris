import { describe, it, expect } from "vitest";
import {
  getLocalDateISO,
  getLocalTimeHHmm,
  normalizeTimeToHHmm,
  daysSinceSignupInTimezone,
} from "@/lib/utils/date";

describe("date utilities", () => {
  describe("getLocalDateISO", () => {
    it("returns date in YYYY-MM-DD format", () => {
      const result = getLocalDateISO("America/New_York");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("handles different timezones", () => {
      const ny = getLocalDateISO("America/New_York");
      const tokyo = getLocalDateISO("Asia/Tokyo");
      // Both should be valid dates (might be different depending on when test runs)
      expect(ny).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tokyo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getLocalTimeHHmm", () => {
    it("returns time in HH:mm format", () => {
      const result = getLocalTimeHHmm("America/New_York");
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it("pads single digits", () => {
      const result = getLocalTimeHHmm("America/New_York");
      const [hours, minutes] = result.split(":");
      expect(hours.length).toBe(2);
      expect(minutes.length).toBe(2);
    });
  });

  describe("normalizeTimeToHHmm", () => {
    it("normalizes time without seconds", () => {
      expect(normalizeTimeToHHmm("09:30")).toBe("09:30");
      expect(normalizeTimeToHHmm("23:45")).toBe("23:45");
    });

    it("normalizes time with seconds", () => {
      expect(normalizeTimeToHHmm("09:30:00")).toBe("09:30");
      expect(normalizeTimeToHHmm("23:45:59")).toBe("23:45");
    });

    it("handles edge cases", () => {
      expect(normalizeTimeToHHmm("00:00")).toBe("00:00");
      expect(normalizeTimeToHHmm("00:00:00")).toBe("00:00");
    });
  });

  describe("daysSinceSignupInTimezone", () => {
    it("calculates days between dates", () => {
      const createdAt = "2024-01-01T12:00:00Z";
      const result = daysSinceSignupInTimezone(createdAt, "America/New_York");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("returns 0 for same day signup", () => {
      const now = new Date().toISOString();
      const result = daysSinceSignupInTimezone(now, "America/New_York");
      expect(result).toBe(0);
    });
  });
});
