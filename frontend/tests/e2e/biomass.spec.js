import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
const fixture = "../ai/results/biomass/parity.png";
async function photoStep(page) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "New feed test" })
    .click();
  await page
    .getByRole("button", { name: "Green fodder / pasture", exact: false })
    .click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("input[type=file]").setInputFiles(fixture);
  await expect(page.locator("img.feed-preview")).toBeVisible();
  await page
    .getByText("Optional pasture biomass · experimental", { exact: true })
    .click();
  await page.getByRole("checkbox", { name: /top-down pasture/ }).check();
  await page
    .getByRole("button", { name: "Estimate pasture biomass", exact: true })
    .click();
}
test("real biomass model matches Python and reloads offline with manual confirmation", async ({
  page,
  context,
}) => {
  test.skip(
    !existsSync(fixture) || !existsSync("public/models/biomass/biomass.onnx"),
    "Run biomass training/export and create parity fixture first",
  );
  test.setTimeout(120000);
  await page.goto("/");
  await page.getByRole("button", { name: "Continue", exact: false }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await photoStep(page);
  await expect(
    page.getByText(
      "Experimental biomass estimate · not used for nutrition or safety",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 60000 });
  const expected = JSON.parse(
    readFileSync("../ai/results/biomass/parity.json", "utf8"),
  ).predictions.Dry_Total_g;
  const total = page
    .locator("dl div")
    .filter({ has: page.getByText("Total dry biomass", { exact: true }) })
    .locator("dd");
  expect(Math.abs(parseFloat(await total.innerText()) - expected)).toBeLessThan(
    0.11,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/pasture-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Yes, continue" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: /Check feed/i }).click();
  await expect(page.getByText(/Feed type confirmed by farmer:/)).toBeVisible();
  await page
    .getByRole("button", { name: "Save batch test", exact: true })
    .click();
  await context.setOffline(true);
  await page.reload();
  await photoStep(page);
  await expect(
    page.getByText(
      "Experimental biomass estimate · not used for nutrition or safety",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 60000 });
});

test.describe("uncached model failure", () => {
  test.use({ serviceWorkers: "block" });
  test("missing biomass assets preserve manual feed workflow", async ({
    page,
  }) => {
    await page.route("**/models/biomass/**", (route) => route.abort());
    await page.goto("/");
    await page.getByRole("button", { name: "Continue", exact: false }).click();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "New feed test" })
      .click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.locator("input[type=file]").setInputFiles("public/icon-192.png");
    await expect(page.locator("img.feed-preview")).toBeVisible();
    await page
      .getByText("Optional pasture biomass · experimental", { exact: true })
      .click();
    await page.getByRole("checkbox", { name: /top-down pasture/ }).check();
    await page
      .getByRole("button", { name: "Estimate pasture biomass", exact: true })
      .click();
    await expect(page.getByText(/Pasture analysis is unavailable/)).toBeVisible(
      { timeout: 30000 },
    );
    await page.getByRole("button", { name: "Change feed type" }).click();
    await expect(page.getByText("Step 1 of 5")).toBeVisible();
  });
});
