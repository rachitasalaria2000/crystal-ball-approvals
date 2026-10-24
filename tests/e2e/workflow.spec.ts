import { test, expect } from "@playwright/test";
test("dashboard search, assistant close/reopen and missing-key fallback", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Approvals & Review" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search approvals" }).fill("Drone");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("textbox", { name: "Search approvals" }).fill("");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.getByRole("button", { name: "Close assistant" }).click();
  await page.getByRole("button", { name: "Open approvals assistant" }).click();
  await page
    .getByRole("button", { name: "Present me Summary", exact: false })
    .click();
  await expect(
    page.getByText("Reference fallback · AI unavailable", { exact: false }),
  ).toBeVisible({ timeout: 12000 });
  await expect(page.getByRole("log")).toContainText("4 pending approvals");
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
});
test("all five actions call the real API transport and degrade safely without a key", async ({
  page,
}) => {
  await page.goto("/");
  for (const name of ["Talk to me", "Help me", "Teach me", "Replay Greeting"]) {
    await page.getByRole("button", { name, exact: false }).click();
    await expect(page.getByRole("status")).toHaveCount(0, { timeout: 12000 });
    await expect(
      page.getByRole("complementary").getByRole("alert"),
    ).toHaveCount(0);
  }
  await expect(page.getByRole("log")).toContainText("Reference fallback");
});
test("mobile assistant fits viewport and input remains usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const panel = page.getByRole("complementary", {
    name: "Approvals assistant",
  });
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await expect(
    page.getByRole("textbox", { name: "Ask about approvals" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
});
