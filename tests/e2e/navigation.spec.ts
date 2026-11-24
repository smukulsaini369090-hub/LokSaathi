import { test, expect } from "@playwright/test";

test.describe("LokSaathi PWA Navigation & Core Flows", () => {
  test("home page loads and shows 3 primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/योजना खोजें|Find Schemes/i)).toBeVisible();
    await expect(page.getByText(/दस्तावेज़ स्कैन|Scan Document/i)).toBeVisible();
    await expect(page.getByText(/सहेजी गई|Saved/i)).toBeVisible();
  });

  test("navigates to scheme discovery page", async ({ page }) => {
    await page.goto("/");
    await page.getByText(/योजना खोजें|Find Schemes/i).click();
    await expect(page).toHaveURL(/\/schemes/);
    await expect(page.getByRole("button", { name: /माइक|बोलें|mic/i })).toBeVisible();
  });

  test("navigates to document scanner page", async ({ page }) => {
    await page.goto("/");
    await page.getByText(/दस्तावेज़ स्कैन|Scan Document/i).click();
    await expect(page).toHaveURL(/\/document/);
    await expect(
      page.getByText(/कैमरा|फोटो|camera|photo/i).first()
    ).toBeVisible();
  });

  test("saved page loads with empty state message", async ({ page }) => {
    await page.goto("/saved");
    await expect(
      page.getByText(/सहेजी नहीं गई|No Saved Schemes/i)
    ).toBeVisible();
  });

  test("language switcher toggles language text between Hindi and English", async ({
    page,
  }) => {
    await page.goto("/");
    const langBtn = page.getByRole("button", {
      name: /भाषा बदलें|Change Language/i,
    });
    await expect(langBtn).toBeVisible();

    // Toggle to English
    await langBtn.click();
    await expect(page.getByText(/Find Schemes/i)).toBeVisible();

    // Toggle back to Hindi
    await langBtn.click();
    await expect(page.getByText(/योजना खोजें/i)).toBeVisible();
  });
});
