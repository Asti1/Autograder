import fs from "fs";
import path from "path";

/**
 * Template-based test generator - More reliable than Gemini
 * Creates proper Playwright tests without AI hallucination
 */
export class TemplateGenerator {
  constructor(rubricPath) {
    this.rubricPath = rubricPath;
    this.rubric = JSON.parse(fs.readFileSync(rubricPath, "utf-8"));
  }

  /**
   * Generate complete test file from templates
   */
  generate() {
    console.log(`\n🔧 Generating tests using templates (no AI)...`);
    console.log(`   Assignment: ${this.rubric.assignmentNumber}`);
    console.log(`   Total criteria: ${this.rubric.criteria.length}\n`);

    let testCode = this.generateHeader();

    // Generate tests for each criterion
    this.rubric.criteria.forEach((criterion, index) => {
      console.log(
        `   Generating test ${index + 1}/${this.rubric.criteria.length}: ${
          criterion.originalText
        }`
      );
      testCode += this.generateTest(criterion);
    });

    testCode += this.generateFooter();

    // Save the test file
    const outputPath = path.join(
      process.cwd(),
      "tests",
      "generated",
      `assignment${this.rubric.assignmentNumber}.spec.js`
    );

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, testCode);

    console.log(`\n✅ Tests generated successfully!`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   Tests created: ${this.rubric.criteria.length}\n`);

    return outputPath;
  }

  /**
   * Generate file header
   */
  generateHeader() {
    return `import { test, expect } from '@playwright/test';

const results = [];

// Constants
const TEST_COURSE_ID = '1234';
const TEST_ASSIGNMENT_ID = '5678';

// Get base URL from environment or use from config
const BASE_URL = process.env.STUDENT_URL;

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

test.describe('Assignment ${this.rubric.assignmentNumber} Tests', () => {

`;
  }

  /**
   * Generate file footer
   */
  generateFooter() {
    return `
  test.afterAll(async () => {
    console.log('\\n=== GRADING RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
    
    const totalEarned = results.reduce((sum, r) => sum + r.points.earned, 0);
    const totalPossible = results.reduce((sum, r) => sum + r.points.possible, 0);
    const percentage = ((totalEarned / totalPossible) * 100).toFixed(2);
    
    console.log(\`\\nTotal Score: \${totalEarned}/\${totalPossible} (\${percentage}%)\`);
    console.log(\`Passed: \${results.filter(r => r.passed).length}/\${results.length}\`);
    console.log(\`Failed: \${results.filter(r => !r.passed).length}/\${results.length}\`);
  });

});
`;
  }

  /**
   * Generate a single test based on criterion
   */
  generateTest(criterion) {
    const template = this.selectTemplate(criterion);
    return template(criterion);
  }

  /**
   * Select appropriate template based on criterion type
   */
  selectTemplate(criterion) {
    // Check test type and category to select template
    if (criterion.testType === "form_input") {
      return this.formInputTemplate;
    } else if (
      criterion.testType === "form_checkbox" ||
      criterion.testType === "form_radio"
    ) {
      return this.formCheckboxRadioTemplate;
    } else if (criterion.testType === "form_select") {
      return this.formSelectTemplate;
    } else if (criterion.testType === "navigation_click") {
      return this.navigationTemplate;
    } else if (criterion.testType === "link_exists") {
      return this.linkExistsTemplate;
    } else if (criterion.category && criterion.category.includes("CSS")) {
      return this.cssStyleTemplate;
    } else if (
      criterion.detail &&
      criterion.detail.toLowerCase().includes("grid")
    ) {
      return this.gridLayoutTemplate;
    } else if (
      criterion.detail &&
      criterion.detail.toLowerCase().includes("responsive")
    ) {
      return this.responsiveTemplate;
    } else if (
      criterion.detail &&
      criterion.detail.toLowerCase().includes("bootstrap")
    ) {
      return this.bootstrapTemplate;
    } else {
      return this.genericTemplate;
    }
  }

  /**
   * Template for form input tests
   */
  formInputTemplate = (c) => `  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: ${c.points.best} };
    let details = '';

    try {
      await page.goto(buildUrl('${c.route}'));
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const inputType = '${this.extractInputType(c.detail)}';
      const inputName = '${this.extractFieldName(c.detail)}';
      const input = page.locator(\`input[type="\${inputType}"], input[name*="\${inputName}" i], input[placeholder*="\${inputName}" i]\`);

      if (await input.count() > 0) {
        const actualType = await input.first().getAttribute('type');
        if (actualType === inputType) {
          points.earned = ${c.points.best};
          details = \`\${inputName} input found with correct type="\${inputType}"\`;
        } else {
          points.earned = ${c.points.almost};
          details = \`\${inputName} input found but type="\${actualType}" instead of "\${inputType}"\`;
        }
      } else {
        details = \`\${inputName} input not found\`;
      }
    } catch (error) {
      details = \`Error: \${error.message}\`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });

`;

  /**
   * Template for checkbox/radio tests
   */
  formCheckboxRadioTemplate = (c) => {
    const type = c.testType === "form_checkbox" ? "checkbox" : "radio";
    const value = this.extractFieldName(c.detail);

    return `  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: ${c.points.best} };
    let details = '';

    try {
      await page.goto(buildUrl('${c.route}'));
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const input = page.locator('input[type="${type}"][value*="${value}" i]');

      if (await input.count() > 0) {
        points.earned = ${c.points.best};
        details = '${value} ${type} found';
      } else {
        details = '${value} ${type} not found';
      }
    } catch (error) {
      details = \`Error: \${error.message}\`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });

`;
  };

  /**
   * Template for select/dropdown tests
   */
  formSelectTemplate = (c) => `  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: ${c.points.best} };
    let details = '';

    try {
      await page.goto(buildUrl('${c.route}'));
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const select = page.locator('select');
      const count = await select.count();

      if (count > 0) {
        const options = await select.first().locator('option').count();
        points.earned = ${c.points.best};
        details = \`Found \${count} dropdown(s) with \${options} options\`;
      } else {
        details = 'No dropdown found';
      }
    } catch (error) {
      details = \`Error: \${error.message}\`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });

`;

  /**
   * Template for navigation tests
   */
  navigationTemplate = (c) => {
    const targetRoute = this.extractNavigationTarget(c.detail);

    return `  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: ${c.points.best} };
    let details = '';

    try {
      await page.goto(buildUrl('${c.route}'));
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const button = page.getByRole('button', { name: /${this.extractButtonText(
        c.detail
      )}/i })
        .or(page.getByRole('link', { name: /${this.extractButtonText(
          c.detail
        )}/i }));

      if (await button.count() > 0) {
        await button.first().click();
        await page.waitForTimeout(2000);
        
        const url = page.url();
        if (${this.generateUrlCheck(targetRoute)}) {
          points.earned = ${c.points.best};
          details = \`Navigation successful to \${url}\`;
        } else {
          points.earned = ${c.points.almost};
          details = \`Button clicked but navigated to \${url}\`;
        }
      } else {
        details = 'Navigation button/link not found';
      }
    } catch (error) {
      details = \`Error: \${error.message}\`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });

`;
  };

  /**
   * Template for link existence tests
   */
  linkExistsTemplate = (c) => {
    const linkTarget = this.extractLinkTarget(c.detail);

    return `  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: ${c.points.best} };
    let details = '';

    try {
      await page.goto(buildUrl('${c.route}'));
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const link = page.locator('a[href*="${linkTarget}"]');

      if (await link.count() > 0) {
        points.earned = ${c.points.best};
        details = '${linkTarget} link found';
      } else {
        details = '${linkTarget} link not found';
      }
    } catch (error) {
      details = \`Error: \${error.message}\`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });

`;
  };

  /**
   * Template for CSS/style tests
   */
  cssStyleTemplate = (c) => {
    const colors = this.extractColors(c.detail);

    return `  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: ${c.points.best} };
    let details = '';

    try {
      await page.goto(buildUrl('${c.route}'));
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const element = page.locator('${this.getElementSelector(
        c.detail
      )}').first();

      if (await element.count() > 0) {
        const bgColor = await element.evaluate(el => window.getComputedStyle(el).backgroundColor);
        const fgColor = await element.evaluate(el => window.getComputedStyle(el).color);
        
        points.earned = ${c.points.best};
        details = \`Element found with bg: \${bgColor}, color: \${fgColor}\`;
      } else {
        details = 'Element not found';
      }
    } catch (error) {
      details = \`Error: \${error.message}\`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });

`;
  };

  /**
   * Template for grid/layout tests
   */
  gridLayoutTemplate = (c) => `  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: ${c.points.best} };
    let details = '';

    try {
      await page.goto(buildUrl('${c.route}'));
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const items = page.locator('[class*="course"], .course-card, [class*="grid"] > *');
      const count = await items.count();

      if (count >= 3) {
        points.earned = ${c.points.best};
        details = \`Found \${count} items in grid layout\`;
      } else if (count > 0) {
        points.earned = ${c.points.better};
        details = \`Found \${count} items (expected 3+)\`;
      } else {
        details = 'No grid items found';
      }
    } catch (error) {
      details = \`Error: \${error.message}\`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });

`;

  /**
   * Template for responsive tests
   */
  responsiveTemplate = (c) => {
    const isNarrow =
      c.detail.toLowerCase().includes("narrow") ||
      c.detail.toLowerCase().includes("hide");
    const width = isNarrow ? 480 : 1280;

    return `  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: ${c.points.best} };
    let details = '';

    try {
      await page.goto('${c.route}');
      await page.setViewportSize({ width: ${width}, height: 720 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(500);

      const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();

      if (await sidebar.count() > 0) {
        const isVisible = await sidebar.isVisible();
        ${
          isNarrow
            ? `if (!isVisible) {
          points.earned = ${c.points.best};
          details = 'Sidebar correctly hidden at narrow viewport';
        } else {
          points.earned = ${c.points.almost};
          details = 'Sidebar still visible at narrow viewport';
        }`
            : `if (isVisible) {
          points.earned = ${c.points.best};
          details = 'Sidebar correctly shown at wide viewport';
        } else {
          points.earned = ${c.points.almost};
          details = 'Sidebar hidden at wide viewport';
        }`
        }
      } else {
        details = 'Sidebar element not found';
      }
    } catch (error) {
      details = \`Error: \${error.message}\`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });

`;
  };

  /**
   * Template for Bootstrap class tests
   */
  bootstrapTemplate = (c) => `  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: ${c.points.best} };
    let details = '';

    try {
      await page.goto(buildUrl('${c.route}'));
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const elements = page.locator('[class*="list"], ul, ol, .table, form, .btn');
      const count = await elements.count();

      if (count > 0) {
        points.earned = ${c.points.best};
        details = \`Found \${count} Bootstrap-styled elements\`;
      } else {
        details = 'No Bootstrap elements found';
      }
    } catch (error) {
      details = \`Error: \${error.message}\`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });

`;

  /**
   * Generic template for any criterion
   */
  genericTemplate = (c) => `  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: ${c.points.best} };
    let details = '';

    try {
      await page.goto(buildUrl('${c.route}'));
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const pageContent = page.locator('body');

      if (await pageContent.count() > 0) {
        points.earned = ${c.points.best};
        details = 'Page loaded successfully';
      } else {
        details = 'Page did not load';
      }
    } catch (error) {
      details = \`Error: \${error.message}\`;
    }

    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });

`;

  /**
   * Helper: Extract input type from detail
   */
  extractInputType(detail) {
    const lower = detail.toLowerCase();
    if (lower.includes("password")) return "password";
    if (lower.includes("email")) return "email";
    if (lower.includes("date")) return "date";
    if (lower.includes("number")) return "number";
    if (lower.includes("file")) return "file";
    if (lower.includes("range") || lower.includes("slider")) return "range";
    return "text";
  }

  /**
   * Helper: Extract field name from detail
   */
  extractFieldName(detail) {
    const lower = detail.toLowerCase();
    if (lower.includes("username")) return "username";
    if (lower.includes("password")) return "password";
    if (lower.includes("email")) return "email";
    if (lower.includes("first name")) return "firstname";
    if (lower.includes("last name")) return "lastname";
    if (lower.includes("salary")) return "salary";
    if (lower.includes("dob") || lower.includes("birth")) return "dob";
    if (lower.includes("rating")) return "rating";
    return "input";
  }

  /**
   * Helper: Extract colors from detail
   */
  extractColors(detail) {
    const colors = {
      foreground: null,
      background: null,
    };

    const lower = detail.toLowerCase();
    const colorPattern =
      /(black|white|red|blue|green|yellow)\s+on\s+(black|white|red|blue|green|yellow)/i;
    const match = detail.match(colorPattern);

    if (match) {
      colors.foreground = match[1];
      colors.background = match[2];
    }

    return colors;
  }

  /**
   * Helper: Get element selector from detail
   */
  getElementSelector(detail) {
    const lower = detail.toLowerCase();
    if (lower.includes("heading")) return "h1, h2, h3";
    if (lower.includes("paragraph")) return "p";
    if (lower.includes("div")) return "div";
    if (lower.includes("span")) return "span";
    return "body > *";
  }

  /**
   * Helper: Extract navigation target from detail
   */
  extractNavigationTarget(detail) {
    const lower = detail.toLowerCase();
    if (lower.includes("profile")) return "Profile";
    if (lower.includes("dashboard")) return "Dashboard";
    if (lower.includes("signin")) return "Signin";
    if (lower.includes("signup")) return "Signup";
    if (lower.includes("modules")) return "Modules";
    if (lower.includes("assignments")) return "Assignments";
    if (lower.includes("home")) return "Home";
    return "";
  }

  /**
   * Helper: Extract button text from detail
   */
  extractButtonText(detail) {
    const lower = detail.toLowerCase();
    if (lower.includes("signin")) return "sign ?in";
    if (lower.includes("signup")) return "sign ?up";
    if (lower.includes("signout")) return "sign ?out";
    return "button";
  }

  /**
   * Helper: Generate URL check for navigation
   */
  generateUrlCheck(target) {
    if (!target) return "true";

    const targets = target.split(" or ").map((t) => t.trim());
    return targets.map((t) => `url.includes('/${t}')`).join(" || ");
  }

  /**
   * Helper: Extract link target from detail
   */
  extractLinkTarget(detail) {
    const lower = detail.toLowerCase();
    if (lower.includes("github")) return "github";
    if (lower.includes("account")) return "Account";
    if (lower.includes("dashboard")) return "Dashboard";
    if (lower.includes("labs")) return "Labs";
    if (lower.includes("calendar")) return "Calendar";
    if (lower.includes("inbox")) return "Inbox";
    if (lower.includes("neu")) return "northeastern";
    return "";
  }
}

// CLI usage
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: node templateGenerator.js <rubric.json>");
    process.exit(1);
  }

  const rubricPath = args[0];
  const generator = new TemplateGenerator(rubricPath);

  generator.generate();
}
