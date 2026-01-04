import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getRequiredEnv } from "@/lib/utils/env";

describe("getRequiredEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env after each test
    process.env = originalEnv;
  });

  it("returns value when environment variable exists", () => {
    process.env.TEST_VAR = "test-value";
    expect(getRequiredEnv("TEST_VAR")).toBe("test-value");
  });

  it("throws error when environment variable is missing", () => {
    delete process.env.TEST_VAR;
    expect(() => getRequiredEnv("TEST_VAR")).toThrow("Missing environment variable: TEST_VAR");
  });

  it("throws error with helpful message", () => {
    delete process.env.TEST_VAR;
    expect(() => getRequiredEnv("TEST_VAR")).toThrow("For local development");
    expect(() => getRequiredEnv("TEST_VAR")).toThrow("For Vercel deployment");
    expect(() => getRequiredEnv("TEST_VAR")).toThrow(".env.example");
  });

  it("throws error when environment variable is empty string", () => {
    process.env.TEST_VAR = "";
    expect(() => getRequiredEnv("TEST_VAR")).toThrow("Missing environment variable: TEST_VAR");
  });
});
