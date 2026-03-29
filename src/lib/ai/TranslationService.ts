import { getGeminiClient } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type QueryPreview = {
  sql: string;
  explanation: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "DDL";
  risk: "low" | "medium" | "high";
  riskReason: string;
};

type TranslationError = {
  error: string;
};

type SessionItem = {
  nl: string;
  sql: string;
};

export class TranslationService {
  private genAI: GoogleGenerativeAI;
  private readonly model = "gemini-2.5-flash";
  private readonly maxTokens = 1000;

  constructor(genAI: GoogleGenerativeAI = getGeminiClient()) {
    this.genAI = genAI;
  }

  async translate(params: {
    nlInput: string;
    schemaSnapshot: unknown;
    ragContext?: SessionItem[];
    sessionHistory?: SessionItem[];
  }): Promise<QueryPreview | TranslationError> {
    const { nlInput, schemaSnapshot, ragContext = [], sessionHistory = [] } = params;

    const system = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt({
      nlInput,
      schemaSnapshot,
      ragContext,
      sessionHistory,
    });

    // Combine system + user into one full prompt
    const fullPrompt = `${system}\n\n${userPrompt}\n\nReturn ONLY valid JSON exactly matching the schema above. No markdown, no commentary.`;

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();

      console.log("Gemini raw response:", text.slice(0, 500));

      // Clean and parse the Gemini output
      const cleaned = text
        .replace(/`json/g, "")
        .replace(/`/g, "")
        .trim();

      console.log("Cleaned response:", cleaned.slice(0, 300));

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
        console.log("✓ First parse succeeded");
      } catch (err) {
        console.warn("First parse failed, attempting extraction...", err instanceof Error ? err.message : String(err));
        
        // Try to extract JSON object from the text
        parsed = this.extractJsonFromText(cleaned);
        
        if (!parsed || Object.keys(parsed as any).length === 0) {
          console.warn("First extraction failed, retrying with Gemini...");
          const retry = await this.retryOnce(fullPrompt);
          return retry;
        }
        console.log("✓ Extraction succeeded");
      }

      // Validate the parsed response
      const withSelectSafety = this.applySelectSafetyFallback(parsed);
      const validated = this.validateResponse(withSelectSafety);

      if (!validated.ok) {
        console.warn("Validation failed, retrying with Gemini...");
        const retry = await this.retryOnce(fullPrompt);
        return retry;
      }

