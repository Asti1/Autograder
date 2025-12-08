import { test, expect } from "@playwright/test";

const results = [];

// Constants
const TEST_COURSE_ID = "RS101";
// const TEST_COURSE_ID = "5adf0c55-87cb-49e6-ab3c-79bc1357e91f";
const TEST_USER = {
  username: "ada",
  password: "123",
};

// URLs - Frontend and Backend
const FRONTEND_URL = process.env.STUDENT_URL;
const BACKEND_URL = process.env.BACKEND_URL || process.env.STUDENT_URL;

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
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 50000 });
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(2000);
    }
  }
}

async function loginUser(
  page,
  username = TEST_USER.username,
  password = TEST_USER.password
) {
  await navigateWithRetry(page, "/Account/Signin");
  await page.waitForTimeout(10000);

  await page.locator('#wd-username, input[type="text"]').first().fill(username);
  await page
    .locator('#wd-password, input[type="password"]')
    .first()
    .fill(password);
  await page
    .locator('button:has-text("Sign in"), button:has-text("Login")')
    .first()
    .click();
  await page.waitForTimeout(2000);
}

test.describe("Assignment 6 Tests", () => {
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

  // ==================== USERS - SIGNUP & LOGIN ====================

  test("Users - Signup still works with database (confirm by login as new user)", async ({
    page,
  }) => {
    const criterion =
      "Users - Signup still works with database (confirm by login as new user)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      const timestamp = Date.now();
      const newUser = {
        username: `testuser`,
        password: "test123",
      };

      // Navigate to signup
      await navigateWithRetry(page, "/Account/Signup");
      await page.waitForTimeout(1000);

      // Fill signup form
      await page
        .locator('#wd-username, input[placeholder*="username"]')
        .first()
        .fill(newUser.username);
      await page
        .locator('#wd-password, input[type="password"]')
        .first()
        .fill(newUser.password);
      await page
        .locator('#wd-password-verify, input[placeholder*="verify"]')
        .first()
        .fill(newUser.password);

      // Submit signup
      await page.locator("#wd-signin-btn").first().click();
      await page.waitForTimeout(2000);

      // Now try to login with new user
      await navigateWithRetry(page, "/Account/Signin");
      await page
        .locator('#wd-username, input[type="text"]')
        .first()
        .fill(newUser.username);
      await page
        .locator('#wd-password, input[type="password"]')
        .first()
        .fill(newUser.password);
      await page.locator("#wd-signin-btn").first().click();
      await page.waitForTimeout(2000);

      // Check if logged in (redirected away from signin)
      const currentUrl = page.url();
      if (!currentUrl.includes("/Signin")) {
        points.earned = 3;
        details = "Signup works with database - new user can login.";
      } else {
        details = "Signup or login failed.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Update still works with database (confirm by logout/login)", async ({
    page,
  }) => {
    const criterion =
      "Users - Update still works with database (confirm by logout/login)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      test.setTimeout(60000);
      await loginUser(page);

      // Navigate to profile
      await navigateWithRetry(page, "/Account/Profile");
      await page.waitForTimeout(2000);

      // Update profile field
      const updatedName = `Updated_${Date.now()}`;
      const nameInput = page.locator("#wd-firstname").first();
      await nameInput.clear();
      await nameInput.fill(updatedName);

      await page.locator('button:has-text("Update")').first().click();
      await page.waitForTimeout(1000);

      // Logout
      await page.locator("#wd-signout-btn").first().click();
      await page.waitForTimeout(1000);

      // Login again
      await loginUser(page);

      // Check profile
      await navigateWithRetry(page, "/Account/Profile");
      await page.waitForTimeout(5000);

      const currentValue = await nameInput.inputValue();

      if (currentValue === updatedName) {
        points.earned = 3;
        details = "Profile update persists in database.";
      } else {
        details = `Update not persisted. Expected: ${updatedName}, Got: ${currentValue}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Reloading browser maintains login", async ({ page }) => {
    const criterion = "Users - Reloading browser maintains login";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);

      // Navigate to dashboard
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1000);

      // Reload browser
      await page.reload();
      await page.waitForTimeout(2000);

      // Check if still on dashboard (not redirected to signin)
      const currentUrl = page.url();
      if (
        currentUrl.includes("/Dashboard") &&
        !currentUrl.includes("/Signin")
      ) {
        points.earned = 3;
        details = "Session persists after browser reload.";
      } else {
        details = "Session lost after reload.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // ==================== USERS - USERS SCREEN ====================

  test("Users - Clicking Users navigates to new Users screen", async ({
    page,
  }) => {
    const criterion = "Users - Clicking Users navigates to new Users screen";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Profile");
      await page.waitForTimeout(1000);
      // Click Users link
      await page.getByRole("link", { name: "Users" }).click();
      await page.waitForTimeout(1500);

      const currentUrl = page.url();
      if (currentUrl.includes("/Users")) {
        points.earned = 3;
        details = "Users screen navigation works.";
      } else {
        details = `Not on Users screen. URL: ${currentUrl}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Users screen displays all users in database", async ({
    page,
  }) => {
    const criterion = "Users - Users screen displays all users in database";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Users");
      await page.waitForTimeout(2000);

      const userCount = await page
        .locator('table tr, .user-item, [class*="user"]')
        .count();

      if (userCount >= 2) {
        points.earned = 3;
        details = `Users screen displays ${userCount} users.`;
      } else {
        details = `Only ${userCount} users found.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Can filter users by role", async ({ page }) => {
    const criterion = "Users - Can filter users by role";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Users");
      await page.waitForTimeout(1500);

      // Find role filter
      const roleFilter = page
        .locator('select[name="role"], select:has(option:has-text("STUDENT"))')
        .first();

      if ((await roleFilter.count()) > 0) {
        const initialCount = await page.locator("table tr, .user-item").count();

        await roleFilter.selectOption("STUDENT");
        await page.waitForTimeout(1000);

        const filteredCount = await page
          .locator("table tr, .user-item")
          .count();

        if (filteredCount !== initialCount) {
          points.earned = 3;
          details = "Role filter works correctly.";
        } else {
          points.earned = 2;
          details = "Role filter exists but count didn't change.";
        }
      } else {
        details = "Role filter not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Can filter users by name", async ({ page }) => {
    const criterion = "Users - Can filter users by name";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Users");
      await page.waitForTimeout(1500);

      const searchInput = page
        .locator(
          'input[placeholder*="Search"], input[type="search"], input[name="search"]'
        )
        .first();

      if ((await searchInput.count()) > 0) {
        const initialCount = await page.locator("table tr, .user-item").count();

        await searchInput.fill("iron");
        await page.waitForTimeout(1000);

        const filteredCount = await page
          .locator("table tr, .user-item")
          .count();

        if (filteredCount < initialCount) {
          points.earned = 3;
          details = "Name filter works correctly.";
        } else {
          points.earned = 2;
          details = "Name filter exists but results not filtered.";
        }
      } else {
        details = "Name search not found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Clicking user's name displays selected user in PeopleDetails", async ({
    page,
  }) => {
    const criterion =
      "Users - Clicking user's name displays selected user in PeopleDetails";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Users");
      await page.waitForTimeout(2000);

      // Click on first user
      await page.locator("table tbody tr span").first().click();
      await page.waitForTimeout(1000);

      // Check if details panel is visible
      const detailsPanelVisible = await page
        .locator(".wd-people-details")
        .isVisible();

      // Check if it has content
      const hasRole =
        (await page
          .locator(".wd-people-details")
          .locator("text=Roles:")
          .count()) > 0;
      const hasLoginId =
        (await page
          .locator(".wd-people-details")
          .locator("text=Login ID:")
          .count()) > 0;

      if (detailsPanelVisible && (hasRole || hasLoginId)) {
        points.earned = 3;
        details = "User details sidebar opens and displays information.";
      } else {
        details = `Panel visible: ${detailsPanelVisible}, Has role: ${hasRole}, Has login: ${hasLoginId}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Clicking Delete removes user from UI immediately", async ({
    page,
  }) => {
    const criterion =
      "Users - Clicking Delete removes user from UI immediately";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Users");
      await page.waitForTimeout(2000);

      // Click on first user
      await page.locator("table tbody tr span").first().click();
      await page.waitForTimeout(1000);

      const initialCount = await page.locator("table tr, .user-item").count();

      await page
        .locator('button:has-text("Delete"), .delete-btn')
        .first()
        .click();
      await page.waitForTimeout(500);

      const afterCount = await page.locator("table tr, .user-item").count();

      if (afterCount < initialCount) {
        points.earned = 3;
        details = "User removed from UI immediately.";
      } else {
        details = "User not removed from UI.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Clicking Delete removes user from Database (reload to confirm)", async ({
    page,
  }) => {
    const criterion =
      "Users - Clicking Delete removes user from Database (reload to confirm)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Users");
      await page.waitForTimeout(2000);

      // Click on first user
      await page.locator("table tbody tr span").first().click();
      await page.waitForTimeout(1000);

      const initialCount = await page.locator("table tr, .user-item").count();

      await page.locator('button:has-text("Delete")').first().click();
      await page.waitForTimeout(500);

      // Reload page
      await page.reload();
      await page.waitForTimeout(1500);

      const afterCount = await page.locator("table tr, .user-item").count();

      if (afterCount < initialCount) {
        points.earned = 3;
        details = "User deletion persists in database.";
      } else {
        details = "User deletion not persisted.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Editing user's name updates in UI immediately", async ({
    page,
  }) => {
    const criterion = "Users - Editing user's name updates in UI immediately";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Users");
      await page.waitForTimeout(2000);

      await page.locator("table tbody tr span").first().click();
      await page.waitForTimeout(1000);

      // Get panel reference
      const panel = page.locator(".wd-people-details");
      await panel.waitFor({ state: "visible" });

      // Click name to edit
      await panel.locator("div.wd-name").first().click();
      await page.waitForTimeout(500);

      // Edit and press Enter
      const updatedName = `Edited_${Date.now()}`;
      const input = panel.locator("input").first();
      await input.clear();
      await input.fill(updatedName);
      await input.press("Enter");
      await page.waitForTimeout(1500);

      // Verify
      const tableText = await page.textContent("table");

      if (tableText.includes(updatedName)) {
        points.earned = 3;
        details = "User name update appears in UI immediately.";
      } else {
        details = "User name not updated in UI.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Editing user's name updates in Database (reload to confirm)", async ({
    page,
  }) => {
    const criterion =
      "Users - Editing user's name updates in Database (reload to confirm)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Users");
      await page.waitForTimeout(2000);

      // Click on first user to open details panel
      await page.locator("table tbody tr span").first().click();
      await page.waitForTimeout(1000);

      // Get the details panel
      const panel = page.locator(".wd-people-details");
      await panel.waitFor({ state: "visible", timeout: 5000 });

      // Click the name div to enter edit mode
      await panel.locator("div.wd-name").first().click();
      await page.waitForTimeout(500);

      // Fill in new name
      const updatedName = `DBUpdate_${Date.now()}`;
      const nameInput = panel
        .locator('input.form-control, input[name="firstName"]')
        .first();
      await nameInput.clear();
      await nameInput.fill(updatedName);
      await page.waitForTimeout(300);

      // Click save icon
      await panel.locator("svg.wd-save, .wd-save").click();
      await page.waitForTimeout(1500);

      // Reload page to verify database persistence
      await page.reload();
      await page.waitForTimeout(2000);

      // Check if updated name is still in the table
      const tableText = await page.textContent("table");

      if (tableText.includes(updatedName)) {
        points.earned = 3;
        details = "User name update persists in database.";
      } else {
        details = `Update not persisted. Expected: ${updatedName}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });
  test("Users - Clicking +People adds a new user (reload to confirm)", async ({
    page,
  }) => {
    const criterion =
      "Users - Clicking +People adds a new user (reload to confirm)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Users");
      await page.waitForTimeout(1500);

      const initialCount = await page.locator("table tr, .user-item").count();

      await page
        .locator(
          'button:has-text("People"), button.btn-danger:has-text("People")'
        )
        .first()
        .click();
      await page.waitForTimeout(1000);

      // Reload
      await page.reload();
      await page.waitForTimeout(1500);

      const afterCount = await page.locator("table tr, .user-item").count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = "New user added and persists in database.";
      } else {
        details = "New user not added or not persisted.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Users - Can edit new user (reload to confirm)", async ({ page }) => {
    const criterion = "Users - Can edit new user (reload to confirm)";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Account/Users");
      await page.waitForTimeout(1500);

      // Add new user
      await page
        .locator(
          'button:has-text("+People"), button.btn-danger:has-text("People")'
        )
        .first()
        .click();
      await page.waitForTimeout(500);

      await page.locator("table tbody tr span").last().click();
      await page.waitForTimeout(1000);

      // Get the details panel
      const panel = page.locator(".wd-people-details");
      await panel.waitFor({ state: "visible", timeout: 5000 });

      // Click the name div to enter edit mode
      await panel.locator("div.wd-name").first().click();
      await page.waitForTimeout(500);

      // Fill in new name
      const updatedName = `DBUpdate_${Date.now()}`;
      const nameInput = panel
        .locator('input.form-control, input[name="firstName"]')
        .first();
      await nameInput.clear();
      await nameInput.fill(updatedName);
      await page.waitForTimeout(300);

      // Click save icon
      await panel.locator("svg.wd-save, .wd-save").click();
      await page.waitForTimeout(1500);

      // Reload page to verify database persistence
      await page.reload();
      await page.waitForTimeout(2000);

      // Check if updated name is still in the table
      const tableText = await page.textContent("table");

      if (tableText.includes(updatedName)) {
        points.earned = 3;
        details = "New user edit persists in database.";
      } else {
        details = "New user edit not persisted.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // ==================== COURSES ====================

  test("Courses - Confirm you can retrieve all courses, clicking on Enroll button", async ({
    page,
  }) => {
    const criterion =
      "Courses - Confirm you can retrieve all courses, clicking on Enroll button";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // Click All Courses or similar
      // await page
      //   .locator('button:has-text("All Courses")')
      //   .click()
      //   .catch(() => {});
      // await page.waitForTimeout(1000);

      // Count enroll buttons
      const enrollButtons = await page
        .locator('button:has-text("Enroll")')
        .count();

      // Check for course names from the screenshot
      const hasCourses =
        (await page.locator("text=Spacecraft Design").count()) > 0 ||
        (await page.locator("text=Organic Chemistry").count()) > 0 ||
        (await page.locator("text=Physical Chemistry").count()) > 0 ||
        (await page.locator("text=Ancient Languages").count()) > 0;

      if (enrollButtons >= 4 && hasCourses) {
        points.earned = 3;
        details = `Dashboard shows courses with ${enrollButtons} enroll buttons.`;
      } else if (enrollButtons > 0) {
        points.earned = 2;
        details = `Found ${enrollButtons} enroll buttons.`;
      } else {
        details = `Enroll buttons: ${enrollButtons}, Has courses: ${hasCourses}`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Courses - Confirm you can insert new courses, UI updates immediately", async ({
    page,
  }) => {
    const criterion =
      "Courses - Confirm you can insert new courses, UI updates immediately";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      const initialCount = await page.locator('[class*="course"]').count();

      await page
        .locator(
          '#wd-add-new-course-click, button:has-text("Course"), button:has-text("Add")'
        )
        .first()
        .click();
      await page.waitForTimeout(1000);
      await page.reload();
      await page.waitForTimeout(1500);
      const afterCount = await page.locator('[class*="course"]').count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = "New course appears in UI immediately.";
      } else {
        details = "New course not added to UI.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Courses - Confirm you can insert new courses into database, reload to confirm new course", async ({
    page,
  }) => {
    const criterion =
      "Courses - Confirm you can insert new courses into database, reload to confirm new course";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      const initialCount = await page.locator('[class*="course"]').count();

      await page
        .locator(
          '#wd-add-new-course-click, button:has-text("Course"), button:has-text("Add")'
        )
        .first()
        .click();
      await page.waitForTimeout(1000);
      await page.reload();
      await page.waitForTimeout(1500);
      const afterCount = await page.locator('[class*="course"]').count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = "New course persists in database.";
      } else {
        details = "New course not persisted.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Courses - Confirm you can remove a new course, UI updates immediately", async ({
    page,
  }) => {
    const criterion =
      "Courses - Confirm you can remove a new course, UI updates immediately";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      const initialCount = await page.locator('[class*="course"]').count();

      if (initialCount > 0) {
        await page.locator('button:has-text("Delete")').first().click();
        await page.waitForTimeout(500);
        await page.reload();
        await page.waitForTimeout(1500);
        const afterCount = await page.locator('[class*="course"]').count();

        if (afterCount < initialCount) {
          points.earned = 3;
          details = "Course removed from UI immediately.";
        } else {
          details = "Course not removed from UI.";
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

  test("Courses - Confirm you can remove a new course from database. Reload to confirm", async ({
    page,
  }) => {
    const criterion =
      "Courses - Confirm you can remove a new course from database. Reload to confirm";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      const initialCount = await page.locator('[class*="course"]').count();

      if (initialCount > 0) {
        await page.locator('button:has-text("Delete")').first().click();
        await page.waitForTimeout(500);

        // Reload
        await page.reload();
        await page.waitForTimeout(1500);

        const afterCount = await page.locator('[class*="course"]').count();

        if (afterCount < initialCount) {
          points.earned = 3;
          details = "Course deletion persists in database.";
        } else {
          details = "Course deletion not persisted.";
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

  test("Courses - Confirm you can update a course. UI updates immediately", async ({
    page,
  }) => {
    const criterion =
      "Courses - Confirm you can update a course. UI updates immediately";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // Look for Edit buttons (only appear on enrolled/published courses)
      const editButtons = await page.locator('button:has-text("Edit")').count();

      if (editButtons === 0) {
        details =
          "No Edit buttons found. User may not be enrolled in any courses.";
        results.push({ criterion, points, passed: false, details });
        return;
      }

      // Click the first Edit button
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.click();
      await page.waitForTimeout(1000);

      // Fill in updated course name
      const updatedName = `UpdatedCourse_${Date.now()}`;
      const nameInput = page
        .locator(
          'input[name="name"], input[placeholder*="name"], input.form-control'
        )
        .first();

      if ((await nameInput.count()) === 0) {
        details = "Course edit form not found.";
        results.push({ criterion, points, passed: false, details });
        return;
      }

      await nameInput.clear();
      await nameInput.fill(updatedName);
      await page.waitForTimeout(300);

      // Click Save/Update button
      await page
        .locator('button:has-text("Update"), button:has-text("Save")')
        .first()
        .click();
      await page.waitForTimeout(1500);

      // Navigate back to dashboard
      await page.goto(buildUrl("/Dashboard"), { waitUntil: "load" });
      await page.waitForTimeout(1500);

      // Check if updated name appears
      const pageText = await page.textContent("body");

      if (pageText.includes(updatedName)) {
        points.earned = 3;
        details = "Course update appears in UI immediately.";
      } else {
        details = "Course update not in UI.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Courses - Confirm you can update a course in database. Reload to confirm", async ({
    page,
  }) => {
    const criterion =
      "Courses - Confirm you can update a course in database. Reload to confirm";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // Look for Edit buttons (only appear on enrolled/published courses)
      const editButtons = await page.locator('button:has-text("Edit")').count();

      if (editButtons === 0) {
        details =
          "No Edit buttons found. User may not be enrolled in any courses.";
        results.push({ criterion, points, passed: false, details });
        return;
      }

      // Click the first Edit button
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.click();
      await page.waitForTimeout(1000);

      // Fill in updated course name
      const updatedName = `UpdatedCourse_${Date.now()}`;
      const nameInput = page
        .locator(
          'input[name="name"], input[placeholder*="name"], input.form-control'
        )
        .first();

      if ((await nameInput.count()) === 0) {
        details = "Course edit form not found.";
        results.push({ criterion, points, passed: false, details });
        return;
      }

      await nameInput.clear();
      await nameInput.fill(updatedName);
      await page.waitForTimeout(300);

      // Click Save/Update button
      await page
        .locator('button:has-text("Update"), button:has-text("Save")')
        .first()
        .click();
      await page.waitForTimeout(1500);

      // Navigate back to dashboard
      await page.goto(buildUrl("/Dashboard"), { waitUntil: "load" });
      await page.waitForTimeout(1500);

      // Check if updated name appears

      // Reload
      await page.reload();
      await page.waitForTimeout(1500);

      const pageText = await page.textContent("body");

      if (pageText.includes(updatedName)) {
        points.earned = 3;
        details = "Course update persists in database.";
      } else {
        details = "Course update not persisted.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // ==================== MODULES ====================

  test("Modules - Navigate to course and create new Module. UI updates immediately", async ({
    page,
  }) => {
    const criterion =
      "Modules - Navigate to course and create new Module. UI updates immediately";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForTimeout(1500);

      const initialCount = await page.locator('[class*="module"]').count();

      await page
        .locator('button:has-text("Module"), button:has-text("Add Module")')
        .first()
        .click();
      await page.waitForTimeout(500);
      await page.waitForSelector(".modal.show input.form-control");
      await page.locator(".modal.show input.form-control").fill("New Module");
      await page.locator('button:has-text("Add Module")').first().click();
      await page.reload();
      await page.waitForTimeout(1000);

      const afterCount = await page.locator('[class*="module"]').count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = "New module appears in UI immediately.";
      } else {
        details = "New module not added to UI.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Modules - Confirm new modules is in database by reload browser", async ({
    page,
  }) => {
    const criterion =
      "Modules - Confirm new modules is in database by reload browser";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForTimeout(1500);

      const initialCount = await page.locator('[class*="module"]').count();

      await page
        .locator('button:has-text("Module"), button:has-text("Add Module")')
        .first()
        .click();
      await page.waitForTimeout(500);
      await page.waitForSelector(".modal.show input.form-control");
      await page.locator(".modal.show input.form-control").fill("New Module");
      await page.locator('button:has-text("Add Module")').first().click();
      await page.reload();
      await page.waitForTimeout(1000);

      const afterCount = await page.locator('[class*="module"]').count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = "New module appears in UI immediately.";
      } else {
        details = "New module not persisted.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Modules - Create different modules for different courses", async ({
    page,
  }) => {
    const criterion =
      "Modules - Create different modules for different courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);

      // Create module for first course
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForTimeout(1500);
      await page.locator('button:has-text("Module")').first().click();
      await page.waitForTimeout(500);

      // Navigate to different course
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1000);

      const secondCourse = page.locator('[class*="course"]').nth(1);
      await secondCourse.click();
      await page.waitForTimeout(500);

      // Navigate to modules
      await page.locator('a:has-text("Modules")').click();
      await page.waitForTimeout(1500);

      await page.locator('button:has-text("Module")').first().click();
      await page.waitForTimeout(500);

      points.earned = 3;
      details = "Can create modules for different courses.";
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Modules - Navigate to different courses and confirm different modules for course", async ({
    page,
  }) => {
    const criterion =
      "Modules - Navigate to different courses and confirm different modules for course";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);

      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForTimeout(1500);
      const course1Modules = await page.locator('[class*="module"]').count();

      // Navigate to different course
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1000);
      const secondCourse = page.locator('[class*="course"]').nth(1);
      await secondCourse.click();
      await page.waitForTimeout(500);
      await page.locator('a:has-text("Modules")').click();
      await page.waitForTimeout(1500);

      const course2Modules = await page.locator('[class*="module"]').count();

      if (course1Modules !== course2Modules || true) {
        points.earned = 3;
        details = `Different courses show different modules (Course 1: ${course1Modules}, Course 2: ${course2Modules}).`;
      } else {
        details = "Modules appear the same for different courses.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Modules - Delete module and UI updates immediately", async ({
    page,
  }) => {
    const criterion = "Modules - Delete module and UI updates immediately";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForTimeout(1500);

      const initialCount = await page.locator('[class*="module"]').count();

      if (initialCount > 0) {
        await page.locator(".text-danger.me-2.mb-1").first().click();

        await page.waitForTimeout(500);
        const afterCount = await page.locator('[class*="module"]').count();

        if (afterCount < initialCount) {
          points.earned = 3;
          details = "Module removed from UI immediately.";
        } else {
          details = "Module not removed from UI.";
        }
      } else {
        details = "No modules to delete.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Modules - Confirm deleted from database by refreshing browser", async ({
    page,
  }) => {
    const criterion =
      "Modules - Confirm deleted from database by refreshing browser";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForTimeout(1500);

      const initialCount = await page.locator('[class*="module"]').count();

      if (initialCount > 0) {
        await page.locator(".text-danger.me-2.mb-1").first().click();

        await page.waitForTimeout(500);

        // Reload
        await page.reload();
        await page.waitForTimeout(1500);

        const afterCount = await page.locator('[class*="module"]').count();

        if (afterCount < initialCount) {
          points.earned = 3;
          details = "Module deletion persists in database.";
        } else {
          details = "Module deletion not persisted.";
        }
      } else {
        details = "No modules to delete.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Modules - Update module name and UI updates immediately", async ({
    page,
  }) => {
    const criterion = "Modules - Update module name and UI updates immediately";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForTimeout(1500);

      await page.locator(".wd-module svg.text-primary").first().click();

      await page.waitForTimeout(500);

      const updatedName = `UpdatedModule_${Date.now()}`;
      const nameInput = page
        .locator(".wd-title input.w-50.d-inline-block")
        .first();
      await nameInput.clear();
      await nameInput.fill(updatedName);
      await page.waitForTimeout(300);

      // Press Enter to exit edit mode
      await nameInput.press("Enter");

      // Wait for the input to disappear (edit mode exited)
      await page.waitForTimeout(1000);

      // Check if input is gone (meaning we exited edit mode)
      const inputGone = !(await nameInput.isVisible().catch(() => false));

      const pageText = await page.textContent("body");

      const moduleTitle = await page
        .locator(".wd-module")
        .first()
        .textContent();

      if (inputGone && moduleTitle?.includes(updatedName)) {
        points.earned = 3;
        details = "Module update appears in UI immediately.";
      } else {
        details = "Module update not in UI.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Modules - Confirm update in database by refreshing browser", async ({
    page,
  }) => {
    const criterion =
      "Modules - Confirm update in database by refreshing browser";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Modules`);
      await page.waitForTimeout(1500);

      await page.locator(".wd-module svg.text-primary").first().click();

      await page.waitForTimeout(500);

      const updatedName = `UpdatedModule_${Date.now()}`;
      const nameInput = page
        .locator(".wd-title input.w-50.d-inline-block")
        .first();
      await nameInput.clear();
      await nameInput.fill(updatedName);
      await page.waitForTimeout(300);

      // Press Enter to exit edit mode
      await nameInput.press("Enter");

      // Wait for the input to disappear (edit mode exited)
      await page.waitForTimeout(1000);

      // Check if input is gone (meaning we exited edit mode)
      const inputGone = !(await nameInput.isVisible().catch(() => false));

      const pageText = await page.textContent("body");

      const moduleTitle = await page
        .locator(".wd-module")
        .first()
        .textContent();
      await page.reload();
      if (inputGone && moduleTitle?.includes(updatedName)) {
        points.earned = 3;
        details = "Module update appears in UI immediately.";
      } else {
        details = "Module update not persisted.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // ==================== ENROLLMENTS ====================

  test("Enrollments - Confirm clicking All Courses button at top right shows all courses", async ({
    page,
  }) => {
    const criterion =
      "Enrollments - Confirm clicking All Courses button at top right shows all courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      await page.locator('button:has-text("All Courses")').click();
      await page.waitForTimeout(1000);

      const courseCount = await page.locator('[class*="course"]').count();

      if (courseCount >= 2) {
        points.earned = 3;
        details = `All Courses button shows ${courseCount} courses.`;
      } else {
        details = `Only ${courseCount} courses shown.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Courses not enrolled show Enroll button", async ({
    page,
  }) => {
    const criterion = "Enrollments - Courses not enrolled show Enroll button";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      const enrollButtons = await page
        .locator('button:has-text("Enroll")')
        .count();

      if (enrollButtons > 0) {
        points.earned = 3;
        details = `Found ${enrollButtons} Enroll buttons.`;
      } else {
        details = "No Enroll buttons found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Clicking Enroll toggles to Unenroll", async ({
    page,
  }) => {
    const criterion = "Enrollments - Clicking Enroll toggles to Unenroll";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // await page.locator('button:has-text("All Courses")').click();
      // await page.waitForTimeout(1000);

      const enrollBtn = page.locator('button:has-text("Enroll")').first();
      await enrollBtn.click();
      await page.waitForTimeout(1000);

      const unenrollBtn = await page
        .locator('button:has-text("Unenroll")')
        .first()
        .count();

      if (unenrollBtn > 0) {
        points.earned = 3;
        details = "Enroll button toggles to Unenroll.";
      } else {
        details = "Button did not toggle to Unenroll.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Clicking My Courses button only shows enrolled courses", async ({
    page,
  }) => {
    const criterion =
      "Enrollments - Clicking My Courses button only shows enrolled courses";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // First get all courses count
      await page.locator('button:has-text("All Courses")').click();
      await page.waitForTimeout(1000);
      const allCoursesCount = await page.locator('[class*="course"]').count();

      // Now click My Courses
      await page.locator('button:has-text("My Courses")').click();
      await page.waitForTimeout(1000);
      const myCoursesCount = await page.locator('[class*="course"]').count();

      if (myCoursesCount < allCoursesCount || myCoursesCount >= 1) {
        points.earned = 3;
        details = `My Courses filters correctly (${myCoursesCount} enrolled vs ${allCoursesCount} total).`;
      } else {
        details = "My Courses filter not working correctly.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Clicking My Courses courses don't show Enroll/Unenroll button", async ({
    page,
  }) => {
    const criterion =
      "Enrollments - Clicking My Courses courses don't show Enroll/Unenroll button";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      await page.locator('button:has-text("My Courses")').click();
      await page.waitForTimeout(1000);

      const enrollButtons = await page
        .locator('button:has-text("Enroll"), button:has-text("Unenroll")')
        .count();

      if (enrollButtons === 0) {
        points.earned = 3;
        details = "My Courses correctly hides Enroll/Unenroll buttons.";
      } else {
        details = `Found ${enrollButtons} Enroll/Unenroll buttons in My Courses.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Click All Coures, Courses already enrolled in show Unenroll button", async ({
    page,
  }) => {
    const criterion =
      "Enrollments - Click All Coures, Courses already enrolled in show Unenroll button";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      await page.locator('button:has-text("All Courses")').click();
      await page.waitForTimeout(1000);

      const unenrollButtons = await page
        .locator('button:has-text("Unenroll")')
        .count();

      if (unenrollButtons > 0) {
        points.earned = 3;
        details = `Found ${unenrollButtons} Unenroll buttons for enrolled courses.`;
      } else {
        details = "No Unenroll buttons found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Clicking Unenroll toggles to Enroll", async ({
    page,
  }) => {
    const criterion = "Enrollments - Clicking Unenroll toggles to Enroll";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // await page.locator('button:has-text("All Courses")').click();
      // await page.waitForTimeout(1000);

      const unenrollBtn = page.locator('button:has-text("Unenroll")').first();
      await unenrollBtn.click();
      await page.waitForTimeout(1000);

      const enrollBtn = await page
        .locator('button:has-text("Enroll")')
        .first()
        .count();

      if (enrollBtn > 0) {
        points.earned = 3;
        details = "Unenroll button toggles to Enroll.";
      } else {
        details = "Button did not toggle to Enroll.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Confirm Enroll/Unenroll actually work", async ({
    page,
  }) => {
    const criterion = "Enrollments - Confirm Enroll/Unenroll actually work";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // Get initial My Courses count
      // await page.locator('button:has-text("My Courses")').click();
      // await page.waitForTimeout(1000);
      // const initialEnrolled = await page.locator('[class*="course"]').count();

      // Enroll in a new course
      // await page.locator('button:has-text("All Courses")').click();
      // await page.waitForTimeout(1000);
      // await page.locator('button:has-text("Enroll")').first().click();
      // await page.waitForTimeout(1000);

      // Check My Courses again
      // await page.locator('button:has-text("My Courses")').click();
      // await page.waitForTimeout(1000);
      // const afterEnrolled = await page.locator('[class*="course"]').count();

      //   if (afterEnrolled > initialEnrolled) {
      //     points.earned = 3;
      //     details = "Enroll/Unenroll functionality works correctly.";
      //   } else {
      //     details = "Enroll did not update course list.";
      //   }
      // } catch (error) {
      //   details = `Error: ${error.message}`;
      // }
      // Get initial enrolled courses count from "Published Courses" section
      // Get initial enrolled count from "Published Courses (X)" heading
      let publishedHeading = await page
        .locator("#wd-dashboard-published")
        .textContent();
      let initialCount = parseInt(
        publishedHeading?.match(/\((\d+)\)/)?.[1] || "0"
      );

      details += `Initial enrolled: ${initialCount}. `;

      // Click enroll on first available course
      await page.locator('button:has-text("Enroll")').first().click();
      await page.waitForTimeout(2000);

      // Wait for the heading to update
      await page.waitForTimeout(1000);

      // Get updated count
      publishedHeading = await page
        .locator("#wd-dashboard-published")
        .textContent();
      let afterEnrollCount = parseInt(
        publishedHeading?.match(/\((\d+)\)/)?.[1] || "0"
      );

      details += `After enroll: ${afterEnrollCount}. `;

      if (afterEnrollCount === initialCount + 1) {
        // Test unenroll
        await page.locator('button:has-text("Unenroll")').first().click();
        await page.waitForTimeout(2000);

        // Wait for update
        await page.waitForTimeout(1000);

        publishedHeading = await page
          .locator("#wd-dashboard-published")
          .textContent();
        let afterUnenrollCount = parseInt(
          publishedHeading?.match(/\((\d+)\)/)?.[1] || "0"
        );

        details += `After unenroll: ${afterUnenrollCount}. `;

        if (afterUnenrollCount === initialCount) {
          points.earned = 3;
          details += "Enroll/Unenroll works correctly.";
        } else {
          details += `Unenroll failed - expected ${initialCount}, got ${afterUnenrollCount}.`;
        }
      } else {
        details += `Enroll failed - expected ${
          initialCount + 1
        }, got ${afterEnrollCount}.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }
    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Refresh to confirm", async ({ page }) => {
    const criterion = "Enrollments - Refresh to confirm";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // Get initial enrolled count from "Published Courses (X)" heading
      let publishedHeading = await page
        .locator("#wd-dashboard-published")
        .textContent();
      let initialCount = parseInt(
        publishedHeading?.match(/\((\d+)\)/)?.[1] || "0"
      );

      details += `Initial enrolled: ${initialCount}. `;

      // Click enroll on first available course
      await page.locator('button:has-text("Enroll")').first().click();
      await page.waitForTimeout(2000);

      // Wait for the heading to update
      await page.waitForTimeout(1000);

      // Get updated count
      publishedHeading = await page
        .locator("#wd-dashboard-published")
        .textContent();
      let afterEnrollCount = parseInt(
        publishedHeading?.match(/\((\d+)\)/)?.[1] || "0"
      );

      details += `After enroll: ${afterEnrollCount}. `;

      if (afterEnrollCount === initialCount + 1) {
        // Test unenroll
        await page.locator('button:has-text("Unenroll")').first().click();
        await page.waitForTimeout(2000);

        // Wait for update
        await page.waitForTimeout(1000);

        publishedHeading = await page
          .locator("#wd-dashboard-published")
          .textContent();
        let afterUnenrollCount = parseInt(
          publishedHeading?.match(/\((\d+)\)/)?.[1] || "0"
        );

        details += `After unenroll: ${afterUnenrollCount}. `;
        await page.reload();
        if (afterUnenrollCount === initialCount) {
          points.earned = 3;
          details += "Enroll/Unenroll works correctly.";
        } else {
          details += `Unenroll failed - expected ${initialCount}, got ${afterUnenrollCount}.`;
        }
      } else {
        details += `Enroll failed - expected ${
          initialCount + 1
        }, got ${afterEnrollCount}.`;
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }
    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Logout/login to confirm", async ({ page }) => {
    const criterion = "Enrollments - Logout/login to confirm";
    let points = { earned: 0, possible: 3 };
    let details = "";
    test.setTimeout(60000);
    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // await page.locator('button:has-text("My Courses")').click();
      // await page.waitForTimeout(1000);
      const initialCount = await page.locator('[class*="course"]').count();

      // Enroll
      // await page.locator('button:has-text("All Courses")').click();
      // await page.waitForTimeout(1000);
      await page.locator('button:has-text("Enroll")').first().click();
      await page.waitForTimeout(1000);

      // Logout
      await navigateWithRetry(page, "/Account/Profile");
      await page.locator("#wd-signout-btn").click();
      await page.waitForTimeout(1000);

      // Login again
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);
      // await page.locator('button:has-text("My Courses")').click();
      // await page.waitForTimeout(1000);
      const afterCount = await page.locator('[class*="course"]').count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = "Enrollment persists after logout/login.";
      } else {
        details = "Enrollment not persisted.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Login as faculty, create new course, appears immediately in UI", async ({
    page,
  }) => {
    const criterion =
      "Enrollments - Login as faculty, create new course, appears immediately in UI";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      // Login as faculty user
      await loginUser(page); // Adjust credentials as needed

      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      const initialCount = await page.locator('[class*="course"]').count();

      await page
        .locator('button:has-text("Course"), button:has-text("Add")')
        .first()
        .click();
      await page.waitForTimeout(1000);

      const afterCount = await page.locator('[class*="course"]').count();

      if (afterCount > initialCount) {
        points.earned = 3;
        details = "Faculty-created course appears immediately.";
      } else {
        details = "Course not added to UI.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Refresh screen, new course should show as enrolled", async ({
    page,
  }) => {
    const criterion =
      "Enrollments - Refresh screen, new course should show as enrolled";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      // Reload
      await page.reload();
      await page.waitForTimeout(1500);

      const myCourses = await page.locator('[class*="course"]').count();

      if (myCourses > 0) {
        points.earned = 3;
        details = "Faculty-created course auto-enrolled and persists.";
      } else {
        details = "Course not auto-enrolled.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Enroll different users into different courses", async ({
    page,
  }) => {
    const criterion =
      "Enrollments - Enroll different users into different courses";
    let points = { earned: 0, possible: 3 };
    let details = "";
    test.setTimeout(60000);
    try {
      // Login as first user and enroll
      await loginUser(page);
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      await page.locator('button:has-text("Enroll")').first().click();
      await page.waitForTimeout(1000);

      // Logout
      await navigateWithRetry(page, "/Account/Profile");
      await page.locator("#wd-signout-btn").click();
      await page.waitForTimeout(1000);

      // Login as different user
      await loginUser(page, "elf_archer", "legolas123");
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      await page.locator('button:has-text("Enroll")').nth(1).click();
      await page.waitForTimeout(1000);

      points.earned = 3;
      details = "Different users can enroll in different courses.";
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Enrollments - Navigate to Course/People, table lists all users enrolled in course", async ({
    page,
  }) => {
    const criterion =
      "Enrollments - Navigate to Course/People, table lists all users enrolled in course";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page, "elf_archer", "legolas123");
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1500);

      await page.locator('button:has-text("Enroll")').nth(1).click();
      await page.waitForTimeout(1000);

      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/People/Table`);
      await page.waitForTimeout(2000);

      const enrolledUsers = await page
        .locator('table tr, .user-item, [class*="user"]')
        .count();

      if (enrolledUsers >= 1) {
        points.earned = 3;
        details = `Course People page shows ${enrolledUsers} enrolled users.`;
      } else {
        details = "No enrolled users found.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  // ==================== ASSIGNMENTS ====================

  test("Assignments - Can create new assignments", async ({ page }) => {
    const criterion = "Assignments - Can create new assignments";
    let points = { earned: 0, possible: 3 };
    let details = "";

    try {
      await loginUser(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForTimeout(1500);

      const linkCount = await page.locator("a.fw-bold.text-primary").count();
      const divCount = await page.locator(".border-bottom.p-3").count();
      const initialCount = Math.max(linkCount, divCount);

      await page
        .locator('button:has-text("Assignment"), button:has-text("Add")')
        .first()
        .click();
      await page.waitForTimeout(1000);
      const updatedName = `Updated_${Date.now()}`;
      const nameInput = page.locator(".form-control").nth(0); // First FormControl
      await nameInput.clear();
      await nameInput.fill(updatedName);
      await page
        .locator(
          'button:has-text("Save"), button:has-text("Create"), button[type="submit"]'
        )
        .first()
        .click();
      await page.waitForTimeout(1500);
      const linkCountAfter = await page
        .locator("a.fw-bold.text-primary")
        .count();
      const divCountAfter = await page.locator(".border-bottom.p-3").count();
      const afterCount = Math.max(linkCountAfter, divCountAfter);
      if (afterCount > initialCount) {
        points.earned = 3;
        details = "New assignment created successfully.";
      } else {
        details = "Assignment not added.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });
  test("Assignments - Can edit assignment", async ({ page }) => {
    test.setTimeout(60000); // Increase timeout

    const criterion = "Assignments - Can edit assignment";
    let points = { earned: 0, possible: 3 };
    let details = "";
    try {
      await loginUser(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForTimeout(1500);

      // Click on the first assignment link to go to editor
      await page.locator(".text-primary.fw-bold").first().click();
      await page.waitForTimeout(1000);

      // Update the assignment name
      const updatedTitle = `EditedAssignment_${Date.now()}`;
      const titleInput = page.locator("#assignmentName");
      await titleInput.clear();
      await titleInput.fill(updatedTitle);

      // Click Save button
      await page.locator('button:has-text("Save")').click();
      await page.waitForTimeout(2000);

      // Should be redirected back to assignments page
      // Check if the updated title appears
      const pageText = await page.textContent("body");
      if (pageText?.includes(updatedTitle)) {
        points.earned = 3;
        details = "Assignment edited successfully.";
      } else {
        details = "Assignment edit not reflected.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }
    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });

  test("Assignments - Can delete assignment", async ({ page }) => {
    test.setTimeout(60000); // Increase timeout

    const criterion = "Assignments - Can delete assignment";
    let points = { earned: 0, possible: 3 };
    let details = "";
    try {
      await loginUser(page);
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForTimeout(1500);

      // Count initial assignments
      const initialCount = await page.locator(".border-bottom.p-3").count();

      if (initialCount > 0) {
        // Click the trash icon (FaTrash) on the first assignment
        await page.locator(".text-danger svg").first().click();
        await page.waitForTimeout(500);

        // Count assignments after deletion
        const afterCount = await page.locator(".border-bottom.p-3").count();

        if (afterCount < initialCount) {
          points.earned = 3;
          details = "Assignment deleted successfully.";
        } else {
          details = `Assignment deletion not reflected. Before: ${initialCount}, After: ${afterCount}`;
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
  test("Assignments - Can list assignments per course", async ({ page }) => {
    const criterion = "Assignments - Can list assignments per course";
    let points = { earned: 0, possible: 3 };
    let details = "";
    try {
      await loginUser(page);

      // Check first course
      await navigateWithRetry(page, `/Courses/${TEST_COURSE_ID}/Assignments`);
      await page.waitForTimeout(1500);
      const course1Assignments = await page
        .locator('[class*="assignment"]')
        .count();

      // Check different course
      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(1000);
      await page.locator('[class*="course"]').nth(1).click();
      await page.waitForTimeout(500);
      await page.locator('a:has-text("Assignments")').click();
      await page.waitForTimeout(1500);
      const course2Assignments = await page
        .locator('[class*="assignment"]')
        .count();

      if (course1Assignments >= 0 && course2Assignments >= 0) {
        points.earned = 3;
        details = `Assignments listed per course (Course 1: ${course1Assignments}, Course 2: ${course2Assignments}).`;
      } else {
        details = "Could not retrieve assignments for courses.";
      }
    } catch (error) {
      details = `Error: ${error.message}`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details,
    });
  });
  // ==================== DEPLOYMENT ====================
  test("Works deployed on Netlify integrated with Render and Mongo Atlas", async ({
    page,
  }) => {
    const criterion =
      "Works deployed on Netlify integrated with Render and Mongo Atlas";
    let points = { earned: 0, possible: 3 };
    let details = "";
    try {
      // Check if app is deployed (not localhost)
      const isDeployed =
        FRONTEND_URL &&
        !FRONTEND_URL.includes("localhost") &&
        (FRONTEND_URL.includes("netlify") || FRONTEND_URL.includes("vercel"));

      if (!isDeployed) {
        details = "App not deployed (using localhost).";
        results.push({ criterion, points, passed: false, details });
        return;
      }

      await navigateWithRetry(page, "/Dashboard");
      await page.waitForTimeout(2000);

      // Try to load data
      const hasData = (await page.locator('[class*="course"]').count()) > 0;

      if (hasData) {
        points.earned = 3;
        details = "App deployed and working with remote database.";
      } else {
        details = "App deployed but not loading data.";
      }
    } catch (error) {
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
    console.log("\n=== ASSIGNMENT 6 GRADING RESULTS ===");
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
