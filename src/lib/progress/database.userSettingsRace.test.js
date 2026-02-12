import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

import { deleteDB, getUserSettings, initDB, saveUserSettings } from "./database.js";

describe("saveUserSettings ordering guards", () => {
  beforeEach(async () => {
    try {
      await deleteDB();
    } catch {}
    await initDB();
  });

  it("ignores stale snapshots when an older lastUpdated arrives later", async () => {
    const userId = "user-race";

    await saveUserSettings(userId, {
      level: "B1",
      practiceMode: "mixed",
      lastUpdated: 2000,
    });

    await saveUserSettings(userId, {
      level: "A1",
      practiceMode: "specific",
      lastUpdated: 1000,
    });

    const persisted = await getUserSettings(userId);
    expect(persisted).toBeTruthy();
    expect(persisted.settings.level).toBe("B1");
    expect(persisted.settings.practiceMode).toBe("mixed");
    expect(persisted.settings.lastUpdated).toBe(2000);
  });

  it("applies newer snapshots normally", async () => {
    const userId = "user-race-newer";

    await saveUserSettings(userId, {
      level: "A2",
      practiceMode: "mixed",
      lastUpdated: 1000,
    });

    await saveUserSettings(userId, {
      level: "C1",
      practiceMode: "specific",
      lastUpdated: 3000,
    });

    const persisted = await getUserSettings(userId);
    expect(persisted.settings.level).toBe("C1");
    expect(persisted.settings.practiceMode).toBe("specific");
    expect(persisted.settings.lastUpdated).toBe(3000);
  });
});
