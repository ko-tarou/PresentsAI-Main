import { test, expect } from "@playwright/test";
import { registerAndLogin, uniqueEmail } from "./helpers";

test.describe("Slides", () => {
  test("add a slide via the slide panel", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);
    await page.getByRole("button", { name: /新規作成|最初のプレゼン/ }).first().click();
    await page.waitForURL("**/editor/**", { timeout: 20_000 });

    // The slide panel (<aside>) lists slide thumbnails, one per ".group" wrapper.
    // Each thumbnail wrapper has class "group relative" — count those for slide count.
    const slidePanel = page.locator("aside").filter({ hasText: "スライド" }).first();
    const thumbnails = slidePanel.locator("div.group");

    // A new presentation starts with exactly one slide.
    await expect(thumbnails).toHaveCount(1);

    const addBtn = page.getByRole("button", { name: /スライドを追加/ });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // After adding, there should be exactly 2 slide thumbnails in the panel.
    await expect(thumbnails).toHaveCount(2);
  });
});
