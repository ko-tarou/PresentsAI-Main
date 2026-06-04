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

    // Open the 挿入 ribbon tab and locate the insert-text button.
    await page.getByRole("button", { name: "挿入" }).click();
    const insertText = page.getByTestId("insert-text");
    await expect(insertText).toBeVisible();
    await expect(insertText).toBeEnabled({ timeout: 20_000 });

    // Add a textbox (this used to trigger "Maximum update depth exceeded").
    await insertText.click();
    await page.waitForTimeout(1500);
    await page.keyboard.press("Escape");
    await insertText.click();
    await page.waitForTimeout(1500);

    // No infinite-loop / max-depth errors.
    const maxDepth = pageErrors.filter((e) => /Maximum update depth/i.test(e));
    expect(maxDepth, "should not have Maximum update depth errors").toHaveLength(0);

    // Editor stays on the editor route (didn't crash out).
    await expect(page).toHaveURL(/\/editor\//);
  });

  test("status-bar スライド一覧 shows the slide sorter and 標準表示に戻る returns", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);
    await page.getByRole("button", { name: /新規作成|最初のプレゼン/ }).first().click();
    await page.waitForURL("**/editor/**", { timeout: 20_000 });

    // Switch to slide sorter via the status-bar view-mode button.
    await page.getByRole("button", { name: "スライド一覧" }).first().click();
    await expect(page.getByRole("button", { name: "標準表示に戻る" })).toBeVisible();

    // Return to normal editing view.
    await page.getByRole("button", { name: "標準表示に戻る" }).click();
    await expect(page.getByRole("button", { name: "標準表示に戻る" })).toHaveCount(0);
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
