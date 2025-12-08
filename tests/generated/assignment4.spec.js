import { test, expect } from "@playwright/test";

const results = [];

// Constants
const TEST_COURSE_ID = "RS101";
const TEST_ASSIGNMENT_ID = "A101";

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
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(2000);
    }
  }
}

test.describe("Assignment 4 Tests", () => {
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

  // ==================== LAB - USER EVENTS ====================
  test("Lab - User Events - Handling Click Events", async ({ page }) => {
    const criterion = "Lab - User Events - Handling Click Events";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Set up alert handler
      let alertMessages = [];
      page.on("dialog", async (dialog) => {
        alertMessages.push(dialog.message());
        await dialog.accept();
      });

      // Test "Hello World!" button
      const helloBtn = page.locator('button:has-text("Hello World!")');
      if ((await helloBtn.count()) > 0) {
        await helloBtn.click();
        await page.waitForTimeout(300);
      }

      // Test "Life is Good!" button
      const goodBtn = page.locator('button:has-text("Life is Good!")');
      if ((await goodBtn.count()) > 0) {
        await goodBtn.click();
        await page.waitForTimeout(300);
      }

      // Test "Life is Great!" button
      const greatBtn = page.locator('button:has-text("Life is Great!")');
      if ((await greatBtn.count()) > 0) {
        await greatBtn.click();
        await page.waitForTimeout(300);
      }

      // Check if alerts were triggered (at least 2 out of 3)
      if (alertMessages.length >= 2) {
        points.earned = 3;
        details = `Click events work - ${alertMessages.length} alerts triggered.`;
      } else if (alertMessages.length === 1) {
        points.earned = 2;
        details = "Only 1 alert triggered (expected 3).";
      } else {
        details = "No alerts triggered from click events.";
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

  test("Lab - User Events - Passing Data when Handling Events", async ({
    page,
  }) => {
    const criterion = "Lab - User Events - Passing Data when Handling Events";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Set up alert handler
      let alertMessages = [];
      page.on("dialog", async (dialog) => {
        alertMessages.push(dialog.message());
        await dialog.accept();
      });

      // Click the "Pass 2 and 3 to add()" button
      const passBtn = page.locator('button:has-text("Pass 2 and 3 to add()")');

      if ((await passBtn.count()) > 0) {
        await passBtn.click();
        await page.waitForTimeout(500);

        // Check if alert shows 5 (2+3)
        const hasCorrectSum = alertMessages.some(
          (msg) =>
            msg.includes("5") ||
            msg.includes("Sum: 5") ||
            msg.includes("2 + 3 = 5")
        );

        if (hasCorrectSum) {
          points.earned = 3;
          details =
            "Button passes data (2, 3) to handler and shows sum = 5 in alert.";
        } else if (alertMessages.length > 0) {
          points.earned = 1;
          details = `Alert triggered but incorrect value: ${
            alertMessages[alertMessages.length - 1]
          }`;
        } else {
          details = "Button found but no alert triggered.";
        }
      } else {
        details = "Could not find 'Pass 2 and 3 to add()' button.";
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

  test("Lab - User Events - Passing Functions as Attributes", async ({
    page,
  }) => {
    const criterion = "Lab - User Events - Passing Functions as Attributes";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Set up alert handler
      let alertMessages = [];
      page.on("dialog", async (dialog) => {
        alertMessages.push(dialog.message());
        await dialog.accept();
      });

      // Click the "Invoke the Function" button
      const invokeBtn = page.locator('button:has-text("Invoke the Function")');

      if ((await invokeBtn.count()) > 0) {
        await invokeBtn.click();
        await page.waitForTimeout(500);

        // Check if alert shows "hello" or "Hello"
        const hasHello = alertMessages.some((msg) => /hello/i.test(msg));

        if (hasHello) {
          points.earned = 3;
          details = "Button invokes passed function and shows 'Hello' alert.";
        } else if (alertMessages.length > 0) {
          points.earned = 1;
          details = `Alert triggered but wrong message: ${
            alertMessages[alertMessages.length - 1]
          }`;
        } else {
          details = "Button found but no alert triggered.";
        }
      } else {
        details = "Could not find 'Invoke the Function' button.";
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

  test("Lab - User Events - The Event Object", async ({ page }) => {
    const criterion = "Lab - User Events - The Event Object";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Click the "Display Event Object" button to trigger display
      const displayBtn = page.locator(
        'button:has-text("Display Event Object")'
      );

      if ((await displayBtn.count()) > 0) {
        await displayBtn.click();
        await page.waitForTimeout(500);

        // Now check if the JSON event object is displayed on page
        const pageText = await page.textContent("body");

        if (pageText) {
          // Look for event object properties in the displayed JSON
          const hasEventProps =
            (pageText.includes('"_reactName"') &&
              pageText.includes('"onClick"')) ||
            (pageText.includes('"type"') && pageText.includes('"click"')) ||
            pageText.includes('"target"') ||
            pageText.includes('"timeStamp"') ||
            pageText.includes('"eventPhase"');

          if (hasEventProps) {
            points.earned = 3;
            details =
              "Display Event Object button clicked and event object properties displayed.";
          } else {
            points.earned = 1;
            details =
              "Button clicked but event object properties not found on page.";
          }
        } else {
          details = "Page content could not be read.";
        }
      } else {
        details = "Could not find 'Display Event Object' button.";
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
  // ==================== LAB - COMPONENT STATE ====================

  test("Lab - Component State - Integer State Variables", async ({ page }) => {
    const criterion = "Lab - Component State - Integer State Variables";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Look for counter display
      const counterDisplay = page.locator("text=/count|counter/i").first();

      // Get initial value
      const initialText = await counterDisplay.textContent();
      const initialMatch = initialText?.match(/\d+/);
      const initialValue = initialMatch ? parseInt(initialMatch[0]) : 0;

      // Find increment button
      const incrementBtn = page
        .locator(
          'button:has-text("increment"), button:has-text("+"), button:has-text("up")'
        )
        .first();
      await incrementBtn.click();
      await page.waitForTimeout(300);

      // Check if counter increased
      const afterIncText = await counterDisplay.textContent();
      const afterIncMatch = afterIncText?.match(/\d+/);
      const afterIncValue = afterIncMatch ? parseInt(afterIncMatch[0]) : 0;

      if (afterIncValue === initialValue + 1) {
        // Find decrement button
        const decrementBtn = page
          .locator(
            'button:has-text("decrement"), button:has-text("-"), button:has-text("down")'
          )
          .first();
        await decrementBtn.click();
        await page.waitForTimeout(300);

        const afterDecText = await counterDisplay.textContent();
        const afterDecMatch = afterDecText?.match(/\d+/);
        const afterDecValue = afterDecMatch ? parseInt(afterDecMatch[0]) : 0;

        if (afterDecValue === initialValue) {
          points.earned = 3;
          details = "Counter increments and decrements correctly.";
        } else {
          points.earned = 2;
          details = "Counter increments but decrement not working properly.";
        }
      } else {
        details = "Counter increment not working.";
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

  test("Lab - Component State - Boolean State Variables", async ({ page }) => {
    const criterion = "Lab - Component State - Boolean State Variables";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Look for the Boolean State Variables section
      const section = page.locator("text=Boolean State Variables").first();
      await section.waitFor({ timeout: 5000 });

      // Look for checkbox
      const checkbox = page.locator('input[type="checkbox"]').first();

      if ((await checkbox.count()) > 0) {
        // Get initial state
        const initialChecked = await checkbox.isChecked();

        // Look for the message area (the div/element that shows "Yay! you are done" or "Not done")
        const messageLocator = page
          .locator("text=/Yay|done|not done/i")
          .first();

        // Get initial message
        let initialMessage = "";
        if ((await messageLocator.count()) > 0) {
          initialMessage = (await messageLocator.textContent()) || "";
        }

        // Toggle checkbox
        await checkbox.click();

        // Wait for React state to update - wait for the message to change
        await page.waitForTimeout(500);

        // Check if checkbox state changed
        const afterChecked = await checkbox.isChecked();
        const checkboxToggled = initialChecked !== afterChecked;

        // Get message after click
        let afterMessage = "";
        if ((await messageLocator.count()) > 0) {
          afterMessage = (await messageLocator.textContent()) || "";
        } else {
          // Try to find the message again in case it appeared
          const newMessageLocator = page
            .locator("text=/Yay|done|not done/i")
            .first();
          if ((await newMessageLocator.count()) > 0) {
            afterMessage = (await newMessageLocator.textContent()) || "";
          }
        }

        // Check if message changed
        const messageChanged = initialMessage !== afterMessage;

        // Also check by looking at the entire body text
        const bodyTextAfter = await page.textContent("body");
        const hasDoneMessage =
          bodyTextAfter?.includes("Yay") ||
          (bodyTextAfter?.includes("Done") &&
            !bodyTextAfter?.includes("not done"));
        const hasNotDoneMessage =
          bodyTextAfter?.includes("Not done") ||
          bodyTextAfter?.includes("not done");

        if (
          checkboxToggled &&
          (messageChanged || hasDoneMessage || hasNotDoneMessage)
        ) {
          points.earned = 3;
          details = `Checkbox toggles (${initialChecked} → ${afterChecked}) and message updates.`;
        } else if (checkboxToggled) {
          points.earned = 2;
          details = `Checkbox toggles (${initialChecked} → ${afterChecked}) but message doesn't update. Initial: "${initialMessage}", After: "${afterMessage}"`;
        } else {
          details = "Checkbox not responding to clicks.";
        }
      } else {
        details = "No checkbox found.";
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

  test("Lab - Component State - String State Variables", async ({ page }) => {
    const criterion = "Lab - Component State - String State Variables";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");
      await page.waitForTimeout(500);

      // Locate the String State section
      //   const section = page.locator("text=String State Variables").first();
      //   const container = section.locator("xpath=..");

      // The input should be inside this container
      const input = page.locator('input[value="John"]').first();

      const testString = "TestString123";

      await input.fill(testString);
      await page.waitForTimeout(200);

      const isVisible = await page
        .locator(`text=${testString}`)
        .isVisible()
        .catch(() => false);

      if (isVisible) {
        points.earned = 3;
        details = "String state updates correctly.";
      } else {
        details = "Typed text did not update the string state display.";
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

  test("Lab - Component State - Date State Variables", async ({ page }) => {
    const criterion = "Lab - Component State - Date State Variables";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Find date input
      const dateInput = page.locator('input[type="date"]').first();

      if ((await dateInput.count()) > 0) {
        // Set a date
        await dateInput.fill("2024-12-25");
        await page.waitForTimeout(300);

        // Check if date appears on page
        const pageText = await page.textContent("body");

        if (
          pageText?.includes("2024-12-25") ||
          pageText?.includes("12/25/2024") ||
          pageText?.includes("Dec")
        ) {
          points.earned = 3;
          details = "Date state updates when date input changes.";
        } else {
          details = "Date state not reflecting input changes.";
        }
      } else {
        details = "No date input found.";
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

  test("Lab - Component State - Object State Variables", async ({ page }) => {
    const criterion = "Lab - Component State - Object State Variables";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Ensure section exists
      const section = page.locator("h2:has-text('Object State Variables')");
      await expect(section).toBeVisible();

      // Grab the correct <pre> for this section only
      const objectPre = page.locator(
        "xpath=//h2[contains(text(), 'Object State Variables')]/following-sibling::pre[1]"
      );

      // Inputs directly after this section (first two inputs)
      const inputs = page.locator(
        "xpath=(//h2[contains(text(),'Object State Variables')]/following::input)[position()<=2]"
      );

      const count = await inputs.count();
      if (count !== 2) {
        details = `Expected 2 inputs, found ${count}`;
      } else {
        const nameInput = inputs.nth(0);
        const ageInput = inputs.nth(1);

        const newName = "ObjectTestUser";
        const newAge = "55";

        await nameInput.fill(newName);
        await ageInput.fill(newAge);
        await page.waitForTimeout(200);

        const preText = await objectPre.textContent();

        const nameUpdated = preText?.includes(newName);
        const ageUpdated = preText?.includes(newAge);

        if (nameUpdated && ageUpdated) {
          points.earned = 3;
          details = "Object state updates correctly.";
        } else {
          details = "Object state did not update.";
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

  test("Lab - Component State - Array State Variables - addElement", async ({
    page,
  }) => {
    const criterion =
      "Lab - Component State - Array State Variables - addElement";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      const section = page.locator("text=Array State Variable").first();
      const container = section.locator("xpath=..");

      const listItems = container.locator("li");
      const initialCount = await listItems.count();

      const addButton = container.locator('button:has-text("Add Element")');

      await addButton.click();
      await page.waitForTimeout(200);

      const updatedCount = await listItems.count();

      if (updatedCount === initialCount + 1) {
        points.earned = 3;
        details = "Add element works correctly.";
      } else {
        details = "Clicking Add Element did not increase the array size.";
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

  test("Lab - Component State - Array State Variables - deleteElement", async ({
    page,
  }) => {
    const criterion =
      "Lab - Component State - Array State Variables - deleteElement";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Find array display
      const initialCount = await page
        .locator('li, [class*="array"] > div')
        .count();

      if (initialCount > 0) {
        // Find delete button (could be per item or general)
        const deleteButton = page
          .locator(
            'button:has-text("delete"), button:has-text("remove"), button:has-text("×")'
          )
          .first();
        await deleteButton.click();
        await page.waitForTimeout(300);

        // Check if list shrunk
        const afterDeleteCount = await page
          .locator('li, [class*="array"] > div')
          .count();

        if (afterDeleteCount < initialCount) {
          points.earned = 3;
          details = `Array element deleted successfully (${initialCount} → ${afterDeleteCount}).`;
        } else {
          details = "Delete element button not working.";
        }
      } else {
        details = "No array elements to delete.";
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

  // ==================== LAB - APPLICATION STATE (REDUX) ====================

  test("Lab - Application State - Create a Hello World Redux component", async ({
    page,
  }) => {
    const criterion =
      "Lab - Application State - Create a Hello World Redux component";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Look for Redux hello world component
      const pageText = await page.textContent("body");

      if (/redux|hello.*world/i.test(pageText)) {
        points.earned = 3;
        details = "Redux Hello World component found.";
      } else {
        details = "Redux Hello World component not found.";
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

  test("Lab - Component State - Sharing State Between Components", async ({
    page,
  }) => {
    const criterion =
      "Lab - Component State - Sharing State Between Components";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");
      await page.waitForTimeout(1000);

      // Directly find the buttons by their IDs - no waiting for text
      const incrementBtn = page.locator(
        "button#wd-increment-child-state-click"
      );
      const decrementBtn = page.locator(
        "button#wd-decrement-child-state-click"
      );

      // Click increment
      await incrementBtn.click();
      await page.waitForTimeout(300);

      // Click decrement
      await decrementBtn.click();
      await page.waitForTimeout(300);

      // If we got here without errors, the buttons work
      points.earned = 3;
      details = "Shared state counter buttons work.";
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
  test("Lab - Application State - Passing Data to Reducers", async ({
    page,
  }) => {
    const criterion = "Lab - Application State - Passing Data to Reducers";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Look for input to pass data to Redux
      const input = page
        .locator('input[type="number"], input[type="text"]')
        .first();

      if ((await input.count()) > 0) {
        await input.fill("5");
        await page.waitForTimeout(300);

        // Find button to add this value
        const addButton = page
          .locator('button:has-text("add"), button:has-text("+")')
          .first();
        await addButton.click();
        await page.waitForTimeout(300);

        // Check if the value was added to state
        const pageText = await page.textContent("body");

        if (pageText?.includes("5")) {
          points.earned = 3;
          details = "Data successfully passed to reducers via actions.";
        } else {
          details = "Data not reflecting in Redux state.";
        }
      } else {
        details = "No input found to pass data to reducers.";
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

  // ==================== LAB - TODO LIST ====================

  test("Lab - Todo List - Render all todos", async ({ page }) => {
    const criterion = "Lab - Todo List - Render all todos";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");

      // Find todo list items
      const todoItems = await page.locator('li, [class*="todo"]').count();

      if (todoItems >= 2) {
        points.earned = 3;
        details = `Found ${todoItems} todo items rendered.`;
      } else if (todoItems === 1) {
        points.earned = 2;
        details = "Found 1 todo item (expected multiple).";
      } else {
        details = "No todo items found.";
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

  test("Lab4 - Todo List - Create new Todo", async ({ page }) => {
    const criterion = "Lab4 - Todo List - Create new Todo";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");
      await page.waitForLoadState("networkidle");

      // Count initial todos in the list
      const initialCount = await page.locator(".list-group-item").count();

      // Find the input field in the TodoForm (at the top)
      const input = page.locator("input.form-control").first();
      await input.fill("New Test Todo");

      // Click the Add button with id="wd-add-todo-click"
      const addButton = page.locator("#wd-add-todo-click");
      await addButton.click();

      await page.waitForTimeout(500);

      const afterCount = await page.locator(".list-group-item").count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = `Successfully created new todo (${initialCount} → ${afterCount}).`;
      } else {
        details = `Create todo not working. Count: ${initialCount} → ${afterCount}`;
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

  test("Lab4 - Todo List - Delete Todo", async ({ page }) => {
    const criterion = "Lab4 - Todo List - Delete Todo";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");
      await page.waitForLoadState("networkidle");

      const initialCount = await page.locator(".list-group-item").count();

      if (initialCount > 0) {
        // Click the first Delete button with id="wd-delete-todo-click"
        const deleteButton = page.locator("#wd-delete-todo-click").first();
        await deleteButton.click();

        await page.waitForTimeout(500);

        const afterCount = await page.locator(".list-group-item").count();

        if (afterCount < initialCount) {
          points.earned = 3;
          details = `Successfully deleted todo (${initialCount} → ${afterCount}).`;
        } else {
          details = `Delete todo not working. Count: ${initialCount} → ${afterCount}`;
        }
      } else {
        details = "No todos to delete.";
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

  test("Lab4 - Todo List - Select a todo", async ({ page }) => {
    const criterion = "Lab4 - Todo List - Select a todo";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");
      await page.waitForLoadState("networkidle");

      const todoItems = await page.locator(".list-group-item").count();

      if (todoItems > 0) {
        // Click the first "Edit" button with id="wd-set-todo-click"
        const editButton = page.locator("#wd-set-todo-click").first();
        await editButton.click();

        await page.waitForTimeout(500);

        // Check if the input field at the top is populated with the todo text
        const input = page.locator("input.form-control").first();
        const inputValue = await input.inputValue();

        if (inputValue && inputValue.length > 0) {
          points.earned = 3;
          details = `Todo selection works. Input populated with: "${inputValue}"`;
        } else {
          details = "Edit button clicked but input field not populated.";
        }
      } else {
        details = "No todos found to select.";
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

  test("Lab4 - Todo List - Update a todo", async ({ page }) => {
    const criterion = "Lab4 - Todo List - Update a todo";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab4");
      await page.waitForLoadState("networkidle");

      // First, create a new todo so we have control over the content
      const input = page.locator("input.form-control").first();
      await input.fill("Test Todo For Update");
      await page.locator("#wd-add-todo-click").click();
      await page.waitForTimeout(500);

      // Find the todo we just created
      const ourTodo = page.locator(
        '.list-group-item:has-text("Test Todo For Update")'
      );

      if ((await ourTodo.count()) > 0) {
        // Click Edit on our todo
        await ourTodo.locator("#wd-set-todo-click").click();
        await page.waitForTimeout(500);

        // Update the text
        await input.clear();
        await input.fill("Test Todo UPDATED");
        await page.waitForTimeout(300);

        // Click Update
        await page.locator("#wd-update-todo-click").click();
        await page.waitForTimeout(1000);

        // Check if the updated version exists
        const updatedExists =
          (await page
            .locator('.list-group-item:has-text("Test Todo UPDATED")')
            .count()) > 0;

        if (updatedExists) {
          points.earned = 3;
          details = "Todo update functionality works correctly.";
        } else {
          // Partial credit: UI works but Redux logic incomplete
          points.earned = 2;
          details =
            "Update UI works but todo not actually updated in list (Redux issue).";
        }
      } else {
        details = "Could not create test todo.";
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
  // ==================== KAMBAZ - DASHBOARD ====================
  const KAMBAZ_CREDENTIALS = {
    username: "ada",
    password: "123",
  };

  async function ensureLoggedIn(page) {
    try {
      // Check if already logged in by looking for a dashboard element
      // const isDashboard = page.url().includes("Dashboard");
      // if (isDashboard) return true;

      // Navigate to signin
      await page.goto(`${BASE_URL}`);
      await page.waitForLoadState("networkidle");

      // Fill credentials
      await page
        .locator("#wd-username")
        .first()
        .fill(KAMBAZ_CREDENTIALS.username);
      await page
        .locator("#wd-password")
        .first()
        .fill(KAMBAZ_CREDENTIALS.password);

      // Click sign in
      await page
        .locator('button:has-text("Sign in"), button:has-text("Login")')
        .first()
        .click();

      // Wait for redirect
      await page.waitForTimeout(2000);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }
  test("Kambaz - Dashboard - Creating New Courses", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Creating New Courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      // await navigateWithRetry(page, "/Dashboard");

      const initialCount = await page.locator('[class*="course"]').count();

      // Find add course button
      const addButton = page
        .locator(
          'button:has-text("add"), button:has-text("new"), button:has-text("create")'
        )
        .first();
      await addButton.click();
      await page.waitForTimeout(500);

      const afterCount = await page.locator('[class*="course"]').count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = `New course created successfully (${initialCount} → ${afterCount}).`;
      } else {
        details = "Add course button not working.";
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

  test("Kambaz - Dashboard - Deleting a Course", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Deleting a Course";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      await page.waitForTimeout(1000);

      const courseCards = page.locator(".wd-dashboard-course");
      const initialCount = await courseCards.count();

      if (initialCount === 0) {
        details = "No courses available to delete.";
      } else {
        // Click Edit on the first course card
        const firstEditBtn = page.locator("#wd-edit-course-click").first();

        await firstEditBtn.click();
        await page.waitForTimeout(300);

        // Click the TOP delete button
        const topDeleteBtn = page.locator('button:has-text("Delete")').first();

        await topDeleteBtn.click();

        // Wait for Redux state update + re-render
        await page.waitForTimeout(1200);

        const afterCount = await page.locator(".wd-dashboard-course").count();

        if (afterCount < initialCount) {
          points.earned = 3;
          details = `Course deleted successfully (${initialCount} → ${afterCount}).`;
        } else {
          points.earned = 1;
          details = `Delete clicked but count did not decrease (${initialCount} → ${afterCount}).`;
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

  test("Kambaz - Dashboard - Editing a Course", async ({ page }) => {
    const criterion = "Kambaz - Dashboard - Editing a Course";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      await page.waitForTimeout(800);

      // All course cards
      const courseCards = page.locator(".wd-dashboard-course");
      const count = await courseCards.count();

      if (count === 0) {
        details = "No courses available to edit.";
      } else {
        // Pick the first course card
        const firstCourse = courseCards.first();

        // Read its title BEFORE clicking edit
        const originalTitle = await firstCourse
          .locator(".wd-dashboard-course-title")
          .innerText();

        // Click Edit on that card
        await firstCourse.locator("#wd-edit-course-click").click();
        await page.waitForTimeout(300);

        // Check if the top FormControl input now contains that title
        const topNameInput = page.locator("input.mb-2"); // this matches your name input
        const inputValue = await topNameInput.inputValue();

        if (inputValue.trim() === originalTitle.trim()) {
          points.earned = 3;
          details =
            "Edit mode activated and course data loaded into input fields.";
        } else {
          points.earned = 1;
          details = `Edit button clicked, but input field value '${inputValue}' does not match selected course title '${originalTitle}'.`;
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

  // ==================== KAMBAZ - COURSES ====================

  test("Kambaz - Courses - Display selected course", async ({ page }) => {
    const criterion = "Kambaz - Courses - Display selected course";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Home`);

      // Check if course content is displayed
      const hasContent = await page
        .locator('h1, h2, [class*="course"]')
        .count();

      if (hasContent > 0) {
        points.earned = 3;
        details = "Selected course displays correctly.";
      } else {
        details = "Course page appears empty.";
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

  // ==================== KAMBAZ - MODULES ====================

  test("Kambaz - Modules - Creating a Module", async ({ page }) => {
    const criterion = "Kambaz - Modules - Creating a Module";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      await navigateWithRetry(page, "/Courses/" + TEST_COURSE_ID + "/Modules");

      // Click "+ Module" button
      const addModuleButton = page.locator("#wd-add-module-btn").first();

      await addModuleButton.click();

      // Wait for modal content specifically (avoids strict mode failure)
      const modal = page.locator(".modal.show .modal-content").first();
      await modal.waitFor({ state: "visible" });

      // Check for input inside modal
      const inputCount = await modal.locator("input.form-control").count();

      if (inputCount > 0) {
        points.earned = 3;
        details = "Module creation modal opened with FormControl input.";
      } else {
        details = "Modal opened but no FormControl input found.";
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

  test("Kambaz - Modules - Deleting a Module", async ({ page }) => {
    const criterion = "Kambaz - Modules - Deleting a Module";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);

      // Count modules initially
      const initialCount = await page.locator(".wd-module").count();

      if (initialCount === 0) {
        details = "No modules to delete.";
      } else {
        // Locate delete icon inside the first module row
        const deleteButton = page.locator(".wd-module svg.text-danger").first();

        await deleteButton.click();

        // Wait for state update
        await page.waitForTimeout(800);

        const afterCount = await page.locator(".wd-module").count();

        if (afterCount < initialCount) {
          points.earned = 3;
          details = `Module deleted successfully (${initialCount} → ${afterCount}).`;
        } else {
          details = "Delete module not working.";
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

  test("Kambaz - Modules - Editing a Module", async ({ page }) => {
    const criterion = "Kambaz - Modules - Editing a Module";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);

      // Find the edit pencil icon
      const editButton = page.locator(".wd-module svg.text-primary").first();

      if ((await editButton.count()) === 0) {
        details = "No edit module button found.";
      } else {
        // Click to enable editing
        await editButton.click();
        await page.waitForTimeout(500);

        // Check if the input (FormControl) appears inside a module row
        const hasInput = await page
          .locator(".wd-module input.form-control")
          .count();

        if (hasInput > 0) {
          points.earned = 3;
          details = "Edit module interface (input box) appears.";
        } else {
          details = "Edit button found but no edit interface appeared.";
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

  test("Kambaz - Modules - Module Reducer", async ({ page }) => {
    const criterion = "Kambaz - Modules - Module Reducer";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);

      // Before count
      const initialCount = await page.locator(".wd-module").count();

      // Click +Module button
      await page.locator("#wd-add-module-btn").first().click();

      // Wait for modal to appear
      const modal = page.locator(".modal.show");
      await modal.waitFor();

      // Type a new module name
      await modal.locator("input.form-control").fill("Reducer Test Module");

      // Click Add in modal footer
      await modal.locator("button:has-text('Add')").click();

      await page.waitForTimeout(700);

      // After count
      const afterCount = await page.locator(".wd-module").count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = "Module reducer functioning (Redux state updated correctly).";
      } else {
        details = "Module reducer did not update state.";
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

  // ==================== KAMBAZ - ASSIGNMENTS ====================

  test("Kambaz - Assignments - Creating an Assignment", async ({ page }) => {
    const criterion = "Kambaz - Assignments - Creating an Assignment";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);

      // Count assignments on landing page
      const initialCount = await page
        .locator(".border-bottom >> text=Points")
        .count();

      // Click the + Assignment button (uses variant="danger")
      await page.locator('button:has-text("+ Assignment")').click();

      // Ensure editor loaded
      await page.waitForSelector("#wd-assignments-editor");

      // Fill in required fields
      const randomName = `Test Assignment ${Date.now()}`;
      await page.locator("input#assignmentName").fill(randomName);

      await page
        .locator("textarea#assignmentDescription")
        .fill("This is a created assignment from automated test.");

      // Points
      await page.locator("input#points").fill("100");

      // Due Date
      await page.locator("input#dueDate").fill("2025-12-25");

      // Save
      await page.locator('button:has-text("Save")').click();

      // Wait for redirect back
      await page.waitForURL(/\/Assignments$/);

      // Count again after saving
      const afterCount = await page
        .locator(".border-bottom >> text=Points")
        .count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = `Assignment created successfully (${initialCount} → ${afterCount}).`;
      } else {
        details = "Assignment editor saved, but assignment not added.";
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

  test("Kambaz - Assignments - Editing an Assignment", async ({ page }) => {
    const criterion = "Kambaz - Assignments - Editing an Assignment";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);

      // Find the first assignment link
      const firstAssignment = page
        .locator('#wd-assignments a[href*="Assignments"]')
        .first();

      if ((await firstAssignment.count()) === 0) {
        details = "No assignments available to edit.";
      } else {
        await firstAssignment.click();
        await page.waitForTimeout(500);

        // Editor must show populated inputs
        const titleInput = page.locator("input#assignmentName");

        if (await titleInput.count()) {
          points.earned = 3;
          details = "Assignment editor opened successfully.";
        } else {
          details = "Editor did not load after clicking assignment.";
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

  test("Kambaz - Assignments - Deleting an Assignment", async ({ page }) => {
    const criterion = "Kambaz - Assignments - Deleting an Assignment";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await ensureLoggedIn(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);

      // Count before deleting
      const initialCount = await page
        .locator("#wd-assignments .border-bottom")
        .count();

      if (initialCount > 0) {
        // Find delete/trash button
        const deleteButton = page
          .locator("#wd-assignments button.text-danger")
          .first();

        await deleteButton.click();

        // Wait for modal
        await page.waitForSelector(".modal-dialog");

        // Confirm delete
        await page.locator('button:has-text("Yes")').click();
        await page.waitForTimeout(500);

        const afterCount = await page
          .locator("#wd-assignments .border-bottom")
          .count();

        if (afterCount < initialCount) {
          points.earned = 3;
          details = `Assignment deleted successfully (${initialCount} → ${afterCount}).`;
        } else {
          details = "Delete assignment not working.";
        }
      } else {
        details = "No assignments to delete.";
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

  // ==================== FINAL SUMMARY ====================

  test.afterAll(async () => {
    console.log("\n=== ASSIGNMENT 4 GRADING RESULTS ===");
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
