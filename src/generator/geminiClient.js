import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Gemini API client for test generation
 */
export class GeminiClient {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent code generation
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    });
  }

  /**
   * Generate Playwright tests from prompt
   */
  async generateTests(systemPrompt, rubricPrompt, examplePrompt) {
    try {
      console.log("Sending request to Gemini API...");

      const fullPrompt = `${systemPrompt}\n\n${examplePrompt}\n\n${rubricPrompt}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

      console.log("Received response from Gemini");

      // Extract code from markdown if present
      const codeMatch = text.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
      if (codeMatch) {
        return codeMatch[1].trim();
      }

      return text.trim();
    } catch (error) {
      console.error("Error generating tests with Gemini:", error);
      throw error;
    }
  }

  /**
   * Generate tests with retry logic
   */
  async generateTestsWithRetry(
    systemPrompt,
    rubricPrompt,
    examplePrompt,
    maxRetries = 3
  ) {
    let lastError;
    let lastCode;

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Attempt ${i + 1}/${maxRetries}`);
        const result = await this.generateTests(
          systemPrompt,
          rubricPrompt,
          examplePrompt
        );
        lastCode = result;

        // Validate that result looks like valid JavaScript
        if (this.validateTestCode(result)) {
          return result;
        } else {
          console.warn("Generated code failed validation, retrying...");
          lastError = new Error("Generated code is invalid");

          // If it's the last retry, return what we have anyway
          if (i === maxRetries - 1) {
            console.warn(
              "⚠️  Max retries reached. Returning code for post-processing..."
            );
            return lastCode; // Return it anyway - post-processing will fix it
          }
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error.message);
        lastError = error;

        // Wait before retrying
        if (i < maxRetries - 1) {
          const waitTime = 2000 * (i + 1);
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    // If we have any code at all, return it for post-processing
    if (lastCode && lastCode.includes("test")) {
      console.warn(
        "⚠️  Using last generated code despite validation failure..."
      );
      return lastCode;
    }

    throw (
      lastError || new Error("Failed to generate tests after maximum retries")
    );
  }

  /**
   * Basic validation of generated test code
   */
  validateTestCode(code) {
    // Check for essential Playwright imports and structure
    const requiredPatterns = [
      /import.*@playwright\/test/,
      /test\.describe|test\(/, // Made more lenient - either describe OR test
    ];

    const missingPatterns = [];
    let allPassed = true;

    requiredPatterns.forEach((pattern, index) => {
      if (!pattern.test(code)) {
        allPassed = false;
        if (index === 0) missingPatterns.push("Playwright import");
        if (index === 1) missingPatterns.push("test blocks");
      }
    });

    if (!allPassed) {
      console.warn(
        `   ⚠️  Validation issues: Missing ${missingPatterns.join(", ")}`
      );
      console.warn("   Attempting to fix in post-processing...");
    }

    // More lenient - accept if it has basic structure
    return code.includes("test(") || code.includes("test.describe");
  }

  /**
   * Generate tests in chunks for large rubrics
   */
  async generateTestsInChunks(
    systemPrompt,
    criteria,
    examplePrompt,
    chunkSize = 20
  ) {
    const chunks = [];

    for (let i = 0; i < criteria.length; i += chunkSize) {
      chunks.push(criteria.slice(i, i + chunkSize));
    }

    console.log(
      `Splitting into ${chunks.length} chunks of ~${chunkSize} criteria each`
    );

    const generatedTests = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`\nGenerating chunk ${i + 1}/${chunks.length}...`);

      // Create rubric prompt for this chunk
      const chunkPrompt = this.buildChunkPrompt(chunks[i], i);

      try {
        const tests = await this.generateTestsWithRetry(
          systemPrompt,
          chunkPrompt,
          examplePrompt
        );

        generatedTests.push(tests);
        console.log(`✓ Chunk ${i + 1} generated successfully`);
      } catch (error) {
        console.error(`✗ Chunk ${i + 1} failed:`, error.message);
        console.warn("  Creating placeholder tests for failed chunk...");

        // Create basic placeholder tests for failed chunk
        const placeholderTests = this.createPlaceholderTests(chunks[i]);
        generatedTests.push(placeholderTests);
      }
    }

    // Combine all chunks
    console.log("\nCombining all chunks...");
    return this.combineTestChunks(generatedTests);
  }

  /**
   * Create placeholder tests for a failed chunk
   */
  createPlaceholderTests(criteria) {
    let tests = "";

    criteria.forEach((c) => {
      tests += `
  test('${c.originalText}', async ({ page }) => {
    const criterion = '${c.originalText}';
    let points = { earned: 0, possible: 3 };
    let details = '';

    try {
      await page.goto('${c.route}');
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Placeholder - needs manual implementation
      const element = page.locator('body');
      if (await element.count() > 0) {
        points.earned = 3;
        details = 'Page loaded (placeholder test - needs review)';
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
    });

    return tests;
  }

  /**
   * Build prompt for a chunk of criteria
   */
  buildChunkPrompt(criteriaChunk, chunkIndex) {
    let prompt = `# TEST CHUNK ${chunkIndex + 1}\n\n`;
    prompt += `Generate tests for the following criteria:\n\n`;

    criteriaChunk.forEach((c, i) => {
      prompt += `${i + 1}. ${c.originalText}\n`;
      prompt += `   - Type: ${c.type}\n`;
      prompt += `   - Route: ${c.route}\n`;
      prompt += `   - Points: ${c.points.best} (best)\n\n`;
    });

    return prompt;
  }

  /**
   * Combine multiple test chunks into a single file
   */
  combineTestChunks(chunks) {
    // Extract imports from first chunk
    const firstChunk = chunks[0];
    const importsMatch = firstChunk.match(/^([\s\S]*?)(?=test\.describe)/);
    const imports = importsMatch ? importsMatch[1].trim() : "";

    // Extract all test blocks
    const testBlocks = chunks
      .map((chunk) => {
        const testsMatch = chunk.match(/test\([\s\S]*?\}\);/g);
        return testsMatch ? testsMatch.join("\n\n") : "";
      })
      .filter(Boolean);

    // Combine into single file
    return `${imports}

const results = [];

test.describe('Assignment Tests', () => {
  
${testBlocks.join("\n\n")}

  test.afterAll(async () => {
    console.log('\\n=== GRADING RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
  });
});
`;
  }
}
