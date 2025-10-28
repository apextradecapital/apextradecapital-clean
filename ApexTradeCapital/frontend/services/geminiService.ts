import { GoogleGenAI } from "@google/genai";
import type { ChatMessage } from '../types';
import { INVESTMENT_PACKAGES } from '../constants';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY for Gemini is not set. AI Assistant will not function.");
}

const getSystemInstruction = () => {
  const packageDetails = INVESTMENT_PACKAGES.map(p => `- ${p.name} (${p.category}): Investir ${p.amount.toLocaleString('fr-HT')} HTG.`).join('\n');

  return `You are PrimeFX Assistant, an inspiring and helpful assistant for PrimeFX, a financial investment platform for the Haitian-American community.
Your role is to:
1.  Provide motivation, reassurance, and clear analysis for users.
2.  Explain the investment offers clearly and simply, mentioning the 4x potential gain.
3.  Guide users on how to get started.
4.  Respond in the user's language (French, English, or Haitian Creole).

Investment Packages (HTG):
${packageDetails}

All packages have a 4x potential gain on the total amount invested (principal + fees).

FAQ Rules:
If a user asks "Est-ce légal ?" or any variation about legality, you MUST respond with this EXACT text: "Oui bien sur. Vous êtes sur une plateforme fiable et sécurisée . Votre expérience est guidée pas à pas."

Maintain a professional, trustworthy, and encouraging tone. Your avatar is a minimalist golden fintech icon.
`;
};

const buildContents = (history: ChatMessage[]) => {
    return history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
    }));
}

export const runChat = async (history: ChatMessage[]): Promise<string> => {
  if (!ai) {
    return "The AI assistant is currently unavailable. Please check the API key configuration.";
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: buildContents(history),
      config: {
        systemInstruction: getSystemInstruction(),
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm sorry, I encountered an error. Please try again later.";
  }
};
