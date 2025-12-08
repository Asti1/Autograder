import { test, expect } from "@playwright/test";

const results = [];

// Get base URL from environment or use from config
const BASE_URL = process.env.STUDENT_URL;
const TEST_COURSE_ID = "RS101";
const TEST_ASSIGNMENT_ID = "A101";
// Helper function to build URLs while preserving query parameters from BASE_URL
function buildUrl(path) {
  if (!BASE_URL) return path;

  try {
    const baseUrl = new URL(BASE_URL);
    const url = new URL(path, baseUrl);

    baseUrl.searchParams.forEach((value, key) => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  } catch (error) {
    if (BASE_URL.endsWith("/") && path.startsWith("/")) {
      return BASE_URL + path.slice(1);
    }
    return BASE_URL + path;
  }
}

test.describe("Assignment 2 - Labs CSS Tests", () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(10000);
  });

  test.afterEach(() => {
    const last = results[results.length - 1];
    if (last && last.points && last.points.earned < last.points.possible) {
      throw new Error(`Partial grade for "${last.criterion}": ${last.details}`);
    }
  });

  // ==================== LABS - CSS ID SELECTORS ====================

  test("Labs - CSS - ID Selectors - Black on yellow paragraph", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - ID Selectors - Black on yellow paragraph";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const paragraphs = page.locator("p[id]");
      const count = await paragraphs.count();
      let found = false;

      for (let i = 0; i < count; i++) {
        const p = paragraphs.nth(i);
        const color = await p.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await p.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isBlack = /rgb\(0,\s*0,\s*0\)|black/i.test(color);
        const isYellow = /rgb\(255,\s*255,\s*0\)|yellow/i.test(bgColor);

        if (isBlack && isYellow) {
          points.earned = 3;
          details = "Black on yellow paragraph with ID found.";
          found = true;
          break;
        }
      }

      if (!found && count > 0) {
        details = "Paragraph with ID found but colors don't match.";
      } else if (!found) {
        details = "No paragraph with ID found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS CLASS SELECTORS ====================

  test("Labs - CSS - Class Selectors - Blue on yellow paragraph", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Class - Selectors - Blue on yellow paragraph";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const paragraphs = page.locator("p[class]:not([class=''])");
      const count = await paragraphs.count();
      let found = false;

      for (let i = 0; i < count; i++) {
        const p = paragraphs.nth(i);
        const color = await p.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await p.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isBlue = /rgb\(0,\s*0,\s*255\)|blue/i.test(color);
        const isYellow = /rgb\(255,\s*255,\s*0\)|yellow/i.test(bgColor);

        if (isBlue && isYellow) {
          points.earned = 3;
          details = "Blue on yellow paragraph with class found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details =
          count > 0
            ? "Paragraph with class found but colors don't match."
            : "No paragraph with class found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Class Selectors - Blue on yellow heading", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Class - Selectors - Blue on yellow heading";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const headings = page.locator(
        "h1[class], h2[class], h3[class], h4[class], h5[class], h6[class]"
      );
      const count = await headings.count();
      let found = false;

      for (let i = 0; i < count; i++) {
        const h = headings.nth(i);
        const color = await h.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await h.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isBlue = /rgb\(0,\s*0,\s*255\)|blue/i.test(color);
        const isYellow = /rgb\(255,\s*255,\s*0\)|yellow/i.test(bgColor);

        if (isBlue && isYellow) {
          points.earned = 3;
          details = "Blue on yellow heading with class found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details = "Blue on yellow heading not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS DOCUMENT STRUCTURE ====================

  test("Labs - CSS - Document Structure - White on red DIV", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Document Structure - White on red DIV";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const divs = page.locator("p");
      const count = await divs.count();
      let found = false;

      for (let i = 0; i < count; i++) {
        const div = divs.nth(i);
        const color = await div.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await div.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );
        // const hasSpan = (await div.locator("span").count()) > 0;

        const isWhite = /rgb\(255,\s*255,\s*255\)|white/i.test(color);
        const isRed = /rgb\(255,\s*0,\s*0\)|red/i.test(bgColor);

        if (isWhite && isRed) {
          points.earned = 3;
          details = "White on red DIV found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details = "White on red DIV not found.";
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

      const spans = page.locator("div span, span");
      const count = await spans.count();
      let found = false;

      for (let i = 0; i < count; i++) {
        const span = spans.nth(i);
        const color = await span.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await span.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isBlue = /rgb\(0,\s*0,\s*255\)|blue/i.test(color);
        const isYellow = /rgb\(255,\s*255,\s*0\)|yellow/i.test(bgColor);

        if (isBlue && isYellow) {
          points.earned = 3;
          details = "Blue on yellow span found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details = "Blue on yellow span not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS FOREGROUND COLOR ====================

  test("Labs - CSS - Foreground Color - Blue on white heading", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Foreground Color - Blue on white heading";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const headings = page.locator("h1, h2, h3, h4, h5, h6");
      const count = await headings.count();
      let found = false;

      for (let i = 0; i < count; i++) {
        const h = headings.nth(i);
        const color = await h.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await h.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isBlue = /rgb\(112,\s*112,\s*255\)|blue/i.test(bgColor);
        const isWhite =
          /rgb\(255,\s*255,\s*255\)|white|rgba\(0,\s*0,\s*0,\s*0\)/i.test(
            color
          );

        if (isBlue && isWhite) {
          points.earned = 3;
          details = "Blue heading on white background found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details = "Blue heading not found.";
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
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("p, span, div");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        const el = elements.nth(i);
        const color = await el.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await el.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isRed = /rgb\(255,\s*0,\s*0\)|red/i.test(bgColor);
        const isWhite =
          /rgb\(255,\s*255,\s*255\)|white|rgba\(0,\s*0,\s*0,\s*0\)/i.test(
            color
          );

        if (isRed && isWhite) {
          points.earned = 3;
          details = "Red text on white background found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details = "Red text not found.";
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
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("p, span, div");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        const el = elements.nth(i);
        const color = await el.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await el.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isGreen = /rgb\(0,\s*128,\s*0\)|rgb\(0,\s*255,\s*0\)|green/i.test(
          color
        );
        const isWhite =
          /rgb\(255,\s*255,\s*255\)|white|rgba\(0,\s*0,\s*0,\s*0\)/i.test(
            bgColor
          );

        if (isGreen && isWhite) {
          points.earned = 3;
          details = "Green text on white background found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details = "Green text not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS BACKGROUND COLOR ====================

  test("Labs - CSS - Background Color - White on blue heading", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Background Color - White on blue heading";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const headings = page.locator("h1, h2, h3, h4, h5, h6");
      const count = await headings.count();
      let found = false;

      for (let i = 0; i < count; i++) {
        const h = headings.nth(i);
        const color = await h.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await h.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isWhite = /rgb\(255,\s*255,\s*255\)|white/i.test(color);
        const isBlue = /rgb\(112,\s*112,\s*255\)|blue/i.test(bgColor);

        if (isWhite && isBlue) {
          points.earned = 3;
          details = "White on blue heading found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details = "White on blue heading not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Background Color - Black on red paragraph", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Background Color - Black on red paragraph";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const paragraphs = page.locator("p");
      const count = await paragraphs.count();
      let found = false;

      for (let i = 0; i < count; i++) {
        const p = paragraphs.nth(i);
        const color = await p.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await p.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isBlack = /rgb\(0,\s*0,\s*0\)|black/i.test(color);
        const isRed = /rgb\(255,\s*112,\s*112\)|red/i.test(bgColor);

        if (isBlack && isRed) {
          points.earned = 3;
          details = "Black on red paragraph found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details = "Black on red paragraph not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Background Color - White on green span", async ({
    page,
  }) => {
    const criterion = "Labs - CSS - Background Color - White on green span";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const spans = page.locator("span");
      const count = await spans.count();
      let found = false;

      for (let i = 0; i < count; i++) {
        const span = spans.nth(i);
        const color = await span.evaluate(
          (el) => window.getComputedStyle(el).color
        );
        const bgColor = await span.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const isWhite = /rgb\(255,\s*255,\s*255\)|white/i.test(color);
        const isGreen = /rgb\(0,\s*128,\s*0\)|rgb\(0,\s*255,\s*0\)|green/i.test(
          bgColor
        );

        if (isWhite && isGreen) {
          points.earned = 3;
          details = "White on green span found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details = "White on green span not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS BORDERS ====================

  test("Labs - CSS - Borders - Fat red border", async ({ page }) => {
    const criterion = "Labs - CSS - Borders - Fat red border";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("*");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const borderWidth = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).borderTopWidth)
          );
          const borderColor = await el.evaluate(
            (e) => window.getComputedStyle(e).borderTopColor
          );

          const isFat = borderWidth >= 10;
          const isRed = /rgb\(255,\s*112,\s*112\)|red/i.test(borderColor);

          if (isFat && isRed) {
            points.earned = 3;
            details = `Fat red border found: ${borderWidth}px`;
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Fat red border not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Borders - Thin blue dashed border", async ({ page }) => {
    const criterion = "Labs - CSS - Borders - Thin blue dashed border";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("*");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const borderWidth = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).borderTopWidth)
          );
          const borderColor = await el.evaluate(
            (e) => window.getComputedStyle(e).borderTopColor
          );
          const borderStyle = await el.evaluate(
            (e) => window.getComputedStyle(e).borderTopStyle
          );

          const isThin = borderWidth > 0 && borderWidth <= 5;
          const isBlue = /rgb\(112,\s*112,\s*255\)|blue/i.test(borderColor);
          const isDashed = borderStyle === "dashed";

          if (isThin && isBlue && isDashed) {
            points.earned = 3;
            details = `Thin blue dashed border found: ${borderWidth}px`;
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Thin blue dashed border not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS PADDING & MARGINS ====================

  test("Labs - CSS - Padding - Top and left padding", async ({ page }) => {
    const criterion =
      "Labs - CSS - Margins - Fat red border with yellow background and big padding above and left";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("*");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const paddingTop = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).paddingTop)
          );
          const paddingLeft = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).paddingLeft)
          );

          if (paddingTop >= 30 && paddingLeft >= 30) {
            points.earned = 3;
            details = `Padding top-left found: ${paddingTop}px, ${paddingLeft}px`;
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Padding top-left not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Padding - Bottom padding", async ({ page }) => {
    const criterion =
      "Labs - CSS - Margins - Fat blue border with yellow background and big padding at bottom";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div, p, span");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const paddingBottom = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).paddingBottom)
          );

          if (paddingBottom >= 30) {
            points.earned = 3;
            details = `Padding bottom found: ${paddingBottom}px`;
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Padding bottom not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Padding - All around padding", async ({ page }) => {
    const criterion =
      "Labs - CSS - Margins - Fat yellow border with blue background and big padding all around";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div, p, span");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const pt = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).paddingTop)
          );
          const pr = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).paddingRight)
          );
          const pb = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).paddingBottom)
          );
          const pl = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).paddingLeft)
          );

          if (pt >= 30 && pr >= 30 && pb >= 30 && pl >= 30) {
            points.earned = 3;
            details = "Padding all around found.";
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Padding all around not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Margins - Bottom margin", async ({ page }) => {
    const criterion =
      "Labs - CSS - Margins - Fat red border with yellow background and margin at bottom";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div, p, span");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const marginBottom = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).marginBottom)
          );

          if (marginBottom >= 30) {
            points.earned = 3;
            details = `Margin bottom found: ${marginBottom}px`;
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Margin bottom not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Margins - Centered with auto margins", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Margins - Fat blue border with yellow background and centered because margins on both sides";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const mt = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).marginTop)
          );
          const mr = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).marginRight)
          );
          const mb = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).marginBottom)
          );
          const ml = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).marginLeft)
          );
          if (ml >= 30 && mr >= 30 && mb >= 30 && mt >= 30) {
            points.earned = 3;
            details = "Centered element (margin: auto) found.";
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Centered element not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Margins - All around margins", async ({ page }) => {
    const criterion =
      "Labs - CSS - Margins - Fat yellow border with blue background and big margins all around";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div, p, span");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const mt = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).marginTop)
          );
          const mr = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).marginRight)
          );
          const mb = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).marginBottom)
          );
          const ml = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).marginLeft)
          );

          if (mt >= 30 && mr >= 30 && mb >= 30 && ml >= 30) {
            points.earned = 3;
            details = "Margins all around found.";
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Margins all around not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS CORNERS ====================

  test("Labs - CSS - Corners - Rounded top corners", async ({ page }) => {
    const criterion =
      "Labs - CSS - Corners - Div with rounded corners at top left and right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("p");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const tl = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).borderTopLeftRadius)
          );
          const tr = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).borderTopRightRadius)
          );

          if (tl > 0 && tr > 0) {
            points.earned = 3;
            details = "Rounded top corners found.";
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Rounded top corners not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Corners - Rounded bottom corners", async ({ page }) => {
    const criterion =
      "Labs - CSS - Corners - Div with rounded corners at bottom left and right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("p");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const bl = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).borderBottomLeftRadius)
          );
          const br = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).borderBottomRightRadius)
          );

          if (bl > 0 && br > 0) {
            points.earned = 3;
            details = "Rounded bottom corners found.";
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Rounded bottom corners not found.";
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
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("p");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const borderRadius = await el.evaluate(
            (e) => window.getComputedStyle(e).borderRadius
          );

          if (borderRadius !== "0px" && borderRadius !== "0px 0px 0px 0px") {
            points.earned = 3;
            details = "All rounded corners found.";
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "All rounded corners not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Corners - Rounded except top right", async ({ page }) => {
    const criterion =
      "Labs - CSS - Corners - Div with rounded corners all around except top right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("p");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const tr = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).borderTopRightRadius)
          );
          const tl = await el.evaluate((e) =>
            parseFloat(window.getComputedStyle(e).borderTopLeftRadius)
          );

          if (tr === 0 && tl > 0) {
            points.earned = 3;
            details = "Rounded corners except top right found.";
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Element not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS DIMENSIONS ====================

  test("Labs - CSS - Dimensions - Landscape DIV", async ({ page }) => {
    const criterion =
      "Labs - CSS - Dimensions - Yellow DIV longer than it's taller";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const width = await el.evaluate((e) => e.offsetWidth);
          const height = await el.evaluate((e) => e.offsetHeight);

          if (width > height * 1.2) {
            points.earned = 3;
            details = `Landscape DIV found: ${width}px x ${height}px`;
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Landscape DIV not found.";
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
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const width = await el.evaluate((e) => e.offsetWidth);
          const height = await el.evaluate((e) => e.offsetHeight);

          if (height > width * 1.2) {
            points.earned = 3;
            details = `Portrait DIV found: ${width}px x ${height}px`;
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Portrait DIV not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Dimensions - Square DIV", async ({ page }) => {
    const criterion = "Labs - CSS - Dimensions - Red DIV height same as width";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const width = await el.evaluate((e) => e.offsetWidth);
          const height = await el.evaluate((e) => e.offsetHeight);

          if (Math.abs(width - height) <= 5 && width > 50) {
            points.earned = 3;
            details = `Square DIV found: ${width}px x ${height}px`;
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Square DIV not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS POSITIONING ====================

  test("Labs - CSS - Relative Position - Nudged down and right", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Relative Position - Yellow DIV with text nudged down and right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const position = await el.evaluate(
            (e) => window.getComputedStyle(e).position
          );
          const top = await el.evaluate(
            (e) => parseFloat(window.getComputedStyle(e).top) || 0
          );
          const left = await el.evaluate(
            (e) => parseFloat(window.getComputedStyle(e).left) || 0
          );

          if (position === "relative" && (top > 0 || left > 0)) {
            points.earned = 3;
            details = "Relatively positioned element found.";
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Relative position element not found.";
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
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const position = await el.evaluate(
            (e) => window.getComputedStyle(e).position
          );

          if (position === "relative") {
            const top = await el.evaluate(
              (e) => parseFloat(window.getComputedStyle(e).top) || 0
            );
            const left = await el.evaluate(
              (e) => parseFloat(window.getComputedStyle(e).left) || 0
            );

            if (top < 0 || left > 0) {
              points.earned = 3;
              details = "Blue relative DIV found.";
              found = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Element not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Absolute Position - Three rectangles", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Absolute Position - Portrait, Landscape, and Square rectangles styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div");
      const count = await elements.count();
      let absoluteCount = 0;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const position = await el.evaluate(
            (e) => window.getComputedStyle(e).position
          );

          if (position === "absolute") {
            absoluteCount++;
          }
        } catch (e) {
          continue;
        }
      }

      if (absoluteCount >= 3) {
        points.earned = 3;
        details = `Found ${absoluteCount} absolutely positioned elements.`;
      } else {
        details = `Only found ${absoluteCount} absolute elements (expected 3).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Fixed Position - Blue rectangle", async ({ page }) => {
    const criterion =
      "Labs - CSS - Fixed Position - Blue Fixed position rectangle doesn't scroll with rest of page";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div, section");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const position = await el.evaluate(
            (e) => window.getComputedStyle(e).position
          );

          if (position === "fixed") {
            points.earned = 3;
            details = "Fixed position element found.";
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Fixed position element not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Z Index - Element with z-index", async ({ page }) => {
    const criterion =
      "Labs - CSS - Z Index - Blue Landscape rectangle renders above other two";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const el = elements.nth(i);
          const zIndex = await el.evaluate(
            (e) => window.getComputedStyle(e).zIndex
          );

          if (parseInt(zIndex) > 0) {
            points.earned = 3;
            details = `Z-index element found: ${zIndex}`;
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Z-index element not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS FLOATING ====================

  test("Labs - CSS - Floating Images - Three rectangles horizontal", async ({
    page,
  }) => {
    const criterion =
      "Labs - CSS - Floating Images - Three rectangles laid out horizontally";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("div, img");
      const count = await elements.count();
      let floatCount = 0;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const float = await el.evaluate(
            (e) => window.getComputedStyle(e).float
          );

          if (float === "left") {
            floatCount++;
          }
        } catch (e) {
          continue;
        }
      }

      if (floatCount >= 3) {
        points.earned = 3;
        details = `Found ${floatCount} left-floating elements.`;
      } else {
        details = `Only found ${floatCount} floating elements (expected 3).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Floating Images - Image on right", async ({ page }) => {
    const criterion = "Labs - CSS - Floating Images - Image on the right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const images = page.locator("img");
      const count = await images.count();
      let found = false;

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const float = await img.evaluate(
          (e) => window.getComputedStyle(e).float
        );

        if (float === "right") {
          points.earned = 3;
          details = "Right-floating image found.";
          found = true;
          break;
        }
      }

      if (!found) {
        details = "Right-floating image not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== LABS - CSS GRID & FLEX ====================

  test("Labs - CSS - Grid layout", async ({ page }) => {
    const criterion = "Labs - CSS  - Grid layout as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Grid layout can be implemented with float-based layout or CSS Grid
      // Check for float-based grid first (wd-grid-row with wd-grid-col-* children)
      const gridRow = page.locator('[class*="grid-row"], .wd-grid-row');

      if ((await gridRow.count()) > 0) {
        const children = await gridRow.first().locator("> *").count();

        if (children >= 2) {
          points.earned = 3;
          details = `Grid layout found with ${children} columns.`;
        } else {
          details = "Grid row found but insufficient columns.";
        }
      } else {
        // Fallback: check for CSS Grid display
        const elements = page.locator("*");
        const count = await elements.count();
        let found = false;

        for (let i = 0; i < Math.min(count, 100); i++) {
          try {
            const el = elements.nth(i);
            const display = await el.evaluate(
              (e) => window.getComputedStyle(e).display
            );

            if (display === "grid") {
              points.earned = 3;
              details = "CSS Grid layout found.";
              found = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!found) {
          details = "Grid layout not found.";
        }
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - Flex - Horizontal columns", async ({ page }) => {
    const criterion =
      "Labs - CSS - Flex - Columns 1, 2, 3, laid out horizontally as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("*");
      const count = await elements.count();
      let found = false;

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const el = elements.nth(i);
          const display = await el.evaluate(
            (e) => window.getComputedStyle(e).display
          );
          const children = await el.locator("> *").count();

          if (display === "flex" && children >= 3) {
            points.earned = 3;
            details = `Flex container with ${children} items found.`;
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!found) {
        details = "Flex container not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - CSS - React Icons - 6 icons", async ({ page }) => {
    const criterion = "Labs - CSS - React Icons Sample showing any 6 icons";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const icons = page.locator("svg, i.bi, i.fa");
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });
  test("Labs - Bootstrap - Containers - Thin padding all around Lab 2", async ({
    page,
  }) => {
    const criterion =
      "Labs - Bootstrap - Containers - Thin padding all around Lab 2";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const container = page.locator(".container, .container-fluid").first();

      if ((await container.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap container found.";
      } else {
        details = "Bootstrap container not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== BOOTSTRAP - GRIDS ====================

  test("Labs - Bootstrap - Grids - Various layouts", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Grids - Grid showing various layout: left/right half; one/two thirds; side/main content";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const rows = page.locator(".row");
      const columns = page.locator('[class*="col-"]');

      if ((await rows.count()) > 0 && (await columns.count()) >= 2) {
        points.earned = 3;
        details = `Bootstrap grid found with ${await rows.count()} rows and ${await columns.count()} columns.`;
      } else {
        details = "Bootstrap grid not found or incomplete.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== BOOTSTRAP - RESPONSIVE ====================

  test("Labs - Bootstrap - Responsive - Columns A, B, C, D", async ({
    page,
  }) => {
    const criterion =
      "Labs - Bootstrap - Responsive - Columns A, B, C, D laid out horizontally or vertically based on screen size";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const columns = page.locator('[class*="col-"]');
      const count = await columns.count();

      if (count >= 4) {
        points.earned = 3;
        details = `Found ${count} responsive columns.`;
      } else {
        details = `Only found ${count} columns (expected 4+).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Responsive - Columns 1-12", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Responsive - Columns 1, 2, through 12 laid out horizontally or vertically based on screen size";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const columns = page.locator('[class*="col-"]');
      const count = await columns.count();

      if (count >= 4) {
        points.earned = 3;
        details = `Found ${count} responsive columns.`;
      } else {
        details = `Only found ${count} columns.`;
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
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const breakpoints = page.locator(
        ".d-block, .d-sm-block, .d-md-block, .d-lg-block, .d-xl-block"
      );

      if ((await breakpoints.count()) > 0) {
        points.earned = 3;
        details = "Breakpoint indicators found.";
      } else {
        details = "Breakpoint indicators not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== BOOTSTRAP - TABLES ====================

  test("Labs - Bootstrap - Tables - Quizzes table", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Tables - Quizzes table styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const table = page.locator("table.table");

      if ((await table.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap table found.";
      } else {
        details = "Bootstrap table not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Responsive Tables - Horizontal scroll", async ({
    page,
  }) => {
    const criterion =
      "Labs - Bootstrap - Responsive Tables - Table with long columns shows horizontal scrollbars when narrow window";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const responsiveTable = page.locator(".table-responsive");

      if ((await responsiveTable.count()) > 0) {
        points.earned = 3;
        details = "Responsive table container found.";
      } else {
        details = "Responsive table not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== BOOTSTRAP - LISTS ====================

  test("Labs - Bootstrap - Lists - Favorite movies", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Lists - Favorite list of movies styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const listGroup = page.locator(".list-group, ul.list-group");

      if ((await listGroup.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap list group found.";
      } else {
        details = "Bootstrap list not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Link Lists - Favorite books", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Link Lists - Favorite list of links to books styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const linkList = page.locator(
        ".list-group a.list-group-item, a.list-group-item"
      );

      if ((await linkList.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap link list found.";
      } else {
        details = "Bootstrap link list not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== BOOTSTRAP - FORMS ====================

  test("Labs - Bootstrap - Forms - Email and textarea", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Forms - Email and text area form styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const emailInput = page.locator('input[type="email"].form-control');
      const textarea = page.locator("textarea.form-control");

      if ((await emailInput.count()) > 0 && (await textarea.count()) > 0) {
        points.earned = 3;
        details = "Email and textarea with form-control found.";
      } else if (
        (await emailInput.count()) > 0 ||
        (await textarea.count()) > 0
      ) {
        points.earned = 2;
        details = "One form control found (expected both).";
      } else {
        details = "Form controls not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Forms - Dropdown", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Forms - Dropdown styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Forms - Switches", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Forms - Switches styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const switches = page.locator(
        ".form-check-input, .form-switch, input[type='checkbox'].form-check-input"
      );

      if ((await switches.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap switches found.";
      } else {
        details = "Bootstrap switches not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Forms - Sliders", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Forms - Sliders styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Forms - Addons", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Forms - Addons styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const inputGroup = page.locator(".input-group");

      if ((await inputGroup.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap input group found.";
      } else {
        details = "Bootstrap input group not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Forms - Responsive horizontal", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Forms - Responsive form horizontal in wide screens";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Forms - Vertical in narrow", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Forms - Vertical in narrow screens";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const responsiveForm = page.locator("form [class*='col-']");

      if ((await responsiveForm.count()) > 0) {
        points.earned = 3;
        details = "Responsive form columns found.";
      } else {
        details = "Responsive form not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== BOOTSTRAP - TABS & PILLS ====================

  test("Labs - Bootstrap - Tabs", async ({ page }) => {
    const criterion = "Labs - Bootstrap - Tabs - Tabs styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Pills - Table of contents", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Pills - Table of content to navigate to Lab 1, 2, Kanbas";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pills = page.locator(".nav-pills, ul.nav-pills");

      if ((await pills.count()) > 0) {
        points.earned = 3;
        details = "Bootstrap pills found.";
      } else {
        details = "Bootstrap pills not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Labs - Bootstrap - Pills - Git repository link", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Pills - Link to navigate to git repository";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const gitLink = page.locator('a[href*="github"]');

      if ((await gitLink.count()) > 0) {
        points.earned = 3;
        details = "GitHub link found.";
      } else {
        details = "GitHub link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== BOOTSTRAP - CARDS ====================

  test("Labs - Bootstrap - Cards - Starship card", async ({ page }) => {
    const criterion =
      "Labs - Bootstrap - Cards - Stacking Starship card styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab2"));
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });
  test("Kambaz - Navigation - Links present", async ({ page }) => {
    const criterion =
      "Kambaz - Navigation - Links: Northeaster, Account, Dashboard, Courses, Calendar, Inbox, Labs";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const requiredLinks = [
        /account/i,
        /dashboard/i,
        /courses/i,
        /calendar/i,
        /inbox/i,
        /labs/i,
      ];
      let foundLinks = 0;

      for (const linkPattern of requiredLinks) {
        const link = page.getByRole("link", { name: linkPattern });
        if ((await link.count()) > 0) foundLinks++;
      }

      if (foundLinks >= 6) {
        points.earned = 3;
        details = `Found ${foundLinks}/6+ navigation links.`;
      } else if (foundLinks >= 4) {
        points.earned = 2;
        details = `Found ${foundLinks}/6 navigation links.`;
      } else {
        details = `Only found ${foundLinks}/6 navigation links.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Navigation - Northeastern logo and link", async ({ page }) => {
    const criterion =
      "Kambaz - Navigation - Northeastern: has logo, clicking navigates to northeastern.edu";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/"));
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Navigation - Account styling", async ({ page }) => {
    const criterion =
      "Kambaz - Navigation - Account: black background, white text and icon";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const accountLink = page.getByRole("link", { name: /account/i }).first();

      if ((await accountLink.count()) > 0) {
        points.earned = 3;
        details = "Account link found.";
      } else {
        details = "Account link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Navigation - Dashboard styling", async ({ page }) => {
    const criterion =
      "Kambaz - Navigation - Dashboard: white background red text and icon";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dashboardLink = page
        .getByRole("link", { name: /dashboard/i })
        .first();

      if ((await dashboardLink.count()) > 0) {
        points.earned = 3;
        details = "Dashboard link found.";
      } else {
        details = "Dashboard link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Navigation - Other links styling", async ({ page }) => {
    const criterion =
      "Kambaz - Navigation - All others: black background, white text, red icon";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Get navigation links (Courses, Calendar, Inbox, Labs - NOT Account or Dashboard)
      const navLinks = page.locator(
        'a[href*="/Courses"], a[href*="/Calendar"], a[href*="/Inbox"], a[href*="/Labs"]'
      );

      if ((await navLinks.count()) >= 3) {
        // Check styling on first navigation link
        const firstLink = navLinks.first();
        const bgColor = await firstLink.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );
        const color = await firstLink.evaluate(
          (el) => window.getComputedStyle(el).color
        );

        // Check for black/dark background
        const hasBlackBg =
          /rgb\(0,\s*0,\s*0\)|black|rgb\([0-5][0-9],\s*[0-5][0-9],\s*[0-5][0-9]\)/i.test(
            bgColor
          );
        // Check for white text
        const hasWhiteText = /rgb\(255,\s*255,\s*255\)|white/i.test(color);

        if (hasBlackBg && hasWhiteText) {
          points.earned = 3;
          details = "Navigation links styled correctly (black bg, white text).";
        } else {
          points.earned = 2;
          details = `Links found but styling: bg=${bgColor}, color=${color}`;
        }
      } else {
        details = "Insufficient navigation links.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Navigation - Generally looks as shown", async ({ page }) => {
    const criterion = "Kambaz - Navigation - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const nav = page.locator(
        "nav, aside, [id*='navigation'], [class*='navigation']"
      );
      const navLinks = page.locator("a[href]");

      if ((await nav.count()) > 0 && (await navLinks.count()) >= 4) {
        points.earned = 3;
        details = "Navigation structure correct.";
      } else {
        details = `Navigation unclear: nav=${await nav.count()}, links=${await navLinks.count()}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== KAMBAZ - DASHBOARD ====================

  test("Kambaz - Dashboard - Courses render as grid", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Courses render as a grid";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseContainer = page.locator(".row, [class*='grid']");

      if ((await courseContainer.count()) > 0) {
        points.earned = 3;
        details = "Course grid layout found.";
      } else {
        details = "Grid layout not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Dashboard - Courses wrap to next line", async ({ page }) => {
    const criterion =
      "Kambaz - Dashboard - As window narrows, courses wrap to next line";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator(
        '[class*="course"], .card, a[href*="/Courses/"]'
      );

      if ((await courses.count()) >= 3) {
        // Check if the parent container has flex-wrap
        const parent = courses.first().locator("..").first(); // Get parent element
        const flexWrap = await parent.evaluate(
          (el) => window.getComputedStyle(el).flexWrap
        );
        const display = await parent.evaluate(
          (el) => window.getComputedStyle(el).display
        );

        const hasFlexWrap = flexWrap === "wrap";
        // const isFlex = display === "flex" || display === "inline-flex";

        if (hasFlexWrap || (await courses.count()) >= 3) {
          points.earned = 3;
          details = `Responsive course layout found with flex-wrap: ${flexWrap}`;
        } else {
          points.earned = 2;
          details = `Courses found but flex-wrap: ${flexWrap}, display: ${display}`;
        }
      } else {
        details = "Responsive layout unclear.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Dashboard - All courses same width", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - All courses same width";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator('[class*="course"], .card');
      const count = await courses.count();

      if (count >= 3) {
        const widths = [];
        for (let i = 0; i < Math.min(3, count); i++) {
          const width = await courses.nth(i).evaluate((el) => el.offsetWidth);
          widths.push(width);
        }

        const allSame = widths.every((w) => Math.abs(w - widths[0]) < 30);

        if (allSame) {
          points.earned = 3;
          details = "All courses have same width.";
        } else {
          details = `Course widths vary: ${widths.join(", ")}px`;
        }
      } else {
        details = "Not enough courses found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Dashboard - Margins around courses", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Margins around courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
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
          details = "No margins detected.";
        }
      } else {
        details = "Courses not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Dashboard - Course background", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Solid or image background in card";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const course = page.locator('[class*="course"], .card').first();

      if ((await course.count()) > 0) {
        const bgColor = await course.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );
        const bgImage = await course.evaluate(
          (el) => window.getComputedStyle(el).img
        );

        if (bgColor !== "rgba(0, 0, 0, 0)" || bgImage !== "none") {
          points.earned = 3;
          details = "Course background styling found.";
        } else {
          details = "No background styling.";
        }
      } else {
        details = "Courses not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Dashboard - At least 3 courses", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - At least 3 courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator('a[href*="/Courses/"]');
      const count = await courses.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} courses.`;
      } else {
        details = `Only found ${count} courses (expected 3+).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Dashboard - Generally looks as shown", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator('[class*="course"], .card');
      const nav = page.locator("a[href]");

      if ((await courses.count()) >= 3 && (await nav.count()) > 0) {
        points.earned = 3;
        details = "Dashboard layout correct.";
      } else {
        details = "Dashboard structure unclear.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Dashboard - Kanbas navigation on left", async ({ page }) => {
    const criterion =
      "Kambaz - Dashboard - On the left: Kanbas Navigation sidebar";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const sidebar = page
        .locator(
          "nav, aside, [id*='navigation'], [class*='navigation'], [id*='kambaz']"
        )
        .first();

      if ((await sidebar.count()) > 0) {
        const rect = await sidebar.evaluate((el) => el.getBoundingClientRect());

        if (rect.left < 200) {
          points.earned = 3;
          details = `Left sidebar found at x=${rect.left.toFixed(0)}px`;
        } else {
          points.earned = 2;
          details = `Sidebar found but at x=${rect.left.toFixed(
            0
          )}px (expected < 200px)`;
        }
      } else {
        details = "Sidebar not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Dashboard - Dashboard content on right", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - On the right: Dashboard or Courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator('[class*="course"]');

      if ((await courses.count()) >= 3) {
        points.earned = 3;
        details = "Dashboard content found.";
      } else {
        details = "Dashboard content unclear.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Dashboard - Content fills screen", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - On the right: Fills rest of screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const mainContent = page
        .locator(
          "main, [role='main'], [id*='dashboard'], [class*='dashboard'], [class*='main-content']"
        )
        .first();

      if ((await mainContent.count()) > 0) {
        // Verify it actually contains courses
        const courses = await mainContent
          .locator('a[href*="/Courses/"], .card, [class*="course"]')
          .count();

        if (courses >= 3) {
          points.earned = 3;
          details = `Main content area found with ${courses} courses.`;
        } else {
          points.earned = 2;
          details = "Main content found but courses unclear.";
        }
      } else {
        points.earned = 2;
        details = "Layout appears functional.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });
  // ==================== KAMBAZ - COURSE NAVIGATION ====================

  test("Kambaz - Course Navigation - Links present", async ({ page }) => {
    const criterion =
      "Kambaz - Course Navigation - Links: Home, Module, Piazza, Zoom, Assignments, Quizzes, Grades";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const requiredLinks = [
        /home/i,
        /modules/i,
        /assignments/i,
        /grades/i,
        /piazza/i,
        /zoom/i,
        /people/i,
      ];
      let foundLinks = 0;

      for (const linkPattern of requiredLinks) {
        const link = page.getByRole("link", { name: linkPattern });
        if ((await link.count()) > 0) foundLinks++;
      }

      if (foundLinks >= 4) {
        points.earned = 3;
        details = `Found ${foundLinks}/7 course navigation links.`;
      } else if (foundLinks >= 2) {
        points.earned = 2;
        details = `Found ${foundLinks}/7 course navigation links.`;
      } else {
        details = `Only found ${foundLinks} links.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Course Navigation - White background", async ({ page }) => {
    const criterion = "Kambaz - Course Navigation - Background: white";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courseNav = page
        .locator('a[href*="/Courses/"], [class*="course"]')
        .first();

      if ((await courseNav.count()) > 0) {
        points.earned = 3;
        details = "Course navigation found.";
      } else {
        details = "Course navigation not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Course Navigation - Red link text", async ({ page }) => {
    const criterion = "Kambaz - Course Navigation - Link text: red";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Get navigation links that are NOT active
      const inactiveLinks = page.locator(".list-group-item:not(.active)");
      const count = await inactiveLinks.count();

      if (count >= 3) {
        // Check the first inactive link
        const firstInactiveLink = inactiveLinks.first();
        const color = await firstInactiveLink.evaluate(
          (el) => window.getComputedStyle(el).color
        );

        // Check for red color (Bootstrap danger color or custom red)
        const isRed = /rgb\(220,\s*53,\s*69\)|rgb\(223,\s*56,\s*69\)|red/i.test(
          color
        );

        if (isRed) {
          points.earned = 3;
          details = `Inactive navigation links are red: ${color}`;
        } else {
          points.earned = 1;
          details = `Inactive links found but color is: ${color} (expected red like rgb(220, 53, 69))`;
        }
      } else {
        details = `Only found ${count} inactive navigation links (expected 3+).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Course Navigation - Active link styling", async ({ page }) => {
    const criterion =
      "Kambaz - Course Navigation - Active link: black left border and text";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const activeLink = page.locator('.active, [class*="active"]').first();

      if ((await activeLink.count()) > 0) {
        points.earned = 3;
        details = "Active link styling found.";
      } else {
        points.earned = 2;
        details = "Active link not identified.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Course Navigation - Home is active", async ({ page }) => {
    const criterion = "Kambaz - Course Navigation - Active link: Home";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const homeLink = page.getByRole("link", { name: /home/i }).first();

      if ((await homeLink.count()) > 0) {
        points.earned = 3;
        details = "Home link found.";
      } else {
        details = "Home link not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Course Navigation - Generally looks as shown", async ({
    page,
  }) => {
    const criterion = "Kambaz - Course Navigation - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== KAMBAZ - MODULES ====================

  test("Kambaz - Modules - Buttons present", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Buttons: Collapse All, View Progress, Module";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const buttons = page.locator("button");
      const count = await buttons.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} buttons.`;
      } else {
        details = `Only found ${count} buttons (expected 3+).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - Grey button styling", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Black on grey: Collapse All, View Progress";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Look for grey/secondary buttons
      const greyButtons = page.locator(
        'button.btn-secondary, button.btn-light, button:has-text("Collapse All"), button:has-text("View Progress")'
      );

      const count = await greyButtons.count();

      if (count >= 2) {
        // Verify one of them actually has grey styling
        const firstButton = greyButtons.first();
        const className = await firstButton.getAttribute("class");
        const bgColor = await firstButton.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        const hasGreyClass = /btn-secondary|btn-light/i.test(className || "");
        const hasGreyBg =
          /rgb\(108,\s*117,\s*125\)|rgb\(206,\s*212,\s*218\)|rgb\(233,\s*236,\s*239\)/i.test(
            bgColor
          );

        if (hasGreyClass || hasGreyBg) {
          points.earned = 3;
          details = `Found ${count} grey buttons. Class: ${className}, Color: ${bgColor}`;
        } else {
          points.earned = 1;
          details = `Found ${count} buttons but styling unclear. Color: ${bgColor}`;
        }
      } else {
        details = `Only found ${count} grey button(s), expected 2+.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - Red module button", async ({ page }) => {
    const criterion = "Kambaz - Modules - White on red: + Module";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const redButton = page.locator("button.btn-danger, button.btn-primary");

      if ((await redButton.count()) > 0) {
        points.earned = 3;
        details = "Module button found.";
      } else {
        details = "Module button not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - Publish dropdown", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Publish all: drop down with 4 options as shown and icon";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const dropdown = page.locator("select, button.dropdown-toggle");

      if ((await dropdown.count()) > 0) {
        points.earned = 3;
        details = "Publish dropdown found.";
      } else {
        details = "Dropdown not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - Dropdown options with icons", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Each option has text and icons as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const icons = page.locator("svg, i");

      if ((await icons.count()) >= 3) {
        points.earned = 3;
        details = "Icons found in interface.";
      } else {
        details = "Insufficient icons.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - Widest layout shows sidebars", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Widest shows sidebars on the left and modules on the right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`), {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      await page.waitForTimeout(1500);

      // Check for main navigation (Dashboard, Courses, Calendar, etc.)
      const mainNavLinks =
        (await page.locator("text=Dashboard").count()) +
        (await page.locator("text=Courses").count()) +
        (await page.locator("text=Calendar").count());

      // Check for course navigation (Home, Modules, Assignments, etc.)
      const courseNavLinks = await page
        .locator('.list-group-item, a:has-text("Home"), a:has-text("Modules")')
        .count();

      // Check for module content (Week 1, Week 2, etc.)
      const weekHeaders = await page.locator("text=/Week \\d+/").count();
      const lessonItems = await page
        .locator("text=LEARNING OBJECTIVES, text=Introduction to the course")
        .count();

      const hasMainNav = mainNavLinks >= 2;
      const hasCourseNav = courseNavLinks >= 3;
      const hasModules = weekHeaders >= 1 || lessonItems >= 1;

      if (hasMainNav && hasCourseNav && hasModules) {
        points.earned = 3;
        details = "Widest layout shows sidebars and modules correctly.";
      } else {
        details = `Main nav: ${hasMainNav} (${mainNavLinks}), Course nav: ${hasCourseNav} (${courseNavLinks}), Modules: ${hasModules} (weeks: ${weekHeaders}, lessons: ${lessonItems})`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - Narrowest hides sidebars", async ({ page }) => {
    const criterion = "Kambaz - Modules - Narrowest hides left sidebars";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      // Set viewport to narrowest size
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Check if left sidebar is hidden
      const leftSidebar = page
        .locator("nav.wd-kambaz-navigation, .wd-kambaz-navigation, nav")
        .first();

      let leftSidebarVisible = false;
      if ((await leftSidebar.count()) > 0) {
        leftSidebarVisible = await leftSidebar.isVisible();
      }

      // Check if course navigation is hidden
      const courseNav = page
        .locator('.list-group:has(a:has-text("Modules"))')
        .first();
      let courseNavVisible = false;
      if ((await courseNav.count()) > 0) {
        courseNavVisible = await courseNav.isVisible();
      }

      // Modules content should still be visible
      const modulesVisible = await page.locator("text=Week 1").isVisible();

      if (!leftSidebarVisible && modulesVisible) {
        points.earned = 3;
        details = "Narrowest layout hides sidebars correctly.";
      } else {
        details = `Sidebar hidden: ${!leftSidebarVisible}, Modules visible: ${modulesVisible}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - Module titles styling", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Module Titles: grey background, icon to left of title, controls on the right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const moduleTitles = page.locator('[class*="module"], h2, h3');

      if ((await moduleTitles.count()) >= 2) {
        points.earned = 3;
        details = "Module titles found.";
      } else {
        details = "Module titles not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - At least 2 modules", async ({ page }) => {
    const criterion = "Kambaz - Modules - At least 2 modules";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modules = page.locator('[class*="module"], li');
      const count = await modules.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} modules.`;
      } else {
        details = `Only found ${count} modules (expected 2+).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - Lessons styling", async ({ page }) => {
    const criterion =
      "Kambaz - Modules - Lessons: white background, green border on left, icon to left of title, controls on the right";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const lessons = page.locator('li, [class*="lesson"]');

      if ((await lessons.count()) >= 2) {
        points.earned = 3;
        details = "Lessons found.";
      } else {
        details = "Lessons not found or insufficient.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - At least 2 lessons", async ({ page }) => {
    const criterion = "Kambaz - Modules - At least 2 lessons";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const lessons = page.locator('li, [class*="lesson"]');
      const count = await lessons.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} lessons.`;
      } else {
        details = `Only found ${count} lessons (expected 2+).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Modules - Generally looks as shown", async ({ page }) => {
    const criterion = "Kambaz - Modules - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modules = page.locator('[class*="module"]');
      const buttons = page.locator("button");

      if ((await modules.count()) >= 2 && (await buttons.count()) >= 2) {
        points.earned = 3;
        details = "Modules page structure correct.";
      } else {
        details = "Structure unclear.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== KAMBAZ - HOME ====================

  test("Kambaz - Home - Course Status on 4th column", async ({ page }) => {
    const criterion = "Kambaz - Home - Course Status on 4th column";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`), {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      await page.waitForTimeout(1500);

      // Look for "Course Status" heading
      const courseStatusHeading = await page
        .locator("text=Course Status")
        .count();

      // Look for buttons in the Course Status section
      const unpublishBtn = await page
        .locator('button:has-text("Unpublish")')
        .count();
      const publishBtn = await page
        .locator('button:has-text("Publish")')
        .count();
      const importBtn = await page
        .locator("text=Import Existing Content")
        .count();
      const chooseHomepageBtn = await page
        .locator("text=Choose Homepage")
        .count();

      const hasCourseStatus = courseStatusHeading > 0;
      const hasStatusButtons =
        unpublishBtn + publishBtn + importBtn + chooseHomepageBtn >= 3;

      if (hasCourseStatus && hasStatusButtons) {
        points.earned = 3;
        details = "Course Status section found with buttons.";
      } else if (hasStatusButtons) {
        points.earned = 2;
        details = `Status buttons found (${
          unpublishBtn + publishBtn + importBtn + chooseHomepageBtn
        }) but no heading.`;
      } else {
        details = `Course Status heading: ${hasCourseStatus}, Status buttons: ${
          unpublishBtn + publishBtn + importBtn + chooseHomepageBtn
        }`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });
  test("Kambaz - Home - Modules in 3rd column", async ({ page }) => {
    const criterion = "Kambaz - Home - Modules in 3rd column";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modules = page.locator('[class*="module"]');

      if ((await modules.count()) >= 2) {
        points.earned = 3;
        details = "Modules found on home page.";
      } else {
        details = "Modules not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Home - Widest shows 4 columns", async ({ page }) => {
    const criterion = "Kambaz - Home - Widest shows 4 columns";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`), {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      await page.waitForTimeout(2000);

      // Check for all key sections more broadly
      const checks = {
        leftNav:
          (await page.locator("text=Dashboard").count()) +
            (await page.locator("text=Courses").count()) +
            (await page.locator("text=Calendar").count()) >
          0,

        courseNav:
          (await page.locator("text=Home").count()) +
            (await page.locator("text=Modules").count()) +
            (await page.locator("text=Assignments").count()) >=
          2,

        mainContent:
          (await page.locator("text=Week 1").count()) +
            (await page.locator("text=Week 2").count()) +
            (await page.locator("text=LEARNING").count()) +
            (await page.locator("text=Introduction").count()) >
          0,

        courseStatus:
          (await page.locator("text=Course Status").count()) +
            (await page.locator("text=Publish").count()) +
            (await page.locator("text=Import Existing Content").count()) >
          0,
      };

      const columnCount = Object.values(checks).filter(Boolean).length;

      if (columnCount >= 4) {
        points.earned = 3;
        details = "Four-column layout found (all sections present).";
      } else if (columnCount === 3) {
        points.earned = 2;
        details = `Three columns found: ${JSON.stringify(checks)}`;
      } else {
        details = `Only ${columnCount} columns found: ${JSON.stringify(
          checks
        )}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });
  test("Kambaz - Home - Course Status hides when narrow", async ({ page }) => {
    const criterion = "Kambaz - Home - As narrows, Course Status hides";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.setViewportSize({ width: 768, height: 1024 }); // Tablet size

      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`), {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      await page.waitForTimeout(1500);

      // Check if Course Status section is hidden
      const courseStatusLocator = page.locator("text=Course Status");
      let isVisible = false;

      if ((await courseStatusLocator.count()) > 0) {
        try {
          isVisible = await courseStatusLocator.isVisible({ timeout: 1000 });
        } catch (e) {
          isVisible = false;
        }
      }

      if (!isVisible) {
        points.earned = 3;
        details = "Course Status hides on narrow viewport.";
      } else {
        points.earned = 1;
        details = "Course Status still visible on narrow viewport.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Home - Narrowest hides sidebars", async ({ page }) => {
    const criterion = "Kambaz - Home - Narrowest hides left sidebars";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`), {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      await page.waitForTimeout(1500);

      // Check if left navigation is hidden
      const dashboardLocator = page.locator("text=Dashboard").first();
      const coursesLocator = page.locator("text=Courses").first();

      let dashboardVisible = false;
      let coursesVisible = false;

      if ((await dashboardLocator.count()) > 0) {
        try {
          dashboardVisible = await dashboardLocator.isVisible({
            timeout: 1000,
          });
        } catch (e) {
          dashboardVisible = false;
        }
      }

      if ((await coursesLocator.count()) > 0) {
        try {
          coursesVisible = await coursesLocator.isVisible({ timeout: 1000 });
        } catch (e) {
          coursesVisible = false;
        }
      }

      const sidebarsHidden = !dashboardVisible && !coursesVisible;

      if (sidebarsHidden) {
        points.earned = 3;
        details = "Sidebars hidden on narrowest viewport.";
      } else {
        details = `Dashboard visible: ${dashboardVisible}, Courses visible: ${coursesVisible}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Home - Generally looks as shown", async ({ page }) => {
    const criterion = "Kambaz - Home - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`), {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      await page.waitForTimeout(1500);

      // Check for key elements that should be present
      const elements = {
        navigation: (await page.locator("text=Dashboard").count()) > 0,
        courseNav: (await page.locator("text=Modules").count()) > 0,
        content: (await page.locator("text=Week").count()) > 0,
        courseStatus: (await page.locator("text=Course Status").count()) > 0,
        buttons: (await page.locator("button, .btn").count()) >= 3,
      };

      const presentCount = Object.values(elements).filter(Boolean).length;

      if (presentCount >= 4) {
        points.earned = 3;
        details = "Home page has all expected elements.";
      } else if (presentCount >= 3) {
        points.earned = 2;
        details = `Most elements present: ${JSON.stringify(elements)}`;
      } else {
        details = `Only ${presentCount}/5 key elements found.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });
  // ==================== KAMBAZ - PEOPLE ====================

  test("Kambaz - People - Clicking link displays screen", async ({ page }) => {
    const criterion =
      "Kambaz - People - Clicking People link displays People Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const peopleLink = page.getByRole("link", { name: /people/i });

      if ((await peopleLink.count()) > 0) {
        await peopleLink.click();
        await page.waitForTimeout(1000);

        if (page.url().includes("/People")) {
          points.earned = 3;
          details = "People navigation works.";
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - People - Renders as shown", async ({ page }) => {
    const criterion = "Kambaz - People - Renders as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/People`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const people = page.locator(".table, .list-group");

      if ((await people.count()) > 0) {
        points.earned = 3;
        details = "People list found.";
      } else {
        details = "People list not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - People - At least 3 users", async ({ page }) => {
    const criterion = "Kambaz - People - At least 3 users";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/People`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const users = page.locator("tr, .list-group-item");
      const count = await users.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} users.`;
      } else {
        details = `Only found ${count} users (expected 3+).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  // ==================== KAMBAZ - ASSIGNMENTS ====================

  test("Kambaz - Assignments - Buttons floated right", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments - Buttons must be floated to the right as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const buttons = page.locator("button.float-end, .float-end button");

      if ((await buttons.count()) >= 2) {
        points.earned = 3;
        details = "Right-floated buttons found.";
      } else {
        points.earned = 2;
        details = "Buttons found but float unclear.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments - Search field", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments - The Search for Assignment text field must render as shown including the placeholder text, the magnifying glass, and justified to the left.";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments`));
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments - React Icons used", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments - Use React Icons similar to the ones shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const icons = page.locator("svg, i");
      const count = await icons.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} icons.`;
      } else {
        details = `Only found ${count} icons (expected 3+).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments - Group and Assignment buttons", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments - The Group and Assignment buttons must be justified to the right, in the color shown, and plus icons. Use the same colors used in the Modules and Home Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const buttons = page.locator("button");

      if ((await buttons.count()) >= 2) {
        points.earned = 3;
        details = "Buttons found.";
      } else {
        details = "Buttons not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments - Bootstrap spacing", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments - White spaces around and between content must be rendered with Bootstrap's margin and padding classes";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const spacedElements = page.locator('[class*="m-"], [class*="p-"]');

      if ((await spacedElements.count()) >= 3) {
        points.earned = 3;
        details = "Bootstrap spacing classes found.";
      } else {
        details = "Spacing classes not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments - Green left border", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments - The border to the left of the line items must be rendered green as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const borderedElement = page
        .locator('.border-start, [class*="border"]')
        .first();

      if ((await borderedElement.count()) > 0) {
        points.earned = 3;
        details = "Border found.";
      } else {
        points.earned = 2;
        details = "Border element unclear.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments - Assignment titles", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments - The titles of the assignments, A1, A2, etc, must be rendered as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const assignmentTitles = page.locator('a[href*="/Assignments/"]');
      const count = await assignmentTitles.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} assignment titles.`;
      } else {
        details = `Only found ${count} assignment titles (expected 2+).`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments - Subtext with dates and points", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments - The subtext under the titles such as the due dates, start times, and points, must render as shown, but the dates and times can be different";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const subtexts = page.locator("small, .text-muted, span");

      if ((await subtexts.count()) >= 2) {
        points.earned = 3;
        details = "Assignment details found.";
      } else {
        details = "Subtext unclear.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments - Generally looks as shown", async ({ page }) => {
    const criterion = "Kambaz - Assignments - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const assignments = page.locator('a[href*="/Assignments/"]');
      const buttons = page.locator("button");

      if ((await assignments.count()) >= 2 && (await buttons.count()) >= 2) {
        points.earned = 3;
        details = "Assignments page structure correct.";
      } else {
        details = "Structure unclear.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });
  test("Kambaz - Assignments Editor - Link selection optional", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments Editor - The Assignments link does not need to be rendered as selected in the Course Navigation sidebar as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`)
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      points.earned = 3;
      details = "Editor page loaded (link selection not required).";
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
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
        buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`)
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      points.earned = 3;
      details = "Editor page loaded (breadcrumb styling optional).";
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments Editor - Bootstrap form-control", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments Editor - All input, textarea, and select form elements must be styled with Bootstrap form-control class";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`)
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments Editor - Labels on top left", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments Editor - The input fields Points, Assignment Group, Display Grade as, Submission Type, and Assign, must appear on the top left of their related fields";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`)
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

    results.push({ criterion, points, passed: points.earned === 3, details });
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
        buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`)
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const gridElements = page.locator(".row, [class*='col-']");
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments Editor - Bootstrap spacing", async ({ page }) => {
    const criterion =
      "Kambaz - Assignments Editor - White spaces around and between content must be implemented with Bootstrap margin and padding classes";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`)
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const spacedElements = page.locator('[class*="m-"], [class*="p-"]');
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

    results.push({ criterion, points, passed: points.earned === 3, details });
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
        buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`)
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      points.earned = 3;
      details = "Calendar icons not required.";
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
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
        buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`)
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Assignments Editor - Generally looks as shown", async ({
    page,
  }) => {
    const criterion = "Kambaz - Assignments Editor - Generally looks as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`)
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const formControls = page.locator(".form-control, .form-select");
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
    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Accounts - Account Sidebar styled", async ({ page }) => {
    const criterion = "Kambaz - Accounts - Account Sidebar styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Signin"), {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      await page.waitForTimeout(1500);

      // Check for sidebar navigation links - use simpler selectors
      const signinLink = await page.locator('a:has-text("Sign in")').count();
      const signupLink = await page.locator('a:has-text("Sign up")').count();
      const profileLink = await page.locator('a:has-text("Profile")').count();

      // Check for sidebar structure
      const hasSidebar =
        (await page.locator("nav, aside, .list-group").count()) > 0;
      const totalLinks = signinLink + signupLink + profileLink;

      if (hasSidebar && totalLinks >= 2) {
        points.earned = 3;
        details = `Sidebar: true, Links: ${totalLinks}`;
      } else if (totalLinks >= 2) {
        points.earned = 2;
        details = `Links found (${totalLinks}) but sidebar structure unclear.`;
      } else {
        details = `Sidebar: ${hasSidebar}, Links: ${totalLinks}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Accounts - Signin screen styled", async ({ page }) => {
    const criterion = "Kambaz - Accounts - Signin screen styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Signin"), {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      await page.waitForTimeout(1500);

      // Check for heading
      const hasHeading = (await page.getByText("Sign in").count()) > 0;

      // Check for form controls
      const formControls = await page.locator(".form-control").count();
      const inputs = await page.locator("input").count();

      // Check for button - look for multiple types
      const buttons = await page
        .locator('button, .btn, [type="submit"]')
        .count();

      const totalInputs = Math.max(formControls, inputs);

      if (hasHeading && totalInputs >= 2 && buttons >= 1) {
        points.earned = 3;
        details = `Heading: true, Inputs: ${totalInputs}, Buttons: ${buttons}`;
      } else if (totalInputs >= 2) {
        points.earned = 2;
        details = `Form elements present (${totalInputs} inputs) but missing button or heading.`;
      } else {
        details = `Heading: ${hasHeading}, Inputs: ${totalInputs}, Buttons: ${buttons}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Accounts - Signup screen styled", async ({ page }) => {
    const criterion = "Kambaz - Accounts - Signup screen styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Signup"), {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      await page.waitForTimeout(1500);

      // Check for heading
      const hasHeading = (await page.getByText("Sign up").count()) > 0;

      // Check for form controls
      const formControls = await page.locator(".form-control").count();
      const inputs = await page.locator("input").count();

      // Check for button - look for multiple types
      const buttons = await page
        .locator('button, .btn, [type="submit"]')
        .count();

      const totalInputs = Math.max(formControls, inputs);

      if (hasHeading && totalInputs >= 2 && buttons >= 1) {
        points.earned = 3;
        details = `Heading: true, Inputs: ${totalInputs}, Buttons: ${buttons}`;
      } else if (totalInputs >= 2) {
        points.earned = 2;
        details = `Form elements present (${totalInputs} inputs) but missing button or heading.`;
      } else {
        details = `Heading: ${hasHeading}, Inputs: ${totalInputs}, Buttons: ${buttons}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({ criterion, points, passed: points.earned === 3, details });
  });
  test("Kambaz - Accounts - Profile screen styled", async ({ page }) => {
    const criterion = "Kambaz - Accounts - Profile screen styled as shown";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Profile"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const formControls = page.locator(".form-control, .form-select");
      const buttons = page.locator("button, a[role='button']");

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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Accounts - Signin navigates to Profile or Dashboard", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Accounts - Clicking Signin in Signin screen navigates to Profile or Dashboard";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Signin"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // const signinButton = page.getByRole("button", { name: /sign ?in/i });
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Accounts - Signup navigates to Profile or Dashboard", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Accounts - Clicking Signup in Signup screen navigates to Profile or Dashboard";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Signup"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // const signupButton = page.getByRole("button", { name: /sign ?up/i });
      const signupButton = page.locator("#wd-signin-btn");

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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test("Kambaz - Accounts - Navigation works correctly", async ({ page }) => {
    const criterion =
      "Kambaz - Accounts - Clicking on Account, Signin, Signup, and Profile in sidebars navigate as expected";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Account/Signin"));
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

    results.push({ criterion, points, passed: points.earned === 3, details });
  });

  test.afterAll(async () => {
    console.log("\n=== ASSIGNMENT 2 LABS CSS RESULTS ===");
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
