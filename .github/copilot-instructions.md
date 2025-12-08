## Purpose
Make effective edits to the AutoGrader codebase. This file contains the minimal, concrete rules and pointers an AI coding agent needs to be productive without introducing breaking changes.

## Big picture (what runs and why)
- Pipeline: `src/parser/excelParser.js` -> `src/generator/*` -> generated tests in `tests/generated/*.spec.js` -> `src/runner/testRunner.js` -> `reports/` (JSON + HTML).
- Two generation approaches:
  - `TemplateGenerator` (`src/generator/templateGenerator.js`) — reliable, deterministic template-based tests.
  - `GeminiClient` + `PromptBuilder` (`src/generator/geminiClient.js`, `src/generator/promptBuilder.js`, `src/generator/testGenerator.js`) — AI-based generation that needs strict prompt structure and heavy post-processing.

## Quick developer commands (from `package.json`)
- Parse Excel rubric to JSON: `npm run parse` (calls `node src/parser/excelParser.js`).
- Generate tests from rubric: `npm run generate` (calls `node src/generator/testGenerator.js`).
- Run Playwright tests: `npm run test` (runs `playwright test`).
- Grade/run runner: `npm run grade` (calls `node src/runner/testRunner.js`).
- Full workflow: `npm run full-grade` (parse -> generate -> grade).
- View latest HTML report: `npm run view-grade` or `npm run show-report`.

## Project-specific conventions and patterns
- Tests are always written to a strict template: see `src/generator/promptBuilder.js` for the exact required test structure. Follow it precisely.
  - Each test must define: `const criterion = '...'; let points = { earned: 0, possible: N }; let details = '';` followed by a `try { ... } catch (error) { details = `Error: ${error.message}` }` and a final `results.push({ criterion, points, passed: points.earned === points.possible, details })`.
  - Do NOT emit tests that only navigate and have empty try blocks — the PromptBuilder enforces this and post-processing will try to fix incomplete tests but they must still be reviewed.

- Result object shape (used across generator and runner):
  - results.push expects { criterion, points: { earned, possible }, passed, details }.
  - TestRunner parses either Playwright JSON or console `=== GRADING RESULTS ===` JSON and converts into the grading report.

- URL handling: tests should use the `buildUrl()` helper (or `navigateWithRetry()` seen in generated tests) to preserve `STUDENT_URL` query params and to work with Vercel share links.

## Integration points & environment
- Gemini (Google Generative AI) is optional but present: `@google/generative-ai` is used in `src/generator/geminiClient.js`. If using Gemini, set `GEMINI_API_KEY` in the environment.
- The runner expects `STUDENT_URL` environment variable (set by CLI or `TestRunner`) or uses Playwright `baseURL` (generated in `playwright.config.js`).

## Files to reference when making changes
- Parsing input: `src/parser/excelParser.js` — rubric -> structured JSON (fields: assignmentNumber, metadata.totalPoints, criteria[]).
- Generation: `src/generator/testGenerator.js`, `src/generator/templateGenerator.js`, `src/generator/promptBuilder.js`, `src/generator/geminiClient.js`.
- Test runner + reports: `src/runner/testRunner.js` and `reports/`.
- CLI: `src/cli.js` (shows the canonical workflow and sample usage strings).
- Example generated tests: `tests/generated/*.spec.js` (review these before running the grader).

## How to safely modify generators or test format
- If editing generator output, always:
  1. Run `npm run generate` with a small rubric JSON (or use existing `rubrics/*.json`).
 2. Manually review the generated file in `tests/generated/assignmentX.spec.js` for: proper try/catch, `results.push` format, and `test.afterAll` hook.
 3. Run `npm run grade <student-url>` against a known local/fixture site to validate parsing and report generation.

## When to prefer TemplateGenerator vs Gemini
- Use `TemplateGenerator` for predictable, production grading — it avoids AI hallucination and produces complete tests (see `src/generator/templateGenerator.js`).
- Use Gemini flow only when you need to generate tests from complex natural-language rubrics; expect to post-process and manually review results (see `src/generator/testGenerator.js` postProcessCode behavior).

## Small gotchas and hints
- Playwright reporters: the project generates `playwright.config.js` if missing; tests expect reporter JSON to be output to `reports/test-results.json` and `reports/html`.
- `TestRunner` will try to extract custom `results` JSON from console output if Playwright JSON isn't present — keep the `results` console output format stable.
- Keep `results` console output compact and valid JSON (the generator code prints JSON with `JSON.stringify(results, null, 2)`).

## If something's unclear
- Ask for the rubric JSON file you want to target and the intended student URL. Point me to the specific generator file you want to change and I will: run parse->generate, review the generated test, and run grade to validate reports.

---
If you'd like, I can now add a short checklist-based PR template or expand this file with examples from `tests/generated/assignment3.spec.js` showing `buildUrl`/`navigateWithRetry` usage. Feedback? 
