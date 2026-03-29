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
  
  const isLastChapter = chapterIndex === config.chapters - 1;

  const prompt = `
    Você é um escritor profissional de ficção. Escreva o capítulo ${chapterIndex + 1} de ${config.chapters} da história abaixo.

    DADOS DA HISTÓRIA:
    Título: ${config.title}
    Gênero: ${config.genre}
    Tom: ${config.tone}
    Ponto de Vista: ${config.pov}
    Cenário: ${config.setting}

    PERSONAGENS:
    ${config.characters.map((c: any) => `- ${c.name} (${c.role})`).join('\n')}

    ENREDO:
    ${config.plot}

    CONTEXTO DOS CAPÍTULOS ANTERIORES:
    ${previousChapters.length > 0
      ? previousChapters.map((c, i) => `Capítulo ${i + 1}: ${c.slice(0, 400)}...`).join('\n')
      : 'Este é o primeiro capítulo — apresente o mundo e os personagens.'}

    INSTRUÇÕES OBRIGATÓRIAS:
    - Escreva aproximadamente ${config.pagesPerChapter} páginas com ${config.linesPerPage} linhas por página.
    - O capítulo deve ter um título próprio criativo.
    - Mantenha consistência total com os capítulos anteriores.
    - ${isLastChapter
        ? 'Este é o ÚLTIMO capítulo. Conclua a história de forma satisfatória, resolvendo todos os conflitos.'
        : `No final do capítulo, escreva uma TRANSIÇÃO NARRATIVA — um parágrafo curto e instigante que conecta este capítulo ao próximo, deixando o leitor ansioso para continuar. Separe este parágrafo com a linha: [TRANSIÇÃO]`}

    FORMATO DE RESPOSTA (siga exatamente):
    TITULO: [Título criativo do capítulo]
    CONTEUDO: [Texto completo do capítulo]
    ${!isLastChapter ? 'TRANSICAO: [Parágrafo de transição para o próximo capítulo]' : ''}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  
  const text = response.text || '';

  const titleMatch = text.match(/TITULO:\s*(.*)/i);
  const contentMatch = text.match(/CONTEUDO:\s*([\s\S]*?)(?=TRANSICAO:|$)/i);
  const transicaoMatch = text.match(/TRANSICAO:\s*([\s\S]*)/i);

  const content = contentMatch ? contentMatch[1].trim() : text;
  const transicao = transicaoMatch ? transicaoMatch[1].trim() : '';

  return {
    title: titleMatch ? titleMatch[1].trim() : `Capítulo ${chapterIndex + 1}`,
    content: transicao ? `${content}\n\n— ✦ —\n\n${transicao}` : content,
    transicao: transicao
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
