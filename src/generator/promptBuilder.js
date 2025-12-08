/**
 * Build detailed prompts for Gemini to generate accurate Playwright tests
 * This is critical - the prompt must be extremely detailed to avoid hallucination
 */
export class PromptBuilder {
  constructor(rubric) {
    this.rubric = rubric;
  }

  /**
   * Build the complete system prompt with all context
   */
  buildSystemPrompt() {
    return `You are an expert Playwright test generator for web development assignments.

# ⚠️ CRITICAL RULE - TESTS MUST BE COMPLETE ⚠️

EVERY test MUST have ACTUAL WORKING CODE inside the try block. 
NO empty try blocks. NO placeholder comments.
NO tests that just navigate and do nothing.

WRONG (DO NOT DO THIS):
\`\`\`javascript
test('Test', async ({ page }) => {
  try {
    await page.goto('/route');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  // ← NOTHING HERE - THIS IS WRONG!
  
  results.push({...});
});
\`\`\`

CORRECT (ALWAYS DO THIS):
\`\`\`javascript
test('Test', async ({ page }) => {
  try {
    await page.goto('/route');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // ACTUAL TEST LOGIC HERE
    const element = page.locator('button');
    if (await element.count() > 0) {
      points.earned = 3;
      details = 'Button found';
    } else {
      details = 'Button not found';
    }
  } catch (error) {
    details = \\\`Error: \\\${error.message}\\\`;
  }
  
  results.push({...});
});
\`\`\`

# MANDATORY TEST STRUCTURE

EVERY SINGLE test must follow this EXACT pattern:

\`\`\`javascript
test('Criterion name', async ({ page }) => {
  const criterion = 'Exact criterion text';
  let points = { earned: 0, possible: 3 };
  let details = '';

  try {
    await page.goto('/route');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // STEP 1: Find the element
    const element = page.locator('selector');
    
    // STEP 2: Check if it exists
    if (await element.count() > 0) {
      // STEP 3: Award points
      points.earned = 3;
      details = 'Element found and correct';
    } else {
      // STEP 4: No points
      details = 'Element not found';
    }
  } catch (error) {
    details = \\\`Error: \\\${error.message}\\\`;
  }

  results.push({
    criterion,
    points,
    passed: points.earned === points.possible,
    details
  });
});
\`\`\`

# WHAT TO TEST BASED ON CRITERION TYPE

## CSS/Styling Tests
For criteria about colors, backgrounds, borders:
\`\`\`javascript
const element = page.locator('div, p, h1').first();
if (await element.count() > 0) {
  const bgColor = await element.evaluate(el => window.getComputedStyle(el).backgroundColor);
  const color = await element.evaluate(el => window.getComputedStyle(el).color);
  
  if (bgColor.includes('255, 0, 0') || bgColor.includes('red')) {
    points.earned = 3;
    details = \\\`Element has red background: \\\${bgColor}\\\`;
  } else {
    details = \\\`Background is \\\${bgColor}, expected red\\\`;
  }
}
\`\`\`

## Layout/Grid Tests
For criteria about responsive layouts, grids:
\`\`\`javascript
const courses = page.locator('.course-card, [class*="course"]');
const count = await courses.count();

if (count >= 3) {
  const firstBox = await courses.first().boundingBox();
  const secondBox = await courses.nth(1).boundingBox();
  
  if (firstBox && secondBox && firstBox.width === secondBox.width) {
    points.earned = 3;
    details = \\\`Found \\\${count} courses with equal width\\\`;
  } else {
    points.earned = 2;
    details = 'Courses found but widths may vary';
  }
} else {
  details = \\\`Only found \\\${count} courses\\\`;
}
\`\`\`

## Navigation Tests
For criteria about navigation, sidebars:
\`\`\`javascript
const navLink = page.locator('a[href*="/Dashboard"]');

if (await navLink.count() > 0) {
  points.earned = 3;
  details = 'Navigation link found';
} else {
  details = 'Navigation link not found';
}
\`\`\`

## Form Styling Tests
For criteria about Bootstrap classes:
\`\`\`javascript
const inputs = page.locator('input, textarea, select');
const count = await inputs.count();

if (count > 0) {
  let allHaveFormControl = true;
  for (let i = 0; i < count; i++) {
    const className = await inputs.nth(i).getAttribute('class');
    if (!className || !className.includes('form-control')) {
      allHaveFormControl = false;
      break;
    }
  }
  
  if (allHaveFormControl) {
    points.earned = 3;
    details = \\\`All \\\${count} form elements have form-control class\\\`;
  } else {
    points.earned = 2;
    details = 'Some form elements missing form-control class';
  }
} else {
  details = 'No form elements found';
}
\`\`\`

## Responsive Tests
For criteria about viewport changes:
\`\`\`javascript
// Test at wide viewport
await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForTimeout(500);

const sidebar = page.locator('nav, aside, [class*="sidebar"]');

if (await sidebar.isVisible()) {
  points.earned = 3;
  details = 'Sidebar visible at wide viewport';
} else {
  details = 'Sidebar not visible at wide viewport';
}

// Optional: Test narrow viewport
await page.setViewportSize({ width: 480, height: 720 });
await page.waitForTimeout(500);

if (await sidebar.isHidden()) {
  points.earned = 3;
  details = 'Sidebar correctly hidden at narrow viewport';
}
\`\`\`

# ROUTING RULES

- Labs: /Labs/Lab1 or /Labs/Lab2 (specified in rubric)
- Kambaz Dashboard: /Dashboard
- Kambaz Account: /Account/Signin, /Account/Profile, /Account/Signup
- Kambaz Courses: /Courses/\${TEST_COURSE_ID}/Home, /Courses/\${TEST_COURSE_ID}/Modules
- Kambaz Assignments: /Courses/\${TEST_COURSE_ID}/Assignments
- Assignment Editor: /Courses/\${TEST_COURSE_ID}/Assignments/Editor/\${TEST_ASSIGNMENT_ID}

# CRITICAL RULES

1. NEVER leave try block empty after navigation
2. ALWAYS check element.count() before operations
3. ALWAYS provide meaningful details
4. ALWAYS close tests with });
5. NEVER use placeholder comments
6. ALWAYS award points based on what you find

# OUTPUT REQUIREMENTS

Generate COMPLETE, WORKING tests for EVERY criterion. Each test must:
- Navigate to correct route
- Look for specific elements
- Award points appropriately
- Provide helpful details
- Be properly closed

NO EXCEPTIONS. NO INCOMPLETE TESTS.`;
  }

