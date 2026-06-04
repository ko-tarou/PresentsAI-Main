import { test, expect } from "@playwright/test";
import { registerAndLogin, uniqueEmail } from "./helpers";

test.describe("Editor flow", () => {
  test("create presentation, add a textbox without crashing, and stay in editor", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);

    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    // Create new presentation -> navigates to editor.
    await page.getByRole("button", { name: /新規作成|最初のプレゼン/ }).first().click();
    await page.waitForURL("**/editor/**", { timeout: 20_000 });

    // Editor toolbar visible.
    await expect(page.locator('button[title="テキスト (T)"]')).toBeVisible();

    // Add a textbox (this used to trigger "Maximum update depth exceeded").
    await page.locator('button[title="テキスト (T)"]').click();
    await page.waitForTimeout(1500);
    await page.keyboard.press("Escape");
    await page.locator('button[title="テキスト (T)"]').click();
    await page.waitForTimeout(1500);

    // No infinite-loop / max-depth errors.
    const maxDepth = pageErrors.filter((e) => /Maximum update depth/i.test(e));
    expect(maxDepth, "should not have Maximum update depth errors").toHaveLength(0);

    // Editor stays on the editor route (didn't crash out).
    await expect(page).toHaveURL(/\/editor\//);
  });

  test("editor hard-refresh stays authenticated", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);
    await page.getByRole("button", { name: /新規作成|最初のプレゼン/ }).first().click();
    await page.waitForURL("**/editor/**", { timeout: 20_000 });
    const url = page.url();
    await page.reload();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(url); // Not bounced to /login.
  });
});
