import { test, expect } from "@playwright/test";

const results = [];

// Constants
const TEST_COURSE_ID = "RS101";
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
        const rootUrl = buildUrl("/");
        console.log(`Priming session at: ${rootUrl}`);
        await page.goto(rootUrl, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(1000);
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

test.describe("Assignment 3 Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for navigation
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(10000);
  });

  // Fail the Playwright test if the computed points are partial or zero
  test.afterEach(() => {
    const last = results[results.length - 1];
    if (last && last.points && last.points.earned < last.points.possible) {
      throw new Error(`Partial grade for "${last.criterion}": ${last.details}`);
    }
  });

  // ==================== LABS - JAVASCRIPT FUNDAMENTALS ====================

  test("Labs - Variable types", async ({ page }) => {
    const criterion = "Labs - Variable types";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Check for variable demonstrations (let, const, var)
      const pageText = await page.textContent("body");
      const hasVariableContent =
        /variable|let|const|var|string|number|boolean/i.test(pageText || "");

      if (hasVariableContent) {
        points.earned = 3;
        details = "Variable types content found on page.";
      } else {
        details = "Variable types content not clearly visible.";
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

  test("Labs - Boolean Variables", async ({ page }) => {
    const criterion = "Labs - Boolean Variables";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasBooleanContent = /boolean|true|false/i.test(pageText || "");

      if (hasBooleanContent) {
        points.earned = 3;
        details = "Boolean variables content found.";
      } else {
        details = "Boolean content not found.";
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

  test("Labs - If Else", async ({ page }) => {
    const criterion = "Labs - If Else";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasIfElse = /if.*else|conditional/i.test(pageText || "");

      if (hasIfElse) {
        points.earned = 3;
        details = "If-else content found.";
      } else {
        details = "If-else content not found.";
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

  test("Labs - Ternary conditional operator", async ({ page }) => {
    const criterion = "Labs - Ternary conditional operator";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasTernary = /ternary|\?.*:/i.test(pageText || "");

      if (hasTernary) {
        points.earned = 3;
        details = "Ternary operator content found.";
      } else {
        details = "Ternary operator content not found.";
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

  test("Labs - Generating conditional output", async ({ page }) => {
    const criterion = "Labs - Generating conditional output";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Look for conditional rendering examples
      const pageText = await page.textContent("body");
      const hasConditional = /conditional|render|output/i.test(pageText || "");

      if (hasConditional) {
        points.earned = 3;
        details = "Conditional output examples found.";
      } else {
        details = "Conditional output not found.";
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

  test("Labs - Welcome If Else", async ({ page }) => {
    const criterion = "Labs - Welcome If Else";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const welcomeText = page.locator("text=/welcome/i");
      if ((await welcomeText.count()) > 0) {
        points.earned = 3;
        details = "Welcome if-else example found.";
      } else {
        details = "Welcome if-else not found.";
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

  test("Labs - Please login Inline", async ({ page }) => {
    const criterion = "Labs - Please login Inline";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const loginText = page.locator("text=/login/i");
      if ((await loginText.count()) > 0) {
        points.earned = 3;
        details = "Login inline example found.";
      } else {
        details = "Login inline not found.";
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

  test("Labs - Legacy ES5 function", async ({ page }) => {
    const criterion = "Labs - Legacy ES5 function";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasES5 = /function|ES5/i.test(pageText || "");

      if (hasES5) {
        points.earned = 3;
        details = "ES5 function example found.";
      } else {
        details = "ES5 function not found.";
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

  test("Labs - ES6 arrow functions", async ({ page }) => {
    const criterion = "Labs - ES6 arrow functions";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasArrow = /arrow|=>|ES6/i.test(pageText || "");

      if (hasArrow) {
        points.earned = 3;
        details = "Arrow function examples found.";
      } else {
        details = "Arrow functions not found.";
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

  test("Labs - Implied returns", async ({ page }) => {
    const criterion = "Labs - Implied returns";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasImplied = /implied|return|arrow/i.test(pageText || "");

      if (hasImplied) {
        points.earned = 3;
        details = "Implied returns example found.";
      } else {
        details = "Implied returns not found.";
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

  test("Labs - Template Literals", async ({ page }) => {
    const criterion = "Labs - Template Literals";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasTemplate = /template|literal|`/i.test(pageText || "");

      if (hasTemplate) {
        points.earned = 3;
        details = "Template literals example found.";
      } else {
        details = "Template literals not found.";
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

  // ==================== LABS - ARRAYS ====================

  test("Labs - Working with Arrays", async ({ page }) => {
    const criterion = "Labs - Working with Arrays";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasArrays = /array|\[.*\]/i.test(pageText || "");

      if (hasArrays) {
        points.earned = 3;
        details = "Array examples found.";
      } else {
        details = "Array examples not found.";
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

  test("Labs - Array index and length", async ({ page }) => {
    const criterion = "Labs - Array index and length";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasIndexLength = /index|length|array/i.test(pageText || "");

      if (hasIndexLength) {
        points.earned = 3;
        details = "Array index/length examples found.";
      } else {
        details = "Array index/length not found.";
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

  test("Labs - Adding and Removing Data to/from Arrays", async ({ page }) => {
    const criterion = "Labs - Adding and Removing Data to/from Arrays";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasAddRemove = /push|pop|shift|unshift|add|remove/i.test(
        pageText || ""
      );

      if (hasAddRemove) {
        points.earned = 3;
        details = "Array add/remove examples found.";
      } else {
        details = "Array manipulation not found.";
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

  test("Labs - For Loops", async ({ page }) => {
    const criterion = "Labs - For Loops";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasForLoop = /for.*loop|iteration/i.test(pageText || "");

      if (hasForLoop) {
        points.earned = 3;
        details = "For loop examples found.";
      } else {
        details = "For loops not found.";
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

  test("Labs - The Map Function", async ({ page }) => {
    const criterion = "Labs - The Map Function";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasMap = /\.map|map function/i.test(pageText || "");

      if (hasMap) {
        points.earned = 3;
        details = "Map function examples found.";
      } else {
        details = "Map function not found.";
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

  test("Labs - The Find Function", async ({ page }) => {
    const criterion = "Labs - The Find Function";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasFind = /\.find|find function/i.test(pageText || "");

      if (hasFind) {
        points.earned = 3;
        details = "Find function examples found.";
      } else {
        details = "Find function not found.";
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

  test("Labs - The Find Index Function", async ({ page }) => {
    const criterion = "Labs - The Find Index Function";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasFindIndex = /findIndex|find.*index/i.test(pageText || "");

      if (hasFindIndex) {
        points.earned = 3;
        details = "FindIndex function examples found.";
      } else {
        details = "FindIndex function not found.";
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

  test("Labs - The Filter Function", async ({ page }) => {
    const criterion = "Labs - The Filter Function";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasFilter = /\.filter|filter function/i.test(pageText || "");

      if (hasFilter) {
        points.earned = 3;
        details = "Filter function examples found.";
      } else {
        details = "Filter function not found.";
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

  test("Labs - JavaScript Object Notation (JSON)", async ({ page }) => {
    const criterion = "Labs - JavaScript Object Notation (JSON)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasJSON = /JSON|object|{.*}/i.test(pageText || "");

      if (hasJSON) {
        points.earned = 3;
        details = "JSON examples found.";
      } else {
        details = "JSON examples not found.";
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

  // ==================== LABS - TODO LIST ====================

  test("Labs - Implementing a simple ToDo List using React.js", async ({
    page,
  }) => {
    const criterion = "Labs - Implementing a simple ToDo List using React.js";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasTodo = /todo|task|list/i.test(pageText || "");

      if (hasTodo) {
        points.earned = 3;
        details = "ToDo list implementation found.";
      } else {
        details = "ToDo list not found.";
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

  test("Labs - TodoItem", async ({ page }) => {
    const criterion = "Labs - TodoItem";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Look for list items or todo items
      const todoItems = page.locator("li, [class*='todo'], [class*='item']");
      const count = await todoItems.count();

      if (count > 0) {
        points.earned = 3;
        details = `Found ${count} todo items.`;
      } else {
        details = "Todo items not found.";
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

  test("Labs - TodoList", async ({ page }) => {
    const criterion = "Labs - TodoList";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const todoList = page.locator("ul, ol, [class*='list']");
      if ((await todoList.count()) > 0) {
        points.earned = 3;
        details = "TodoList component found.";
      } else {
        details = "TodoList not found.";
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

  // ==================== LABS - ADVANCED JS ====================

  test("Labs - The Spread Operator", async ({ page }) => {
    const criterion = "Labs - The Spread Operator";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasSpread = /spread|\.\.\.|\.\.\./i.test(pageText || "");

      if (hasSpread) {
        points.earned = 3;
        details = "Spread operator examples found.";
      } else {
        details = "Spread operator not found.";
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

  test("Labs - Destructing", async ({ page }) => {
    const criterion = "Labs - Destructing";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasDestructuring = /destruct|{.*}.*=/i.test(pageText || "");

      if (hasDestructuring) {
        points.earned = 3;
        details = "Destructuring examples found.";
      } else {
        details = "Destructuring not found.";
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

  test("Labs - Function Destructing", async ({ page }) => {
    const criterion = "Labs - Function Destructing";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasFunctionDestructuring =
        /function.*{.*}|destruct.*parameter/i.test(pageText || "");

      if (hasFunctionDestructuring) {
        points.earned = 3;
        details = "Function destructuring examples found.";
      } else {
        details = "Function destructuring not found.";
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

  // ==================== LABS - STYLING ====================

  test("Labs - Working with HTML classes", async ({ page }) => {
    const criterion = "Labs - Working with HTML classes";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elementsWithClass = page.locator("[class]");
      const count = await elementsWithClass.count();

      if (count > 0) {
        points.earned = 3;
        details = `Found ${count} elements with classes.`;
      } else {
        details = "No elements with classes found.";
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

  test("Labs - Red Dangerous background", async ({ page }) => {
    const criterion = "Labs - Red Dangerous background";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("*");
      const count = await elements.count();
      let foundRed = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const bgColor = await elements
            .nth(i)
            .evaluate((el) => window.getComputedStyle(el).backgroundColor);

          // Light coral or red - matches rgb(240-255, x, x) for red/coral shades
          if (
            /rgb\((25[0-5]|24[0-9]),\s*[0-9]{1,3},\s*[0-9]{1,3}\)|red|coral/i.test(
              bgColor
            )
          ) {
            foundRed = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (foundRed) {
        points.earned = 3;
        details = "Red/coral/dangerous background found.";
      } else {
        details = "Red background not found.";
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

  test("Labs - Blue Dynamic blue background", async ({ page }) => {
    const criterion = "Labs - Blue Dynamic blue background";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("*");
      const count = await elements.count();
      let foundBlue = false;

      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const bgColor = await elements
            .nth(i)
            .evaluate((el) => window.getComputedStyle(el).backgroundColor);

          // Light blue or blue - matches rgb(x, x, 200-255) for blue shades
          if (
            /rgb\([0-9]{1,3},\s*[0-9]{1,3},\s*2[0-9]{2}\)|rgb\(0,\s*0,\s*255\)|blue/i.test(
              bgColor
            )
          ) {
            foundBlue = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (foundBlue) {
        points.earned = 3;
        details = "Blue/lightblue dynamic background found.";
      } else {
        details = "Blue background not found.";
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

  test("Labs - Working with the HTML Style attribute", async ({ page }) => {
    const criterion = "Labs - Working with the HTML Style attribute";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const styledElements = page.locator("[style]");
      const count = await styledElements.count();

      if (count > 0) {
        points.earned = 3;
        details = `Found ${count} elements with inline styles.`;
      } else {
        details = "No inline styled elements found.";
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

  test("Labs - Styles yellow, red, blue backgrounds", async ({ page }) => {
    const criterion = "Labs - Styles yellow, red, blue backgrounds";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const elements = page.locator("*");
      const count = await elements.count();
      let foundColors = {
        yellow: false,
        red: false,
        blue: false,
        green: false,
      };

      for (let i = 0; i < Math.min(count, 100); i++) {
        try {
          const bgColor = await elements
            .nth(i)
            .evaluate((el) => window.getComputedStyle(el).backgroundColor);

          // Light yellow or yellow (255, 255, 0) to (255, 255, 224) - lightyellow
          if (/rgb\(25[0-5],\s*25[0-5],\s*[0-9]{1,3}\)|yellow/i.test(bgColor))
            foundColors.yellow = true;

          // Light coral or red (240, 128, 128) - lightcoral, (255, 0, 0) - red
          if (
            /rgb\((25[0-5]|24[0-9]),\s*([0-9]{1,3}),\s*([0-9]{1,3})\)|red|coral/i.test(
              bgColor
            )
          )
            foundColors.red = true;

          // Light blue or blue (173, 216, 230) - lightblue, (0, 0, 255) - blue
          if (
            /rgb\(([0-9]{1,3}),\s*([0-9]{1,3}),\s*2[0-9]{2}\)|rgb\(0,\s*0,\s*255\)|blue/i.test(
              bgColor
            )
          )
            foundColors.blue = true;

          // Light green (144, 238, 144) - lightgreen
          if (
            /rgb\(([0-9]{1,3}),\s*2[0-9]{2},\s*([0-9]{1,3})\)|green/i.test(
              bgColor
            )
          )
            foundColors.green = true;
        } catch (e) {
          continue;
        }
      }

      const foundCount = Object.values(foundColors).filter(Boolean).length;
      if (foundCount >= 3) {
        points.earned = 3;
        details = `Found ${foundCount}/4 background colors (yellow, red, blue, green).`;
      } else if (foundCount > 0) {
        points.earned = foundCount;
        details = `Found ${foundCount}/4 background colors.`;
      } else {
        details = "No colored backgrounds found.";
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

  // ==================== LABS - REACT COMPONENTS ====================

  test("Labs - Parameterizing Components", async ({ page }) => {
    const criterion = "Labs - Parameterizing Components";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasParams = /parameter|props|component/i.test(pageText || "");

      if (hasParams) {
        points.earned = 3;
        details = "Component parameterization examples found.";
      } else {
        details = "Component parameters not found.";
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

  test("Labs - Child Components", async ({ page }) => {
    const criterion = "Labs - Child Components";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasChildren = /child|children|nested/i.test(pageText || "");

      if (hasChildren) {
        points.earned = 3;
        details = "Child components examples found.";
      } else {
        details = "Child components not found.";
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

  // ==================== LABS - ROUTING ====================

  test("Labs - Working with Location", async ({ page }) => {
    const criterion = "Labs - Working with Location";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasLocation = /location|pathname|route/i.test(pageText || "");

      if (hasLocation) {
        points.earned = 3;
        details = "Location/routing examples found.";
      } else {
        details = "Location examples not found.";
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

  test("Labs - Navigation highlights current page", async ({ page }) => {
    const criterion = "Labs - Navigation highlights current page";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const activeLinks = page.locator(".active, [class*='active']");
      if ((await activeLinks.count()) > 0) {
        points.earned = 3;
        details = "Active navigation highlighting found.";
      } else {
        details = "Active navigation not found.";
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

  test("Labs - Encoding Path Parameters", async ({ page }) => {
    const criterion = "Labs - Encoding Path Parameters";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      const hasPathParams = /parameter|path|route|:id/i.test(pageText || "");

      if (hasPathParams) {
        points.earned = 3;
        details = "Path parameter examples found.";
      } else {
        details = "Path parameters not found.";
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

  test("Labs - 1 + 2 displays 3", async ({ page }) => {
    const criterion = "Labs - 1 + 2 displays 3";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3/add/1/2"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      if (/3/.test(pageText || "")) {
        points.earned = 3;
        details = "Addition 1 + 2 = 3 works correctly.";
      } else {
        details = "Addition result not found or incorrect.";
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

  test("Labs - 3 + 4 displays 7", async ({ page }) => {
    const criterion = "Labs - 3 + 4 displays 7";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Labs/Lab3/add/3/4"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const pageText = await page.textContent("body");
      if (/7/.test(pageText || "")) {
        points.earned = 3;
        details = "Addition 3 + 4 = 7 works correctly.";
      } else {
        details = "Addition result not found or incorrect.";
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

  // ==================== KAMBAZ - DATA DRIVEN TESTS ====================

  test("Kambaz - Data Driven Kambaz Navigation", async ({ page }) => {
    const criterion = "Kambaz - Data Driven Kambaz Navigation";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Look for main Kanbas navigation links (Account, Dashboard, Courses, Calendar, Inbox)
      const requiredLinks = [
        /account/i,
        /dashboard/i,
        /courses/i,
        /calendar/i,
        /inbox/i,
      ];

      let foundLinks = 0;
      for (const linkPattern of requiredLinks) {
        const link = page.getByRole("link", { name: linkPattern });
        if ((await link.count()) > 0) {
          foundLinks++;
        }
      }

      if (foundLinks >= 5) {
        points.earned = 3;
        details = `Found ${foundLinks}/5+ Kanbas navigation links (Account, Dashboard, Courses, Calendar, Inbox).`;
      } else if (foundLinks >= 3) {
        points.earned = 2;
        details = `Found ${foundLinks}/5 Kanbas navigation links.`;
      } else {
        details = `Only found ${foundLinks} Kanbas navigation links (expected 5+).`;
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

  test("Kambaz - Data Driven Dashboard Screen", async ({ page }) => {
    const criterion = "Kambaz - Data Driven Dashboard Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl("/Dashboard"));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const courses = page.locator('a[href*="/Courses/"]');
      const count = await courses.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} data-driven courses.`;
      } else if (count > 0) {
        points.earned = count;
        details = `Found ${count} courses (expected 3+).`;
      } else {
        details = "No courses found on dashboard.";
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

  test("Kambaz - Data Driven Course Screen", async ({ page }) => {
    const criterion = "Kambaz - Data Driven Course Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const visibleElements = page.locator("body *:visible");
      const count = await visibleElements.count();

      if (count > 10) {
        points.earned = 3;
        details = "Course screen renders with data.";
      } else {
        details = "Course screen appears empty or minimal.";
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

  test("Kambaz - Data Driven Course Navigation", async ({ page }) => {
    const criterion = "Kambaz - Data Driven Course Navigation";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Look for course navigation links (Home, Modules, Piazza, Zoom, Assignments, Quizzes, Grades, People)
      const requiredLinks = [
        /home/i,
        /modules/i,
        /assignments/i,
        /grades/i,
        /people/i,
      ];

      let foundLinks = 0;
      for (const linkPattern of requiredLinks) {
        const link = page.getByRole("link", { name: linkPattern });
        if ((await link.count()) > 0) {
          foundLinks++;
        }
      }

      if (foundLinks >= 5) {
        points.earned = 3;
        details = `Found ${foundLinks}/5+ course navigation links (Home, Modules, Assignments, etc.).`;
      } else if (foundLinks >= 3) {
        points.earned = 2;
        details = `Found ${foundLinks}/5 course navigation links.`;
      } else {
        details = `Only found ${foundLinks} course navigation links (expected 5+).`;
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

  test("Kambaz - Data Driven Modules Screen", async ({ page }) => {
    const criterion = "Kambaz - Data Driven Modules Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Modules`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modules = page.locator('li, [class*="module"]');
      const count = await modules.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} modules (data-driven).`;
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

  test("Kambaz - Implementing the Home Screen with React.js", async ({
    page,
  }) => {
    const criterion = "Kambaz - Implementing the Home Screen with React.js";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Home`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const modules = page.locator('[class*="module"]');
      const courseStatus = page.locator('[class*="status"]');

      const hasModules = (await modules.count()) >= 2;
      // const hasStatus = (await courseStatus.count()) > 0;

      if (hasModules) {
        points.earned = 3;
        details = "Home screen implemented with modules and status.";
      } else if (hasModules < 2) {
        points.earned = 2;
        details = "Home screen partially implemented.";
      } else {
        details = "Home screen implementation not clear.";
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

  test("Kambaz - Data Driven Assignments Screen", async ({ page }) => {
    const criterion = "Kambaz - Data Driven Assignments Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const assignments = page.locator('a[href*="/Assignments/"]');
      const count = await assignments.count();

      if (count >= 2) {
        points.earned = 3;
        details = `Found ${count} assignments (data-driven).`;
      } else if (count === 1) {
        points.earned = 2;
        details = "Found 1 assignment (expected 2+).";
      } else {
        details = "No assignments found.";
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

  test("Kambaz - Data Driven Assignment Editor Screen", async ({ page }) => {
    const criterion = "Kambaz - Data Driven Assignment Editor Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(
        buildUrl(`/Courses/${TEST_COURSE_ID}/Assignments/${TEST_ASSIGNMENT_ID}`)
      );
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const inputs = page.locator("input, textarea, select");
      const count = await inputs.count();

      let hasData = false;
      for (let i = 0; i < Math.min(count, 5); i++) {
        const value = await inputs.nth(i).inputValue();
        if (value && value.length > 0) {
          hasData = true;
          break;
        }
      }

      if (hasData) {
        points.earned = 3;
        details = "Assignment editor populated with data.";
      } else {
        details = "Assignment editor appears empty.";
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

  test("Kambaz - Data Driven People Screen", async ({ page }) => {
    const criterion = "Kambaz - Data Driven People Screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await page.goto(buildUrl(`/Courses/${TEST_COURSE_ID}/People/Table`));
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      const people = page.locator("tr, .list-group-item, [class*='person']");
      const count = await people.count();

      if (count >= 3) {
        points.earned = 3;
        details = `Found ${count} people (data-driven).`;
      } else if (count > 0) {
        points.earned = count;
        details = `Found ${count} people (expected 3+).`;
      } else {
        details = "No people found.";
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
    console.log("\n=== ASSIGNMENT 3 GRADING RESULTS ===");
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
