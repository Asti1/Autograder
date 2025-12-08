import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

/**
 * Test runner for executing generated Playwright tests
 */
export class TestRunner {
  constructor(studentUrl, assignmentNumber = null) {
    this.studentUrl = studentUrl;
    this.assignmentNumber = assignmentNumber;
  }

  /**
   * Run all tests or specific assignment tests
   */
  async run() {
    console.log(`\n🚀 Running tests for: ${this.studentUrl}\n`);

    // Set environment variable for student URL
    process.env.STUDENT_URL = this.studentUrl;

    // Determine which test file to run
    const testPattern = this.assignmentNumber
      ? `tests/generated/assignment${this.assignmentNumber}.spec.js`
      : "tests/generated/*.spec.js";

    try {
      // Run Playwright tests
      console.log(`Running: npx playwright test ${testPattern}`);

      const { stdout, stderr } = await execAsync(
        `npx playwright test ${testPattern} --reporter=json`,
        {
          env: { ...process.env, STUDENT_URL: this.studentUrl },
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }
      );

      // Parse results from stdout (Playwright JSON reporter)
      const results = this.parseResults(stdout);

      // Generate grading report
      const report = this.generateReport(results);

      // Save report
      this.saveReport(report);

      // Display summary
      this.displaySummary(report);

      return report;
    } catch (error) {
      console.error("Error running tests:", error);

      // Even if tests fail, try to parse results
      if (error.stdout) {
        const results = this.parseResults(error.stdout);
        const report = this.generateReport(results);
        this.saveReport(report);
        this.displaySummary(report);
        return report;
      }

      throw error;
    }
  }

  /**
   * Parse test results from Playwright output
   */
  parseResults(output) {
    try {
      // Look for the JSON results in the output
      const jsonMatch = output.match(/\{[\s\S]*"suites"[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: look for custom results array in console output
      const resultsMatch = output.match(
        /=== GRADING RESULTS ===\n([\s\S]*?)(?:\n===|\n\nTotal Score:|$)/
      );
      if (resultsMatch) {
        const resultsJson = resultsMatch[1].trim();
        return { custom: JSON.parse(resultsJson) };
      }

      return null;
    } catch (error) {
      console.error("Error parsing results:", error);
      return null;
    }
  }

  /**
   * Generate grading report from results
   */
  generateReport(results) {
    const report = {
      studentUrl: this.studentUrl,
      timestamp: new Date().toISOString(),
      assignmentNumber: this.assignmentNumber,
      criteria: [],
      summary: {
        totalPoints: 0,
        earnedPoints: 0,
        percentage: 0,
        passed: 0,
        failed: 0,
        total: 0,
      },
    };

    if (!results) {
      report.error = "Failed to parse test results";
      return report;
    }

    // Parse custom results if available
    if (results.custom) {
      results.custom.forEach((result) => {
        report.criteria.push({
          criterion: result.criterion,
          passed: result.passed,
          pointsEarned: result.points.earned,
          pointsPossible: result.points.possible,
          details: result.details,
        });

        report.summary.totalPoints += result.points.possible;
        report.summary.earnedPoints += result.points.earned;
        report.summary.total++;

        if (result.passed) {
          report.summary.passed++;
        } else {
          report.summary.failed++;
        }
      });
    } else if (results.suites) {
      // Parse Playwright JSON format
      this.parsePlaywrightSuites(results.suites, report);
    }

    // Calculate percentage
    if (report.summary.totalPoints > 0) {
      report.summary.percentage = (
        (report.summary.earnedPoints / report.summary.totalPoints) *
        100
      ).toFixed(2);
    }

    return report;
  }

  /**
   * Parse Playwright suites recursively
   */
  parsePlaywrightSuites(suites, report) {
    suites.forEach((suite) => {
      if (suite.specs) {
        suite.specs.forEach((spec) => {
          const test = spec.tests[0];
          const passed = test.results[0].status === "passed";

          // Try to extract custom scoring from test
          const criterion = spec.title;

          report.criteria.push({
            criterion: criterion,
            passed: passed,
            pointsEarned: passed ? 3 : 0, // Default scoring
            pointsPossible: 3,
            details: passed ? "Test passed" : "Test failed",
          });

          report.summary.totalPoints += 3;
          report.summary.earnedPoints += passed ? 3 : 0;
          report.summary.total++;

          if (passed) {
            report.summary.passed++;
          } else {
            report.summary.failed++;
          }
        });
      }

      if (suite.suites) {
        this.parsePlaywrightSuites(suite.suites, report);
      }
    });
  }

  /**
   * Save report to file
   */
  saveReport(report) {
    const reportsDir = path.join(process.cwd(), "reports");

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `grading-report-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    // Also save as latest
    const latestPath = path.join(reportsDir, "latest.json");
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Report saved to: ${filepath}`);
  }

  /**
   * Display summary in console
   */
  displaySummary(report) {
    console.log("\n" + "=".repeat(60));
    console.log("  GRADING SUMMARY");
    console.log("=".repeat(60));
    console.log(`  Student URL: ${report.studentUrl}`);
    console.log(`  Assignment:  ${report.assignmentNumber || "All"}`);
    console.log(
      `  Date:        ${new Date(report.timestamp).toLocaleString()}`
    );
    console.log("=".repeat(60));
    console.log(
      `  Total Score: ${report.summary.earnedPoints}/${report.summary.totalPoints}`
    );
    console.log(`  Percentage:  ${report.summary.percentage}%`);
    console.log(
      `  Passed:      ${report.summary.passed}/${report.summary.total}`
    );
    console.log(
      `  Failed:      ${report.summary.failed}/${report.summary.total}`
    );
    console.log("=".repeat(60));

    // Display failed criteria
    if (report.summary.failed > 0) {
      console.log("\n❌ Failed Criteria:");
      report.criteria.forEach((c) => {
        if (!c.passed) {
          console.log(`\n  • ${c.criterion}`);
          console.log(`    Points: ${c.pointsEarned}/${c.pointsPossible}`);
          console.log(`    Details: ${c.details}`);
        }
      });
    }

    console.log("\n" + "=".repeat(60) + "\n");
  }
}

// CLI usage
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error(
      "Usage: node testRunner.js <student-url> [assignment-number]"
    );
    console.error(
      "Example: node testRunner.js https://student-site.netlify.app 1"
    );
    process.exit(1);
  }

  const studentUrl = args[0];
  const assignmentNumber = args[1] ? parseInt(args[1]) : null;

  const runner = new TestRunner(studentUrl, assignmentNumber);

  runner
    .run()
    .then(() => {
      console.log("✅ Grading complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error.message);
      process.exit(1);
    });
}