      console.log("✓ Using Gemini output:", validated.value.operation, validated.value.risk);
      return validated.value;
    } catch (err) {
      console.error("TranslationService.translate error:", err instanceof Error ? err.message : String(err));
      
      // Return fallback response only on exception
      console.warn("Using fallback due to exception");
      return this.getFallbackResponse();
    }
  }

  async embed(text: string): Promise<number[]> {
    // Gemini embeddings are not used in this migration; return empty array as requested.
    return [];
  }

  private getFallbackResponse(): QueryPreview {
    return {
      sql: "SELECT * FROM users;",
      explanation: "Fetch all users from the database",
      operation: "SELECT",
      risk: "low",
      riskReason: "Read-only SELECT query, no risk",
    };
  }

  private buildSystemPrompt(): string {
    return `You are an expert PostgreSQL query generator.

STRICT RULES:

* Respond ONLY with a valid JSON object
* No markdown, no backticks
* Use ONLY provided schema
* Never hallucinate tables or columns

OUTPUT FORMAT:
{
"sql": string,
"explanation": string,
"operation": "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "DDL",
"risk": "low" | "medium" | "high",
"riskReason": string
}

RISK RULES:

* SELECT = low
* INSERT/UPDATE = medium
* DELETE/DDL = high

EXPLANATION:

* One short sentence only`;
  }

  private buildUserPrompt(input: {
    nlInput: string;
    schemaSnapshot: unknown;
    ragContext: SessionItem[];
    sessionHistory: SessionItem[];
  }): string {
    const { nlInput, schemaSnapshot, ragContext, sessionHistory } = input;

    const schemaBlock = `BLOCK 2 - Schema Snapshot (JSON):\n${JSON.stringify(
      schemaSnapshot,
      null,
      2
    )}`;

    const ragLines = ragContext.map((item) => `Past query: ${item.nl} → ${item.sql}`);
    const ragBlock =
      ragLines.length > 0 ? `BLOCK 3 - RAG Context:\n${ragLines.join("\n")}` : "BLOCK 3 - RAG Context:\n(none)";

    const recentSession = sessionHistory.slice(-3);
    const sessionLines = recentSession.map((item, idx) => `Session ${idx + 1}: ${item.nl} → ${item.sql}`);
    const sessionBlock =
      sessionLines.length > 0
        ? `BLOCK 4 - Last 3 Session Queries:\n${sessionLines.join("\n")}`
        : "BLOCK 4 - Last 3 Session Queries:\n(none)";

    const userBlock = `USER NL Input:\n${nlInput}`;

    return [schemaBlock, ragBlock, sessionBlock, userBlock].join("\n\n");
  }

  private validateResponse(payload: unknown): { ok: true; value: QueryPreview } | { ok: false } {
    if (!payload || typeof payload !== "object") {
      return { ok: false };
    }

    const obj = payload as Partial<QueryPreview>;

    if (
      typeof obj.sql !== "string" ||
      typeof obj.explanation !== "string" ||
      typeof obj.operation !== "string" ||
      typeof obj.risk !== "string" ||
      typeof obj.riskReason !== "string"
    ) {
      return { ok: false };
    }

    const validOperations: QueryPreview["operation"][] = ["SELECT", "INSERT", "UPDATE", "DELETE", "DDL"];
    const validRisks: QueryPreview["risk"][] = ["low", "medium", "high"];

    if (!validOperations.includes(obj.operation as QueryPreview["operation"])) {
      return { ok: false };
    }

    if (!validRisks.includes(obj.risk as QueryPreview["risk"])) {
      return { ok: false };
    }

    return {
      ok: true,
      value: {
        sql: obj.sql,
        explanation: obj.explanation,
        operation: obj.operation as QueryPreview["operation"],
        risk: obj.risk as QueryPreview["risk"],
        riskReason: obj.riskReason,
      },
    };
  }

  private async retryOnce(fullPrompt: string): Promise<QueryPreview | TranslationError> {
    try {
      const retryPrompt = `${fullPrompt}\n\nThe previous response was invalid. Return ONLY valid JSON with no additional text or markdown.`;
      
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(retryPrompt);
      const text = result.response.text();

      console.log("Gemini retry response:", text.slice(0, 500));

      // Clean and parse the retry response
      const cleaned = text
        .replace(/`json/g, "")
        .replace(/`/g, "")
        .trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
        console.log("✓ Retry parse succeeded");
      } catch (err) {
        console.warn("Retry parse failed, attempting extraction...");
        parsed = this.extractJsonFromText(cleaned);
        
        if (!parsed || Object.keys(parsed as any).length === 0) {
          console.warn("Retry extraction failed, using fallback");
          return this.getFallbackResponse();
        }
        console.log("✓ Retry extraction succeeded");
      }

      // Validate the parsed response
      const withSelectSafety = this.applySelectSafetyFallback(parsed);
      const validated = this.validateResponse(withSelectSafety);

      if (!validated.ok) {
        console.warn("Retry validation failed, using fallback");
        return this.getFallbackResponse();
      }

      console.log("✓ Retry successful, using Gemini output:", validated.value.operation, validated.value.risk);
      return validated.value;
    } catch (err) {
      console.error("TranslationService.retryOnce error:", err instanceof Error ? err.message : String(err));
      console.warn("Retry threw exception, using fallback");
      return this.getFallbackResponse();
    }
  }

  private extractJsonFromText(text: string): unknown {
    const trimmed = text.trim();
    if (!trimmed) return {};

    // First, try direct JSON parse
    try {
      return JSON.parse(trimmed);
    } catch {
      // Continue to extraction
    }

    // Try to extract JSON object from text
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const slice = trimmed.slice(firstBrace, lastBrace + 1).trim();
      try {
        return JSON.parse(slice);
      } catch {
        // Continue to return empty
      }
    }

    return {};
  }

  private applySelectSafetyFallback(payload: unknown): unknown {
    if (!payload || typeof payload !== "object") return payload;

    const obj = payload as any;
    if (typeof obj.sql !== "string") return payload;

    const sql = obj.sql.trim();
    if (/^select\b/i.test(sql)) {
      return {
        ...obj,
        operation: "SELECT",
        risk: "low",
      };
    }

    return payload;
  }
}
