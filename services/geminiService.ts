import { GoogleGenAI } from "@google/genai";
import { GenerationParams, ImageModel } from "../types";

const getApiKey = (providedKey?: string) => {
  return providedKey || localStorage.getItem('gemini_api_key') || process.env.API_KEY;
};

const isImagenModel = (model: ImageModel): boolean => {
  return model.startsWith('imagen-');
};

const generateWithGemini = async (
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  aspectRatio: string,
  referenceImages?: string[]
): Promise<string | null> => {
  const parts: any[] = [{ text: prompt }];

  if (referenceImages && referenceImages.length > 0) {
    referenceImages.forEach((imgBase64) => {
      const matches = imgBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    });
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: parts,
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: "1K"
      }
    },
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("Empty response from model");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64Data = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${base64Data}`;
    }
  }

  throw new Error("No image data found in response");
};

const generateWithImagen = async (
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  aspectRatio: string
): Promise<string | null> => {
  const response = await ai.models.generateImages({
    model: model,
    prompt: prompt,
    config: {
      aspectRatio: aspectRatio,
      numberOfImages: 1,
    },
  });

  if (!response.generatedImages || response.generatedImages.length === 0) {
    throw new Error("No images generated");
  }

  const generatedImage = response.generatedImages[0];
  
  if (generatedImage.image?.imageBytes) {
    const base64Data = generatedImage.image.imageBytes;
    const mimeType = 'image/png';
    return `data:${mimeType};base64,${base64Data}`;
  }

  throw new Error("No image data found in Imagen response");
};

export const generateImage = async (params: GenerationParams, apiKey?: string): Promise<string | null> => {
  const { prompt, aspectRatio, model = 'gemini-3-pro-image-preview', referenceImages } = params;
  
  const key = getApiKey(apiKey);
  if (!key) throw new Error("API Key is missing. Please add your Gemini API Key.");

  const ai = new GoogleGenAI({ apiKey: key });
  
  let retryCount = 0;
  const maxRetries = 3;
  let lastError: any = new Error("Failed to generate image");

  while (retryCount <= maxRetries) {
    try {
      if (isImagenModel(model)) {
        return await generateWithImagen(ai, model, prompt, aspectRatio);
      } else {
        return await generateWithGemini(ai, model, prompt, aspectRatio, referenceImages);
      }
    } catch (error: any) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      lastError = error;
      
      const isRateLimit = error.status === 429 || 
                          (error.message && error.message.includes('429')) ||
                          (error.message && error.message.includes('Quota exceeded'));

      if (isRateLimit && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 2000 + (Math.random() * 1000);
        console.warn(`Rate limit hit. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      } else {
        throw lastError;
      }
    }
  }
  
  throw lastError;
};

export const improvePrompt = async (currentPrompt: string, apiKey?: string, type: 'image' | 'video' = 'image'): Promise<string> => {
  const key = getApiKey(apiKey);
  if (!key) return currentPrompt;

  const ai = new GoogleGenAI({ apiKey: key });
  
  const systemPrompt = type === 'video' 
    ? `You are an expert prompt engineer for AI video generation (specifically for Google Veo). 
       Analyze the following user prompt and transform it into a highly detailed prompt optimized for Image-to-Video generation.
       Focus on describing CAMERA MOVEMENT (pan, tilt, zoom), SUBJECT MOTION (what is moving and how), LIGHTING changes, and ATMOSPHERE.
       Keep it cinematic and dynamic.
       Return ONLY the improved prompt text without any explanations.`
    : `You are an expert prompt engineer for AI image generators. 
       Analyze the following user prompt and expand it into a highly detailed, descriptive, and cinematic prompt that will produce high-quality results. 
       Focus on lighting, texture, composition, and artistic style.
       Return ONLY the improved prompt text without any explanations or quotes.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${systemPrompt}
      
      User prompt: "${currentPrompt}"`,
    });

    return response.text?.trim() || currentPrompt;
  } catch (error) {
    console.error("Failed to improve prompt:", error);
    return currentPrompt;
  }
};
