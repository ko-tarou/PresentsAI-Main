import { test, expect } from "@playwright/test";
import path from "node:path";
import { registerAndLogin, uniqueEmail } from "./helpers";

// Playwright runs with cwd = e2e/ (its config dir), so the fixture path resolves
// from there. Specs are transpiled to CommonJS, so import.meta is unavailable.
const SAMPLE_PPTX = path.resolve(process.cwd(), "fixtures/sample.pptx");

/**
 * Regression coverage for the PPTX import root-cause fixes (#124): importing a
 * real .pptx must produce an editable deck, open in the editor, and render its
 * objects without throwing (no image-crop / double-serialize crash, no
 * "Maximum update depth" loop).
 *
 * The deck in fixtures/sample.pptx has 2 slides with text and a shape.
 */
test.describe("PPTX import", () => {
  test("imports a .pptx, opens it in the editor, and does not crash", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);

    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    // Accept the post-import "warnings" alert if any element was skipped.
    page.on("dialog", (d) => d.accept());

    // The dashboard import button uses a hidden <input type=file accept=".pptx">.
    const fileInput = page.locator('input[type="file"][accept*=".pptx"]');
    await expect(fileInput).toHaveCount(1);
    await fileInput.setInputFiles(SAMPLE_PPTX);

    // Import parses the deck, creates a presentation, and routes to the editor.
    await page.waitForURL("**/editor/**", { timeout: 30_000 });

    // The imported deck has 2 slides — the slide panel must list both.
    const slidePanel = page.locator("aside").filter({ hasText: "スライド" }).first();
    await expect(slidePanel.locator("div.group")).toHaveCount(2, { timeout: 20_000 });

    // The editor canvas must be present (deck rendered, not a blank crash page).
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });

    // None of the root-cause crashes recurred.
    const fatal = pageErrors.filter((e) =>
      /Maximum update depth|toDataURL|crop|getContext|undefined is not/i.test(e),
    );
    expect(fatal, `unexpected page errors: ${fatal.join(" | ")}`).toHaveLength(0);

    // Still on the editor route (didn't bounce out / unmount).
    await expect(page).toHaveURL(/\/editor\//);
  });
});
