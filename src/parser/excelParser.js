import XLSX from "xlsx";
import fs from "fs";
import path from "path";

/**
 * Parse Excel rubric to structured JSON format
 * Handles Labs and Kambaz sections with proper routing logic
 */
export class ExcelParser {
  constructor(filePath) {
    this.filePath = filePath;
    this.assignmentNumber = this.extractAssignmentNumber(filePath);
  }

  /**
   * Extract assignment number from filename (e.g., A1Rubric.xlsx -> 1)
   */
  extractAssignmentNumber(filePath) {
    const filename = path.basename(filePath, ".xlsx");
    const match = filename.match(/A(\d+)/i);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Main parsing method
   */
  parse() {
    const workbook = XLSX.readFile(this.filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const rubric = {
      assignmentNumber: this.assignmentNumber,
      metadata: {
        totalPoints: 0,
        sections: [],
      },
      criteria: [],
    };

    // Skip header rows (0: Criteria/Points, 1: Best/Better/Almost/Missing)
    for (let i = 2; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !row[0]) continue;

      const criteriaText = row[0].trim();
      const points = this.extractPoints(row);

      const criterion = this.parseCriterion(criteriaText, points);
      if (criterion) {
        rubric.criteria.push(criterion);
        rubric.metadata.totalPoints += points.best;
      }
    }

    // Group criteria by section
    rubric.metadata.sections = this.extractSections(rubric.criteria);

    return rubric;
  }

  /**
   * Extract points from row (columns B, C, D, E represent 3, 2, 1, 0)
   */
  extractPoints(row) {
    return {
      best: row[1] !== undefined ? row[1] : 3,
      better: row[2] !== undefined ? row[2] : 2,
      almost: row[3] !== undefined ? row[3] : 1,
      missing: row[4] !== undefined ? row[4] : 0,
    };
  }

  /**
   * Parse a single criterion into structured format
   */
  parseCriterion(text, points) {
    // Determine if it's a Lab or Kambaz criterion
    if (text.includes("Lab -")) {
      return this.parseLabCriterion(text, points);
    } else if (text.includes("Kambaz -")) {
      return this.parseKambazCriterion(text, points);
    } else {
      return this.parseGeneralCriterion(text, points);
    }
  }

  /**
   * Parse Lab criterion (e.g., "Lab - Forms - Username")
   */
  parseLabCriterion(text, points) {
    const labMatch = text.match(/Lab - (.+)/);
    if (!labMatch) return null;

    const parts = labMatch[1].split(" - ").map((p) => p.trim());
    const category = parts[0]; // Forms, Lists, Images, etc.
    const detail = parts.slice(1).join(" - ");

    return {
      type: "lab",
      category: category,
      detail: detail,
      originalText: text,
      route: `/Labs/Lab${this.assignmentNumber}`,
      points: points,
      testType: this.determineLabTestType(category, detail),
    };
  }

  /**
   * Parse Kambaz criterion (e.g., "Kambaz - Account - Signin - Username field")
   */
  parseKambazCriterion(text, points) {
    const kambazMatch = text.match(/Kambaz - (.+)/);
    if (!kambazMatch) return null;

    const parts = kambazMatch[1].split(" - ").map((p) => p.trim());
    const section = parts[0]; // Account, Dashboard, Courses, etc.
    const subsection = parts[1] || ""; // Signin, Profile, Navigation, etc.
    const detail = parts.slice(2).join(" - ");

    const route = this.buildKambazRoute(section, subsection);

    return {
      type: "kambaz",
      section: section,
      subsection: subsection,
      detail: detail,
      originalText: text,
      route: route,
      points: points,
      testType: this.determineKambazTestType(section, subsection, detail),
    };
  }

  /**
   * Parse general criterion (deployment, GitHub, etc.)
   */
  parseGeneralCriterion(text, points) {
    return {
      type: "general",
      detail: text,
      originalText: text,
      route: "/",
      points: points,
      testType: "general",
    };
  }

  /**
   * Build route for Kambaz sections
   */
  buildKambazRoute(section, subsection) {
    // Navigation Sidebar has no specific route
    if (section === "Navigation Sidebar") {
      return "/";
    }

    // Dashboard
    if (section === "Dashboard") {
      return "/Dashboard";
    }

    // Account section
    if (section === "Account") {
      if (subsection === "Navigation") {
        return "/Account/Signin"; // Default for navigation testing
      }
      return `/Account/${subsection}`; // /Account/Signin, /Account/Profile, etc.
    }

    // Courses section
    if (section === "Courses") {
      if (subsection === "Navigation") {
        return "/Courses/:id/Home"; // Default course for navigation
      }
      return `/Courses/:id/${subsection}`; // /Courses/:id/Modules, etc.
    }

    // Modules
    if (section === "Modules") {
      return "/Courses/:id/Modules";
    }

    // Assignments
    if (section === "Assignments") {
      return "/Courses/:id/Assignments";
    }

    // Assignment Editor
    if (section === "Assignment Editor") {
      return "/Courses/:id/Assignments/:assignmentId";
    }

    return "/";
  }

  /**
   * Determine what type of test to generate for Lab criteria
   */
  determineLabTestType(category, detail) {
    const lowerDetail = detail.toLowerCase();

    if (category.includes("Table") || lowerDetail.includes("table")) {
      return "table_elements";
    }
    if (category.includes("Form") || lowerDetail.includes("form")) {
      if (
        lowerDetail.includes("username") ||
        lowerDetail.includes("password")
      ) {
        return "form_input";
      }
      if (lowerDetail.includes("radio")) {
        return "form_radio";
      }
      if (lowerDetail.includes("checkbox")) {
        return "form_checkbox";
      }
      if (lowerDetail.includes("select") || lowerDetail.includes("dropdown")) {
        return "form_select";
      }
      if (lowerDetail.includes("textarea")) {
        return "form_textarea";
      }
      if (lowerDetail.includes("button") && lowerDetail.includes("alert")) {
        return "form_button_alert";
      }
      if (lowerDetail.includes("file upload")) {
        return "form_file";
      }
      return "form_generic";
    }
    if (category.includes("List") || lowerDetail.includes("list")) {
      if (lowerDetail.includes("ordered")) {
        return "ordered_list";
      }
      if (lowerDetail.includes("unordered")) {
        return "unordered_list";
      }
      return "list_generic";
    }
    if (category.includes("Image") || lowerDetail.includes("image")) {
      return "image";
    }
    if (category.includes("Heading") || lowerDetail.includes("heading")) {
      return "heading";
    }
    if (category.includes("Paragraph") || lowerDetail.includes("paragraph")) {
      return "paragraph";
    }
    if (
      category.includes("Anchor") ||
      lowerDetail.includes("anchor") ||
      lowerDetail.includes("link")
    ) {
      return "anchor";
    }

    return "generic";
  }

  /**
   * Determine what type of test to generate for Kambaz criteria
   */
  determineKambazTestType(section, subsection, detail) {
    const lowerDetail = detail.toLowerCase();

    // Navigation tests
    if (lowerDetail.includes("clicking") && lowerDetail.includes("navigates")) {
      return "navigation_click";
    }
    if (lowerDetail.includes("link") && !lowerDetail.includes("clicking")) {
      return "link_exists";
    }

    // Form field tests
    if (lowerDetail.includes("field of type")) {
      return "input_type";
    }
    if (lowerDetail.includes("dropdown") || lowerDetail.includes("select")) {
      return "dropdown";
    }
    if (lowerDetail.includes("checkbox")) {
      return "checkbox";
    }

    // Content tests
    if (lowerDetail.includes("title") || lowerDetail.includes("subtitle")) {
      return "text_content";
    }
    if (lowerDetail.includes("default value")) {
      return "default_value";
    }
    if (lowerDetail.includes("sidebar")) {
      return "sidebar";
    }
    if (lowerDetail.includes("list of")) {
      return "list_items";
    }

    return "generic";
  }

  /**
   * Extract unique sections from criteria
   */
  extractSections(criteria) {
    const sections = new Set();
    criteria.forEach((c) => {
      if (c.type === "lab") sections.add("Labs");
      else if (c.type === "kambaz") sections.add(`Kambaz - ${c.section}`);
      else sections.add("General");
    });
    return Array.from(sections);
  }

  /**
   * Save parsed rubric to JSON file
   */
  save(outputPath) {
    const rubric = this.parse();
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(rubric, null, 2));
    console.log(`Rubric parsed and saved to ${outputPath}`);
    console.log(`Total criteria: ${rubric.criteria.length}`);
    console.log(`Total points: ${rubric.metadata.totalPoints}`);

    return rubric;
  }
}

// CLI usage
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: node excelParser.js <rubric.xlsx> [output.json]");
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace(".xlsx", ".json");

  const parser = new ExcelParser(inputPath);
  parser.save(outputPath);
}
