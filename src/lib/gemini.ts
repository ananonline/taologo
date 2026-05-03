import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. Please check your environment variables.");
}

const genAI = new GoogleGenAI({ apiKey: apiKey || "" });

export interface LogoConcept {
  id: string;
  concept: string;
  style: string;
  description: string;
  prompt: string;
}

export async function brainstormLogoConcepts(userPrompt: string, referenceImage?: { data: string, mimeType: string }): Promise<LogoConcept[]> {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `You are a professional logo designer. 
  Given a user idea ${referenceImage ? "and a reference image" : ""}, brainstorm 4 distinct logo concepts. 
  ${referenceImage ? "Analyze the style, color palette, and composition of the provided reference image and use it as inspiration for the concepts." : ""}
  Each concept should have:
  1. concept: A short name in Vietnamese.
  2. style: A style description in Vietnamese (e.g., Tối giản, Cổ điển, Tương lai, Tự nhiên).
  3. description: A detailed description of the logo idea in Vietnamese (This will be shown to the user).
  4. prompt: A detailed image generation prompt specifically optimized for a logo. This MUST be in English, descriptive, and specify "white background, high quality, vector style, centered".
  Return the result as a JSON array of objects with keys: concept, style, description, prompt.`;

  const parts: any[] = [{ text: `User Idea: ${userPrompt}` }];
  if (referenceImage) {
    parts.push({
      inlineData: {
        data: referenceImage.data,
        mimeType: referenceImage.mimeType
      }
    });
  }

  const result = await genAI.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    },
  });

  try {
    const data = JSON.parse(result.text || "[]");
    return data.map((item: any, index: number) => ({
      id: Math.random().toString(36).substr(2, 9),
      ...item
    }));
  } catch (e) {
    console.error("Failed to parse logo concepts", e);
    return [];
  }
}

export async function generateLogoImage(prompt: string): Promise<string> {
  const model = "gemini-2.5-flash-image";
  const response = await genAI.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates returned from image generation");
  }

  const parts = candidates[0].content.parts;
  for (const part of parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data found in response");
}
