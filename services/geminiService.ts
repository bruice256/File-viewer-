
import { GoogleGenAI, Type } from "@google/genai";
import { FileInsight } from "../types";

export class GeminiService {
  private static ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  static async analyzeFile(fileName: string, fileType: string, contentSnippet: string): Promise<FileInsight> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this file metadata and snippet. 
        Filename: ${fileName}
        MimeType: ${fileType}
        Content (first 1000 chars): ${contentSnippet}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A short 1-2 sentence summary of what this file appears to be." },
              suggestedAction: { type: Type.STRING, description: "A suggested software or way to open this file properly." },
              detectedType: { type: Type.STRING, description: "A refined file type classification." }
            },
            required: ["summary", "suggestedAction", "detectedType"]
          }
        }
      });

      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini analysis failed", error);
      return {
        summary: "Analysis failed. The file could not be scanned.",
        suggestedAction: "Try opening with a specialized viewer.",
        detectedType: "Unknown"
      };
    }
  }
}
