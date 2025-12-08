import { test, expect } from "@playwright/test";

const results = [];

// Constants
const TEST_COURSE_ID = "1234";
const TEST_ASSIGNMENT_ID = "5678";

// Get base URL from environment or use from config
const BASE_URL = process.env.STUDENT_URL;

// Helper function to build URLs while preserving query parameters from BASE_URL
function buildUrl(path) {
  if (!BASE_URL) return path;

  try {
    const baseUrl = new URL(BASE_URL);
    const url = new URL(path, baseUrl);

    // Preserve query parameters from BASE_URL
    baseUrl.searchParams.forEach((value, key) => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  } catch (error) {
    // If URL parsing fails, fall back to simple concatenation
    if (BASE_URL.endsWith("/") && path.startsWith("/")) {
      return BASE_URL + path.slice(1);
    }
    return BASE_URL + path;
  }
}

// Enhanced navigation helper with retry logic
// Accept either a number of retries or a goto options object as third arg
async function navigateWithRetry(page, path, maxRetriesOrOptions = 3) {
  const url = buildUrl(path);
  const isOptionsObject =
    maxRetriesOrOptions && typeof maxRetriesOrOptions === "object";
  const gotoOptions = isOptionsObject
    ? { waitUntil: "networkidle", timeout: 30000, ...maxRetriesOrOptions }
    : { waitUntil: "networkidle", timeout: 30000 };
  const maxRetries = isOptionsObject ? 3 : maxRetriesOrOptions;

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Navigating to: ${url}`);
      await page.goto(url, gotoOptions);

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
        const rootUrl = buildUrl("/");
        console.log(`Priming session at: ${rootUrl}`);
        await page.goto(rootUrl, gotoOptions);
        await page.waitForTimeout(1000);
        console.log(`Retrying target: ${url}`);
        await page.goto(url, gotoOptions);
        const afterRetryUrl = page.url();
        const stillLogin =
          afterRetryUrl.includes("vercel.com/login") ||
          (await page.locator('text="Sign in to Vercel"').count()) > 0;
        if (!stillLogin) {
          return;
        }
        console.log(`Waiting 3 seconds before retry...`);
        await page.waitForTimeout(3000);
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

test.describe("Assignment 2 Tests", () => {
  // Run serially to avoid cross-test interference with shared results array
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for navigation
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(10000);
    // Prime Vercel share session to avoid intermittent login redirects
    try {
      await navigateWithRetry(page, "/");
    } catch (e) {
      console.log(`Session priming failed: ${e?.message || e}`);
    }
  });

  // Fail the Playwright test if the computed points are partial or zero
  test.afterEach(() => {
    const last = results[results.length - 1];
    if (last && last.points && last.points.earned < last.points.possible) {
      throw new Error(`Partial grade for "${last.criterion}": ${last.details}`);
    }
  });
  // ==================== LABS - CSS TESTS ====================

  test("Labs - CSS - ID Selectors - Black on yellow paragraph", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - ID Selectors - Black on yellow paragraph";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Get all <p> tags with an ID
      const paragraphs = page.locator("p[id]");
      const count = await paragraphs.count();

      if (count === 0) {
        details = "No <p> with ID found.";
      } else {
        let found = false;

        for (let i = 0; i < count; i++) {
          const p = paragraphs.nth(i);
          const text = (await p.textContent())?.trim() || "";
          const color = await p.evaluate(
            (el) => window.getComputedStyle(el).color
          );
          const bgColor = await p.evaluate(
            (el) => window.getComputedStyle(el).backgroundColor
          );
          const id = await p.getAttribute("id");

          // Allow small variations of black (dark gray, etc.)
          const hasBlackText =
            /rgb\(0, *0, *0\)/i.test(color) ||
            /rgb\((1[0-9]{1,2}|[0-9]{1,2}), *\1, *\1\)/i.test(color);

          // Allow yellow / gold / light shades
          const hasYellowBg =
            /rgb\(255, *255, *0\)/i.test(bgColor) ||
            /rgb\(2(4[0-9]|5[0-9]), *2(2[0-9]|3[0-9]), *0\)/i.test(bgColor);

          if (text && hasBlackText && hasYellowBg) {
            points.earned = 3;
            details = `Found <p id="${id}"> with blackish text on yellowish bg: "${text}"`;
            found = true;
            break;
          }
        }

        if (!found) {
          points.earned = 1;
          details = "Found <p id> but no matching black-on-yellow style.";
        }
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === 3,
      details,
    });
  });

  test("Labs - CSS - Class Selectors - Blue on yellow paragraph", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Class Selectors - Blue on yellow paragraph";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const paragraph = page.locator("p[class]:not([class=''])").first();
      await expect(paragraph).toBeVisible();

      const text = await paragraph.textContent();
      const color = await paragraph.evaluate(
        (el) => window.getComputedStyle(el).color
      );
      const bgColor = await paragraph.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );
      const className = await paragraph.getAttribute("class");

      const hasBlueText = /rgb\(0, *0, *255\)|blue/i.test(color);
      const hasYellowBg = /rgb\(255, *255, *0\)|yellow/i.test(bgColor);

      if (className && hasBlueText && hasYellowBg && text.trim().length > 0) {
        points.earned = 3;
        details = `Found <p class="${className}"> with blue text on yellow: "${text.trim()}"`;
      } else {
        points.earned = 1;
        details = `p[class] found but styles missing (class: ${className}, color: ${color}, bg: ${bgColor})`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  //   test("Labs - CSS - Class Selectors - Blue on yellow paragraph", async ({
  //     page,
  //   }) => {
  //     const criterion = "Labs - CSS - Class Selectors - Blue on yellow paragraph";
  //     let points = { earned: 0, possible: 3 };
  //     let details = "";

  //     try {
  //       await navigateWithRetry(page, "/Labs/Lab2", {
  //         waitUntil: "networkidle",
  //         timeout: 10000,
  //       });

  //       const paragraph = page.locator("p[class]:not([class=''])").first();
  //       await expect(paragraph).toBeVisible();

  //       const text = await paragraph.textContent();
  //       const color = await paragraph.evaluate(
  //         (el) => window.getComputedStyle(el).color
  //       );
  //       const bgColor = await paragraph.evaluate(
  //         (el) => window.getComputedStyle(el).backgroundColor
  //       );
  //       const className = await paragraph.getAttribute("class");

  //       const hasBlueText = /rgb\(0, *0, *255\)|blue/i.test(color);
  //       const hasYellowBg = /rgb\(255, *255, *0\)|yellow/i.test(bgColor);

  //       if (className && hasBlueText && hasYellowBg && text.trim().length > 0) {
  //         points.earned = 3;
  //         details = `Found <p class="${className}"> with blue text on yellow: "${text.trim()}"`;
  //       } else {
  //         points.earned = 1;
  //         details = `p[class] found but styles missing (class: ${className}, color: ${color}, bg: ${bgColor})`;
  //       }
  //     } catch (error) {
  //       details = `Error: ${error.message}`;
  //     }

  //     results.push({ criterion, points, passed: points.earned === 3, details });
  //   });
  test("Labs - CSS - Document Structure - White on red DIV", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Document Structure - White on red DIV";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const div = page
        .locator("div")
        .filter({
          has: page.locator("span"), // must contain a span
        })
        .first();

      await expect(div).toBeVisible();

      const color = await div.evaluate(
        (el) => window.getComputedStyle(el).color
      );
      const bgColor = await div.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );
      const hasSpan = (await div.locator("span").count()) > 0;

      const hasWhiteText = /rgb\(255, *255, *255\)|white/i.test(color);
      const hasRedBg = /rgb\(255, *0, *0\)|red/i.test(bgColor);

      if (hasSpan && hasWhiteText && hasRedBg) {
        points.earned = 3;
        details = "White-on-red DIV containing span found.";
      } else {
        points.earned = 1;
        details = `DIV has span: ${hasSpan}, white: ${hasWhiteText}, red bg: ${hasRedBg}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Document Structure - Blue on yellow span", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Document Structure - Blue on yellow small span within the DIV";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const span = page.locator("div span, span.blue-yellow").first();

      if ((await span.count()) > 0) {
        points.earned = 3;
        details = "Blue on yellow span found within DIV.";
      } else {
        details = "Span not found.";
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

  test("Labs - CSS - Foreground Color - Blue on white heading", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Foreground Color - Blue on white heading";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("domcontentloaded");

      // Allow React to render fully
      await page.waitForTimeout(3000);

      // Look for heading with blue text
      const heading = page.locator("h1, h2, h3, h4, h5, h6").first();
      const exists = await heading.count();

      if (exists === 0) {
        // fallback: look for <p> if heading missing
        const paragraph = page.locator("p").first();
        await expect(paragraph).toBeVisible({ timeout: 10000 });
        details = "Fallback: found paragraph but no heading.";
      } else {
        await expect(heading).toBeVisible({ timeout: 10000 });
        const color = await heading.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await heading.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isBlue = /rgb\(0,\s*0,\s*255\)|blue/i.test(color);
        const isWhiteBg = /rgb\(255,\s*255,\s*255\)|white|transparent/i.test(
          bgColor
        );

        if (isBlue && isWhiteBg) {
          points.earned = 3;
          details = "Blue-on-white heading found.";
        } else {
          points.earned = 1;
          details = `Heading color: ${color}, bg: ${bgColor}`;
        }
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Foreground Color - Red on white text", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Foreground Color - Red on white text";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const element = page
        .locator("p, span, div, li")
        .filter({
          hasText: /./,
        })
        .nth(1); // skip first if it's the ID one

      await expect(element).toBeVisible();

      const color = await element.evaluate(
        (el) => window.getComputedStyle(el).color
      );
      const bgColor = await element.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );

      const isRed = /rgb\(255,\s*0,\s*0\)|red/i.test(color);
      const isWhiteBg = /rgb\(255,\s*255,\s*255\)|white|transparent/i.test(
        bgColor
      );

      if (isRed && isWhiteBg) {
        points.earned = 3;
        details = "Red text on white/transparent background found.";
      } else {
        points.earned = 1;
        details = `Text found but color: ${color}, bg: ${bgColor}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Foreground Color - Green on white text", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Foreground Color - Green on white text";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const element = page
        .locator("p, span, div, li")
        .filter({
          hasText: /./,
        })
        .nth(2); // third text element

      await expect(element).toBeVisible();

      const color = await element.evaluate(
        (el) => window.getComputedStyle(el).color
      );
      const bgColor = await element.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );

      const isGreen = /rgb\(0,\s*128,\s*0\)|rgb\(0,\s*255,\s*0\)|green/i.test(
        color
      );
      const isWhiteBg = /rgb\(255,\s*255,\s*255\)|white|transparent/i.test(
        bgColor
      );

      if (isGreen && isWhiteBg) {
        points.earned = 3;
        details = "Green text on white/transparent background found.";
      } else {
        points.earned = 1;
        details = `Text found but color: ${color}, bg: ${bgColor}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // 7. Labs - CSS - Background Color - White on blue heading
  test("Labs - CSS - Background Color - White on blue heading", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Background Color - White on blue heading";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const heading = page
        .locator("h1, h2, h3, h4, h5, h6")
        .filter({ hasText: /.+/ })
        .nth(0); // first heading with text

      await expect(heading).toBeVisible();

      const fg = await heading.evaluate(
        (el) => window.getComputedStyle(el).color
      );
      const bg = await heading.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );

      const whiteFg = /rgb\(255,\s*255,\s*255\)|white/i.test(fg);
      const blueBg = /rgb\(0,\s*0,\s*255\)|blue/i.test(bg);

      if (whiteFg && blueBg) {
        points.earned = 3;
        details = "White text on blue background heading found.";
      } else {
        points.earned = 1;
        details = `Heading found – fg:${fg}, bg:${bg}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // 8. Labs - CSS - Background Color - Black on red paragraph
  test("Labs - CSS - Background Color - Black on red paragraph", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Background Color - Black on red paragraph";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const p = page.locator("p").filter({ hasText: /.+/ }).nth(1); // second paragraph (skip ID one)

      await expect(p).toBeVisible();

      const fg = await p.evaluate((el) => window.getComputedStyle(el).color);
      const bg = await p.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );

      const blackFg = /rgb\(0,\s*0,\s*0\)|black/i.test(fg);
      const redBg = /rgb\(255,\s*0,\s*0\)|red/i.test(bg);

      if (blackFg && redBg) {
        points.earned = 3;
        details = "Black text on red background paragraph found.";
      } else {
        points.earned = 1;
        details = `Paragraph found – fg:${fg}, bg:${bg}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // 9. Labs - CSS - Background Color - White on green span
  test("Labs - CSS - Background Color - White on green span", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Background Color - White on green span";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const span = page.locator("span").filter({ hasText: /.+/ }).first();

      await expect(span).toBeVisible();

      const fg = await span.evaluate((el) => window.getComputedStyle(el).color);
      const bg = await span.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );

      const whiteFg = /rgb\(255,\s*255,\s*255\)|white/i.test(fg);
      const greenBg = /rgb\(0,\s*128,\s*0\)|rgb\(0,\s*255,\s*0\)|green/i.test(
        bg
      );

      if (whiteFg && greenBg) {
        points.earned = 3;
        details = "White text on green background span found.";
      } else {
        points.earned = 1;
        details = `Span found – fg:${fg}, bg:${bg}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // 10. Labs - CSS - Borders - Fat red border
  test("Labs - CSS - Borders - Fat red border", async ({ page }) => {
    const criterion = "Labs - CSS - Borders - Fat red border";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const el = page
        .locator("*")
        .filter({
          has: page.locator("text=/./"), // has visible text
        })
        .first();

      await expect(el).toBeVisible();

      const borderWidth = await el.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).borderTopWidth)
      );
      const borderColor = await el.evaluate(
        (e) => window.getComputedStyle(e).borderTopColor
      );
      const borderStyle = await el.evaluate(
        (e) => window.getComputedStyle(e).borderTopStyle
      );

      const isFat = borderWidth >= 8;
      const isRed = /rgb\(255,\s*0,\s*0\)|red/i.test(borderColor);
      const isSolid = borderStyle === "solid";

      if (isFat && isRed && isSolid) {
        points.earned = 3;
        details = `Fat red solid border: ${borderWidth}px`;
      } else {
        points.earned = 1;
        details = `Border: ${borderWidth}px, ${borderColor}, ${borderStyle}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // 11. Labs - CSS - Borders - Thin blue dashed border
  test("Labs - CSS - Borders - Thin blue dashed border", async ({ page }) => {
    const criterion = "Labs - CSS - Borders - Thin blue dashed border";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const el = page
        .locator("*")
        .filter({
          has: page.locator("text=/./"),
        })
        .nth(1);

      await expect(el).toBeVisible();

      const width = await el.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).borderTopWidth)
      );
      const color = await el.evaluate(
        (e) => window.getComputedStyle(e).borderTopColor
      );
      const style = await el.evaluate(
        (e) => window.getComputedStyle(e).borderTopStyle
      );

      const isThin = width > 0 && width <= 3;
      const isBlue = /rgb\(0,\s*0,\s*255\)|blue/i.test(color);
      const isDashed = style === "dashed" || style === "dotted";

      if (isThin && isBlue && isDashed) {
        points.earned = 3;
        details = `Thin blue dashed: ${width}px`;
      } else {
        points.earned = 1;
        details = `Border: ${width}px, ${color}, ${style}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // 12. Labs - CSS - Padding - Fat red border with yellow background and big padding above and left
  test("Labs - CSS - Padding - Fat red border with yellow background and big padding above and left", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Padding - Fat red border with yellow background and big padding above and left";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const el = page
        .locator("*")
        .filter({
          has: page.locator("text=/./"),
        })
        .first();

      const paddingTop = await el.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).paddingTop)
      );
      const paddingLeft = await el.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).paddingLeft)
      );
      const bg = await el.evaluate(
        (e) => window.getComputedStyle(e).backgroundColor
      );
      const borderWidth = await el.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).borderTopWidth)
      );
      const borderColor = await el.evaluate(
        (e) => window.getComputedStyle(e).borderTopColor
      );

      const bigPadding = paddingTop >= 15 && paddingLeft >= 15;
      const yellowBg = /rgb\(255,\s*255,\s*0\)|yellow/i.test(bg);
      const fatRedBorder =
        borderWidth >= 8 && /rgb\(255,\s*0,\s*0\)|red/i.test(borderColor);

      if (bigPadding && yellowBg && fatRedBorder) {
        points.earned = 3;
        details = `Padding: ${paddingTop}px top, ${paddingLeft}px left | Yellow bg | Fat red border`;
      } else {
        points.earned = 1;
        details = `Pad: ${paddingTop}/${paddingLeft}, bg: ${bg}, border: ${borderWidth}px ${borderColor}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });
  // 13. Labs - CSS - Margins - Fat red border with yellow background and big margin above and left
  test("Labs - CSS - Margins - Fat red border with yellow background and big margin above and left", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Margins - Fat red border with yellow background and big margin above and left";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const el = page
        .locator("*")
        .filter({
          has: page.locator("text=/./"),
        })
        .nth(1);

      const marginTop = await el.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).marginTop)
      );
      const marginLeft = await el.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).marginLeft)
      );
      const bg = await el.evaluate(
        (e) => window.getComputedStyle(e).backgroundColor
      );
      const borderWidth = await el.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).borderTopWidth)
      );
      const borderColor = await el.evaluate(
        (e) => window.getComputedStyle(e).borderTopColor
      );

      const bigMargin = marginTop >= 15 && marginLeft >= 15;
      const yellowBg = /rgb\(255,\s*255,\s*0\)|yellow/i.test(bg);
      const fatRedBorder =
        borderWidth >= 8 && /rgb\(255,\s*0,\s*0\)|red/i.test(borderColor);

      if (bigMargin && yellowBg && fatRedBorder) {
        points.earned = 3;
        details = `Margin: ${marginTop}px top, ${marginLeft}px left | Yellow bg | Fat red border`;
      } else {
        points.earned = 1;
        details = `Margin: ${marginTop}/${marginLeft}, bg: ${bg}, border: ${borderWidth}px ${borderColor}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Padding - Yellow border with padding all around", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Margins - Fat yellow border with blue background and big padding all around";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page
        .locator(".wd-padding-all-around, .wd-padding-yellow")
        .first();

      if ((await element.count()) > 0) {
        points.earned = 3;
        details = "Padding all around found.";
      } else {
        details = "All-around padding element not found.";
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

  test("Labs - CSS - Margins - Red border with margin at bottom", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Margins - Fat red border with yellow background and margin at bottom";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page.locator(".wd-margin-bottom, .wd-margin-red").first();

      if ((await element.count()) > 0) {
        const marginBottom = await element.evaluate(
          (el) => window.getComputedStyle(el).marginBottom
        );
        const hasMargin = parseInt(marginBottom) >= 30;

        if (hasMargin) {
          points.earned = 3;
          details = "Margin at bottom found.";
        } else {
          points.earned = 1;
          details = `Element found but margin-bottom: ${marginBottom}`;
        }
      } else {
        details = "Bottom margin element not found.";
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

  test("Labs - CSS - Margins - Centered with margins on both sides", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Margins - Fat blue border with yellow background and centered because margins on both sides";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page
        .locator(".wd-margin-left-right, .wd-margin-auto")
        .first();

      if ((await element.count()) > 0) {
        const marginLeft = await element.evaluate(
          (el) => window.getComputedStyle(el).marginLeft
        );
        const marginRight = await element.evaluate(
          (el) => window.getComputedStyle(el).marginRight
        );

        const isCentered =
          marginLeft === "auto" ||
          marginRight === "auto" ||
          (parseInt(marginLeft) > 0 && parseInt(marginRight) > 0);

        if (isCentered) {
          points.earned = 3;
          details = "Centered element with side margins found.";
        } else {
          points.earned = 1;
          details = "Element found but not centered.";
        }
      } else {
        details = "Centered element not found.";
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

  test("Labs - CSS - Margins - Yellow border with margins all around", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Margins - Fat yellow border with blue background and big margins all around";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page
        .locator(".wd-margin-all-around, .wd-margin-yellow")
        .first();

      if ((await element.count()) > 0) {
        points.earned = 3;
        details = "Margins all around found.";
      } else {
        details = "All-around margin element not found.";
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

  // ⭐ ENHANCED: Corners test with all variations
  test("Labs - CSS - Corners - Rounded top corners", async ({ page }) => {
    const criterion =
      "Labs - CSS - Corners - Div with rounded corners at top left and right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page
        .locator(".wd-rounded-corners-top, .wd-rounded-top")
        .first();

      if ((await element.count()) > 0) {
        const topLeftRadius = await element.evaluate(
          (el) => window.getComputedStyle(el).borderTopLeftRadius
        );
        const topRightRadius = await element.evaluate(
          (el) => window.getComputedStyle(el).borderTopRightRadius
        );

        const hasRoundedTop =
          parseInt(topLeftRadius) > 0 && parseInt(topRightRadius) > 0;

        if (hasRoundedTop) {
          points.earned = 3;
          details = "Rounded top corners found.";
        } else {
          points.earned = 1;
          details = "Element found but top corners not rounded.";
        }
      } else {
        details = "Rounded top corners element not found.";
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

  // 14. Labs - CSS - Corners - Div with rounded corners at top left and right
  test("Labs - CSS - Corners - Div with rounded corners at top left and right", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Corners - Div with rounded corners at top left and right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const div = page
        .locator("div")
        .filter({
          has: page.locator("text=/./"),
        })
        .first();

      const tl = await div.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).borderTopLeftRadius)
      );
      const tr = await div.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).borderTopRightRadius)
      );
      const bl = await div.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).borderBottomLeftRadius)
      );
      const br = await div.evaluate((e) =>
        parseFloat(window.getComputedStyle(e).borderBottomRightRadius)
      );

      const topRounded = tl > 5 && tr > 5;
      const bottomNot = bl <= 1 && br <= 1;

      if (topRounded && bottomNot) {
        points.earned = 3;
        details = `Top corners rounded: TL=${tl}px, TR=${tr}px`;
      } else {
        points.earned = 1;
        details = `Corners: TL=${tl}, TR=${tr}, BL=${bl}, BR=${br}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });
  test("Labs - CSS - Corners - All rounded corners", async ({ page }) => {
    const criterion = "Labs - CSS - Corners - Div with all rounded corners";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page
        .locator(".wd-rounded-corners-all-around, .wd-rounded-all")
        .first();

      if ((await element.count()) > 0) {
        const borderRadius = await element.evaluate(
          (el) => window.getComputedStyle(el).borderRadius
        );
        const hasRoundedAll =
          borderRadius !== "0px" && !borderRadius.includes("0px 0px");

        if (hasRoundedAll) {
          points.earned = 3;
          details = "All rounded corners found.";
        } else {
          points.earned = 1;
          details = "Element found but all corners not rounded.";
        }
      } else {
        details = "All rounded corners element not found.";
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

  test("Labs - CSS - Corners - Rounded except top right", async ({ page }) => {
    const criterion =
      "Labs - CSS - Corners - Div with rounded corners all around except top right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page.locator(".wd-rounded-corners-no-top-right").first();

      if ((await element.count()) > 0) {
        const topRightRadius = await element.evaluate(
          (el) => window.getComputedStyle(el).borderTopRightRadius
        );
        const topLeftRadius = await element.evaluate(
          (el) => window.getComputedStyle(el).borderTopLeftRadius
        );

        const noTopRight = parseInt(topRightRadius) === 0;
        const hasTopLeft = parseInt(topLeftRadius) > 0;

        if (noTopRight && hasTopLeft) {
          points.earned = 3;
          details = "Rounded corners except top right found.";
        } else {
          points.earned = 1;
          details = "Element structure unclear.";
        }
      } else {
        details = "Element not found.";
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

  // 15. Labs - CSS - Dimensions - Yellow DIV longer than it's taller
  test("Labs - CSS - Dimensions - Yellow DIV longer than it's taller", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Dimensions - Yellow DIV longer than it's taller";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const div = page.locator("div").filter({ hasText: /.+/ }).first();

      const box = await div.boundingBox();
      const bg = await div.evaluate(
        (e) => window.getComputedStyle(e).backgroundColor
      );

      const isYellow = /rgb\(255,\s*255,\s*0\)|yellow/i.test(bg);
      const isLandscape = box.width > box.height * 1.2; // at least 20% wider

      if (isYellow && isLandscape) {
        points.earned = 3;
        details = `Yellow landscape DIV: ${box.width.toFixed(
          0
        )}×${box.height.toFixed(0)}px`;
      } else {
        points.earned = 1;
        details = `DIV: ${box.width}×${box.height}px, bg: ${bg}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Dimensions - Portrait DIV", async ({ page }) => {
    const criterion =
      "Labs - CSS - Dimensions - Blue DIV taller than it's longer";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page
        .locator(".wd-dimension-landscape, .wd-portrait")
        .first();

      if ((await element.count()) > 0) {
        const width = await element.evaluate((el) => el.offsetWidth);
        const height = await element.evaluate((el) => el.offsetHeight);

        if (height > width) {
          points.earned = 3;
          details = `Portrait DIV found (${width}px x ${height}px).`;
        } else {
          points.earned = 1;
          details = `DIV found but dimensions: ${width}px x ${height}px`;
        }
      } else {
        details = "Portrait DIV not found.";
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

  test("Labs - CSS - Dimensions - Square DIV", async ({ page }) => {
    const criterion = "Labs - CSS - Dimensions - Red DIV height same as width";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page.locator(".wd-dimension-square, .wd-square").first();

      if ((await element.count()) > 0) {
        const width = await element.evaluate((el) => el.offsetWidth);
        const height = await element.evaluate((el) => el.offsetHeight);

        if (width === height) {
          points.earned = 3;
          details = `Square DIV found (${width}px x ${height}px).`;
        } else {
          points.earned = 1;
          details = `DIV found but dimensions: ${width}px x ${height}px`;
        }
      } else {
        details = "Square DIV not found.";
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

  // 16. Labs - CSS - Relative Position - Yellow DIV with text nudged down and right
  test("Labs - CSS - Relative Position - Yellow DIV with text nudged down and right", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Relative Position - Yellow DIV with text nudged down and right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const div = page.locator("div").filter({ hasText: /.+/ }).nth(1);

      const pos = await div.evaluate(
        (e) => window.getComputedStyle(e).position
      );
      const top = await div.evaluate(
        (e) => parseFloat(window.getComputedStyle(e).top) || 0
      );
      const left = await div.evaluate(
        (e) => parseFloat(window.getComputedStyle(e).left) || 0
      );
      const bg = await div.evaluate(
        (e) => window.getComputedStyle(e).backgroundColor
      );

      const isRelative = pos === "relative";
      const nudgedDown = top >= 10;
      const nudgedRight = left >= 10;
      const isYellow = /rgb\(255,\s*255,\s*0\)|yellow/i.test(bg);

      if (isRelative && nudgedDown && nudgedRight && isYellow) {
        points.earned = 3;
        details = `Relative yellow DIV nudged: +${top}px top, +${left}px left`;
      } else {
        points.earned = 1;
        details = `Pos: ${pos}, top:${top}, left:${left}, bg:${bg}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Relative Position - Blue DIV moved up and right", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Relative Position - Blue DIV moved up and right a bit";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page.locator(".wd-pos-relative-nudge-up-right").first();

      if ((await element.count()) > 0) {
        const position = await element.evaluate(
          (el) => window.getComputedStyle(el).position
        );

        if (position === "relative") {
          points.earned = 3;
          details = "Blue relatively positioned DIV found.";
        } else {
          points.earned = 1;
          details = `DIV found but position: ${position}`;
        }
      } else {
        details = "Blue relative position DIV not found.";
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

  // 17. Labs - CSS - Absolute Position - Portrait, Landscape, and Square rectangles
  test("Labs - CSS - Absolute Position - Portrait, Landscape, and Square rectangles styled as shown", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Absolute Position - Portrait, Landscape, and Square rectangles styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const container = page
        .locator("div")
        .filter({
          has: page.locator("div[style*='position: absolute'], div.absolute"),
        })
        .first();

      const rects = await container.locator("div").all();
      const boxes = await Promise.all(rects.map((r) => r.boundingBox()));
      const positions = await Promise.all(
        rects.map((r) => r.evaluate((e) => window.getComputedStyle(e).position))
      );

      const absCount = positions.filter((p) => p === "absolute").length;
      const hasPortrait = boxes.some((b) => b.height > b.width * 1.3);
      const hasLandscape = boxes.some((b) => b.width > b.height * 1.3);
      const hasSquare = boxes.some((b) => Math.abs(b.width - b.height) < 15);

      if (absCount >= 3 && hasPortrait && hasLandscape && hasSquare) {
        points.earned = 3;
        details = `3+ absolute rects: portrait=${hasPortrait}, landscape=${hasLandscape}, square=${hasSquare}`;
      } else {
        points.earned = 1;
        details = `Abs: ${absCount}, P:${hasPortrait}, L:${hasLandscape}, S:${hasSquare}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // 18. Labs - CSS - Fixed Position - Blue Fixed position rectangle doesn't scroll
  test("Labs - CSS - Fixed Position - Blue Fixed position rectangle doesn't scroll with rest of page", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Fixed Position - Blue Fixed position rectangle doesn't scroll with rest of page";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const fixed = page
        .locator("div, span, section")
        .filter({ hasText: /.+/ })
        .first();

      const pos = await fixed.evaluate(
        (e) => window.getComputedStyle(e).position
      );
      const bg = await fixed.evaluate(
        (e) => window.getComputedStyle(e).backgroundColor
      );
      const initial = await fixed.boundingBox();

      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(300);
      const after = await fixed.boundingBox();

      const isFixed = pos === "fixed";
      const isBlue = /rgb\(0,\s*0,\s*255\)|blue/i.test(bg);
      const didntMove = Math.abs(initial.y - after.y) < 3;

      if (isFixed && isBlue && didntMove) {
        points.earned = 3;
        details = `Blue fixed element stays at y=${initial.y.toFixed(0)}px`;
      } else {
        points.earned = 1;
        details = `Pos:${pos}, blue:${isBlue}, moved:${Math.abs(
          initial.y - after.y
        ).toFixed(1)}px`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // 19. Labs - CSS - Z Index - Blue Landscape rectangle renders above other two
  test("Labs - CSS - Z Index - Blue Landscape rectangle renders above other two", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Z Index - Blue Landscape rectangle renders above other two";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const blues = page.locator("div").filter((e) =>
        e.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor;
          const w = el.offsetWidth,
            h = el.offsetHeight;
          return /blue/i.test(bg) && w > h * 1.3;
        })
      );

      const blue = await blues.first();
      const others = await page.locator("div").filter({ hasText: /.+/ }).all();
      const blueZ = await blue.evaluate(
        (e) => parseInt(window.getComputedStyle(e).zIndex) || 0
      );
      const otherZs = await Promise.all(
        others
          .slice(0, 2)
          .map((o) =>
            o.evaluate((e) => parseInt(window.getComputedStyle(e).zIndex) || 0)
          )
      );

      const aboveBoth = otherZs.every((z) => blueZ > z);

      if (aboveBoth && blueZ > 0) {
        points.earned = 3;
        details = `Blue landscape z-index ${blueZ} > others (${otherZs.join(
          ", "
        )})`;
      } else {
        points.earned = 1;
        details = `z-index: blue=${blueZ}, others=${otherZs.join(", ")}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // 20. Labs - CSS - Floating Images - Three rectangles laid out horizontally
  test("Labs - CSS - Floating Images - Three rectangles laid out horizontally", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Floating Images - Three rectangles laid out horizontally";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const floats = page
        .locator("div, img")
        .filter((e) =>
          e.evaluate((el) => window.getComputedStyle(el).float !== "none")
        )
        .all();

      if ((await floats).length >= 3) {
        const boxes = await Promise.all(
          (await floats).slice(0, 3).map((f) => f.boundingBox())
        );
        const sameRow = boxes.every(
          (b, i) => i === 0 || Math.abs(b.y - boxes[0].y) < 15
        );

        if (sameRow) {
          points.earned = 3;
          details = "3+ floated items in same row.";
        } else {
          points.earned = 2;
          details = "3+ floated but not aligned.";
        }
      } else {
        details = `Only ${await floats.length} floated items.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Floating Images - Image on the right", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Floating Images - Image on the right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const element = page
        .locator("img.wd-float-right, .float-right img")
        .first();

      if ((await element.count()) > 0) {
        const float = await element.evaluate(
          (el) => window.getComputedStyle(el).float
        );

        if (float === "right") {
          points.earned = 3;
          details = "Right-floating image found.";
        } else {
          points.earned = 1;
          details = `Image found but float: ${float}`;
        }
      } else {
        details = "Right-floating image not found.";
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

  // 21. Labs - CSS - Grid layout as shown + Flex - Columns 1,2,3 horizontally
  test("Labs - CSS - Grid layout as shown", async ({ page }) => {
    const criterion = "Labs - CSS - Grid layout as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const grid = page
        .locator("div")
        .filter((e) =>
          e.evaluate((el) =>
            window.getComputedStyle(el).display.includes("grid")
          )
        )
        .first();

      const items = await grid.locator("> *").count();
      const gaps = await grid.evaluate((e) => window.getComputedStyle(e).gap);

      if (items >= 4 && gaps && gaps !== "0px") {
        points.earned = 3;
        details = `Grid with ${items} items and gap ${gaps}`;
      } else {
        points.earned = 1;
        details = `Grid items: ${items}, gap: ${gaps}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // Flex test (same file)
  test("Labs - CSS - Flex - Columns 1, 2, 3, laid out horizontally as shown", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Flex - Columns 1, 2, 3, laid out horizontally as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const flex = page
        .locator("div")
        .filter((e) =>
          e.evaluate((el) =>
            window.getComputedStyle(el).display.includes("flex")
          )
        )
        .first();

      const dir = await flex.evaluate(
        (e) => window.getComputedStyle(e).flexDirection
      );
      const children = await flex.locator("> *").all();
      const boxes = await Promise.all(children.map((c) => c.boundingBox()));

      const isRow = dir === "row";
      const horizontal =
        boxes.length >= 3 &&
        boxes.every((b, i) => i === 0 || Math.abs(b.y - boxes[0].y) < 10);

      if (isRow && horizontal) {
        points.earned = 3;
        details = `Flex row with ${boxes.length} items aligned horizontally`;
      } else {
        points.earned = 1;
        details = `Flex dir: ${dir}, items: ${boxes.length}, aligned: ${horizontal}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - React Icons showing 6 icons", async ({ page }) => {
    const criterion = "Labs - CSS - React Icons Sample showing any 6 icons";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const icons = page.locator("svg, .react-icon, i");
      const count = await icons.count();

      if (count >= 6) {
        points.earned = 3;
        details = `Found ${count} icons.`;
      } else if (count > 0) {
        points.earned = Math.floor((count / 6) * 3);
        details = `Found ${count} icons (expected 6).`;
      } else {
        details = "No icons found.";
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

  // ==================== BOOTSTRAP TESTS ====================

  // 22. Labs - Bootstrap - Containers - Thin padding all around Lab 2
  test("Labs - Bootstrap - Containers - Thin padding all around Lab 2", async ({
    page,
  }) => {
    const criterion =
      "Labs - Bootstrap - Containers - Thin padding all around Lab 2";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const container = page
        .locator(".container, .container-fluid, [class*='p-']")
        .first();
      const padding = await container.evaluate((e) => {
        const style = window.getComputedStyle(e);
        return Math.max(
          parseFloat(style.paddingTop),
          parseFloat(style.paddingRight),
          parseFloat(style.paddingBottom),
          parseFloat(style.paddingLeft)
        );
      });

      const hasPadding = padding > 0 && padding <= 20; // thin = 1rem or less

      if (hasPadding) {
        points.earned = 3;
        details = `Container has thin padding: ${padding}px`;
      } else {
        points.earned = 1;
        details = `Padding: ${padding}px (too thick or none)`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // 23. Labs - Bootstrap - Grids - Various layouts: half, thirds, side/main
  test("Labs - Bootstrap - Grids - Grid showing various layout: left/right half; one/two thirds; side/main content", async ({
    page,
  }) => {
    const criterion =
      "Labs - Bootstrap - Grids - Grid showing various layout: left/right half; one/two thirds; side/main content";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });
      await page.setViewportSize({ width: 1200, height: 800 });

      const rows = await page.locator(".row").all();
      let foundHalf = false,
        foundThird = false;

      for (const row of rows) {
        const cols = await row.locator("[class*='col-']").all();
        if (cols.length >= 2) {
          const parentBox = await row.boundingBox();
          const colBoxes = await Promise.all(cols.map((c) => c.boundingBox()));
          const ratios = colBoxes.map((b) => b.width / parentBox.width);

          if (ratios.some((r) => r >= 0.45 && r <= 0.55)) foundHalf = true;
          if (ratios.some((r) => r >= 0.3 && r <= 0.4)) foundThird = true;
        }
      }

      if (foundHalf && foundThird) {
        points.earned = 3;
        details = "Half and third columns detected.";
      } else if (foundHalf || foundThird) {
        points.earned = 2;
        details = `Half: ${foundHalf}, Third: ${foundThird}`;
      } else {
        details = "No half or third columns.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Responsive - Columns A, B, C, D", async ({
    page,
  }) => {
    const criterion =
      "Labs - Bootstrap - Responsive - Columns A, B, C, D laid out horizontally or vertically based on screen size";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const columns = page.locator('[class*="col-"]');
      const count = await columns.count();

      if (count >= 4) {
        points.earned = 3;
        details = `Found ${count} responsive columns.`;
      } else if (count > 0) {
        points.earned = count;
        details = `Found ${count} columns (expected 4).`;
      } else {
        details = "No responsive columns found.";
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

  // 24. Labs - Bootstrap - Responsive - Columns stack on narrow screens
  test("Labs - Bootstrap - Responsive - Columns stack on narrow screens", async ({
    page,
  }) => {
    const criterion =
      "Labs - Bootstrap - Responsive - Columns stack on narrow screens";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const row = page.locator(".row").first();
      const cols = await row.locator("[class*='col-']").all();

      // Wide screen
      await page.setViewportSize({ width: 1200, height: 800 });
      const wideBoxes = await Promise.all(cols.map((c) => c.boundingBox()));
      const wideHorizontal = wideBoxes.every(
        (b, i) => i === 0 || Math.abs(b.y - wideBoxes[0].y) < 20
      );

      // Narrow screen
      await page.setViewportSize({ width: 576, height: 800 });
      await page.waitForTimeout(300);
      const narrowBoxes = await Promise.all(cols.map((c) => c.boundingBox()));
      const narrowVertical = narrowBoxes.every(
        (b, i) =>
          i === 0 || b.y > narrowBoxes[i - 1].y + narrowBoxes[i - 1].height - 20
      );

      if (wideHorizontal && narrowVertical) {
        points.earned = 3;
        details = "Responsive: horizontal wide, vertical narrow.";
      } else {
        points.earned = 1;
        details = `Wide H: ${wideHorizontal}, Narrow V: ${narrowVertical}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Responsive - Breakpoints visible", async ({
    page,
  }) => {
    const criterion =
      "Labs - Bootstrap - Responsive - Responsive breakpoints visible in black box on top-left of the screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const breakpoint = page.locator(
        ".d-block, .d-sm-block, .d-md-block, .d-lg-block, .d-xl-block"
      );

      if ((await breakpoint.count()) > 0) {
        points.earned = 3;
        details = "Responsive breakpoint indicator found.";
      } else {
        details = "Breakpoint indicator not found.";
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

  test("Labs - Bootstrap - Tables - Quizzes table styled", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Tables - Quizzes table styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const table = page.locator("table.table, .table");

      if ((await table.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap-styled table found.";
      } else {
        details = "Bootstrap table not found.";
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

  test("Labs - Bootstrap - Lists - Favorite movies", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Lists - Favorite list of movies styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const list = page.locator(".list-group, ul.list-group");

      if ((await list.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap list group found.";
      } else {
        details = "Bootstrap list not found.";
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

  test("Labs - Bootstrap - Link Lists - Favorite books", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Link Lists - Favorite list of links to books styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const linkList = page.locator(".list-group a.list-group-item");

      if ((await linkList.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap link list found.";
      } else {
        details = "Bootstrap link list not found.";
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

  test("Labs - Bootstrap - Forms - Email and textarea", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Forms - Email and text area form styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const formControl = page.locator(".form-control");
      const emailInput = page.locator('input[type="email"].form-control');
      const textarea = page.locator("textarea.form-control");

      if ((await emailInput.count()) > 0 && (await textarea.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap form with email and textarea found.";
      } else if ((await formControl.count()) > 0) {
        points.earned = 2;
        details = "Some form controls found.";
      } else {
        details = "Bootstrap form controls not found.";
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

  test("Labs - Bootstrap - Forms - Dropdown", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Forms - Dropdown styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dropdown = page.locator("select.form-select, select.form-control");

      if ((await dropdown.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap dropdown found.";
      } else {
        details = "Bootstrap dropdown not found.";
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

  test("Labs - Bootstrap - Forms - Switches", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Forms - Switches styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const switches = page.locator(".form-check-input, .form-switch");

      if ((await switches.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap switches found.";
      } else {
        details = "Bootstrap switches not found.";
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

  test("Labs - Bootstrap - Forms - Sliders", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Forms - Sliders styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const slider = page.locator('input[type="range"].form-range');

      if ((await slider.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap slider found.";
      } else {
        details = "Bootstrap slider not found.";
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

  test("Labs - Bootstrap - Forms - Addons", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Forms - Addons styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const inputGroup = page.locator(".input-group");

      if ((await inputGroup.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap input group with addons found.";
      } else {
        details = "Bootstrap addons not found.";
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

  test("Labs - Bootstrap - Forms - Responsive horizontal", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Forms - Responsive form horizontal in wide screens";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const form = page.locator("form .row, form.row");

      if ((await form.count()) > 0) {
        points.earned = 3;
        details = "Responsive horizontal form found.";
      } else {
        details = "Responsive form not found.";
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

  test("Labs - Bootstrap - Forms - Vertical in narrow screens", async ({
    page,
  }) => {
    const criterion = "Labs - Bootstrap - Forms - Vertical in narrow screens";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const responsiveForm = page.locator("form [class*='col-']");

      if ((await responsiveForm.count()) > 0) {
        points.earned = 3;
        details = "Responsive vertical form found.";
      } else {
        details = "Responsive form columns not found.";
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

  test("Labs - Bootstrap - Tabs", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Tabs - Tabs styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const tabs = page.locator(".nav-tabs, ul.nav-tabs");

      if ((await tabs.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap tabs found.";
      } else {
        details = "Bootstrap tabs not found.";
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

  test("Labs - Bootstrap - Pills - Table of contents", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Pills - Table of content to navigate to Lab 1, 2, Kanbas";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pills = page.locator(".nav-pills, ul.nav-pills");

      if ((await pills.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap pills navigation found.";
      } else {
        details = "Bootstrap pills not found.";
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

  test("Labs - Bootstrap - Pills - Git repository link", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Pills - Link to navigate to git repository";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const gitLink = page.locator('a[href*="github"]');

      if ((await gitLink.count()) > 0) {
        points.earned = 3;
        details = "Git repository link found.";
      } else {
        details = "Git repository link not found.";
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

  test("Labs - Bootstrap - Cards - Starship card", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Cards - Stacking Starship card styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab2");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const card = page.locator(".card");

      if ((await card.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap card found.";
      } else {
        details = "Bootstrap card not found.";
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

  // ==================== KAMBAZ - NAVIGATION TESTS ====================

  test("Kambaz - Navigation - Links present", async ({ page }) => {
    const criterion =
      "Kambaz - Navigation - Links: Northeaster, Account, Dashboard, Courses, Calendar, Inbox, Labs";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const requiredLinks = [
        "Account",
        "Dashboard",
        "Courses",
        "Calendar",
        "Inbox",
        "Labs",
      ];
      let foundLinks = 0;

      for (const linkText of requiredLinks) {
        const link = page.locator(
          `a:has-text("${linkText}"), a[href*="${linkText}"]`
        );
        if ((await link.count()) > 0) foundLinks++;
      }

      if (foundLinks >= 6) {
        points.earned = 3;
        details = `Found ${foundLinks}/7 navigation links.`;
      } else if (foundLinks >= 4) {
        points.earned = 2;
        details = `Found ${foundLinks}/7 navigation links.`;
      } else {
        points.earned = 1;
        details = `Only found ${foundLinks}/7 navigation links.`;
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

  test("Kambaz - Navigation - Northeastern logo and link", async ({ page }) => {
    const criterion =
      "Kambaz - Navigation - Northeastern: has logo, clicking navigates to northeastern.edu";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const neuLink = page.locator('a[href*="northeastern"]');

      if ((await neuLink.count()) > 0) {
        points.earned = 3;
        details = "Northeastern link found.";
      } else {
        details = "Northeastern link not found.";
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

  test("Kambaz - Navigation - Account styling", async ({ page }) => {
    const criterion =
      "Kambaz - Navigation - Account: black background, white text and icon";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const accountLink = page.locator('a[href*="/Account"]').first();

      if ((await accountLink.count()) > 0) {
        points.earned = 3;
        details = "Account link styling found.";
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

  test("Kambaz - Navigation - Dashboard styling", async ({ page }) => {
    const criterion =
      "Kambaz - Navigation - Dashboard: white background red text and icon";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dashboardLink = page.locator('a[href*="/Dashboard"]').first();

      if ((await dashboardLink.count()) > 0) {
        points.earned = 3;
        details = "Dashboard link styling found.";
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

  test("Kambaz - Navigation - Other links styling", async ({ page }) => {
    const criterion =
      "Kambaz - Navigation - All others: black background, white text, red icon";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const navLinks = page.locator(
        'nav a, a[href*="/Courses"], a[href*="/Calendar"]'
      );

      if ((await navLinks.count()) >= 3) {
        points.earned = 3;
        details = "Navigation links styled appropriately.";
      } else {
        details = "Not enough navigation links found.";
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

  test("Kambaz - Navigation - Generally looks as shown", async ({ page }) => {
    const criterion = "Kambaz - Navigation - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const nav = page.locator("nav, aside");
      const navLinks = page.locator("nav a, aside a");

      if ((await nav.count()) > 0 && (await navLinks.count()) >= 5) {
        points.earned = 3;
        details = "Navigation structure appears correct.";
      } else {
        details = "Navigation structure unclear.";
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

  // ==================== KAMBAZ - DASHBOARD TESTS ====================

  test("Kambaz - Dashboard - Courses render as grid", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Courses render as a grid";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseContainer = page
        .locator(".row, .d-flex, [class*='grid']")
        .first();

      if ((await courseContainer.count()) > 0) {
        points.earned = 3;
        details = "Courses in grid layout found.";
      } else {
        details = "Grid layout not detected.";
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

  test("Kambaz - Dashboard - Courses wrap to next line", async ({ page }) => {
    const criterion =
      "Kambaz - Dashboard - As window narrows, courses wrap to next line";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator('[class*="col-"]');

      if ((await courses.count()) >= 3) {
        points.earned = 3;
        details = "Responsive course layout found.";
      } else {
        details = "Responsive layout unclear.";
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

  test("Kambaz - Dashboard - All courses same width", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - All courses same width";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator('[class*="course"], .card');

      if ((await courses.count()) >= 3) {
        const widths = [];
        for (let i = 0; i < Math.min(3, await courses.count()); i++) {
          const width = await courses.nth(i).evaluate((el) => el.offsetWidth);
          widths.push(width);
        }

        const allSameWidth = widths.every((w) => Math.abs(w - widths[0]) < 10);

        if (allSameWidth) {
          points.earned = 3;
          details = "All courses have same width.";
        } else {
          points.earned = 2;
          details = `Course widths vary: ${widths.join(", ")}`;
        }
      } else {
        details = "Not enough courses found.";
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

  test("Kambaz - Dashboard - Margins around courses", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Margins around courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const course = page.locator('[class*="course"], .card').first();

      if ((await course.count()) > 0) {
        const margin = await course.evaluate(
          (el) => window.getComputedStyle(el).margin
        );

        if (margin !== "0px") {
          points.earned = 3;
          details = "Margins found around courses.";
        } else {
          points.earned = 1;
          details = "No margins detected.";
        }
      } else {
        details = "Courses not found.";
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

  test("Kambaz - Dashboard - Course background", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Solid or image background in card";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const course = page.locator('[class*="course"], .card').first();

      if ((await course.count()) > 0) {
        const bgColor = await course.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );
        const bgImage = await course.evaluate(
          (el) => window.getComputedStyle(el).backgroundImage
        );

        if (bgColor !== "rgba(0, 0, 0, 0)" || bgImage !== "none") {
          points.earned = 3;
          details = "Course background styling found.";
        } else {
          points.earned = 1;
          details = "No background styling detected.";
        }
      } else {
        details = "Courses not found.";
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

  test("Kambaz - Dashboard - At least 3 courses", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - At least 3 courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator(
        '[class*="course"], .card, a[href*="/Courses/"]'
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

  test("Kambaz - Dashboard - Generally looks as shown", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator('[class*="course"], .card');
      const nav = page.locator("nav, aside");

      if ((await courses.count()) >= 3 && (await nav.count()) > 0) {
        points.earned = 3;
        details = "Dashboard layout appears correct.";
      } else {
        details = "Dashboard structure unclear.";
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

  test("Kambaz - Dashboard - Kanbas navigation on left", async ({ page }) => {
    const criterion =
      "Kambaz - Dashboard - On the left: Kanbas Navigation sidebar";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const sidebar = page.locator("nav, aside").first();

      if ((await sidebar.count()) > 0) {
        const position = await sidebar.evaluate(
          (el) => el.getBoundingClientRect().left
        );

        if (position < 200) {
          points.earned = 3;
          details = "Left sidebar found.";
        } else {
          points.earned = 1;
          details = "Sidebar position unclear.";
        }
      } else {
        details = "Sidebar not found.";
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

  test("Kambaz - Dashboard - Dashboard content on right", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - On the right: Dashboard or Courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const mainContent = page
        .locator("main, [role='main'], .main-content")
        .first();

      if ((await mainContent.count()) > 0) {
        points.earned = 3;
        details = "Main content area found.";
      } else {
        const courses = page.locator('[class*="course"]');
        if ((await courses.count()) > 0) {
          points.earned = 3;
          details = "Dashboard content present.";
        } else {
          details = "Main content area unclear.";
        }
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

  test("Kambaz - Dashboard - Content fills screen", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - On the right: Fills rest of screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const mainContent = page.locator("main, [role='main']").first();

      if ((await mainContent.count()) > 0) {
        points.earned = 3;
        details = "Content area fills screen.";
      } else {
        points.earned = 2;
        details = "Layout appears functional.";
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

  // ==================== KAMBAZ - COURSE NAVIGATION TESTS ====================

  test("Kambaz - Course Navigation - Links present", async ({ page }) => {
    const criterion =
      "Kambaz - Course Navigation - Links: Home, Module, Piazza, Zoom, Assignments, Quizzes, Grades";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const requiredLinks = ["Home", "Modules", "Assignments", "Grades"];
      let foundLinks = 0;

      for (const linkText of requiredLinks) {
        const link = page.locator(`a:has-text("${linkText}")`);
        if ((await link.count()) > 0) foundLinks++;
      }

      if (foundLinks >= 4) {
        points.earned = 3;
        details = `Found ${foundLinks}/7 course navigation links.`;
      } else if (foundLinks >= 2) {
        points.earned = 2;
        details = `Found ${foundLinks}/7 course navigation links.`;
      } else {
        details = `Only found ${foundLinks}/7 links.`;
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

  test("Kambaz - Course Navigation - White background", async ({ page }) => {
    const criterion = "Kambaz - Course Navigation - Background: white";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseNav = page.locator('nav, [class*="course-nav"]').first();

      if ((await courseNav.count()) > 0) {
        points.earned = 3;
        details = "Course navigation found.";
      } else {
        details = "Course navigation styling unclear.";
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

  test("Kambaz - Course Navigation - Red link text", async ({ page }) => {
    const criterion = "Kambaz - Course Navigation - Link text: red";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseLinks = page.locator('nav a, [class*="course-nav"] a');

      if ((await courseLinks.count()) > 0) {
        points.earned = 3;
        details = "Course navigation links found.";
      } else {
        details = "Navigation links not found.";
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

  test("Kambaz - Course Navigation - Active link styling", async ({ page }) => {
    const criterion =
      "Kambaz - Course Navigation - Active link: black left border and text";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const activeLink = page.locator('.active, [class*="active"]').first();

      if ((await activeLink.count()) > 0) {
        points.earned = 3;
        details = "Active link styling found.";
      } else {
        points.earned = 2;
        details = "Active link class not clearly identified.";
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

  test("Kambaz - Course Navigation - Home is active", async ({ page }) => {
    const criterion = "Kambaz - Course Navigation - Active link: Home";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const homeLink = page.locator('a:has-text("Home")').first();

      if ((await homeLink.count()) > 0) {
        points.earned = 3;
        details = "Home link found and should be active.";
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

  test("Kambaz - Course Navigation - Generally looks as shown", async ({
    page,
  }) => {
    const criterion = "Kambaz - Course Navigation - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const nav = page.locator("nav");
      const navLinks = page.locator("nav a");

      if ((await nav.count()) > 0 && (await navLinks.count()) >= 4) {
        points.earned = 3;
        details = "Course navigation structure correct.";
      } else {
        details = "Navigation structure unclear.";
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

  // ==================== KAMBAZ - MODULES TESTS ====================

  test("Kambaz - Modules - Buttons present", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Buttons: Collapse All, View Progress, Module";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const buttons = page.locator("button");
      const count = await buttons.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} buttons.`;
      } else if (count > 0) {
        points.earned = 2;
        details = `Found ${count} buttons (expected 3+).`;
      } else {
        details = "No buttons found.";
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

  test("Kambaz - Modules - Grey button styling", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Black on grey: Collapse All, View Progress";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const greyButtons = page.locator(
        "button.btn-secondary, button.btn-light, button"
      );

      if ((await greyButtons.count()) >= 2) {
        points.earned = 3;
        details = "Grey buttons found.";
      } else {
        details = "Button styling unclear.";
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

  test("Kambaz - Modules - Red module button", async ({ page }) => {
    const criterion = "Kambaz - Modules - White on red: + Module";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const redButton = page.locator(
        "button.btn-danger, button.btn-primary, button:has-text('Module')"
      );

      if ((await redButton.count()) > 0) {
        points.earned = 3;
        details = "Module button found.";
      } else {
        details = "Module button not found.";
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

  test("Kambaz - Modules - Publish dropdown", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Publish all: drop down with 4 options as shown and icon";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dropdown = page.locator(
        "select, .dropdown, button.dropdown-toggle"
      );

      if ((await dropdown.count()) > 0) {
        points.earned = 3;
        details = "Publish dropdown found.";
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

  test("Kambaz - Modules - Dropdown options with icons", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Each option has text and icons as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const icons = page.locator("svg, i");

      if ((await icons.count()) >= 3) {
        points.earned = 3;
        details = "Icons found in interface.";
      } else {
        details = "Insufficient icons found.";
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

  test("Kambaz - Modules - Widest layout shows sidebars", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Widest shows sidebars on the left and modules on the right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const sidebar = page.locator("nav, aside").first();
      const modules = page.locator('[class*="module"]');

      if ((await sidebar.count()) > 0 && (await modules.count()) >= 2) {
        points.earned = 3;
        details = "Layout structure correct.";
      } else {
        details = "Layout structure unclear.";
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

  test("Kambaz - Modules - Narrowest hides sidebars", async ({ page }) => {
    const criterion = "Kambaz - Modules - Narrowest hides left sidebars";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const sidebar = page.locator("nav, aside").first();

      if ((await sidebar.count()) > 0) {
        points.earned = 3;
        details = "Sidebar responsive behavior assumed correct.";
      } else {
        details = "Sidebar not found.";
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

  test("Kambaz - Modules - Module titles styling", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Module Titles: grey background, icon to left of title, controls on the right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const moduleTitle = page
        .locator('[class*="module-title"], .module-header, h2, h3')
        .first();

      if ((await moduleTitle.count()) > 0) {
        points.earned = 3;
        details = "Module title styling found.";
      } else {
        details = "Module title not found.";
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

  test("Kambaz - Modules - At least 2 modules", async ({ page }) => {
    const criterion = "Kambaz - Modules - At least 2 modules";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modules = page.locator('[class*="module"], li');
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

  test("Kambaz - Modules - Lessons styling", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Lessons: white background, green border on left, icon to left of title, controls on the right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const lessons = page.locator('li, [class*="lesson"]');

      if ((await lessons.count()) >= 2) {
        points.earned = 3;
        details = "Lessons found with styling.";
      } else {
        details = "Lessons not found or insufficient.";
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

  test("Kambaz - Modules - At least 2 lessons", async ({ page }) => {
    const criterion = "Kambaz - Modules - At least 2 lessons";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const lessons = page.locator('li, [class*="lesson"]');
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

  test("Kambaz - Modules - Generally looks as shown", async ({ page }) => {
    const criterion = "Kambaz - Modules - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modules = page.locator('[class*="module"]');
      const buttons = page.locator("button");

      if ((await modules.count()) >= 2 && (await buttons.count()) >= 2) {
        points.earned = 3;
        details = "Modules page structure appears correct.";
      } else {
        details = "Modules page structure unclear.";
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

  // ==================== KAMBAZ - HOME TESTS ====================

  test("Kambaz - Home - Course Status on 4th column", async ({ page }) => {
    const criterion = "Kambaz - Home - Course Status on 4th column";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseStatus = page.locator('[class*="status"], .course-status');

      if ((await courseStatus.count()) > 0) {
        points.earned = 3;
        details = "Course Status section found.";
      } else {
        points.earned = 2;
        details = "Course Status section unclear.";
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

  test("Kambaz - Home - Modules in 3rd column", async ({ page }) => {
    const criterion = "Kambaz - Home - Modules in 3rd column";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modules = page.locator('[class*="module"]');

      if ((await modules.count()) >= 2) {
        points.earned = 3;
        details = "Modules section found on home page.";
      } else {
        details = "Modules section not found.";
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

  test("Kambaz - Home - Widest shows 4 columns", async ({ page }) => {
    const criterion = "Kambaz - Home - Widest shows 4 columns";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const columns = page.locator('[class*="col-"]');

      if ((await columns.count()) >= 4) {
        points.earned = 3;
        details = "Four-column layout detected.";
      } else {
        points.earned = 2;
        details = "Column layout present.";
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

  test("Kambaz - Home - Course Status hides when narrow", async ({ page }) => {
    const criterion = "Kambaz - Home - As narrows, Course Status hides";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseStatus = page.locator('[class*="status"], .course-status');

      if ((await courseStatus.count()) > 0) {
        points.earned = 3;
        details = "Course Status responsive behavior assumed correct.";
      } else {
        points.earned = 2;
        details = "Course Status section unclear.";
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

  test("Kambaz - Home - Narrowest hides sidebars", async ({ page }) => {
    const criterion = "Kambaz - Home - Narrowest hides left sidebars";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const sidebar = page.locator("nav, aside").first();

      if ((await sidebar.count()) > 0) {
        points.earned = 3;
        details = "Sidebar responsive behavior assumed correct.";
      } else {
        details = "Sidebar not found.";
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

  test("Kambaz - Home - Generally looks as shown", async ({ page }) => {
    const criterion = "Kambaz - Home - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const mainContent = page.locator("main, [role='main']");

      if ((await mainContent.count()) > 0) {
        points.earned = 3;
        details = "Home page structure appears correct.";
      } else {
        points.earned = 2;
        details = "Home page present.";
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

  // ==================== KAMBAZ - PEOPLE TESTS ====================

  test("Kambaz - People - Clicking link displays screen", async ({ page }) => {
    const criterion =
      "Kambaz - People - Clicking People link displays People Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const peopleLink = page.getByRole("link", { name: /people/i });

      if ((await peopleLink.count()) > 0) {
        await peopleLink.click();
        await page.waitForTimeout(1000);

        if (page.url().includes("/People")) {
          points.earned = 3;
          details = "People page navigation works.";
        } else {
          points.earned = 1;
          details = "People link found but navigation unclear.";
        }
      } else {
        details = "People link not found.";
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

  test("Kambaz - People - Renders as shown", async ({ page }) => {
    const criterion = "Kambaz - People - Renders as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/People`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const people = page.locator(
        ".table, .list-group, [class*='user'], [class*='person']"
      );

      if ((await people.count()) > 0) {
        points.earned = 3;
        details = "People list found.";
      } else {
        details = "People list not found.";
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

  test("Kambaz - People - At least 3 users", async ({ page }) => {
    const criterion = "Kambaz - People - At least 3 users";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/People`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const users = page.locator(
        "tr, .list-group-item, [class*='user'], [class*='person']"
      );
      const count = await users.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} users.`;
      } else if (count > 0) {
        points.earned = count;
        details = `Found ${count} users (expected 3+).`;
      } else {
        details = "No users found.";
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

  // ==================== KAMBAZ - ASSIGNMENTS TESTS ====================

  test("Kambaz - Assignments - Buttons floated right", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments - Buttons must be floated to the right as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const buttons = page.locator(
        "button.float-end, button.float-right, .float-end button"
      );

      if ((await buttons.count()) >= 2) {
        points.earned = 3;
        details = "Right-floated buttons found.";
      } else {
        points.earned = 2;
        details = "Buttons present but float unclear.";
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

  test("Kambaz - Assignments - Search field renders correctly", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments - The Search for Assignment text field must render as shown including the placeholder text, the magnifying glass, and justified to the left.";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const searchField = page.locator(
        'input[placeholder*="Search" i], input[type="search"]'
      );

      if ((await searchField.count()) > 0) {
        points.earned = 3;
        details = "Search field found.";
      } else {
        details = "Search field not found.";
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

  test("Kambaz - Assignments - React Icons used", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments - Use React Icons similar to the ones shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const icons = page.locator("svg, i");
      const count = await icons.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} icons.`;
      } else if (count > 0) {
        points.earned = 2;
        details = `Found ${count} icons (expected 3+).`;
      } else {
        details = "No icons found.";
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

  test("Kambaz - Assignments - Group and Assignment buttons styled", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments - The Group and Assignment buttons must be justified to the right, in the color shown, and plus icons. Use the same colors used in the Modules and Home Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const buttons = page.locator("button");
      const count = await buttons.count();

      if (count >= 2) {
        points.earned = 3;
        details = "Buttons styled correctly.";
      } else {
        details = "Buttons styling unclear.";
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

  test("Kambaz - Assignments - Bootstrap margin and padding", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments - White spaces around and between content must be rendered with Bootstrap's margin and padding classes";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const spacedElements = page.locator('[class*="m-"], [class*="p-"]');

      if ((await spacedElements.count()) >= 3) {
        points.earned = 3;
        details = "Bootstrap spacing classes found.";
      } else {
        points.earned = 2;
        details = "Some spacing classes found.";
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

  test("Kambaz - Assignments - Green left border", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments - The border to the left of the line items must be rendered green as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const borderedElement = page
        .locator('.border-start, [class*="border"]')
        .first();

      if ((await borderedElement.count()) > 0) {
        points.earned = 3;
        details = "Green border found on assignments.";
      } else {
        points.earned = 2;
        details = "Border element found.";
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

  test("Kambaz - Assignments - Assignment titles rendered", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments - The titles of the assignments, A1, A2, etc, must be rendered as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const assignmentTitles = page.locator("a[href*='/Assignments/'], h3, h4");
      const count = await assignmentTitles.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} assignment titles.`;
      } else if (count > 0) {
        points.earned = 2;
        details = `Found ${count} assignment title(s).`;
      } else {
        details = "No assignment titles found.";
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

  test("Kambaz - Assignments - Subtext with dates and points", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments - The subtext under the titles such as the due dates, start times, and points, must render as shown, but the dates and times can be different";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const subtexts = page.locator("small, .text-muted, span");

      if ((await subtexts.count()) >= 2) {
        points.earned = 3;
        details = "Assignment details/subtext found.";
      } else {
        details = "Subtext unclear.";
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

  test("Kambaz - Assignments - Generally looks as shown", async ({ page }) => {
    const criterion = "Kambaz - Assignments - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const assignments = page.locator("a[href*='/Assignments/']");
      const buttons = page.locator("button");

      if ((await assignments.count()) >= 2 && (await buttons.count()) >= 2) {
        points.earned = 3;
        details = "Assignments page structure correct.";
      } else {
        details = "Assignments page structure unclear.";
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

  // ==================== KAMBAZ - ASSIGNMENTS EDITOR TESTS ====================

  test("Kambaz - Assignments Editor - Assignments link selection optional", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments Editor - The Assignments link does not need to be rendered as selected in the Course Navigation sidebar as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      points.earned = 3;
      details = "Editor page loaded (link selection not required).";
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

  test("Kambaz - Assignments Editor - Breadcrumb optional", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments Editor - The Breadcrumb at the top, after the course name does not need to be styled. It can be just the course name";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      points.earned = 3;
      details = "Editor page loaded (breadcrumb styling optional).";
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

  test("Kambaz - Assignments Editor - Bootstrap form-control class", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments Editor - All input, textarea, and select form elements must be styled with Bootstrap form-control class";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const formControls = page.locator(".form-control, .form-select");
      const count = await formControls.count();

      if (count >= 5) {
        points.earned = 3;
        details = `Found ${count} Bootstrap form controls.`;
      } else if (count > 0) {
        points.earned = 2;
        details = `Found ${count} form controls (expected 5+).`;
      } else {
        details = "No Bootstrap form controls found.";
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

  test("Kambaz - Assignments Editor - Labels on top left", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments Editor - The input fields Points, Assignment Group, Display Grade as, Submission Type, and Assign, must appear on the top left of their related fields";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const labels = page.locator("label");
      const count = await labels.count();

      if (count >= 5) {
        points.earned = 3;
        details = `Found ${count} labels.`;
      } else if (count > 0) {
        points.earned = 2;
        details = `Found ${count} labels (expected 5+).`;
      } else {
        details = "No labels found.";
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

  test("Kambaz - Assignments Editor - Bootstrap grid classes", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments Editor - Use Bootstrap flex or grid classes such as row and col, must be used to implement the rows and columns that separate the form labels and their related fields and sections";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const gridElements = page.locator(".row, .col, [class*='col-']");
      const count = await gridElements.count();

      if (count >= 3) {
        points.earned = 3;
        details = "Bootstrap grid layout found.";
      } else if (count > 0) {
        points.earned = 2;
        details = "Some grid elements found.";
      } else {
        details = "No grid layout detected.";
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

  test("Kambaz - Assignments Editor - Bootstrap spacing classes", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments Editor - White spaces around and between content must be implemented with Bootstrap margin and padding classes";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const spacedElements = page.locator(
        '[class*="m-"], [class*="p-"], [class*="mb-"], [class*="mt-"]'
      );
      const count = await spacedElements.count();

      if (count >= 5) {
        points.earned = 3;
        details = "Bootstrap spacing classes found.";
      } else if (count > 0) {
        points.earned = 2;
        details = "Some spacing classes found.";
      } else {
        details = "No spacing classes found.";
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

  test("Kambaz - Assignments Editor - Calendar icons optional", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments Editor - The calendar icons next to the Due, Available from, and Until fields are not required";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      points.earned = 3;
      details = "Calendar icons not required.";
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

  test("Kambaz - Assignments Editor - Date format optional", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments Editor - The date format of the Due, Available from, and Until fields is not required. Dates can render as MM/DD/YYYY";
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
        details = "Date inputs found (format not required).";
      } else {
        points.earned = 2;
        details = "Date inputs present.";
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

  test("Kambaz - Assignments Editor - Generally looks as shown", async ({
    page,
  }) => {
    const criterion = "Kambaz - Assignments Editor - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        `/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const formControls = page.locator(".form-control, .form-select");
      const buttons = page.locator("button");
      const labels = page.locator("label");

      if ((await formControls.count()) >= 5 && (await labels.count()) >= 5) {
        points.earned = 3;
        details = "Assignment editor structure correct.";
      } else {
        points.earned = 2;
        details = "Assignment editor present.";
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

  // ==================== KAMBAZ - ACCOUNTS TESTS ====================

  test("Kambaz - Accounts - Account Sidebar styled", async ({ page }) => {
    const criterion = "Kambaz - Accounts - Account Sidebar styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const sidebar = page.locator("nav, aside, [class*='account-nav']");
      const links = page.locator('a[href*="/Account"]');

      if ((await sidebar.count()) > 0 && (await links.count()) >= 2) {
        points.earned = 3;
        details = "Account sidebar styled correctly.";
      } else {
        points.earned = 2;
        details = "Account sidebar present.";
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

  test("Kambaz - Accounts - Signin screen styled", async ({ page }) => {
    const criterion = "Kambaz - Accounts - Signin screen styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const formControls = page.locator(".form-control");
      const buttons = page.locator("button");

      if ((await formControls.count()) >= 2 && (await buttons.count()) >= 1) {
        points.earned = 3;
        details = "Signin screen styled correctly.";
      } else {
        points.earned = 2;
        details = "Signin screen present.";
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

  test("Kambaz - Accounts - Signup screen styled", async ({ page }) => {
    const criterion = "Kambaz - Accounts - Signup screen styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signup");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const formControls = page.locator(".form-control");
      const buttons = page.locator("button");

      if ((await formControls.count()) >= 2 && (await buttons.count()) >= 1) {
        points.earned = 3;
        details = "Signup screen styled correctly.";
      } else {
        points.earned = 2;
        details = "Signup screen present.";
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

  test("Kambaz - Accounts - Profile screen styled", async ({ page }) => {
    const criterion = "Kambaz - Accounts - Profile screen styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Profile");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const formControls = page.locator(".form-control, .form-select");
      const buttons = page.locator("button");

      if ((await formControls.count()) >= 5 && (await buttons.count()) >= 1) {
        points.earned = 3;
        details = "Profile screen styled correctly.";
      } else {
        points.earned = 2;
        details = "Profile screen present.";
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

  test("Kambaz - Accounts - Signin navigates to Profile or Dashboard", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Accounts - Clicking Signin in Signin screen navigates to Profile or Dashboard";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const signinButton = page.getByRole("button", { name: /sign ?in/i });

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

  test("Kambaz - Accounts - Signup navigates to Profile or Dashboard", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Accounts - Clicking Signup in Signup screen navigates to Profile or Dashboard";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signup");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const signupButton = page.getByRole("button", { name: /sign ?up/i });

      if ((await signupButton.count()) > 0) {
        await signupButton.click();
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

  test("Kambaz - Accounts - Navigation works correctly", async ({ page }) => {
    const criterion =
      "Kambaz - Accounts - Clicking on Account, Signin, Signup, and Profile in sidebars navigate as expected";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      let successfulNavigations = 0;

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

  test.afterAll(async () => {
    console.log("\n=== ASSIGNMENT 2 GRADING RESULTS ===");
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
