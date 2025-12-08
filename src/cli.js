#!/usr/bin/env node

import { ExcelParser } from "./parser/excelParser.js";
import { TestGenerator } from "./generator/testGenerator.js";
import { TestRunner } from "./runner/testRunner.js";
import fs from "fs";
import path from "path";

/**
 * Main CLI interface for the assignment grader
 */
class GraderCLI {
  constructor() {
    this.commands = {
      parse: this.parseCommand.bind(this),
      generate: this.generateCommand.bind(this),
      grade: this.gradeCommand.bind(this),
      full: this.fullCommand.bind(this),
      help: this.helpCommand.bind(this),
    };
  }

  /**
   * Parse Excel rubric to JSON
   */
  async parseCommand(args) {
    if (args.length < 1) {
      console.error("Usage: grade parse <rubric.xlsx> [output.json]");
      process.exit(1);
    }

    const inputPath = args[0];
    const outputPath = args[1] || inputPath.replace(".xlsx", ".json");

    console.log(`\n📖 Parsing rubric: ${inputPath}`);

    const parser = new ExcelParser(inputPath);
    const rubric = parser.save(outputPath);

    console.log(`\n✅ Success!`);
    console.log(`   Assignment: ${rubric.assignmentNumber}`);
    console.log(`   Criteria: ${rubric.criteria.length}`);
    console.log(`   Total Points: ${rubric.metadata.totalPoints}`);
    console.log(`   Output: ${outputPath}\n`);
  }

  /**
   * Generate Playwright tests from JSON rubric
   */
  async generateCommand(args) {
    if (args.length < 1) {
      console.error("Usage: grade generate <rubric.json>");
      process.exit(1);
    }

    const rubricPath = args[0];

    if (!fs.existsSync(rubricPath)) {
      console.error(`❌ Rubric file not found: ${rubricPath}`);
      process.exit(1);
    }

    console.log(`\n🔧 Generating tests from: ${rubricPath}`);

    const generator = new TestGenerator(rubricPath);
    await generator.generate();
  }

  /**
   * Run tests against a student submission
   */
  async gradeCommand(args) {
    if (args.length < 1) {
      console.error("Usage: grade test <student-url> [assignment-number]");
      process.exit(1);
    }

    const studentUrl = args[0];
    const assignmentNumber = args[1] ? parseInt(args[1]) : null;

    // Validate URL
    try {
      new URL(studentUrl);
    } catch (error) {
      console.error(`❌ Invalid URL: ${studentUrl}`);
      process.exit(1);
    }

    const runner = new TestRunner(studentUrl, assignmentNumber);
    await runner.run();
  }

  /**
   * Full workflow: parse -> generate -> grade
   */
  async fullCommand(args) {
    if (args.length < 2) {
      console.error("Usage: grade full <rubric.xlsx> <student-url>");
      process.exit(1);
    }

    const rubricPath = args[0];
    const studentUrl = args[1];

    console.log("\n🚀 Starting full grading workflow...\n");

    // Step 1: Parse
    console.log("Step 1/3: Parsing rubric...");
    const jsonPath = rubricPath.replace(".xlsx", ".json");
    await this.parseCommand([rubricPath, jsonPath]);

    // Step 2: Generate
    console.log("\nStep 2/3: Generating tests...");
    await this.generateCommand([jsonPath]);

    // Step 3: Grade
    console.log("\nStep 3/3: Running tests...");
    await this.gradeCommand([studentUrl]);

    console.log("\n✅ Full grading workflow complete!\n");
  }

  /**
   * Display help information
   */
  helpCommand() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          Assignment Auto-Grader CLI                        ║
╚════════════════════════════════════════════════════════════╝

USAGE:
  grade <command> [options]

COMMANDS:

  parse <rubric.xlsx> [output.json]
    Parse an Excel rubric file into structured JSON format
    Example: grade parse rubrics/A1Rubric.xlsx

  generate <rubric.json>
    Generate Playwright tests from a parsed rubric
    Example: grade generate rubrics/A1Rubric.json

  grade <student-url> [assignment-number]
    Run tests against a student's submission
    Example: grade grade https://student-site.netlify.app 1

  full <rubric.xlsx> <student-url>
    Run the complete workflow (parse -> generate -> grade)
    Example: grade full rubrics/A1Rubric.xlsx https://student.com

  help
    Display this help information

ENVIRONMENT VARIABLES:

  GEMINI_API_KEY    Your Google Gemini API key (required)
  STUDENT_URL       Default student URL

EXAMPLES:

  # Parse a rubric
  grade parse rubrics/A1Rubric.xlsx

  # Generate tests
  grade generate rubrics/A1Rubric.json

  # Run tests
  grade grade https://student-site.netlify.app

  # Do everything at once
  grade full rubrics/A1Rubric.xlsx https://student-site.netlify.app

WORKFLOW:

  1. Create/update your Excel rubric
  2. Parse it to JSON: grade parse rubrics/A1Rubric.xlsx
  3. Generate tests: grade generate rubrics/A1Rubric.json
  4. Review generated tests in tests/generated/
  5. Run against student submission: grade grade <url>
  6. Check reports/ folder for results

For more info, visit: https://github.com/yourusername/assignment-grader
`);
  }

  /**
   * Run the CLI
   */
  async run() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      this.helpCommand();
      process.exit(0);
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    if (!this.commands[command]) {
      console.error(`❌ Unknown command: ${command}`);
      console.error('Run "grade help" for usage information');
      process.exit(1);
    }

    try {
      await this.commands[command](commandArgs);
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
}

// Run CLI if this is the main module
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const cli = new GraderCLI();
  cli.run();
}

export { GraderCLI };
