import { test, expect } from "@playwright/test";

const results = [];

// Constants
const TEST_COURSE_ID = "RS101";
const TEST_USER = {
  username: "iron_man",
  password: "stark123",
};

// URLs - Frontend and Backend
const FRONTEND_URL = process.env.STUDENT_URL;
const BACKEND_URL = process.env.BACKEND_URL || process.env.STUDENT_URL; // Fallback to same URL if not provided

// Helper function to build URLs
function buildUrl(path, useBackend = false) {
  const baseUrl = useBackend ? BACKEND_URL : FRONTEND_URL;
  if (!baseUrl) return path;

  try {
    const url = new URL(path, baseUrl);
    if (!useBackend && FRONTEND_URL) {
      const frontendUrl = new URL(FRONTEND_URL);
      frontendUrl.searchParams.forEach((value, key) => {
        if (!url.searchParams.has(key)) {
          url.searchParams.set(key, value);
        }
      });
    }
    return url.toString();
  } catch (error) {
    if (baseUrl.endsWith("/") && path.startsWith("/")) {
      return baseUrl + path.slice(1);
    }
    return baseUrl + path;
  }
}

async function navigateWithRetry(page, path, maxRetries = 3) {
  const url = buildUrl(path);
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(2000);
    }
  }
}

test.describe("Assignment 5 Tests", () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(100000);
    page.setDefaultTimeout(100000);
  });

  test.afterEach(() => {
    const last = results[results.length - 1];
    if (last && last.points && last.points.earned < last.points.possible) {
      throw new Error(`Partial grade for "${last.criterion}": ${last.details}`);
    }
  });

  // ==================== LABS - PATH PARAMETERS ====================
  test("Labs - Path Parameters - Add 34 + 23", async ({ page }) => {
    const criterion = "Labs - Path Parameters - Subtract 34 - 23";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      // Step 1: navigate to frontend page
      await navigateWithRetry(page, "/Labs/Lab5");

      // Step 2: click the subtract button
      const addBtn = page.locator("#wd-path-parameter-add").first();

      await addBtn.click();

      // Step 3: wait for navigation to backend URL
      await page.waitForURL(`${BACKEND_URL}/lab5/add/34/23`, {
        timeout: 10000,
      });

      // Step 4: check backend response
      const body = await page.textContent("body");

      if (body?.includes("57")) {
        points.earned = 3;
        details = "Addition endpoint works (34 + 23 = 57)";
      } else {
        details = `Unexpected response: ${body}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });
  test("Labs - Path Parameters - Subtract 34 - 23", async ({ page }) => {
    const criterion = "Labs - Path Parameters - Subtract 34 - 23";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      // Step 1: navigate to frontend page
      await navigateWithRetry(page, "/Labs/Lab5");

      // Step 2: click the subtract button
      const subtractBtn = page.locator("#wd-path-parameter-subtract").first();

      await subtractBtn.click();

      // Step 3: wait for navigation to backend URL
      await page.waitForURL(`${BACKEND_URL}/lab5/subtract/34/23`, {
        timeout: 10000,
      });

      // Step 4: check backend response
      const body = await page.textContent("body");

      if (body?.includes("11")) {
        points.earned = 3;
        details = "Subtraction endpoint works (34 - 23 = 11)";
      } else {
        details = `Unexpected response: ${body}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Path Parameters - multiply", async ({ page }) => {
    const criterion = "Labs - Path Parameters - multiply";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForTimeout(1000);

      // Click the multiply button
      const multiplyBtn = page.locator('a[href*="multiply"]').first();
      await multiplyBtn.click();
      await page.waitForURL(`${BACKEND_URL}/lab5/multiply/34/23`, {
        timeout: 10000,
      });

      const body = await page.textContent("body");

      // Look for the multiplication result (might vary, so check for numbers)
      if (body?.includes("782")) {
        points.earned = 3;
        details = "Path parameter multiplication works.";
      } else {
        details = "Multiplication result not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Path Parameters - divide", async ({ page }) => {
    const criterion = "Labs - Path Parameters - divide";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForTimeout(1000);

      // Click the divide button
      const divideBtn = page.locator('a[href*="divide"]').first();
      await divideBtn.click();
      await page.waitForURL(`${BACKEND_URL}/lab5/divide/34/23`, {
        timeout: 10000,
      });
      const body = await page.textContent("body");
      if (body?.includes("1.4782608695652173")) {
        points.earned = 3;
        details = "Path parameter division works.";
      } else {
        details = "Division result not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // ==================== LABS - QUERY PARAMETERS ====================

  test("Labs - Query Parameters - Add 34 + 23", async ({ page }) => {
    const criterion = "Labs - Query Parameters - Add 34 + 23";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForTimeout(1000);
      const addBtn = page.locator("#wd-query-parameter-add").first();
      await addBtn.click();
      await page.waitForURL(
        `${BACKEND_URL}/lab5/calculator?operation=add&a=34&b=23`,
        {
          timeout: 10000,
        }
      );
      const body = await page.textContent("body");
      if (body?.includes("57")) {
        points.earned = 3;
        details = "Query parameter addition works (34 + 23 = 57).";
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

  test("Labs - Query Parameters - Subtract 34 - 23", async ({ page }) => {
    const criterion = "Labs - Query Parameters - Subtract 34 - 23";
    let points = { earned: 0, possible: 3 };
    let details = "";
    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForTimeout(1000);
      // Look for query-based subtract button
      const subtractBtn = page.locator("#wd-query-parameter-subtract").first();
      await subtractBtn.click();
      await page.waitForURL(
        `${BACKEND_URL}/lab5/calculator?operation=subtract&a=34&b=23`,
        {
          timeout: 10000,
        }
      );
      const body = await page.textContent("body");
      if (body?.includes("11")) {
        points.earned = 3;
        details = "Query parameter subtraction works (34 - 23 = 11).";
      } else {
        details = "Subtraction result not found or incorrect.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }
    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // ==================== LABS - WORKING WITH OBJECTS ====================

  test("Labs - Working with Objects - Get Assignment", async ({ page }) => {
    const criterion = "Labs - Working with Objects - Get Assignment";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      const getAssignmentBtn = page.locator("#wd-retrieve-assignments").first();
      await getAssignmentBtn.click();
      await page.waitForURL(`${BACKEND_URL}/lab5/assignment`, {
        timeout: 10000,
      });
      const body = await page.textContent("body");
      const jsonData = JSON.parse(body);

      if (
        jsonData.id === 1 &&
        jsonData.title === "NodeJS Assignment" &&
        jsonData.description === "Create a NodeJS server with ExpressJS" &&
        jsonData.due === "2021-10-10" &&
        jsonData.completed === false &&
        jsonData.score === 0
      ) {
        points.earned = 3;
        details = "Assignment object retrieved successfully.";
      } else {
        details = "Assignment object not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Working with Objects - Get Title", async ({ page }) => {
    const criterion = "Labs - Working with Objects - Get Title";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      const getAssignmentTitle = page
        .locator("#wd-retrieve-assignment-title")
        .first();
      await getAssignmentTitle.click();
      await page.waitForURL(`${BACKEND_URL}/lab5/assignment/title`, {
        timeout: 10000,
      });
      const body = await page.textContent("body");
      if (body.includes("NodeJS Assignment")) {
        points.earned = 3;
        details = "Assignment title retrieved successfully.";
      } else {
        details = "Assignment title not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Working with Objects - Update Title", async ({ page }) => {
    const criterion = "Labs - Working with Objects - Update Title";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      const newTitle = "NodeJS Assignment";
      await page.locator("#wd-assignment-title").clear();
      await page.locator("#wd-assignment-title").fill(newTitle);
      await page.locator("#wd-update-assignment-title").click();
      await page.waitForURL(
        `${BACKEND_URL}/lab5/assignment/title/NodeJS%20Assignment`,
        {
          timeout: 10000,
        }
      );
      const body = await page.textContent("body");
      const jsonData = JSON.parse(body);
      if (jsonData.title === "NodeJS Assignment") {
        points.earned = 3;
        details = "Assignment title updated successfully.";
      } else {
        details = "Assignment title update failed.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Working with Objects - Get Module", async ({ page }) => {
    const criterion = "Labs - Working with Objects - Get Module";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      const getModuleBtn = page.locator("#wd-retrieve-module").first();
      await getModuleBtn.click();
      await page.waitForURL(`${BACKEND_URL}/lab5/module`, {
        timeout: 10000,
      });
      const body = await page.textContent("body");
      const jsonData = JSON.parse(body);

      if (
        jsonData.id === 1 &&
        jsonData.course === "Web Development" &&
        jsonData.name === "NodeJS Module" &&
        jsonData.description === "Learn the basics of NodeJS and ExpressJS" &&
        jsonData.completed === false &&
        jsonData.score === 0
      ) {
        points.earned = 3;
        details = "Module object retrieved successfully.";
      } else {
        details = "Module object not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Working with Objects - Get Module Name", async ({ page }) => {
    const criterion = "Labs - Working with Objects - Get Module Name";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      const getModuleName = page.locator("#wd-retrieve-module-name").first();
      await getModuleName.click();
      await page.waitForURL(`${BACKEND_URL}/lab5/module/name`, {
        timeout: 10000,
      });
      const body = await page.textContent("body");
      if (body.includes("NodeJS Module")) {
        points.earned = 3;
        details = "Module name retrieved successfully.";
      } else {
        details = "Module name not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // ==================== LABS - WORKING WITH ARRAYS ====================

  test("Labs - Working with Arrays - Get Todos", async ({ page }) => {
    const criterion = "Labs - Working with Arrays - Get Todos";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      const getTodosBtn = page.locator("#wd-retrieve-todos").first();
      await getTodosBtn.click();
      await page.waitForURL(`${BACKEND_URL}/lab5/todos`, {
        timeout: 10000,
      });
      const body = await page.textContent("body");
      const jsonData = JSON.parse(body);

      if (
        Array.isArray(jsonData) &&
        jsonData.length >= 1 &&
        jsonData[0].id === 1 &&
        jsonData[0].title === "Task 1" &&
        jsonData[0].completed === false
      ) {
        points.earned = 3;
        details = "Todos array retrieved successfully.";
      } else {
        details = "Todos array not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Working with Arrays - Get Todo By Id", async ({ page }) => {
    const criterion = "Labs - Working with Arrays - Get Todo By Id";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      const id = "1";
      await page.locator("#wd-todo-id").clear();
      await page.locator("#wd-todo-id").fill(id);
      const getTodosIdBtn = page.locator("#wd-retrieve-todo-by-id").first();
      await getTodosIdBtn.click();
      await page.waitForURL(`${BACKEND_URL}/lab5/todos/${id}`, {
        timeout: 10000,
      });
      const body = await page.textContent("body");
      const jsonData = JSON.parse(body);

      if (
        jsonData.id === 1 &&
        jsonData.title === "Task 1" &&
        jsonData.completed === false
      ) {
        points.earned = 3;
        details = "Todo by ID retrieved successfully.";
      } else {
        details = "Todo by ID not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Working with Arrays - Get Completed Todos", async ({ page }) => {
    const criterion = "Labs - Working with Arrays - Get Completed Todos";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      const getCompleteTodos = page
        .locator("#wd-retrieve-completed-todos")
        .first();
      await getCompleteTodos.click();
      await page.waitForURL(`${BACKEND_URL}/lab5/todos?completed=true`, {
        timeout: 10000,
      });
      const body = await page.textContent("body");
      const jsonData = JSON.parse(body);

      if (
        Array.isArray(jsonData) &&
        jsonData.length > 0 &&
        jsonData.every((todo) => todo.completed === true)
      ) {
        points.earned = 3;
        details = "Completed todos filtered successfully.";
      } else {
        details = "Completed todos filter not working.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Working with Arrays - Create Todo", async ({ page }) => {
    const criterion = "Labs - Working with Arrays - Create Todo";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      const newTodo = { title: "New Test Todo", completed: false };
      await navigateWithRetry(page, `/Labs/Lab5`);
      const createTodo = page.locator("Create Todo").first();
      await createTodo.click();
      await page.waitForURL(`${BACKEND_URL}/lab5/todos/create`, {
        timeout: 10000,
      });
      const body = await page.textContent("body");
      if (body) {
        points.earned = 3;
        details = "Todo creation endpoint works.";
      } else {
        details = "Todo creation failed.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Working with Arrays - Delete Todo with Id = 1", async ({
    page,
  }) => {
    const criterion = "Labs - Working with Arrays - Delete Todo with Id  = 1";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      const pageText = await page.textContent("body");
      const todoIdToRemove = "1";

      // Fill in the todo ID input field
      // const removeSection = page.locator("text=Removing from an Array");
      // const removeIdInput = removeSection.locator("input.form-control").first();

      // await removeIdInput.clear();
      // await removeIdInput.fill(todoIdToRemove);

      // Click the remove button
      const removeBtn = page.locator("#wd-remove-todo").first();
      await removeBtn.click();
      // Check if the response indicates successful deletion
      await page.waitForURL(
        `${BACKEND_URL}/lab5/todos/${todoIdToRemove}/delete`,
        {
          timeout: 10000,
        }
      );
      const body = await page.textContent("body");
      const todos = JSON.parse(body);

      const todoExists = todos.some(
        (todo) => todo.id === parseInt(todoIdToRemove)
      );
      if (!todoExists) {
        points.earned = 3;
        details = "Todo deletion endpoint works.";
      } else {
        details = "Todo deletion failed.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Working with Arrays - Update Todo To NodeJS Assignment", async ({
    page,
  }) => {
    const criterion =
      "Labs - Working with Arrays - Update Todo To NodeJS Assignment";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      const updateBtn = page.locator('a.btn:has-text("Update Todo")').first();
      await updateBtn.click();
      // Verify the update
      await page.waitForURL(
        `${BACKEND_URL}/lab5/todos/1/title/NodeJS%20Assignment`,
        {
          timeout: 10000,
        }
      );
      const body = await page.textContent("body");
      const jsonData = JSON.parse(body);

      if (
        Array.isArray(jsonData) &&
        jsonData.length >= 1 &&
        jsonData[0].id === 1 &&
        jsonData[0].title === "NodeJS Assignment" &&
        jsonData[0].completed === false
      ) {
        points.earned = 3;
        details = "Todo update works correctly.";
      } else {
        details = "Todo update failed.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // ==================== LABS - ASYNC & HTTP METHODS ====================

  test("Labs - Asynch - Fetching Welcome", async ({ page }) => {
    const criterion = "Labs - Asynch - Fetching Welcome";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForTimeout(1000);
      const fetchBtn = page.locator('button:has-text("Fetch Welcome")').first();
      await fetchBtn.click();
      // const fetchBtn = page.locator('button:has-text("Fetch Welcome")');
      // await fetchBtn.click();

      // Wait a moment for the fetch to complete
      await page.waitForTimeout(2000);

      // Get all bold text elements that might contain the welcome message
      const boldElements = page.locator("b");
      const count = await boldElements.count();

      let foundWelcome = false;
      for (let i = 0; i < count; i++) {
        const text = await boldElements.nth(i).textContent();
        if (text?.includes("Welcome to Lab 5")) {
          foundWelcome = true;
          break;
        }
      }

      if (foundWelcome) {
        points.earned = 3;
        details = "Async welcome message fetched successfully.";
      } else {
        details = "Welcome message not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Asynch - Can edit the assignment title", async ({ page }) => {
    const criterion = "Labs - Asynch - Can edit the assignment title";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForLoadState("networkidle");

      const newTitle = "Updated NodeJS Assignment";

      // Find and update the title
      const asyncSection = page
        .locator('h3:has-text("Working with Objects Asynchronously")')
        .locator("..");
      const titleInput = asyncSection.locator("input.form-control").first();

      await titleInput.clear();
      await titleInput.fill(newTitle);

      // Click Update Title button
      await asyncSection.locator('button:has-text("Update Title")').click();

      // Wait for update to complete
      await page.waitForTimeout(1500);

      // Now verify by clicking "Get Assignment Title" button
      const getAssignmentTitle = page
        .locator("#wd-retrieve-assignment-title")
        .first();
      await getAssignmentTitle.click();

      // Wait for navigation to the server response
      await page.waitForURL(`${BACKEND_URL}/lab5/assignment/title`, {
        timeout: 10000,
      });

      const body = await page.textContent("body");

      if (body?.includes(newTitle)) {
        points.earned = 3;
        details = "Assignment title can be edited.";
      } else {
        details = "Assignment title input not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - POST - Post Todo button creates a new todo", async ({
    page,
  }) => {
    const criterion = "Labs - POST - Post Todo button creates a new todo";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForLoadState("networkidle");

      // Count initial todos in the list
      const initialCount = await page.locator(".list-group-item").count();

      // Click the blue plus icon (Post Todo) - it has id="wd-post-todo"
      const postButton = page.locator("#wd-post-todo");
      await postButton.click();

      // Wait for the new todo to appear
      await page.waitForTimeout(1000);

      const afterCount = await page.locator(".list-group-item").count();
      console.log(afterCount);
      if (afterCount > initialCount) {
        points.earned = 3;
        details = "POST request creates new todo successfully.";
      } else {
        details = "POST button clicked but no new todo added.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - DELETE - Delete button removes todo item", async ({ page }) => {
    const criterion = "Labs - DELETE - Delete button removes todo item";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForLoadState("networkidle");

      await page
        .locator('h3:has-text("Working with Arrays Asynchronously")')
        .scrollIntoViewIfNeeded();

      const initialCount = await page.locator(".list-group-item").count();

      if (initialCount > 0) {
        await page.locator("#wd-delete-todo").first().click();
        await page.waitForTimeout(2000);

        const afterCount = await page.locator(".list-group-item").count();

        if (afterCount < initialCount) {
          points.earned = 3;
          details = `DELETE request removes todo successfully. Count decreased from ${initialCount} to ${afterCount}.`;
        } else {
          details = `Delete button clicked but todo not removed. Count: ${afterCount}`;
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

  test("Labs - PUT - Update Todo checkbox updates the todo", async ({
    page,
  }) => {
    const criterion = "Labs - PUT - Update Todo checkbox updates the todo";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForLoadState("networkidle");

      await page
        .locator('h3:has-text("Working with Arrays Asynchronously")')
        .scrollIntoViewIfNeeded();

      const firstCheckbox = page
        .locator('.list-group-item input[type="checkbox"]')
        .first();

      if ((await firstCheckbox.count()) > 0) {
        const wasChecked = await firstCheckbox.isChecked();

        await firstCheckbox.click();
        await page.waitForTimeout(1500);

        const isNowChecked = await firstCheckbox.isChecked();

        if (wasChecked !== isNowChecked) {
          points.earned = 3;
          details = `PUT request updates todo successfully. Checkbox changed from ${wasChecked} to ${isNowChecked}.`;
        } else {
          details = "Checkbox clicked but state did not change.";
        }
      } else {
        details = "No todo checkboxes found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Labs - Errors - Unable to Delete Todo with ID: 1234", async ({
    page,
  }) => {
    const criterion = "Labs - Errors - Unable to Delete Todo with ID: 1234";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForTimeout(1000);

      // Try to delete non-existent todo
      const errorButton = page.locator('button:has-text("Error")').first();
      if ((await errorButton.count()) > 0) {
        await errorButton.click();
        await page.waitForTimeout(500);

        // Check for error message
        const hasError =
          (await page.locator("text=/error|unable|not found/i").count()) > 0;
        if (hasError) {
          points.earned = 3;
          details = "Error handling works correctly.";
        } else {
          details = "Error message not displayed.";
        }
      } else {
        details = "Error test button not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // ==================== KAMBAZ - ACCOUNT ====================

  test("Kambaz - Account - Can signin with existing account", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Account - Can signin with existing account, e.g., iron_man/stark123";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.waitForTimeout(1000);

      await page
        .locator('input[type="text"], input[placeholder*="username"]')
        .fill(TEST_USER.username);
      await page.locator('input[type="password"]').fill(TEST_USER.password);

      await page
        .locator('button:has-text("Sign in"), button:has-text("Login")')
        .click();
      await page.waitForTimeout(1000);

      // Check if redirected to dashboard or profile
      const currentUrl = page.url();
      if (
        currentUrl.includes("/Dashboard") ||
        currentUrl.includes("/Profile") ||
        currentUrl.includes("/Account")
      ) {
        points.earned = 3;
        details = "Successfully signed in with existing account.";
      } else {
        details = "Sign in did not redirect correctly.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Can create new account", async ({ page }) => {
    const criterion = "Kambaz - Account - Can create new account";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signup");
      await page.waitForTimeout(1000);
      const NEW_USER = { username: "Asti", password: "123" };
      await page.locator("#wd-username").fill(NEW_USER.username);
      await page.locator("#wd-password").fill(NEW_USER.password);
      await page.locator("#wd-password-verify").fill(NEW_USER.password);

      await page.locator("#wd-signin-btn").click();
      await page.waitForTimeout(1000);

      // Check if account was created
      const currentUrl = page.url();
      if (!currentUrl.includes("/Signup")) {
        points.earned = 3;
        details = "New account created successfully.";
      } else {
        details = "Account creation failed.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Account - Can update profile", async ({ page }) => {
    const criterion = "Kambaz - Account - Can update profile";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      // First sign in
      await navigateWithRetry(page, "/Account/Signin");
      await page.locator("#wd-username").fill(TEST_USER.username);
      await page.locator("#wd-password").fill(TEST_USER.password);
      await page.locator('button:has-text("Sign in")').click();
      await page.waitForTimeout(1000);

      // Go to profile
      await navigateWithRetry(page, "/Account/Profile");
      await page.waitForTimeout(1000);

      // Update profile
      const firstNameInput = page
        .locator('input[placeholder*="First"], input[name="firstName"]')
        .first();
      if ((await firstNameInput.count()) > 0) {
        await firstNameInput.fill("Updated Name");

        await page
          .locator('button:has-text("Update"), button:has-text("Save")')
          .click();
        await page.waitForTimeout(500);

        points.earned = 3;
        details = "Profile updated successfully.";
      } else {
        details = "Profile update form not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Can signout", async ({ page }) => {
    const criterion = "Can signout";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      // Sign in first
      await navigateWithRetry(page, "/Account/Signin");
      await page.locator("#wd-username").fill(TEST_USER.username);
      await page.locator("#wd-password").fill(TEST_USER.password);
      await page.locator('button:has-text("Sign in")').click();
      await page.waitForTimeout(1000);

      // Sign out
      await page.locator("#wd-signout-btn").click();
      await page.waitForTimeout(1500);

      // Check if redirected to signin
      const currentUrl = page.url();
      if (currentUrl.includes("/Signin")) {
        points.earned = 3;
        details = "Successfully signed out.";
      } else {
        details = "Sign out did not work correctly.";
      }
    } catch (error) {
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

  test("Kambaz - Courses - Dashboard retrieves and renders courses from server", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Courses - Dashboard retrieves and renders courses from server";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Account/Signin");
      await page.locator("#wd-username").fill(TEST_USER.username);
      await page.locator("#wd-password").fill(TEST_USER.password);
      await page.locator('button:has-text("Sign in")').click();
      await page.waitForTimeout(1000);

      const courseCount = await page.locator('[class*="course"]').count();
      if (courseCount > 0) {
        points.earned = 3;
        details = `Dashboard displays ${courseCount} courses from server.`;
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

  test("Kambaz - Courses - Add button creates new course in server. Refresh to confirm", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Courses - Add button creates new course in server. Refresh to confirm";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1000);

      const initialCount = await page.locator('[class*="course"]').count();

      await page
        .locator('button:has-text("Course"), button:has-text("Add")')
        .first()
        .click();
      await page.waitForTimeout(1000);

      // Refresh page
      await page.reload();
      await page.waitForTimeout(1000);

      const afterCount = await page.locator('[class*="course"]').count();
      if (afterCount > initialCount) {
        points.earned = 3;
        details = "Course persists after refresh (saved to server).";
      } else {
        details = "Course not persisted to server.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Courses - Delete button removes course from server. Refresh to confirm", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Courses - Delete button removes course from server. Refresh to confirm";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1000);

      const initialCount = await page.locator('[class*="course"]').count();

      if (initialCount > 0) {
        await page.locator('button:has-text("Delete")').first().click();
        await page.waitForTimeout(1000);

        // Refresh page
        await page.reload();
        await page.waitForTimeout(1000);

        const afterCount = await page.locator('[class*="course"]').count();
        if (afterCount < initialCount) {
          points.earned = 3;
          details =
            "Course deletion persists after refresh (removed from server).";
        } else {
          details = "Course deletion not persisted to server.";
        }
      } else {
        details = "No courses to delete.";
      }
    } catch (error) {
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

  test("Kambaz - Modules - Confirm that navigating to a course populates the corresponding modules", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Modules - Confirm that navigating to a course populates the corresponding modules";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForTimeout(1500);

      const moduleCount = await page.locator('[class*="module"]').count();
      if (moduleCount > 0) {
        points.earned = 3;
        details = `Modules loaded from server (${moduleCount} modules found).`;
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

  test("Kambaz - Modules - Confirm that you can create new modules for the current course", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Modules - Confirm that you can create new modules for the current course";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForTimeout(1000);

      const initialCount = await page.locator('[class*="module"]').count();

      await page.locator('button:has-text("Module")').first().click();
      await page.waitForTimeout(500);

      await page.locator('input[placeholder*="name"]').fill("Test Module");
      await page.locator('button:has-text("Add")').click();
      await page.waitForTimeout(1000);

      // Refresh to verify persistence
      await page.reload();
      await page.waitForTimeout(1000);

      const afterCount = await page.locator('[class*="module"]').count();
      if (afterCount > initialCount) {
        points.earned = 3;
        details = "Module created and persisted to server.";
      } else {
        details = "Module creation not persisted.";
      }
    } catch (error) {
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

  test("Kambaz - Assignments - Retrieve assignments for selected course", async ({
    page,
  }) => {
    const criterion =
      "Kambaz - Assignments - Retrieve assignments for selected course";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForTimeout(1500);

      const assignmentCount = await page
        .locator('[class*="assignment"]')
        .count();
      if (assignmentCount > 0) {
        points.earned = 3;
        details = `Assignments loaded from server (${assignmentCount} assignments found).`;
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

  // ==================== KAMBAZ - WORKS REMOTELY ====================

  test("Labs - Work Remotely", async ({ page }) => {
    const criterion = "Labs - Work Remotely";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      // Test if the app works with remote server
      await navigateWithRetry(page, "/Labs/Lab5");
      await page.waitForTimeout(1000);

      // Check if data is loaded from remote server
      const hasData = (await page.locator('li, [class*="todo"]').count()) > 0;

      if (hasData) {
        points.earned = 3;
        details = "Application works with remote server.";
      } else {
        details = "Remote server connection not working.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Kambaz - Works Remotely", async ({ page }) => {
    const criterion = "Kambaz - Works Remotely";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // Check if courses are loaded from remote server
      const courseCount = await page.locator('[class*="course"]').count();

      if (courseCount > 0) {
        points.earned = 3;
        details = "Kambaz works with remote server (courses loaded).";
      } else {
        details = "Remote server connection not working for Kambaz.";
      }
    } catch (error) {
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
    console.log("\n=== ASSIGNMENT 5 GRADING RESULTS ===");
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
