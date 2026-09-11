import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { loadEnv } from "vite";
async function welcome(page) {
  const button = page.getByRole("button", { name: "Continue", exact: false });
  await button.click();
}
async function start(page, { name, existing, photo = false } = {}) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "New feed test" })
    .click();
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
  if (name) await page.getByLabel("Batch name", { exact: true }).fill(name);
  if (existing)
    await page
      .getByLabel("Add test to batch")
      .selectOption({ label: existing });
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Step 2 of 5")).toBeVisible();
  if (photo) {
    await page.locator("input[type=file]").setInputFiles("public/icon-192.png");
    await expect(page.locator("img.feed-preview")).toBeVisible();
  }
  await page.getByRole("button", { name: "Yes, continue" }).click();
  await expect(page.getByText("Step 3 of 5")).toBeVisible();
}
async function storage(page, preset = "Low indicated risk") {
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Step 4 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Step 5 of 5")).toBeVisible();
  if (preset) {
    await page
      .getByRole("combobox", { name: "Reading source", exact: true })
      .selectOption("virtual");
    await page.getByRole("button", { name: preset, exact: true }).click();
  }
}
async function save(page) {
  await page
    .getByRole("button", { name: "Save batch test", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Saved on this device", exact: true }),
  ).toBeDisabled();
}
test("guided four-card journey, three languages, offline persistence, storage twin and QR", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await welcome(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.screenshot({
    path: "test-results/desktop-home.png",
    fullPage: true,
  });
  await page.getByRole("combobox", { name: "Language" }).selectOption("ta");
  await expect(
    page.getByRole("button", {
      name: "என் தீவனத்தைச் சோதிக்கவும்",
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "Language" }).selectOption("hi");
  await expect(
    page.getByRole("button", { name: "मेरा चारा जाँचें", exact: false }),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "Language" }).selectOption("en");
  await start(page, { name: "Offline maize batch" });
  await storage(page);
  await page.getByRole("button", { name: "Check feed" }).click();
  for (const name of [
    "Nutrition quality",
    "Feed safety",
    "What should I do?",
    "Storage monitor",
  ])
    await expect(page.getByRole("region", { name, exact: true })).toBeVisible();
  await save(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("status").first()).toContainText("Offline");
  await start(page, { existing: "Offline maize batch", photo: true });
  await storage(page, "High indicated risk");
  await page.getByRole("button", { name: "Check feed" }).click();
  await expect(
    page.getByRole("region", { name: "What should I do?", exact: true }),
  ).toContainText("Do not mix");
  await save(page);
  await page.screenshot({
    path: "test-results/four-card-report.png",
    fullPage: true,
  });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My feed batches" })
    .click();
  await page.getByRole("button", { name: /Offline maize batch/ }).click();
  await expect(
    page.getByText("Score is declining.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR Feed Passport" }),
  ).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Storage monitor", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await expect(
    page.getByText("Humidity or moisture has risen.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Record a new storage check" })
    .click();
  await expect(page.getByText("Step 5 of 5")).toBeVisible();
  await context.setOffline(false);
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My feed batches" })
    .click();
  await expect(
    page.getByRole("button", { name: /Offline maize batch/ }),
  ).toContainText("2");
  expect(errors).toEqual([]);
});
test("unknown inputs stay unavailable and the report can still be saved", async ({
  page,
}) => {
  await page.goto("/");
  await welcome(page);
  await start(page, { name: "Unknown readings" });
  await storage(page, null);
  await page.getByRole("button", { name: "Check feed" }).click();
  await expect(page.locator(".result")).toContainText(
    "Not enough information to give a health score",
  );
  await expect(
    page.getByRole("region", { name: "Feed safety", exact: true }),
  ).toContainText("Not tested");
  await save(page);
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My feed batches" })
    .click();
  await page.getByRole("button", { name: /Unknown readings/ }).click();
  await expect(page.locator(".result")).toContainText(
    "Not enough information to give a health score",
  );
  await expect(
    page.getByRole("img", { name: "QR Feed Passport" }),
  ).toBeVisible();
});
test("nutrition benchmarks produce suggestions, then contamination suppresses them", async ({
  page,
}) => {
  await page.goto("/");
  await welcome(page);
  await start(page);
  await page
    .getByText("Optional lab or feed-label values", { exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "Crude protein", exact: true })
    .fill("8");
  await page
    .getByRole("spinbutton", { name: "Fiber (NDF)", exact: true })
    .fill("30");
  await page
    .getByLabel("I have ingredient targets from my nutritionist")
    .check();
  await page
    .getByLabel("Target reference / nutritionist")
    .fill("Test ingredient benchmark");
  await page.getByLabel("Protein minimum (% DM)").fill("12");
  await page.getByLabel("NDF minimum (% DM)").fill("25");
  await storage(page);
  await page.getByRole("button", { name: "Check feed" }).click();
  await page
    .getByText("What can I give with this feed?", { exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "What should I do?", exact: true }),
  ).toContainText("protein-rich ingredient");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page
    .getByRole("button", { name: "High indicated risk", exact: true })
    .click();
  await page.getByRole("button", { name: "Check feed" }).click();
  await expect(
    page.getByRole("region", { name: "What should I do?", exact: true }),
  ).toContainText("Nutrition improvement is paused");
  await expect(
    page.getByRole("region", { name: "What should I do?", exact: true }),
  ).not.toContainText("protein-rich ingredient");
});
test("laboratory estimate works offline and unsupported images are rejected", async ({
  page,
  context,
}) => {
  const [fixture] = JSON.parse(
    await readFile(
      new URL("../../../ai/evaluation/browser_parity.json", import.meta.url),
    ),
  );
  await page.goto("/");
  await welcome(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.goto("/offline-test");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "New feed test" })
    .click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.getByRole("alert")).toContainText("Choose a valid");
  await page.getByRole("button", { name: "Yes, continue" }).click();
  await storage(page);
  await page
    .getByText("Optional laboratory FQI estimate", { exact: true })
    .click();
  const controls = page.locator(".lab-panel input[type=number]");
  for (const [i, value] of Object.values(fixture.input).entries())
    await controls.nth(i).fill(String(value));
  await page.getByRole("button", { name: "Estimate FQI locally" }).click();
  await expect(page.locator(".lab-panel")).toContainText(
    `Predicted FQI: ${fixture.expected.toFixed(2)}`,
  );
  await page.getByRole("button", { name: "Check feed" }).click();
  await page.getByText("Silage condition", { exact: true }).click();
  await expect(page.locator(".result")).toContainText(
    `Predicted FQI: ${fixture.expected.toFixed(2)}`,
  );
});
test("storage denial never reports a successful save", async ({ page }) => {
  await page.addInitScript(() => {
    IDBFactory.prototype.open = function () {
      throw new DOMException("Storage disabled", "SecurityError");
    };
  });
  await page.goto("/");
  await start(page);
  await storage(page, null);
  await page.getByRole("button", { name: "Check feed" }).click();
  await page.getByRole("button", { name: "Save batch test" }).click();
  await expect(page.getByRole("alert")).toContainText("Could not save");
  await expect(
    page.getByRole("button", { name: "Saved on this device", exact: true }),
  ).toHaveCount(0);
});
test("mobile journey and local profile remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await welcome(page);
  await page.screenshot({
    path: "test-results/mobile-home.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await start(page);
  await storage(page);
  await page.getByRole("button", { name: "Check feed" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/mobile-report.png",
    fullPage: true,
  });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Local profile name" })
    .fill("Local farmer");
  await page.waitForTimeout(200);
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Local profile name" }),
  ).toHaveValue("Local farmer");
});
async function speechMock(page, voices) {
  await page.addInitScript(
    ({ voices }) => {
      window.speechCalls = [];
      window.speechUtterances = [];
      window.SpeechSynthesisUtterance = class {
        constructor(text) {
          this.text = text;
        }
      };
      Object.defineProperty(window, "speechSynthesis", {
        value: {
          getVoices: () => voices,
          addEventListener() {},
          removeEventListener() {},
          speak(u) {
            window.speechUtterances.push(u);
            window.speechCalls.push({
              action: "speak",
              text: u.text,
              lang: u.lang,
            });
          },
          cancel() {
            window.speechCalls.push({ action: "cancel" });
          },
          pause() {
            window.speechCalls.push({ action: "pause" });
          },
          resume() {
            window.speechCalls.push({ action: "resume" });
          },
        },
      });
    },
    { voices },
  );
}
test("local speech is user-triggered, supports controls, and changes language", async ({
  page,
}) => {
  await speechMock(page, [
    { lang: "en-IN", localService: true },
    { lang: "ta-IN", localService: true },
    { lang: "hi-IN", localService: true },
  ]);
  await page.goto("/");
  await welcome(page);
  await start(page);
  await storage(page);
  await page.getByRole("button", { name: "Check feed" }).click();
  expect(
    await page.evaluate(
      () => speechCalls.filter((c) => c.action === "speak").length,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Listen to report" }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Repeat report" }).click();
  await page.evaluate(() =>
    speechUtterances[0].onerror({ error: "interrupted" }),
  );
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  expect(
    await page.evaluate(
      () => speechCalls.filter((c) => c.action === "speak").length,
    ),
  ).toBe(2);
  await page.getByRole("combobox", { name: "Language" }).selectOption("ta");
  await page
    .getByRole("button", { name: "அறிக்கையைக் கேளுங்கள்", exact: false })
    .click();
  expect(
    await page.evaluate(
      () => speechCalls.filter((c) => c.action === "speak").at(-1).lang,
    ),
  ).toBe("ta-IN");
});
test("missing local voice falls back to written report without cloud speech", async ({
  page,
}) => {
  await speechMock(page, [{ lang: "en-US", localService: false }]);
  await page.goto("/");
  await welcome(page);
  await start(page);
  await storage(page);
  await page.getByRole("button", { name: "Check feed" }).click();
  await page.getByRole("button", { name: "Listen to report" }).click();
  await expect(page.locator(".speech-controls")).toContainText(
    "Voice for this language is not available",
  );
  expect(
    await page.evaluate(
      () => speechCalls.filter((c) => c.action === "speak").length,
    ),
  ).toBe(0);
});

