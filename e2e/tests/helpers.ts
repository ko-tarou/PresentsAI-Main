import { Page } from "@playwright/test";

export function uniqueEmail(): string {
  // Unique email per run. Randomness is fine in test code.
  const rand = Math.random().toString(36).slice(2, 10);
  return `e2e_${rand}@example.com`;
}

export async function registerAndLogin(
  page: Page,
  email: string,
  password = "password123",
  displayName = "E2E ユーザー"
) {
  await page.goto("/login");
  // Switch to the register tab.
  await page.getByRole("button", { name: "新規登録" }).click();
  // Display-name field only exists on the register tab.
  await page.getByPlaceholder("田中 太郎").fill(displayName);
  await page.locator("input[type=email]").fill(email);
  await page.locator("input[type=password]").fill(password);
  // Register submit button label is "アカウントを作成".
  await page.getByRole("button", { name: /アカウントを作成/ }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
}

export async function login(page: Page, email: string, password = "password123") {
  await page.goto("/login");
  await page.locator("input[type=email]").fill(email);
  await page.locator("input[type=password]").fill(password);
  // Login submit button label is "ログイン" (avoid matching the tab by scoping to a submit button).
  await page.locator('button[type=submit]').click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
}

/**
 * Auth tokens are persisted in localStorage (zustand persist, key "presentsai-auth"),
 * not cookies. To simulate an unauthenticated visitor we must clear localStorage.
 */
export async function clearAuthState(page: Page) {
  await page.goto("/login");
  await page.evaluate(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.context().clearCookies();
}