  /**
   * Build the specific rubric prompt
   */
  buildRubricPrompt() {
    const criteria = this.rubric.criteria;

    let prompt = `# ASSIGNMENT ${this.rubric.assignmentNumber} RUBRIC\n\n`;
    prompt += `You must generate ${criteria.length} COMPLETE, WORKING tests.\n\n`;
    prompt += `REMEMBER: Each test needs ACTUAL CODE that checks for elements and awards points.\n\n`;

    // Group criteria by type
    const general = criteria.filter((c) => c.type === "general");
    const labs = criteria.filter((c) => c.type === "lab");
    const kambaz = criteria.filter((c) => c.type === "kambaz");

    if (general.length > 0) {
      prompt += `## GENERAL CRITERIA (${general.length} tests)\n\n`;
      general.forEach((c, i) => {
        prompt += `${i + 1}. "${c.originalText}"\n`;
        prompt += `   Route: ${c.route}\n`;
        prompt += `   Test: Check if requirement is met, award 3 points if found\n\n`;
      });
    }

    if (labs.length > 0) {
      prompt += `## LAB CRITERIA (${labs.length} tests)\n\n`;

      labs.forEach((c, i) => {
        prompt += `${i + 1}. "${c.originalText}"\n`;
        prompt += `   Route: ${c.route}\n`;
        prompt += `   Category: ${c.category}\n`;

        // Add specific testing hints based on category
        if (c.category.includes("CSS")) {
          prompt += `   Hint: Use getComputedStyle() to check colors/styles\n`;
        } else if (c.category.includes("Bootstrap")) {
          prompt += `   Hint: Check for Bootstrap classes or visual layout\n`;
        }

        prompt += `   Test: Look for elements matching "${c.detail}", award points if found\n\n`;
      });
    }

    if (kambaz.length > 0) {
      prompt += `## KAMBAZ CRITERIA (${kambaz.length} tests)\n\n`;

      kambaz.forEach((c, i) => {
        prompt += `${i + 1}. "${c.originalText}"\n`;
        prompt += `   Route: ${c.route}\n`;
        prompt += `   Section: ${c.section} - ${c.subsection}\n`;
        prompt += `   Test: Check for "${c.detail}", award points if found\n\n`;
      });
    }

    prompt += `\n⚠️ CRITICAL REMINDER ⚠️\n`;
    prompt += `Every single one of these ${criteria.length} tests MUST have:\n`;
    prompt += `1. Navigation code\n`;
    prompt += `2. Element finding code\n`;
    prompt += `3. If/else logic for points\n`;
    prompt += `4. Results.push() call\n`;
    prompt += `5. Closing });\n\n`;
    prompt += `NO empty try blocks. NO placeholders. ACTUAL WORKING CODE ONLY.\n`;

    return prompt;
  }

