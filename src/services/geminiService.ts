import { GoogleGenAI } from "@google/genai";
import { AppSettings } from "../types";

const getApiKey = (settings: AppSettings) => settings.geminiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

export const generateStoryChapter = async (
  settings: AppSettings,
  config: any,
  chapterIndex: number,
  previousChapters: string[]
) => {
  const apiKey = getApiKey(settings);
  if (!apiKey) throw new Error("API Key não configurada");
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Você é um escritor profissional. Escreva o capítulo ${chapterIndex + 1} de uma história com as seguintes configurações:
    Título: ${config.title}
    Gênero: ${config.genre}
    Tom: ${config.tone}
    Ponto de Vista: ${config.pov}
    Cenário: ${config.setting}
    
    Personagens:
    ${config.characters.map((c: any) => `- ${c.name} (${c.role})`).join('\n')}
    
    Enredo/Prévia:
    ${config.plot}
    
    Contexto dos capítulos anteriores (resumo):
    ${previousChapters.map((c, i) => `Capítulo ${i + 1}: ${c.slice(0, 300)}...`).join('\n')}
    
    Instruções específicas:
    - Escreva aproximadamente ${config.pagesPerChapter} páginas, com foco em ${config.linesPerPage} linhas por página.
    - Mantenha a consistência com os capítulos anteriores.
    - O capítulo deve ter um título próprio.
    - Retorne no formato:
    TITULO: [Título do Capítulo]
    CONTEUDO: [Texto do Capítulo]
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  
  const text = response.text || '';
  
  const titleMatch = text.match(/TITULO:\s*(.*)/i);
  const contentMatch = text.match(/CONTEUDO:\s*([\s\S]*)/i);
  
  return {
    title: titleMatch ? titleMatch[1].trim() : `Capítulo ${chapterIndex + 1}`,
    content: contentMatch ? contentMatch[1].trim() : text
  };
};

export const suggestCharacterName = async (settings: AppSettings, style: string) => {
  const apiKey = getApiKey(settings);
  if (!apiKey) throw new Error("API Key não configurada");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Sugira 5 nomes criativos para um personagem no estilo ${style}. Retorne apenas os nomes separados por vírgula.`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  
  return (response.text || '').split(',').map(s => s.trim());
};

export const generateImagePrompt = async (settings: AppSettings, description: string, type: string, style: string) => {
  const apiKey = getApiKey(settings);
  if (!apiKey) throw new Error("API Key não configurada");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Create a highly detailed English prompt for image generation (Stable Diffusion/Flux) based on: "${description}". 
  Type: "${type}". Style: "${style}". 
  Focus on visual details, lighting, and composition. Return ONLY the English prompt text.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  
  return (response.text || '').trim();
};

export const generateImage = async (settings: AppSettings, description: string, type: string, style: string) => {
  const apiKey = getApiKey(settings);
  
  const prompt = await generateImagePrompt(settings, description, type, style);
  console.log("Generated prompt:", prompt);
  
  if (settings.geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: settings.geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      console.log("Gemini response:", response);

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          console.log("Found inlineData image");
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (error) {
      console.error("Gemini Image Gen failed, falling back to Pollinations", error);
    }
  }

  // Default / Fallback: Pollinations.ai
  const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&model=flux`;
  console.log("Using Pollinations URL:", pollUrl);
  return pollUrl;
};
