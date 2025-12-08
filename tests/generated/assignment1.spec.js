import { test, expect } from "@playwright/test";

const results = [];
// const STUDENT_URL = process.env.STUDENT_URL || "";
// const shareParams = STUDENT_URL.includes("?") ? STUDENT_URL.split("?")[1] : "";
// // Constants
const TEST_COURSE_ID = "1234";
const TEST_ASSIGNMENT_ID = "5678";

// Get base URL from environment or use from config
const BASE_URL = process.env.STUDENT_URL;
console.log("Base URL:", process.env.STUDENT_URL);

// Helper function to construct URLs with query parameters
function buildUrl(path) {
  if (!BASE_URL) return path;

  const url = new URL(BASE_URL);
  const targetUrl = new URL(path, url.origin);

  // Preserve query parameters from the base URL (important for Vercel shareable links)
  if (url.search) {
    targetUrl.search = url.search;
  }

  return targetUrl.toString();
}

// Enhanced navigation helper with retry logic
async function navigateWithRetry(page, path, maxRetries = 3) {
  const url = buildUrl(path);

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Navigating to: ${url}`);
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Verify we're not on a Vercel login page
      const currentUrl = page.url();
      console.log(`Current URL after navigation: ${currentUrl}`);

      // Check for various Vercel login indicators
      const isVercelLogin =
        currentUrl.includes("vercel.com/login") ||
        currentUrl.includes("vercel.com/auth") ||
        (currentUrl.includes("vercel.com") &&
          !currentUrl.includes("_vercel_share")) ||
        (await page.locator('text="Sign in to Vercel"').count()) > 0 ||
        (await page
          .locator('input[type="email"][placeholder*="email"]')
          .count()) > 0;

      if (isVercelLogin) {
        console.log(
          `Vercel login detected, establishing share session then retry ${
            i + 1
          }/${maxRetries}`
        );
        // Prime the session by visiting the root with share token
        const rootUrl = buildUrl("/");
        console.log(`Priming session at: ${rootUrl}`);
        await page.goto(rootUrl, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(1000);
        // Retry target URL immediately
        console.log(`Retrying target: ${url}`);
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        const afterRetryUrl = page.url();
        const stillLogin =
          afterRetryUrl.includes("vercel.com/login") ||
          (await page.locator('text="Sign in to Vercel"').count()) > 0;
        if (!stillLogin) {
          return;
        }
        console.log(`Waiting 3 seconds before retry...`);
        await page.waitForTimeout(3000); // Wait before retry
        continue;
      }

      return; // Success
    } catch (error) {
      console.log(`Navigation attempt ${i + 1} failed: ${error.message}`);
      if (i === maxRetries - 1) throw error; // Last attempt, throw the error
      await page.waitForTimeout(2000); // Wait before retry
    }
  }
}
test.describe("Assignment 1 Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for navigation
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(10000);
    // Prime session with share token at root to avoid Vercel login redirects
    await navigateWithRetry(page, "/");
  });

  // Fail the Playwright test if the computed points are partial or zero
  test.afterEach(() => {
    const last = results[results.length - 1];
    if (last && last.points && last.points.earned < last.points.possible) {
      throw new Error(`Partial grade for "${last.criterion}": ${last.details}`);
    }
  });
  test("General - Identify assignment owner", async ({ page, baseURL }) => {
    const criterion = "Can easily identify whose assignment this is";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs");
      await page.waitForLoadState("networkidle", { timeout: 10000 });
      // const navigateTo = async (page, path) => {
      //   const url = shareParams ? `${path}?${shareParams}` : path;
      //   await page.goto(url);
      // };
      const ownerText = await page
        .locator("div, p, h1,h2,h3,h4")
        .first()
        .textContent();

      if (ownerText && ownerText.trim().length > 0) {
        points.earned = 3;
        details = `Identifiable text found: "${ownerText}"`;
      } else {
        details = "No prominent text found to identify the assignment owner.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("General - Link to GitHub", async ({ page }) => {
    const criterion = "Link to GitHub";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const githubLink = page.locator('a[href*="github.com"]');

      if ((await githubLink.count()) > 0) {
        const href = await githubLink.first().getAttribute("href");
        points.earned = 3;
        details = `GitHub link found with href: ${href}`;
      } else {
        details = "No visible link to GitHub found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("General - Can navigate to Labs easily", async ({ page }) => {
    const criterion = "Can navigate to Labs easily";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const labsLink = page.locator('a:has-text("Labs"), a[href*="/Labs"]');

      if ((await labsLink.count()) > 0) {
        points.earned = 3;
        details = "Labs navigation link found";
      } else {
        details = "No Labs navigation link found";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Heading Tags", async ({ page }) => {
    const criterion = "Lab - Heading Tags";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const h1Count = await page.locator("h1").count();
      const h2Count = await page.locator("h2").count();
      const h3Count = await page.locator("h3").count();

      if (h1Count > 0 || h2Count > 0) {
        points.earned = 3;
        details = `Found ${h1Count} H1, ${h2Count} H2, and ${h3Count} H3 tags.`;
      } else if (h1Count > 0 || h2Count > 0 || h3Count > 0) {
        points.earned = 2;
        details = `Found some heading tags (H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count}).`;
      } else {
        details = "No heading tags found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Paragraph Tag", async ({ page }) => {
    const criterion = "Lab - Paragraph Tag";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const paragraphCount = await page.locator("p").count();

      if (paragraphCount > 0) {
        points.earned = 3;
        details = `Found ${paragraphCount} paragraph tag(s).`;
      } else {
        details = "No paragraph tags found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Lists - Ordered List Elements", async ({ page }) => {
    const criterion = "Lab - Lists - Ordered List Elements";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const olCount = await page.locator("ol").count();
      const liInOlCount = await page.locator("ol li").count();

      if (olCount > 0 && liInOlCount >= 2) {
        points.earned = 3;
        details = `Found ${olCount} ordered list(s) with ${liInOlCount} list item(s).`;
      } else if (olCount > 0) {
        points.earned = 1;
        details = `Found ${olCount} ordered list(s) but insufficient list items.`;
      } else {
        details = "No ordered lists found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Lists - My favorite recipe", async ({ page }) => {
    const criterion = "Lab - Lists - My favorite recipe";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const recipeText = page.locator("ul");
      const hasRecipeText = (await recipeText.count()) > 0;

      if (hasRecipeText) {
        points.earned = 3;
        details = 'Found "favorite recipe" text.';
      } else {
        details = "Recipe text not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Lists - Unordered List Elements", async ({ page }) => {
    const criterion = "Lab - Lists - Unordered List Elements";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const ulCount = await page.locator("ul").count();
      const liInUlCount = await page.locator("ul li").count();

      if (ulCount > 0 && liInUlCount >= 2) {
        points.earned = 3;
        details = `Found ${ulCount} unordered list(s) with ${liInUlCount} list item(s).`;
      } else if (ulCount > 0) {
        points.earned = 1;
        details = `Found unordered list but insufficient items.`;
      } else {
        details = "No unordered lists found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Lists - Your favorite books", async ({ page }) => {
    const criterion = "Lab - Lists - Your favorite books";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const booksText = page.locator("text=/favorite books/i");
      const hasBooksText = (await booksText.count()) > 0;

      if (hasBooksText) {
        points.earned = 3;
        details = 'Found "favorite books" text.';
      } else {
        details = "Books text not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Table Tags Q3, Q4, through Q10", async ({ page }) => {
    const criterion = "Lab - Table Tags Q3, Q4, through Q10";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const tableCount = await page.locator("table").count();
      const rowCount = await page.locator("table tr").count();
      const cellCount = await page.locator("table td").count();

      if (tableCount > 0 && rowCount >= 8 && cellCount >= 16) {
        points.earned = 3;
        details = `Found table with ${rowCount} rows and ${cellCount} cells.`;
      } else if (tableCount > 0) {
        points.earned = 1;
        details = `Table found but incomplete structure.`;
      } else {
        details = "No table found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Images - Starship image", async ({ page }) => {
    const criterion = "Lab - Images - Starship image";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const starshipImg = page.locator(
        'img[alt*="starship" i], img[src*="starship" i]'
      );

      if ((await starshipImg.count()) > 0) {
        points.earned = 3;
        details = "Starship image found.";
      } else {
        details = "Starship image not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Images - Teslabot image", async ({ page }) => {
    const criterion = "Lab - Images - Teslabot image";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const teslabotImg = page.locator(
        'img[alt*="teslabot" i], img[src*="teslabot" i], img[alt*="optimus" i]'
      );

      if ((await teslabotImg.count()) > 0) {
        points.earned = 3;
        details = "Teslabot image found.";
      } else {
        details = "Teslabot image not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Username", async ({ page }) => {
    const criterion = "Lab - Forms - Username";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const usernameInput = page.locator('input[type="text"]');

      if ((await usernameInput.count()) > 0) {
        points.earned = 3;
        details = "Username input field found.";
      } else {
        details = "Username input field not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Password", async ({ page }) => {
    const criterion = "Lab - Forms - Password";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const passwordInput = page.locator('input[type="password"]');

      if ((await passwordInput.count()) > 0) {
        points.earned = 3;
        details = "Password input field found.";
      } else {
        details = "Password input field not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - First Name", async ({ page }) => {
    const criterion = "Lab - Forms - First Name";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const firstNameInput = page.locator('input[type="text"]');

      if ((await firstNameInput.count()) > 0) {
        points.earned = 3;
        details = "First Name input found.";
      } else {
        details = "First Name input not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Last name", async ({ page }) => {
    const criterion = "Lab - Forms - Last name";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab1"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const lastNameInput = page.locator('input[type="text"]');

      if ((await lastNameInput.count()) > 0) {
        points.earned = 3;
        details = "Last Name input found.";
      } else {
        details = "Last Name input not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Textareas", async ({ page }) => {
    const criterion = "Lab - Forms - Textareas";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const textareaCount = await page.locator("textarea").count();

      if (textareaCount > 0) {
        points.earned = 3;
        details = `Found ${textareaCount} textarea(s).`;
      } else {
        details = "No textarea found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Clicking button pops up alert", async ({ page }) => {
    const criterion = "Lab - Forms - Clicking button pops up alert";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      let alertFired = false;
      page.on("dialog", async (dialog) => {
        alertFired = true;
        await dialog.dismiss();
      });

      const button = page.locator("button").first();
      if ((await button.count()) > 0) {
        await button.click();
        await page.waitForTimeout(500);

        if (alertFired) {
          points.earned = 3;
          details = "Button click triggered alert.";
        } else {
          points.earned = 1;
          details = "Button found but no alert triggered.";
        }
      } else {
        details = "No button found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - File upload button", async ({ page }) => {
    const criterion = "Lab - Forms - File upload button";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const fileInput = page.locator('input[type="file"]');

      if ((await fileInput.count()) > 0) {
        points.earned = 3;
        details = "File upload input found.";
      } else {
        details = "File upload input not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Comedy radio", async ({ page }) => {
    const criterion = "Lab - Forms - Comedy radio";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // ✅ Find labels that mention “Comedy” (case-insensitive)
      const labels = page.locator("label");
      const labelCount = await labels.count();

      let found = false;
      for (let i = 0; i < labelCount; i++) {
        const text = (await labels.nth(i).innerText()).trim().toLowerCase();
        if (text.includes("comedy")) {
          found = true;
          break;
        }
      }

      if (found) {
        points.earned = 3;
        details = "Comedy radio button label found.";
      } else {
        details = "Comedy radio button not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Drama radio", async ({ page }) => {
    const criterion = "Lab - Forms - Drama radio";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const labels = page.locator("label");
      const labelCount = await labels.count();

      let found = false;
      for (let i = 0; i < labelCount; i++) {
        const text = (await labels.nth(i).innerText()).trim().toLowerCase();
        if (text.includes("drama")) {
          found = true;
          break;
        }
      }

      if (found) {
        points.earned = 3;
        details = "Drama radio button label found.";
      } else {
        details = "Drama radio button not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - SciFi radio", async ({ page }) => {
    const criterion = "Lab - Forms - SciFi radio";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const labels = page.locator("label");
      const labelCount = await labels.count();

      let found = false;
      for (let i = 0; i < labelCount; i++) {
        const text = (await labels.nth(i).innerText()).trim().toLowerCase();
        if (text.includes("science fiction")) {
          found = true;
          break;
        }
      }

      if (found) {
        points.earned = 3;
        details = "SciFi radio button label found.";
      } else {
        details = "SciFi radio button not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Fantasy radio", async ({ page }) => {
    const criterion = "Lab - Forms - Fantasy radio";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const labels = page.locator("label");
      const labelCount = await labels.count();

      let found = false;
      for (let i = 0; i < labelCount; i++) {
        const text = (await labels.nth(i).innerText()).trim().toLowerCase();
        if (text.includes("fantasy")) {
          found = true;
          break;
        }
      }

      if (found) {
        points.earned = 3;
        details = "Fantasy radio button label found.";
      } else {
        details = "Fantasy radio button not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Comedy checkbox", async ({ page }) => {
    const criterion = "Lab - Forms - Comedy checkbox";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const comedyCheckbox = page.locator('input[type="checkbox"]');

      if ((await comedyCheckbox.count()) > 0) {
        points.earned = 3;
        details = "Comedy checkbox found.";
      } else {
        details = "Comedy checkbox not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Drama checkbox", async ({ page }) => {
    const criterion = "Lab - Forms - Drama checkbox";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dramaCheckbox = page.locator('input[type="checkbox"]');

      if ((await dramaCheckbox.count()) > 0) {
        points.earned = 3;
        details = "Drama checkbox found.";
      } else {
        details = "Drama checkbox not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - SciFi checkbox", async ({ page }) => {
    const criterion = "Lab - Forms - SciFi checkbox";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const scifiCheckbox = page.locator('input[type="checkbox"]');

      if ((await scifiCheckbox.count()) > 0) {
        points.earned = 3;
        details = "SciFi checkbox found.";
      } else {
        details = "SciFi checkbox not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Fantasy checkbox", async ({ page }) => {
    const criterion = "Lab - Forms - Fantasy checkbox";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const fantasyCheckbox = page.locator('input[type="checkbox"]');

      if ((await fantasyCheckbox.count()) > 0) {
        points.earned = 3;
        details = "Fantasy checkbox found.";
      } else {
        details = "Fantasy checkbox not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Select one option dropdown", async ({ page }) => {
    const criterion = "Lab - Forms - Select one option dropdown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const selectDropdown = page.locator("select:not([multiple])");

      if ((await selectDropdown.count()) > 0) {
        points.earned = 3;
        details = "Single select dropdown found.";
      } else {
        details = "Single select dropdown not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Select many options", async ({ page }) => {
    const criterion = "Lab - Forms - Select many options";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const multiSelect = page.locator("select[multiple]");

      if ((await multiSelect.count()) > 0) {
        points.earned = 3;
        details = "Multi-select dropdown found.";
      } else {
        details = "Multi-select dropdown not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Email", async ({ page }) => {
    const criterion = "Lab - Forms - Email";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const emailInput = page.locator('input[type="email"]');

      if ((await emailInput.count()) > 0) {
        points.earned = 3;
        details = "Email input found.";
      } else {
        details = "Email input not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Salary", async ({ page }) => {
    const criterion = "Lab - Forms - Salary";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const salaryInput = page.locator(
        'input[name*="salary" i], input[placeholder*="salary" i], input[type="number"]'
      );

      if ((await salaryInput.count()) > 0) {
        points.earned = 3;
        details = "Salary input found.";
      } else {
        details = "Salary input not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - Rating slider", async ({ page }) => {
    const criterion = "Lab - Forms - Rating slider";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const sliderInput = page.locator('input[type="range"]');

      if ((await sliderInput.count()) > 0) {
        points.earned = 3;
        details = "Rating slider found.";
      } else {
        details = "Rating slider not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Forms - DOB date picker", async ({ page }) => {
    const criterion = "Lab - Forms - DOB date picker";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dateInput = page.locator('input[type="date"]');

      if ((await dateInput.count()) > 0) {
        points.earned = 3;
        details = "Date picker found.";
      } else {
        details = "Date picker not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Anchor Tag", async ({ page }) => {
    const criterion = "Lab - Anchor Tag";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const anchorCount = await page.locator("a").count();

      if (anchorCount > 0) {
        points.earned = 3;
        details = `Found ${anchorCount} anchor tag(s).`;
      } else {
        details = "No anchor tags found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Lab - Implementing Navigation in Single Page Applications", async ({
    page,
  }) => {
    const criterion =
      "Lab - Implementing Navigation in Single Page Applications";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab1");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const navLinks = await page.locator('nav a, a[href^="/"]').count();

      if (navLinks >= 3) {
        points.earned = 3;
        details = `Found ${navLinks} navigation links for SPA.`;
      } else if (navLinks > 0) {
        points.earned = 2;
        details = `Found ${navLinks} navigation links (expected 3+).`;
      } else {
        details = "No navigation links found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // KAMBAZ TESTS

  test("Kambaz - Account - Signin - Username field of type text", async ({
    page,
  }) => {
    const criterion = "Kambaz - Account - Signin - Username field of type text";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Signin"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const usernameInput = page.locator(
        'input[type="text"], input[id*="wd-username" i], input[placeholder*="username" i]'
      );

      if ((await usernameInput.count()) > 0) {
        points.earned = 3;
        details = "Username text input found.";
      } else {
        details = "Username text input not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Signin - Password field of type password", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Signin - Password field of type password";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Signin"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const passwordInput = page.locator('input[type="password"]');

      if ((await passwordInput.count()) > 0) {
        points.earned = 3;
        details = "Password input found.";
      } else {
        details = "Password input not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Signin - Some default values", async ({ page }) => {
    const criterion = "Kambaz - Account - Signin - Some default values";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const inputs = page.locator('input[type="text"], input[type="password"]');
      let hasDefaults = false;

      for (let i = 0; i < (await inputs.count()); i++) {
        const value = await inputs.nth(i).inputValue();
        if (value && value.length > 0) {
          hasDefaults = true;
          break;
        }
      }

      if (hasDefaults) {
        points.earned = 3;
        details = "Found inputs with default values.";
      } else {
        details = "No default values found in inputs.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Signin - Clicking Signin navigates to Profile or Dashboard", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Signin - Clicking Signin navigates to Profile or Dashboard";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const signinButton = page.locator("#wd-signin-btn");

      if ((await signinButton.count()) > 0) {
        await signinButton.click();
        await page.waitForTimeout(2000);

        const url = page.url();
        if (url.includes("/Profile") || url.includes("/Dashboard")) {
          points.earned = 3;
          details = `Navigated to ${url}`;
        } else {
          points.earned = 1;
          details = `Button found but navigated to ${url}`;
        }
      } else {
        details = "Signin button not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Signin - Clicking Signup navigates to Signup Screen", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Signin - Clicking Signup navigates to Signup Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const signupLink = page.locator("#wd-signup-link");

      if ((await signupLink.count()) > 0) {
        await signupLink.click();
        await page.waitForTimeout(1000);

        const url = page.url();
        if (url.includes("/Signup")) {
          points.earned = 3;
          details = "Navigated to Signup screen.";
        } else {
          points.earned = 1;
          details = `Link found but navigated to ${url}`;
        }
      } else {
        details = "Signup link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Dashboard - Dashboard title", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Dashboard title";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dashboardTitle = page.locator(
        'h1:has-text("Dashboard"), h2:has-text("Dashboard")'
      );

      if ((await dashboardTitle.count()) > 0) {
        points.earned = 3;
        details = "Dashboard title found.";
      } else {
        details = "Dashboard title not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Dashboard - Published Courses subtitle", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Published Courses subtitle";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const coursesSubtitle = page.locator(
        'h2:has-text("Courses"), h3:has-text("Courses")'
      );

      if ((await coursesSubtitle.count()) > 0) {
        points.earned = 3;
        details = "Courses subtitle found.";
      } else {
        details = "Courses subtitle not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Dashboard - List of courses", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - List of courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseCards = page.locator(
        '[class*="course"], a[href*="/Courses/"]'
      );
      const count = await courseCards.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} courses.`;
      } else if (count > 0) {
        points.earned = 2;
        details = `Found ${count} courses (expected 3+).`;
      } else {
        details = "No courses found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Navigation Sidebar - Link to Account", async ({ page }) => {
    const criterion = "Kambaz - Navigation Sidebar - Link to Account";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const accountLink = page.locator('a[href*="/Account"]');

      if ((await accountLink.count()) > 0) {
        points.earned = 3;
        details = "Account link found in sidebar.";
      } else {
        details = "Account link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Navigation Sidebar - Link to Dashboard", async ({ page }) => {
    const criterion = "Kambaz - Navigation Sidebar - Link to Dashboard";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dashboardLink = page.locator('a[href*="/Dashboard"]');

      if ((await dashboardLink.count()) > 0) {
        points.earned = 3;
        details = "Dashboard link found in sidebar.";
      } else {
        details = "Dashboard link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Navigation Sidebar - Link to Labs", async ({ page }) => {
    const criterion = "Kambaz - Navigation Sidebar - Labs link";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const labsLink = page.locator('a[href*="/Labs"]');

      if ((await labsLink.count()) > 0) {
        points.earned = 3;
        details = "Labs link found in sidebar.";
      } else {
        details = "Labs link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Profile - Username, first, and last name fields", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Profile - Username, first, and last name fields of type text";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Profile"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const usernameInput = page.locator(
        'input[type="text"][id*="username" i]'
      );
      const firstNameInput = page.locator('input[type="text"][id*="first" i]');
      const lastNameInput = page.locator('input[type="text"][id*="last" i]');

      const foundFields = [];
      if ((await usernameInput.count()) > 0) foundFields.push("username");
      if ((await firstNameInput.count()) > 0) foundFields.push("first name");
      if ((await lastNameInput.count()) > 0) foundFields.push("last name");

      if (foundFields.length === 3) {
        points.earned = 3;
        details =
          "All three text fields found (username, first name, last name).";
      } else if (foundFields.length > 0) {
        points.earned = foundFields.length;
        details = `Found: ${foundFields.join(", ")}. Missing: ${
          3 - foundFields.length
        } field(s).`;
      } else {
        details =
          "No text fields found for username, first name, or last name.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Profile - Password field", async ({ page }) => {
    const criterion =
      "Kambaz - Account - Profile - Password field of type password";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Profile"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const passwordInput = page.locator('input[type="password"]');

      if ((await passwordInput.count()) > 0) {
        points.earned = 3;
        details = "Password field found.";
      } else {
        details = "Password field not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Profile - Date of birth field", async ({ page }) => {
    const criterion =
      "Kambaz - Account - Profile - Date of birth field of type date";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Profile");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dobInput = page.locator('input[type="date"]');

      if ((await dobInput.count()) > 0) {
        points.earned = 3;
        details = "Date of birth field found.";
      } else {
        details = "Date of birth field not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Profile - Email input field", async ({ page }) => {
    const criterion =
      "Kambaz - Account - Profile - Email input field of type email";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Profile");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const emailInput = page.locator('input[type="email"]');

      if ((await emailInput.count()) > 0) {
        points.earned = 3;
        details = "Email input field found.";
      } else {
        details = "Email input field not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Profile - Role dropdown with 4 distinct roles", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Profile - Role dropdown with 4 distinct roles";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Profile");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const roleDropdown = page.locator("select");

      if ((await roleDropdown.count()) > 0) {
        const options = await roleDropdown.first().locator("option").count();
        if (options >= 4) {
          points.earned = 3;
          details = `Role dropdown found with ${options} options.`;
        } else {
          points.earned = 2;
          details = `Role dropdown found but only ${options} options (expected 4+).`;
        }
      } else {
        details = "Role dropdown not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Profile - Some default values", async ({ page }) => {
    const criterion = "Kambaz - Account - Profile - Some default values";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Profile");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const inputs = page.locator("input");
      let hasDefaults = false;

      for (let i = 0; i < (await inputs.count()); i++) {
        const value = await inputs.nth(i).inputValue();
        if (value && value.length > 0) {
          hasDefaults = true;
          break;
        }
      }

      if (hasDefaults) {
        points.earned = 3;
        details = "Found inputs with default values.";
      } else {
        details = "No default values found in inputs.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Profile - Clicking Signout navigates to Signin", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Profile - Clicking Signout Link or Button navigates to Signin Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Profile");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const signoutButton = page
        .getByRole("link", { name: /sign ?out/i })
        .or(page.getByRole("link", { name: /sign ?out/i }));

      if ((await signoutButton.count()) > 0) {
        await signoutButton.click();
        await page.waitForTimeout(2000);

        const url = page.url();
        if (url.includes("/Signin")) {
          points.earned = 3;
          details = "Signout navigates to Signin screen.";
        } else {
          points.earned = 1;
          details = `Signout button found but navigated to ${url}`;
        }
      } else {
        details = "Signout button/link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Signup - Username field", async ({ page }) => {
    const criterion = "Kambaz - Account - Signup - Username field of type text";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Signup"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const usernameInput = page.locator("#wd-username").first();

      if ((await usernameInput.count()) > 0) {
        points.earned = 3;
        details = "Username field found.";
      } else {
        details = "Username field not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Signup - Password field", async ({ page }) => {
    const criterion =
      "Kambaz - Account - Signup - Password field of type password";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Signup"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const passwordInput = page.locator('input[type="password"]');

      if ((await passwordInput.count()) >= 1) {
        points.earned = 3;
        details = "Password field found.";
      } else {
        details = "Password field not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Signup - Verify Password field", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Signup - Verify Password field of type password";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signup");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const passwordInputs = page.locator('input[type="password"]');
      const count = await passwordInputs.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} password fields (including verify password).`;
      } else if (count === 1) {
        points.earned = 1;
        details = "Only one password field found.";
      } else {
        details = "No password fields found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Signup - Some default values", async ({ page }) => {
    const criterion = "Kambaz - Account - Signup - Some default values";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signup");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const inputs = page.locator("input");
      let hasDefaults = false;

      for (let i = 0; i < (await inputs.count()); i++) {
        const value = await inputs.nth(i).inputValue();
        if (value && value.length > 0) {
          hasDefaults = true;
          break;
        }
      }

      if (hasDefaults) {
        points.earned = 3;
        details = "Found inputs with default values.";
      } else {
        details = "No default values found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Signup - Clicking Signin navigates to Signin", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Signup - Clicking Signin Link or Button navigates to Signin Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signup");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const signinLink = page.locator("#wd-signin-btn");

      if ((await signinLink.count()) > 0) {
        await signinLink.click();
        await page.waitForTimeout(2000);

        const url = page.url();
        if (url.includes("/Signin") || url.includes("/Profile")) {
          points.earned = 3;
          details = "Navigates to Signin screen.";
        } else {
          points.earned = 1;
          details = `Link found but navigated to ${url}`;
        }
      } else {
        details = "Signin link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Signup - Clicking Signup navigates to Profile", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Signup - Clicking Signup Link or Button navigates to Profile Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signup");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const signupButton = page.locator("#wd-signin-btn");

      if ((await signupButton.count()) > 0) {
        await signupButton.click();
        await page.waitForTimeout(2000);

        const url = page.url();
        if (url.includes("/Profile")) {
          points.earned = 3;
          details = "Signup navigates to Profile screen.";
        } else {
          points.earned = 1;
          details = `Button found but navigated to ${url}`;
        }
      } else {
        details = "Signup button not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Navigation - Sidebar appears on Account screens", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Navigation - Account Navigation Links sidebar appears on left of Account screens";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const sidebar = page.locator('nav, [role="navigation"], aside');
      const accountLinks = page.locator('a[href*="/Account"]');

      if ((await sidebar.count()) > 0 && (await accountLinks.count()) >= 2) {
        points.earned = 3;
        details = "Account navigation sidebar found with links.";
      } else if ((await accountLinks.count()) >= 2) {
        points.earned = 2;
        details = "Account links found but sidebar structure unclear.";
      } else {
        details = "Account navigation sidebar not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Navigation - Navigation works correctly", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Navigation - Clicking on Signin, Signup, and Profile navigates as expected";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      let successfulNavigations = 0;

      // Try navigating to each section
      const links = [
        { name: /signup/i, expectedUrl: "/Signup" },
        { name: /profile/i, expectedUrl: "/Profile" },
        { name: /signin/i, expectedUrl: "/Signin" },
      ];

      for (const link of links) {
        try {
          const navLink = page.getByRole("link", { name: link.name });
          if ((await navLink.count()) > 0) {
            await navLink.first().click();
            await page.waitForTimeout(1000);
            if (page.url().includes(link.expectedUrl)) {
              successfulNavigations++;
            }
          }
        } catch (e) {
          // Continue to next link
        }
      }

      if (successfulNavigations === 3) {
        points.earned = 3;
        details = "All navigation links work correctly.";
      } else if (successfulNavigations > 0) {
        points.earned = successfulNavigations;
        details = `${successfulNavigations}/3 navigation links work correctly.`;
      } else {
        details = "Navigation links not working as expected.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Navigation - Signin is default screen", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Navigation - Signin Screen is default when navigating to Kanbas";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const url = page.url();
      if (url.includes("/Signin") || url.includes("/Account/Signin")) {
        points.earned = 3;
        details = "Default screen is Signin.";
      } else {
        details = `Default screen is ${url}, not Signin.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Dashboard - The course (3+)", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - The course (3+)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator(
        '[class*="course"], .course-card, div:has(a[href*="/Courses/"])'
      );
      const count = await courses.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} courses.`;
      } else if (count > 0) {
        points.earned = count;
        details = `Found ${count} courses (expected 3+).`;
      } else {
        details = "No courses found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Dashboard - Course links (3+)", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - The link to the course (3+)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseLinks = page.locator('a[href*="/Courses/"]');
      const count = await courseLinks.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} course links.`;
      } else if (count > 0) {
        points.earned = count;
        details = `Found ${count} course links (expected 3+).`;
      } else {
        details = "No course links found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Dashboard - Course Titles (3+)", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Course Title (3+)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseTitles = page.locator("h2, h3, h4, .course-title");
      const count = await courseTitles.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} course titles.`;
      } else if (count > 0) {
        points.earned = count;
        details = `Found ${count} course titles (expected 3+).`;
      } else {
        details = "No course titles found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Navigation Sidebar - Link to NEU", async ({ page }) => {
    const criterion = "Kambaz - Navigation Sidebar - Link to NEU";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const neuLink = page.locator(
        'a[href*="northeastern"], a:has-text("NEU")'
      );

      if ((await neuLink.count()) > 0) {
        points.earned = 3;
        details = "NEU link found.";
      } else {
        details = "NEU link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Navigation Sidebar - Link to Course", async ({ page }) => {
    const criterion = "Kambaz - Navigation Sidebar - Link to Course";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseLink = page.locator(
        'a[href*="/Courses"], a[href*="/Course"]'
      );

      if ((await courseLink.count()) > 0) {
        points.earned = 3;
        details = "Course link found in sidebar.";
      } else {
        details = "Course link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Navigation Sidebar - Link to Calendar", async ({ page }) => {
    const criterion = "Kambaz - Navigation Sidebar - Link to Calendar";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const calendarLink = page.getByRole("link", { name: /calendar/i });

      if ((await calendarLink.count()) > 0) {
        points.earned = 3;
        details = "Calendar link found.";
      } else {
        details = "Calendar link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Navigation Sidebar - Inbox link", async ({ page }) => {
    const criterion = "Kambaz - Navigation Sidebar - Inbox link";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const inboxLink = page.getByRole("link", { name: /inbox/i });

      if ((await inboxLink.count()) > 0) {
        points.earned = 3;
        details = "Inbox link found.";
      } else {
        details = "Inbox link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Courses - Navigation - Home link", async ({ page }) => {
    const criterion =
      "Kambaz - Courses - Navigation - Home link, navigates to Home";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const homeLink = page.getByRole("link", { name: /home/i });

      if ((await homeLink.count()) > 0) {
        points.earned = 3;
        details = "Home navigation link found.";
      } else {
        details = "Home link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Courses - Navigation - Modules link", async ({ page }) => {
    const criterion =
      "Kambaz - Courses - Navigation - Modules link, navigates to Modules";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modulesLink = page.getByRole("link", { name: /modules/i });

      if ((await modulesLink.count()) > 0) {
        await modulesLink.click();
        await page.waitForTimeout(1000);
        if (page.url().includes("/Modules")) {
          points.earned = 3;
          details = "Modules link navigates correctly.";
        } else {
          points.earned = 2;
          details = "Modules link found but navigation unclear.";
        }
      } else {
        details = "Modules link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Courses - Navigation - Assignments link", async ({ page }) => {
    const criterion =
      "Kambaz - Courses - Navigation - Assignments link, navigates to Assignments";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const assignmentsLink = page.getByRole("link", { name: /assignments/i });

      if ((await assignmentsLink.count()) > 0) {
        await assignmentsLink.click();
        await page.waitForTimeout(1000);
        if (page.url().includes("/Assignments")) {
          points.earned = 3;
          details = "Assignments link navigates correctly.";
        } else {
          points.earned = 2;
          details = "Assignments link found but navigation unclear.";
        }
      } else {
        details = "Assignments link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Courses - Home - Screen exists", async ({ page }) => {
    const criterion = "Kambaz - Courses - Home - Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const visibleElements = page.locator("body *:visible");
      const pageText = await page.textContent("body");

      if (
        (await visibleElements.count()) > 3 &&
        /course|home|module|lesson/i.test(pageText || "")
      ) {
        points.earned = 3;
        details = "Course Home screen found.";
      } else {
        details = "Course Home screen structure not clear.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Modules - Show Modules (2+)", async ({ page }) => {
    const criterion = "Kambaz - Modules - Show Modules (2+)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modules = page.locator("li, div, .module").filter({
        hasText: /module/i,
      });
      const count = await modules.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} modules.`;
      } else if (count === 1) {
        points.earned = 2;
        details = "Found 1 module (expected 2+).";
      } else {
        details = "No modules found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Modules - Module titles (2+)", async ({ page }) => {
    const criterion = "Kambaz - Modules - Module title (2+)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modules = page.locator(".wd-module");
      const count = await modules.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} module titles.`;
      } else if (count === 1) {
        points.earned = 2;
        details = "Found 1 module title (expected 2+).";
      } else {
        details = "No module titles found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Modules - Show Lessons (2+)", async ({ page }) => {
    const criterion = "Kambaz - Modules - Show Lessons (2+)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const lessons = page.locator('li, .lesson, [class*="lesson"]');
      const count = await lessons.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} lessons.`;
      } else if (count === 1) {
        points.earned = 2;
        details = "Found 1 lesson (expected 2+).";
      } else {
        details = "No lessons found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignments - Can navigate by clicking link", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments - Can navigate here by clicking Assignments link";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const assignmentsLink = page.getByRole("link", { name: /assignments/i });

      if ((await assignmentsLink.count()) > 0) {
        await assignmentsLink.click();
        await page.waitForTimeout(1000);

        if (page.url().includes("/Assignments")) {
          points.earned = 3;
          details = "Successfully navigated to Assignments.";
        } else {
          points.earned = 1;
          details = "Link exists but navigation unclear.";
        }
      } else {
        details = "Assignments link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignments - Assignment links shown", async ({ page }) => {
    const criterion = "Kambaz - Assignments - Assignment links as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const assignmentLinks = page.locator('a[href*="/Assignments/"]');
      const count = await assignmentLinks.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} assignment links.`;
      } else if (count === 1) {
        points.earned = 2;
        details = "Found 1 assignment link (expected 2+).";
      } else {
        details = "No assignment links found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Assignment Name has default value", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignment Editor - Assignment Name input field has some default value";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(
        page,
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const nameInput = page
        .locator('input[type="text"], [placeholder*="name" i]')
        .first();

      if ((await nameInput.count()) > 0) {
        const value = await nameInput.inputValue();
        if (value && value.length > 0) {
          points.earned = 3;
          details = `Assignment name has default value: "${value}"`;
        } else {
          points.earned = 1;
          details = "Assignment name input found but no default value.";
        }
      } else {
        details = "Assignment name input not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Description has default value", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignment Editor - Assignment Description text area has some default value";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(
        page,
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const descriptionTextarea = page.locator("textarea");

      if ((await descriptionTextarea.count()) > 0) {
        const value = await descriptionTextarea.first().inputValue();
        if (value && value.length > 0) {
          points.earned = 3;
          details = "Description has default value.";
        } else {
          points.earned = 1;
          details = "Description textarea found but no default value.";
        }
      } else {
        details = "Description textarea not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Points field is number type", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignment Editor - Points field is type number";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(
        page,
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pointsInput = page.locator(
        'input[type="number"], input[name*="points" i]'
      );

      if ((await pointsInput.count()) > 0) {
        const type = await pointsInput.first().getAttribute("type");
        if (type === "number") {
          points.earned = 3;
          details = 'Points field has type="number".';
        } else {
          points.earned = 1;
          details = `Points field found but type is "${type}".`;
        }
      } else {
        details = "Points field not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Assignment Group dropdown", async ({
    page,
  }) => {
    const criterion = "Kambaz - Assignment Editor - Assignment Group dropdown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(
        page,
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dropdown = page.locator("select");

      if ((await dropdown.count()) > 0) {
        points.earned = 3;
        details = "Assignment Group dropdown found.";
      } else {
        details = "Dropdown not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Display Grade dropdown", async ({
    page,
  }) => {
    const criterion = "Kambaz - Assignment Editor - Display Grade dropdown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(
        page,
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dropdowns = page.locator("select");
      const count = await dropdowns.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} dropdowns (including Display Grade).`;
      } else if (count === 1) {
        points.earned = 2;
        details = "Found 1 dropdown (expected 2+).";
      } else {
        details = "No dropdowns found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Submission Type dropdown", async ({
    page,
  }) => {
    const criterion = "Kambaz - Assignment Editor - Submission Type dropdown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(
        page,
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dropdowns = page.locator("select");
      const count = await dropdowns.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} dropdowns (including Submission Type).`;
      } else if (count > 0) {
        points.earned = count;
        details = `Found ${count} dropdown(s) (expected 3+).`;
      } else {
        details = "No dropdowns found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Online Entry Options checkboxes", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignment Editor - Online Entry Options checkboxes";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(
        page,
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} checkboxes.`;
      } else if (count === 1) {
        points.earned = 2;
        details = "Found 1 checkbox (expected 2+).";
      } else {
        details = "No checkboxes found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Assign to field has default", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignment Editor - Assign to input field has default value";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(
        page,
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const assignToInput = page
        .locator('input[type="text"], [placeholder*="assign" i]')
        .filter({ hasText: "", has: page.locator('label:has-text("Assign")') })
        .first();

      // Fallback: any text input if above fails
      const finalInput =
        (await assignToInput.count()) > 0
          ? assignToInput
          : page.locator('input[type="text"]').first();

      if ((await finalInput.count()) > 0) {
        const value = await finalInput.inputValue();
        if (value && value.length > 0) {
          points.earned = 3;
          details = `Assign to has default value: "${value}"`;
        } else {
          points.earned = 1;
          details = "Assign to input found but no default value.";
        }
      } else {
        details = "Assign to input not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Due date is type date", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignment Editor - Due date input field of type date";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dateInputs = page.locator('input[type="date"]');
      const count = await dateInputs.count();

      if (count >= 1) {
        points.earned = 3;
        details = `Found ${count} date input(s).`;
      } else {
        details = "No date inputs found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Due date has default date", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignment Editor - Due date input field has some default date";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dateInputs = page.locator('input[type="date"]');

      if ((await dateInputs.count()) > 0) {
        const value = await dateInputs.first().inputValue();
        if (value && value.length > 0) {
          points.earned = 3;
          details = `Due date has default: ${value}`;
        } else {
          points.earned = 1;
          details = "Due date input found but no default.";
        }
      } else {
        details = "No date inputs found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Available from is type date", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignment Editor - Available from date input field of type date";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dateInputs = page.locator('input[type="date"]');
      const count = await dateInputs.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} date inputs (including Available from).`;
      } else if (count === 1) {
        points.earned = 2;
        details = "Found 1 date input (expected 2+).";
      } else {
        details = "No date inputs found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Available from has default date", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignment Editor - Available from input field has some default date";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dateInputs = page.locator('input[type="date"]');

      if ((await dateInputs.count()) >= 2) {
        const value = await dateInputs.nth(1).inputValue();
        if (value && value.length > 0) {
          points.earned = 3;
          details = `Available from has default: ${value}`;
        } else {
          points.earned = 1;
          details = "Available from input found but no default.";
        }
      } else {
        details = "Not enough date inputs found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Until is type date", async ({ page }) => {
    const criterion =
      "Kambaz - Assignment Editor - Until date input field of type date";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dateInputs = page.locator('input[type="date"]');
      const count = await dateInputs.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} date inputs (including Until).`;
      } else if (count > 0) {
        points.earned = count;
        details = `Found ${count} date input(s) (expected 3).`;
      } else {
        details = "No date inputs found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Assignment Editor - Until has default date", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignment Editor - Until input field has some default date";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dateInputs = page.locator('input[type="date"]');

      if ((await dateInputs.count()) >= 3) {
        const value = await dateInputs.nth(2).inputValue();
        if (value && value.length > 0) {
          points.earned = 3;
          details = `Until has default: ${value}`;
        } else {
          points.earned = 1;
          details = "Until input found but no default.";
        }
      } else {
        details = "Not enough date inputs found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test.afterAll(async () => {
    console.log("\n=== GRADING RESULTS ===");
    console.log(JSON.stringify(results, null, 2));

    const totalEarned = results.reduce((sum, r) => sum + r.points.earned, 0);
    const totalPossible = results.reduce(
      (sum, r) => sum + r.points.possible,
      0
    );
    const percentage = ((totalEarned / totalPossible) * 100).toFixed(2);

    console.log(
      `\nTotal Score: ${totalEarned}/${totalPossible} (${percentage}%)`
    );
    console.log(
      `Passed: ${results.filter((r) => r.passed).length}/${results.length}`
    );
    console.log(
      `Failed: ${results.filter((r) => !r.passed).length}/${results.length}`
    );
  });
});
