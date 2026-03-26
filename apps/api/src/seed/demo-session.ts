import type { Session, SessionEvent } from "@pet-pov/db";

/**
 * Seeded demo session for reliable demo/film presentation.
 *
 * Use DEMO_SESSION_ID to identify the demo session in API routes.
 * When real Gemini extraction is ready, this module can be removed
 * and all data will come from Supabase instead.
 */

export const DEMO_SESSION_ID = "demo-biscuit-tuesday";

export const DEMO_SESSION: Session = {
  id: DEMO_SESSION_ID,
  owner_id: "demo-owner",
  pet_id: "demo-pet-goofinsmirtz",
  title: "Goofinsmirtz's Wild Tuesday",
  cloudinary_url: "",
  cloudinary_public_id: "",
  duration_seconds: 6120, // 1h 42m
  status: "complete",
  modes_run: ["recap", "ask-my-pet"],
  created_at: "2026-03-25T09:00:00Z",
  updated_at: "2026-03-25T10:42:00Z",
};

/**
 * Believable session events for a Golden Retriever's day.
 *
 * TODO: Replace with real Gemini Vision extraction output.
 *       The shape is identical — swap getMockedSessionEvents()
 *       for a Supabase fetch and everything downstream works.
 */
export const DEMO_SESSION_EVENTS: SessionEvent[] = [
  {
    timestamp_start: 0,
    timestamp_end: 45,
    description: "Dog barks loudly at the mail carrier approaching the front door",
    subjects: ["dog", "mail carrier", "front door"],
    actions: ["barking", "running to door", "tail wagging"],
    emotion: "excited",
    environment: "living room",
    confidence: 0.95,
  },
  {
    timestamp_start: 120,
    timestamp_end: 210,
    description: "Dog runs back to the window and barks at the mail carrier a second time",
    subjects: ["dog", "mail carrier", "window"],
    actions: ["barking", "jumping at window"],
    emotion: "territorial",
    environment: "living room",
    confidence: 0.92,
  },
  {
    timestamp_start: 600,
    timestamp_end: 2400,
    description: "Dog curls up on the couch and naps for an extended period",
    subjects: ["dog", "couch"],
    actions: ["sleeping", "snoring", "twitching"],
    emotion: "calm",
    environment: "living room",
    confidence: 0.98,
  },
  {
    timestamp_start: 2500,
    timestamp_end: 2700,
    description: "Dog wakes up and stretches, then drinks water from bowl",
    subjects: ["dog", "water bowl"],
    actions: ["stretching", "drinking"],
    emotion: "content",
    environment: "kitchen",
    confidence: 0.94,
  },
  {
    timestamp_start: 3000,
    timestamp_end: 3300,
    description: "Dog finds a tennis ball near the back door and carries it around",
    subjects: ["dog", "tennis ball", "back door"],
    actions: ["sniffing", "picking up ball", "carrying"],
    emotion: "curious",
    environment: "hallway",
    confidence: 0.91,
  },
  {
    timestamp_start: 3600,
    timestamp_end: 4100,
    description: "Dog repeatedly investigates a new potted plant, sniffing it from multiple angles",
    subjects: ["dog", "potted plant"],
    actions: ["sniffing", "circling", "pawing"],
    emotion: "curious",
    environment: "living room",
    confidence: 0.88,
  },
  {
    timestamp_start: 5400,
    timestamp_end: 5700,
    description: "Dog sprints laps around the backyard in a sudden burst of energy",
    subjects: ["dog", "backyard"],
    actions: ["running", "zoomies", "panting"],
    emotion: "ecstatic",
    environment: "backyard",
    confidence: 0.96,
  },
  {
    timestamp_start: 5800,
    timestamp_end: 6100,
    description: "Dog lays down on the cool tile floor, panting and resting after zoomies",
    subjects: ["dog", "tile floor"],
    actions: ["laying down", "panting", "resting"],
    emotion: "tired",
    environment: "kitchen",
    confidence: 0.93,
  },
];

/**
 * Returns mocked session events for the demo session.
 *
 * TODO: Replace this with a real Supabase fetch:
 *   const { data } = await db.from("session_events").select("events").eq("session_id", sessionId).single();
 *   return data?.events ?? [];
 */
export function getMockedSessionEvents(sessionId: string): SessionEvent[] | null {
  if (sessionId === DEMO_SESSION_ID) {
    return DEMO_SESSION_EVENTS;
  }
  return null;
}
