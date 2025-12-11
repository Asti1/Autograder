# AutoGrader System

> **Automated web application grading system using Playwright for Teaching Assistants**

A comprehensive autograding solution that converts Excel-based rubrics into automated Playwright tests, providing TAs with a simple dashboard to grade student web applications with detailed HTML reports.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/playwright-1.40%2B-45ba4b)](https://playwright.dev/)

---

## Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [How It Works](#-how-it-works)
- [Configuration](#-configuration)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## Features

### Core Functionality

- **Excel-to-JSON Conversion**: Automatically parse grading rubrics from Excel files into structured JSON
- **Automated Test Generation**: Generate Playwright tests from rubric criteria using templates (future scope: Paid APIS)
- **Smart Test Routing**: Intelligently routes tests to correct pages (Labs, Kambaz sections, etc.)
- **TA Dashboard**: Clean, responsive web interface for running tests
- **Detailed Reports**: Generate comprehensive HTML reports with screenshots and timing

### Grading Capabilities

- HTML structure validation (forms, tables, lists, images)
- CSS styling checks (colors, layouts, responsive design)
- Navigation testing (links, buttons, page transitions)
- Responsive design verification (viewport-based tests)
- Dynamic content validation (React components, state management)
- Backend integration testing (API calls, authentication)

### User Experience

- Three execution modes: Headless, Headed, UI Mode
- Real-time test execution with progress tracking
- Pass/fail indicators with detailed feedback
- Console output capture for debugging
- Assignment selection with visual feedback

---

## System Architecture

![AutoGrader Architecture](/Users/astitva/Documents/AutoGrader/TA Grading Automation-2025-12-11-002045.png)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher)

  ```bash
  node --version  # Should be v16+
  ```

- **npm** (v7.0.0 or higher)

  ```bash
  npm --version
  ```

- **Git** (for cloning the repository)
  ```bash
  git --version
  ```

### Recommended Tools

- **VS Code** or any modern code editor
- **Chrome/Chromium** browser (Playwright will install browsers automatically)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/autograder.git
cd autograder
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### 3. Verify Installation

```bash
# Test Playwright installation
npx playwright --version

# Should output: Version 1.40.0 (or similar)
```

---

## ⚡ Quick Start

### Step 1: Parse Your Rubric

Place your Excel rubric file (e.g., `A1Rubric.xlsx`) in the `rubrics/` directory. Keep name in the same format for the parser to work.

```bash
# Parse Excel rubric to JSON
npm run parse rubrics/A1-Rubric.xlsx
```

**Expected Output:**

```
Rubric parsed and saved to rubrics/A1-Rubric.json
Total criteria: 47
Total points: 141
```

### Step 2: Generate Tests (future scope)

```bash
# Generate Playwright tests from JSON rubric
npm run generate rubrics/A1-rubric.json
```

**Expected Output:**

```
 Generating tests using templates (no AI)...
   Assignment: 1
   Total criteria: 47

Tests generated successfully!
   Output: tests/generated/assignment1.spec.js
   Tests created: 47
```

### Step 3: Start the Dashboard

```bash
# Start the Express server
npm run web-ui
```

**Expected Output:**

```
Server is running on http://localhost:3001
```

### Step 4: Grade an Assignment

1. Open your browser to `http://localhost:3001`
2. Enter the student's frontend URL (e.g., `https://student-app.vercel.app`)
3. (Optional) Enter backend URL if required
4. Select an assignment from the list
5. Choose execution mode (UI recommended)
6. Click **"Grade Assignment"**
7. View results and download HTML report

---

## 📖 Usage Guide

### Creating a New Rubric

#### 1. Excel Format

Your Excel file must follow this structure:

| Column A                        | Column B     | Column C       | Column D       | Column E        |
| ------------------------------- | ------------ | -------------- | -------------- | --------------- |
| **Criteria**                    | **Best (3)** | **Better (2)** | **Almost (1)** | **Missing (0)** |
| Lab - Forms - Username          | 3            | 2              | 1              | 0               |
| Kambaz - Dashboard - Navigation | 3            | 2              | 1              | 0               |
| Link to GitHub                  | 3            | 2              | 1              | 0               |

**Criteria Naming Convention:**

- **Lab Criteria**: `Lab - Category - Detail`
  - Example: `Lab - Forms - Username input`
- **Kambaz Criteria**: `Kambaz - Section - Subsection - Detail`
  - Example: `Kambaz - Account - Signin - Username field`
- **General Criteria**: Any other text
  - Example: `Link to GitHub`, `Deployed on Vercel`

#### 2. Parse the Rubric

```bash
npm run parse rubrics/A1-Rubric.xlsx
```

#### 3. Generate Tests (not needed rn)

```bash
npm run generate rubrics/A1-rubric.json
```

#### 4. Review Generated Tests

```bash
# Open the generated test file
code tests/generated/assignment3.spec.js
```

### Running Tests Manually

You can run tests directly from the command line:

```bash
# Headless mode
STUDENT_URL=https://student-app.vercel.app npx playwright test tests/generated/assignment1.spec.js

# Headed mode (see browser)
STUDENT_URL=https://student-app.vercel.app npx playwright test tests/generated/assignment1.spec.js --headed

# UI mode (interactive)
STUDENT_URL=https://student-app.vercel.app npx playwright test tests/generated/assignment1.spec.js --ui

# With backend URL
STUDENT_URL=https://student-app.vercel.app BACKEND_URL=https://api.render.com npx playwright test tests/generated/assignment1.spec.js
```

### Understanding Test Results

#### HTML Report

Navigate to `reports/html/index.html` to view:

- Passed tests (green)
- Failed tests (red)
- Execution time for each test
- Screenshots on failure
- Detailed error messages
- Retry information

#### JSON Report

The `reports/test-results.json` contains:

```json
{
  "config": {...},
  "suites": [...],
  "errors": [],
  "stats": {
    "startTime": "2024-01-15T10:30:00.000Z",
    "duration": 45231,
    "expected": 40,
    "unexpected": 5,
    "flaky": 0
  }
}
```

---

## Configuration

### Playwright Configuration

Edit `playwright.config.js`:

```javascript
export default defineConfig({
  testDir: "./tests/generated",
  timeout: 30000, // 30 second timeout per test
  workers: 1, // Run tests sequentially
  use: {
    baseURL: process.env.STUDENT_URL,
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  reporter: [
    ["list"],
    ["json", { outputFile: "reports/test-results.json" }],
    ["html", { outputFolder: "reports/html" }],
  ],
});
```

### Server Configuration

Edit `server/server.js`:

```javascript
const PORT = process.env.PORT || 3001; // Change default port

// Adjust timeout
const GRADING_TIMEOUT = 60000; // 60 seconds
```

---

##  Troubleshooting

### Common Issues

#### 1. "No assignments found"

**Problem:** Dashboard shows no assignments.

**Solution:**

```bash
# Check if test files exist
ls tests/generated/

# If empty, regenerate tests (not working with current gemini API, use PAID API )
npm run generate rubrics/A1-rubric.json
```

#### 2. "ECONNREFUSED" Error

**Problem:** Cannot connect to student URL.

**Solutions:**

- Verify student URL is accessible
- Check if URL includes protocol (`https://`)
- Ensure student site is deployed and running
- Try accessing URL in browser first

#### 3. Tests Timeout

**Problem:** Tests hang or timeout.

**Solutions:**

```javascript
// Increase timeout in playwright.config.js
timeout: 60000, // 60 seconds
  // Or per test:
  test.setTimeout(120000); // 2 minutes
```

#### 4. "Playwright not found"

**Problem:** `npx playwright` command fails.

**Solution:**

```bash
# Reinstall Playwright
npm uninstall playwright @playwright/test
npm install playwright @playwright/test
npx playwright install
```

#### 5. Port Already in Use

**Problem:** Server won't start on port 3001.

**Solutions:**

```bash
# Find and kill process on port 3001
# Mac/Linux:
lsof -ti:3001 | xargs kill -9

# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use different port:
PORT=3002 node server/server.js
```

### Debug Mode

Enable verbose logging:

```bash
# Playwright debug
DEBUG=pw:api npx playwright test

# Server debug
DEBUG=express:* node server/server.js

# Full debug
DEBUG=* node server/server.js
```

---

## Best Practices

### For TAs Using the System

1. **Test incrementally**: Grade one assignment first to verify tests work
2. **Save reports**: Download HTML reports for record-keeping
3. **Check console output**: Provides additional debugging info

### For Developers Maintaining the System

1. **Keep templates simple**: Complex logic should be in helper functions
2. **Add comments**: Explain non-obvious test logic
3. **Test on multiple browsers**: Use Playwright's multi-browser support
4. **Version control rubrics**: Keep Excel files in git
5. **Document criteria naming**: Maintain consistency across assignments

### For Creating Rubrics

1. **Be specific**: "Username input field" is better than "Form validation"
2. **Consistent naming**: Use same pattern across all criteria
3. **Hierarchical structure**: Category → Subcategory → Detail
4. **Testable criteria**: Ensure each criterion can be automatically checked
5. **Point distribution**: Use 3-2-1-0 for partial credit

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style (2-space indentation)
- Add comments for complex logic
- Update README for new features
- Test thoroughly before submitting PR
- Include example usage in PR description

---

[⬆ Back to Top](#-autograder-system)

</div>
