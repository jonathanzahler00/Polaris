import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: "test-user-id" } },
            error: null,
          })
        ),
      },
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { text: "test orientation" },
                error: null,
              })
            ),
          })),
        })),
      })),
    })
  ),
}));

// Mock profile functions
vi.mock("@/lib/profile", () => ({
  getProfileForUser: vi.fn(() =>
    Promise.resolve({
      user_id: "test-user-id",
      timezone: "America/New_York",
      onboarding_completed: true,
    })
  ),
}));

// Mock date functions
vi.mock("@/lib/date", () => ({
  getLocalDateISO: vi.fn(() => "2024-01-01"),
}));

describe("POST /api/today/lock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when text is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/today/lock", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("text is required");
  });

  it("returns 400 when text is too short", async () => {
    const request = new NextRequest("http://localhost:3000/api/today/lock", {
      method: "POST",
      body: JSON.stringify({ text: "" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("text must be 1-100 characters");
  });

  it("returns 400 when text is too long", async () => {
    const request = new NextRequest("http://localhost:3000/api/today/lock", {
      method: "POST",
      body: JSON.stringify({ text: "a".repeat(101) }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("text must be 1-100 characters");
  });

  it("accepts valid text", async () => {
    const request = new NextRequest("http://localhost:3000/api/today/lock", {
      method: "POST",
      body: JSON.stringify({ text: "being present during dinner" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.text).toBe("test orientation");
  });
});