  /**
   * Build example test for context
   */
  buildExampleTest() {
    return `
# COMPLETE WORKING EXAMPLES

Study these examples carefully - EVERY test you generate must be this complete:

\`\`\`javascript
// Example 1: CSS Color Test
test('Labs - CSS - Blue heading', async ({ page }) => {
  const criterion = 'Labs - CSS - Blue heading';
  let points = { earned: 0, possible: 3 };
  let details = '';
  
  try {
    await page.goto('/Labs/Lab1');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const heading = page.locator('h1, h2, h3').first();
    
    if (await heading.count() > 0) {
      const color = await heading.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      if (color.includes('0, 0, 255') || color.includes('blue')) {
        points.earned = 3;
        details = \\\`Heading has blue color: \\\${color}\\\`;
      } else {
        points.earned = 1;
        details = \\\`Heading color is \\\${color}, expected blue\\\`;
      }
    } else {
      details = 'No heading found';
    }
  } catch (error) {
    details = \\\`Error: \\\${error.message}\\\`;
  }
  
  results.push({
    criterion,
    points,
    passed: points.earned === points.possible,
    details
  });
});

// Example 2: Layout Test
test('Kambaz - Dashboard - Courses render as grid', async ({ page }) => {
  const criterion = 'Kambaz - Dashboard - Courses render as grid';
  let points = { earned: 0, possible: 3 };
  let details = '';
  
  try {
    await page.goto('/Dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const courses = page.locator('[class*="course"], .course-card');
    const count = await courses.count();
    
    if (count >= 3) {
      const container = page.locator('[class*="grid"], [style*="display: grid"]');
      const hasGrid = await container.count() > 0;
      
      if (hasGrid || count >= 3) {
        points.earned = 3;
        details = \\\`Found \\\${count} courses in grid layout\\\`;
      } else {
        points.earned = 2;
        details = \\\`Found \\\${count} courses but no clear grid\\\`;
      }
    } else {
      details = \\\`Only \\\${count} courses found (expected 3+)\\\`;
    }
  } catch (error) {
    details = \\\`Error: \\\${error.message}\\\`;
  }
  
  results.push({
    criterion,
    points,
    passed: points.earned === points.possible,
    details
  });
});

// Example 3: Navigation Test
test('Kambaz - Navigation - Black background', async ({ page }) => {
  const criterion = 'Kambaz - Navigation - Black background';
  let points = { earned: 0, possible: 3 };
  let details = '';
  
  try {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const nav = page.locator('nav, [role="navigation"]').first();
    
    if (await nav.count() > 0) {
      const bgColor = await nav.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      if (bgColor.includes('0, 0, 0') || bgColor.includes('rgb(0, 0, 0)')) {
        points.earned = 3;
        details = 'Navigation has black background';
      } else {
        points.earned = 1;
        details = \\\`Navigation background is \\\${bgColor}\\\`;
      }
    } else {
      details = 'Navigation not found';
    }
  } catch (error) {
    details = \\\`Error: \\\${error.message}\\\`;
  }
  
  results.push({
    criterion,
    points,
    passed: points.earned === points.possible,
    details
  });
});

// Example 4: Responsive Test
test('Kambaz - Narrowest hides sidebar', async ({ page }) => {
  const criterion = 'Kambaz - Narrowest hides sidebar';
  let points = { earned: 0, possible: 3 };
  let details = '';
  
  try {
    await page.goto('/Dashboard');
    
    // Test narrow viewport
    await page.setViewportSize({ width: 480, height: 720 });
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    
    if (await sidebar.count() > 0) {
      const isVisible = await sidebar.isVisible();
      
      if (!isVisible) {
        points.earned = 3;
        details = 'Sidebar correctly hidden at narrow viewport';
      } else {
        points.earned = 1;
        details = 'Sidebar still visible at narrow viewport';
      }
    } else {
      details = 'Sidebar not found';
    }
  } catch (error) {
    details = \\\`Error: \\\${error.message}\\\`;
  }
  
  results.push({
    criterion,
    points,
    passed: points.earned === points.possible,
    details
  });
});
\`\`\`

EVERY test you generate MUST be this complete. NO EXCEPTIONS.
`;
  }

  /**
   * Build the complete prompt
   */
  build() {
    return {
      system: this.buildSystemPrompt(),
      rubric: this.buildRubricPrompt(),
      example: this.buildExampleTest(),
    };
  }
}
