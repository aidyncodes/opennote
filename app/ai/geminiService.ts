import { GoogleGenAI } from "@google/genai";

/**
 * Service to interact with Gemini 3 Flash to summarize academic documents.
 */
export const summarizeFile = async (file: File): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY (check .env.local and restart dev server).");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Convert File to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const prompt = `
    You are an expert academic teaching assistant. 
    Analyze the attached ${file.type.includes("pdf") ? "PDF document" : "image"}.
    Provide a detailed yet concise summary of its contents.
    Focus on:
    1. The core subject matter.
    2. Key concepts or formulas mentioned.
    3. Any specific dates, deadlines, or important announcements if visible.
    
    Format the output as a professional description suitable for a student note-sharing feed. 
    Do not use introductory phrases like "The document says". Start directly with the information.
    Keep it within 3-4 paragraphs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        temperature: 0.7,
        topP: 0.9,
      },
    });

    if (!response.text) {
      throw new Error("AI failed to generate a response text.");
    }

    return response.text;
  } catch (error) {
    console.error("Gemini AI Summarization Error:", error);
    throw new Error(
      "Failed to process file with AI. Please check your file content and try again."
    );
  }
};
