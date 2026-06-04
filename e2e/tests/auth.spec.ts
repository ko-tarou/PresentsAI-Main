import { test, expect } from "@playwright/test";
import { registerAndLogin, uniqueEmail, clearAuthState } from "./helpers";

test.describe("Authentication", () => {
  test("register a new account and land on dashboard", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);
    await expect(page.getByRole("heading", { name: "マイプレゼンテーション" })).toBeVisible();
  });

  test("login persists across reload (hydration)", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);
    await page.reload();
    // Must NOT bounce to /login.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "マイプレゼンテーション" })).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await clearAuthState(page);
    await page.goto("/dashboard");
    await page.waitForURL("**/login", { timeout: 20_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
