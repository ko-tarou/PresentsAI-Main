import { test, expect } from "@playwright/test";
import { registerAndLogin, uniqueEmail } from "./helpers";

/**
 * Core "create -> save -> reload" persistence flow. A deck created and modified
 * in the editor must survive a full page reload (data is written to the API and
 * re-hydrated), proving slides are persisted rather than held in memory only.
 */
test.describe("Persistence", () => {
  test("an added slide survives a hard reload", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);

    await page.getByRole("button", { name: /新規作成|最初のプレゼン/ }).first().click();
    await page.waitForURL("**/editor/**", { timeout: 20_000 });
    const editorUrl = page.url();

    const slidePanel = page.locator("aside").filter({ hasText: "スライド" }).first();
    const thumbnails = slidePanel.locator("div.group");
    await expect(thumbnails).toHaveCount(1);

    // Add a second slide and wait for it to register in the panel.
    await page.getByRole("button", { name: /スライドを追加/ }).click();
    await expect(thumbnails).toHaveCount(2);

    // Give the persistence write time to flush to the API before reloading.
    await page.waitForTimeout(2000);
    await page.reload();

    // After reload we must still be in the same editor (authenticated) and the
    // second slide must have been persisted, not lost.
    await expect(page).toHaveURL(editorUrl);
    const reloadedPanel = page.locator("aside").filter({ hasText: "スライド" }).first();
    await expect(reloadedPanel.locator("div.group")).toHaveCount(2, { timeout: 20_000 });
  });
});
