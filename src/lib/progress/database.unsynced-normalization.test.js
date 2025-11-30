import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";

import { initDB, deleteDB, saveAttempt, getUnsyncedItems } from "./database.js";
import { STORAGE_CONFIG } from "./config.js";

describe("unsynced normalization and queries", () => {
  beforeEach(async () => {
    try {
      await deleteDB();
    } catch {}
    await initDB();
  });

  it("normalizes syncedAt null to 0 on save and finds it via index", async () => {
    const userId = "user-test";
    const attempt = {
      userId,
      id: "attempt-test-1",
      itemId: "item-1",
      mood: "indicative",
      tense: "present",
      person: "yo",
      verbId: "hablar",
      correct: true,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      syncedAt: null,
    };

    await saveAttempt(attempt);

    const unsynced = await getUnsyncedItems(
      STORAGE_CONFIG.STORES.ATTEMPTS,
      userId,
    );
    expect(Array.isArray(unsynced)).toBe(true);
    expect(unsynced.length).toBe(1);
    expect(unsynced[0].id).toBe("attempt-test-1");
    expect(unsynced[0].syncedAt).toBe(0);
  });
});