test("configured cloud shows useful login errors and automatically uploads new online saves", async ({
  page,
}) => {
  const env = loadEnv("production", process.cwd(), "VITE_");
  test.skip(
    !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY,
    "Requires public cloud configuration; all cloud requests are mocked.",
  );
  const owner = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    email: "integration@example.test",
    aud: "authenticated",
    role: "authenticated",
  };
  let acceptLogin = false;
  const rows = new Map();
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: owner.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })).toString("base64url")}.test-signature`;
  await page.route(`${env.VITE_SUPABASE_URL.trim()}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let status = 200,
      body;
    if (path.endsWith("/token")) {
      if (!acceptLogin) {
        status = 400;
        body = {
          code: "invalid_credentials",
          error_code: "invalid_credentials",
          msg: "Invalid login credentials",
        };
      } else
        body = {
          access_token: token,
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "test-refresh",
          user: owner,
        };
    } else if (path.endsWith("/user")) body = owner;
    else if (path.endsWith("/feedsight_records")) {
      if (request.method() === "POST") {
        const row = request.postDataJSON();
        rows.set(row.id, row);
        body = { id: row.id };
      } else body = [...rows.values()];
    } else {
      status = 400;
      body = { message: "Unexpected mocked request" };
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.goto("/");
  await welcome(page);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Settings" })
    .click();
  await page.getByLabel("Email", { exact: true }).fill(owner.email);
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Email or password is incorrect",
  );
  acceptLogin = true;
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("Signed in. Enable automatic sync or sync now."),
  ).toBeVisible();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Check cloud connection", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Your account can read its cloud reports",
  );
  await start(page, { name: "Automatic sync integration fixture" });
  await storage(page);
  await page.getByRole("button", { name: "Check feed" }).click();
  await save(page);
  await expect.poll(() => rows.size).toBe(1);
  const row = [...rows.values()][0];
  expect(row.owner_id).toBe(owner.id);
  expect(row.payload.batch.name).toBe("Automatic sync integration fixture");
  await expect(
    page.getByText("Synchronization completed", { exact: true }),
  ).toBeVisible();
});

