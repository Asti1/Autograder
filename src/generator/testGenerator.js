import fs from "fs";
import path from "path";
import { GeminiClient } from "./geminiClient.js";
import { PromptBuilder } from "./promptBuilder.js";

/**
 * Main test generator orchestrator
 */
export class TestGenerator {
  constructor(rubricPath) {
    this.rubricPath = rubricPath;
    this.rubric = this.loadRubric();
    this.gemini = new GeminiClient();
  }

  /**
   * Load rubric JSON file
   */
  loadRubric() {
    if (!fs.existsSync(this.rubricPath)) {
      throw new Error(`Rubric file not found: ${this.rubricPath}`);
    }

    const content = fs.readFileSync(this.rubricPath, "utf-8");
    return JSON.parse(content);
  }

  /**
   * Generate tests for the rubric
   */
  async generate() {
    console.log(
      `\nGenerating tests for Assignment ${this.rubric.assignmentNumber}`
    );
    console.log(`Total criteria: ${this.rubric.criteria.length}`);
    console.log(`Total points: ${this.rubric.metadata.totalPoints}\n`);

    // Build prompts
    const promptBuilder = new PromptBuilder(this.rubric);
    const prompts = promptBuilder.build();

    console.log("Building detailed prompts for Gemini...");

    // Generate tests
    let testCode;

    if (this.rubric.criteria.length > 50) {
      // For large rubrics, generate in chunks
      console.log("Large rubric detected, generating in chunks...");
      testCode = await this.gemini.generateTestsInChunks(
        prompts.system,
        this.rubric.criteria,
        prompts.example,
        20
      );
    } else {
      // Generate all at once
      testCode = await this.gemini.generateTestsWithRetry(
        prompts.system,
        prompts.rubric,
        prompts.example
      );
    }

    // Post-process the generated code
    testCode = this.postProcessCode(testCode);

    // Save the test file
    const outputPath = path.join(
      process.cwd(),
      "tests",
      "generated",
      `assignment${this.rubric.assignmentNumber}.spec.js`
    );

    this.saveTestFile(testCode, outputPath);

    // Also save the Playwright config
    this.generatePlaywrightConfig();

    console.log("\n✅ Test generation complete!");
    console.log(`   Tests saved to: ${outputPath}`);
    console.log(`\nNext steps:`);
    console.log(`   1. Review generated tests: ${outputPath}`);
    console.log(`   2. Run tests: npm run grade <student-url>`);

    return {
      testPath: outputPath,
      criteriaCount: this.rubric.criteria.length,
      totalPoints: this.rubric.metadata.totalPoints,
    };
  }

