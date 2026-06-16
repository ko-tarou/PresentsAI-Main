import { test, expect } from "@playwright/test";
import { registerAndLogin, uniqueEmail } from "./helpers";

/**
 * Export must not crash the editor. Each export path rasterizes every slide on a
 * throwaway offscreen canvas (PDF/PNG/PPTX) — a regression there would either
 * throw (surfaced as a pageerror) or hang. We trigger PDF + PNG export and
 * assert the editor stays alive with no fatal errors.
 */
test.describe("Export", () => {
  test("PDF and PNG export run without crashing the editor", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);

    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.getByRole("button", { name: /新規作成|最初のプレゼン/ }).first().click();
    await page.waitForURL("**/editor/**", { timeout: 20_000 });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });

    async function exportAs(label: RegExp) {
      await page.getByRole("button", { name: /エクスポート/ }).click();
      await page.getByRole("button", { name: label }).click();
      // The popover closes and the export runs; the button re-enables when done.
      await expect(page.getByRole("button", { name: /エクスポート/ })).toBeEnabled({
        timeout: 20_000,
      });
    }

    await exportAs(/PDF として保存/);
    await exportAs(/PNG として保存/);

    const fatal = pageErrors.filter((e) =>
      /toDataURL|getContext|undefined is not|Cannot read/i.test(e),
    );
    expect(fatal, `unexpected export errors: ${fatal.join(" | ")}`).toHaveLength(0);
    await expect(page).toHaveURL(/\/editor\//);
  });
});