test("goals work offline, switch without another test, speak the selected goal and retain the saved goal", async ({
  page,
  context,
}) => {
  await speechMock(page, [{ lang: "en-IN", localService: true }]);
  await page.goto("/");
  await welcome(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await start(page, { name: "Goal comparison demo" });
  await page
    .getByLabel("Who is this feed for? (optional)")
    .selectOption("lactating");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Step 4 of 5")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-goal-picker.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Milk Production", exact: true })
    .click();
  await page.getByRole("button", { name: "Next" }).click();
  await page
    .getByRole("combobox", { name: "Reading source", exact: true })
    .selectOption("virtual");
  await page
    .getByRole("button", { name: "Low indicated risk", exact: true })
    .click();
  await page.getByRole("button", { name: "Check feed" }).click();
  const goal = page.getByRole("region", {
    name: "Goal suitability",
    exact: true,
  });
  await expect(goal).toContainText("Milk Production");
  await expect(goal).toContainText("Insufficient evidence");
  await goal.getByText("Change goal", { exact: true }).click();
  await goal
    .getByRole("button", { name: "Reproductive Support", exact: true })
    .click();
  await page.getByRole("button", { name: "Listen to report" }).click();
  expect(
    await page.evaluate(
      () => speechCalls.filter((c) => c.action === "speak").at(-1).text,
    ),
  ).toContain("Reproductive Support");
  await save(page);
  await goal
    .getByRole("button", { name: "Better Profitability", exact: true })
    .click();
  await expect(goal).toContainText("Comparison only");
  for (const [lang, title] of [
    ["ta", "உங்கள் நோக்கம்"],
    ["hi", "आपका लक्ष्य"],
    ["en", "Your goal"],
  ]) {
    await page.getByRole("combobox", { name: "Language" }).selectOption(lang);
    await expect(
      page.getByRole("region", { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "My feed batches" })
    .click();
  await page.getByRole("button", { name: /Goal comparison demo/ }).click();
  await expect(
    page.getByRole("region", { name: "Goal history" }),
  ).toContainText("Reproductive Support");
  await expect(
    page.getByRole("region", { name: "Goal suitability", exact: true }),
  ).toContainText("Reproductive Support");
  await page.screenshot({
    path: "test-results/goal-history.png",
    fullPage: true,
  });
});
