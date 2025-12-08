const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files for the frontend
app.use(express.static(path.join(__dirname, "public")));

// Serve reports
app.use("/reports", express.static(path.join(__dirname, "../../reports")));

// API to get list of assignments
app.get("/api/assignments", (req, res) => {
  const testsDir = path.join(__dirname, "../../tests/generated");
  try {
    if (!fs.existsSync(testsDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(testsDir);
    const assignments = files
      .filter((file) => file.endsWith(".spec.js"))
      .map((file) => ({
        id: file,
        name: file
          .replace(".spec.js", "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json(assignments);
  } catch (error) {
    console.error("Error reading assignments:", error);
    res.status(500).json({ error: "Failed to list assignments" });
  }
});

// API to run grading
app.post("/api/grade", (req, res) => {
  const { assignment, studentUrl, backendUrl, mode } = req.body;

  if (!assignment || !studentUrl) {
    return res
      .status(400)
      .json({ error: "Assignment and Student URL are required" });
  }

  const env = {
    ...process.env,
    STUDENT_URL: studentUrl,
    BACKEND_URL: backendUrl || "",
  };

  const args = ["playwright", "test", `tests/generated/${assignment}`];

  // Note: We rely on playwright.config.mjs for reporters
  // reporter: [ ["list"], ["json", { outputFile: "reports/test-results.json" }], ["html", { outputFolder: "reports/html" }] ]

  if (mode === "headed") {
    args.push("--headed");
  } else if (mode === "ui") {
    args.push("--ui");
  }

  console.log(`Running: npx ${args.join(" ")}`);

  // We use spawn to run the command
  // Note: We are using 'npx' as the command
  const child = spawn("npx", args, {
    env,
    cwd: path.join(__dirname, "../../"),
    shell: true,
  });

  let output = "";
  let errorOutput = "";

  child.stdout.on("data", (data) => {
    const chunk = data.toString();
    console.log(chunk);
    output += chunk;
  });

  child.stderr.on("data", (data) => {
    const chunk = data.toString();
    console.error(chunk);
    errorOutput += chunk;
  });

  child.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
    const passed = code === 0;

    res.json({
      success: passed,
      message: passed
        ? "Grading completed successfully."
        : "Grading finished with failures.",
      reportUrl: "/reports/html/index.html",
      output: output,
      error: errorOutput,
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