  /**
   * Post-process generated code to ensure completeness
   */
  postProcessCode(code) {
    console.log("\n🔍 Post-processing generated tests...\n");

    // Ensure proper imports
    if (!code.includes("import { test, expect }")) {
      code = `import { test, expect } from '@playwright/test';\n\n${code}`;
    }

    // Ensure constants are defined
    if (!code.includes("const TEST_COURSE_ID")) {
      const constantsBlock = `
// Constants
const TEST_COURSE_ID = '1234';
const TEST_ASSIGNMENT_ID = '5678';

`;
      const describeMatch = code.match(/test\.describe/);
      if (describeMatch) {
        code = code.replace(/test\.describe/, constantsBlock + "test.describe");
      }
    }

    // Ensure results array exists
    if (!code.includes("const results = []")) {
      const describeMatch = code.match(/test\.describe/);
      if (describeMatch) {
        code = code.replace(
          /test\.describe/,
          "const results = [];\n\ntest.describe"
        );
      }
    }

    // CRITICAL FIX: Add missing catch blocks and test logic to incomplete tests
    console.log("   Fixing incomplete tests...");

    // Pattern: tests that have try-goto-wait but then immediately hit results.push
    const incompleteTryPattern =
      /try\s*\{\s*(await page\.goto\([^)]+\);[\s\S]*?await page\.(?:waitForLoadState|setViewportSize)[^;]+;[\s\S]*?)\s*results\.push\(/g;

    let fixCount = 0;
    code = code.replace(incompleteTryPattern, (match, gotoWaitCode) => {
      fixCount++;
      // Extract the test criterion to make appropriate test logic
      const criterionMatch = match.match(/const criterion = ['"]([^'"]+)['"]/);
      const criterion = criterionMatch ? criterionMatch[1] : "";

      // Add generic test logic and catch block
      return `try {
    ${gotoWaitCode.trim()}
    
    // Auto-generated test logic (Gemini failed to generate)
    const pageContent = page.locator('body');
    
    if (await pageContent.count() > 0) {
      points.earned = 3;
      details = 'Test passed (auto-generated - needs manual review for "${criterion}")';
    } else {
      details = 'Page structure unclear';
    }
  } catch (error) {
    details = \`Error: \${error.message}\`;
  }
  
  results.push(`;
    });

    if (fixCount > 0) {
      console.warn(`   ⚠️  Fixed ${fixCount} tests with missing catch blocks!`);
      console.warn(
        "   ⚠️  These tests need manual review and proper test logic!"
      );
    } else {
      console.log("   ✓ All tests have proper try-catch blocks");
    }

    // Fix tests missing closing braces
    console.log("   Checking for missing closing braces...");
    const incompleteTestPattern =
      /test\(['"].*?['"],\s*async\s*\(\{\s*page\s*\}\)\s*=>\s*\{(?:(?!^\s*test\(|^\s*test\.afterAll|^\s*\}\);)[\s\S])*?(?=\n\s*test\(|\n\s*test\.afterAll)/gm;

    let fixedCode = code;
    const incompleteMatches = [...code.matchAll(incompleteTestPattern)];
    let closingFixCount = 0;

    for (const match of incompleteMatches) {
      const incompleteTest = match[0];

      // Check if this test has a results.push
      if (incompleteTest.includes("results.push")) {
        // Has results.push but missing closing
        if (!incompleteTest.trim().endsWith("});")) {
          fixedCode = fixedCode.replace(
            incompleteTest,
            incompleteTest + "\n  });"
          );
          closingFixCount++;
        }
      } else {
        // Missing results.push AND closing - add both
        const testBody = incompleteTest;
        const fixedTest =
          testBody +
          `
    
    results.push({
      criterion,
      points,
      passed: points.earned === points.possible,
      details
    });
  });`;
        fixedCode = fixedCode.replace(testBody, fixedTest);
        closingFixCount++;
      }
    }

    if (closingFixCount > 0) {
      console.log(`   ✓ Fixed ${closingFixCount} tests with missing closings`);
    } else {
      console.log("   ✓ All tests have proper closings");
    }

    // Ensure proper afterAll hook with complete scoring
    console.log("   Checking for afterAll hook...");
    if (!fixedCode.includes("test.afterAll")) {
      console.log("   Adding afterAll hook...");
      // Find the end of the last test
      const lastTestEnd = fixedCode.lastIndexOf("});");
      if (lastTestEnd !== -1) {
        const beforeLastTest = fixedCode.substring(0, lastTestEnd + 3);
        const afterLastTest = fixedCode.substring(lastTestEnd + 3);

        fixedCode =
          beforeLastTest +
          `

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
` +
          afterLastTest;
      }
    } else {
      console.log("   ✓ afterAll hook exists");
      // Enhance existing afterAll to include pass/fail counts
      if (!fixedCode.includes("results.filter(r => r.passed)")) {
        fixedCode = fixedCode.replace(
          /console\.log\(`\\nTotal Score:.*?\);/,
          `console.log(\`\\nTotal Score: \${totalEarned}/\${totalPossible} (\${percentage}%)\`);
    console.log(\`Passed: \${results.filter(r => r.passed).length}/\${results.length}\`);
    console.log(\`Failed: \${results.filter(r => !r.passed).length}/\${results.length}\`);`
        );
      }
    }

    // Ensure the outer test.describe is properly closed
    if (!fixedCode.trim().endsWith("});")) {
      fixedCode = fixedCode.trim() + "\n});";
      console.log("   Added closing for test.describe");
    }

    // Validate test structure - count opening and closing braces
    console.log("\n   Validating brace structure...");
    const openBraces = (fixedCode.match(/\{/g) || []).length;
    const closeBraces = (fixedCode.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      console.warn(
        `   ⚠️  WARNING: Brace mismatch! Opening: ${openBraces}, Closing: ${closeBraces}`
      );
      console.warn("   Generated tests will need manual review.");
    } else {
      console.log(`   ✓ Braces balanced (${openBraces} pairs)`);
    }

    // Count total tests
    const testCount = (fixedCode.match(/test\(/g) || []).length;
    const afterAllCount = (fixedCode.match(/test\.afterAll/g) || []).length;

    console.log(`\n📊 Generation Summary:`);
    console.log(`   Tests generated: ${testCount}`);
    console.log(`   Tests auto-fixed: ${fixCount}`);
    console.log(`   afterAll hooks: ${afterAllCount}`);

    if (fixCount > 0) {
      console.log(`\n⚠️  IMPORTANT: ${fixCount} tests have placeholder logic.`);
      console.log(
        `   Review and update these tests manually for proper validation.`
      );
    }

    // Remove any duplicate test.afterAll blocks
    if (afterAllCount > 1) {
      console.warn(
        `   ⚠️  Multiple afterAll blocks detected. Removing duplicates...`
      );
      // Keep only the last one
      let firstAfterAll = fixedCode.indexOf("test.afterAll");
      while (fixedCode.indexOf("test.afterAll", firstAfterAll + 1) !== -1) {
        const secondStart = fixedCode.indexOf(
          "test.afterAll",
          firstAfterAll + 1
        );
        const secondEnd = fixedCode.indexOf("});", secondStart);
        fixedCode =
          fixedCode.substring(0, firstAfterAll) +
          fixedCode.substring(secondEnd + 3);
      }
      console.log("   ✓ Duplicates removed");
    }

    console.log("\n✅ Post-processing complete!\n");

    return fixedCode;
  }

  /**
   * Save test file
   */
  saveTestFile(code, outputPath) {
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, code, "utf-8");
  }

  /**
   * Generate Playwright configuration
   */
  generatePlaywrightConfig() {
    const configPath = path.join(process.cwd(), "playwright.config.js");

    if (fs.existsSync(configPath)) {
      console.log("Playwright config already exists, skipping...");
      return;
    }

    const config = `import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/generated',
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['html', { outputFolder: 'reports/html' }]
  ],
  use: {
    baseURL: process.env.STUDENT_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
});
`;

    fs.writeFileSync(configPath, config);
    console.log("Generated playwright.config.js");
  }
}

// CLI usage
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: node testGenerator.js <rubric.json>");
    process.exit(1);
  }

  const rubricPath = args[0];
  const generator = new TestGenerator(rubricPath);

  generator
    .generate()
    .then(() => {
      console.log("\n✅ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error:", error.message);
      process.exit(1);
    });
}
