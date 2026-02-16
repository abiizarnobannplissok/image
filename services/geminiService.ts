import { GoogleGenAI } from "@google/genai";
import { GenerationParams, ImageModel } from "../types";

const getApiKey = (providedKey?: string) => {
  return providedKey || localStorage.getItem('gemini_api_key') || process.env.API_KEY;
};

const isImagenModel = (model: ImageModel): boolean => {
  return model.startsWith('imagen-');
};

// Helper function to fetch image from URL and convert to base64
const fetchImageAsBase64 = async (url: string): Promise<{ mimeType: string; data: string } | null> => {
  try {
    console.log(`📥 Fetching image from URL: ${url.substring(0, 60)}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }
    
    // Get content type from response header
    const contentType = response.headers.get('content-type');
    const mimeType = contentType?.split(';')[0] || 'image/png';
    
    // Get array buffer and convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to binary string then to base64
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    
    const base64Data = btoa(binaryString);
    
    console.log(`✅ Successfully fetched image (${mimeType}, ${Math.round(base64Data.length / 1024)}KB)`);
    
    return {
      mimeType: mimeType,
      data: base64Data
    };
  } catch (error) {
    console.error(`❌ Error fetching image:`, error);
    return null;
  }
};

const generateWithGemini = async (
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  aspectRatio: string,
  referenceImages?: string[]
): Promise<string | null> => {
  // Build enhanced prompt that explicitly instructs to use reference images
  let enhancedPrompt = prompt;
  
  if (referenceImages && referenceImages.length > 0) {
    if (referenceImages.length === 1) {
      enhancedPrompt = `Use the provided reference image as a style and composition guide. Analyze the reference image's visual style, color palette, lighting, composition, and artistic elements, then incorporate these characteristics into the new image you generate. The reference image shows the aesthetic approach I want you to follow. Now create: ${prompt}`;
    } else {
      enhancedPrompt = `I have provided ${referenceImages.length} reference images. Analyze all reference images to understand the desired visual style, color palette, lighting, composition, and artistic approach. Use these reference images as guides for creating the new image. Combine the best visual elements from all references. Now create: ${prompt}`;
    }
  }
  
  // Build parts array with text first, then reference images
  const parts: any[] = [{ text: enhancedPrompt }];
  let validReferenceCount = 0;

  if (referenceImages && referenceImages.length > 0) {
    // Process reference images (can be URLs or base64 data)
    for (let index = 0; index < referenceImages.length; index++) {
      const imgInput = referenceImages[index].trim(); // Trim whitespace
      let imageData: { mimeType: string; data: string } | null = null;
      
      console.log(`🖼️ Processing reference image ${index + 1}: ${imgInput.substring(0, 50)}...`);
      
      // Check if input is a URL (case insensitive)
      const isUrl = imgInput.toLowerCase().startsWith('http://') || imgInput.toLowerCase().startsWith('https://');
      
      if (isUrl) {
        console.log(`🔗 Detected URL for image ${index + 1}, fetching...`);
        // Fetch image from URL
        imageData = await fetchImageAsBase64(imgInput);
        if (!imageData) {
          console.error(`❌ Failed to fetch image from URL: ${imgInput}`);
          continue; // Skip this image
        }
      } else {
        console.log(`📄 Processing as base64 data for image ${index + 1}`);
        // Handle base64 data (either data URL format or raw base64)
        const dataUrlMatch = imgInput.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (dataUrlMatch && dataUrlMatch.length === 3) {
          imageData = {
            mimeType: dataUrlMatch[1],
            data: dataUrlMatch[2]
          };
          console.log(`✅ Parsed data URL for image ${index + 1}, mimeType: ${imageData.mimeType}`);
        } else if (imgInput.length > 100) {
          // Assume raw base64
          imageData = {
            mimeType: 'image/png',
            data: imgInput
          };
          console.log(`✅ Using raw base64 for image ${index + 1}`);
        } else {
          console.warn(`⚠️ Invalid base64 data for image ${index + 1}, length: ${imgInput.length}`);
          continue;
        }
      }
      
      // Add to parts if valid
      if (imageData && imageData.data && imageData.data.length > 100) {
        // Ensure the data doesn't contain any URL strings
        if (imageData.data.includes('http://') || imageData.data.includes('https://')) {
          console.error(`❌ Image ${index + 1} data still contains URL! Aborting.`);
          continue;
        }
        
        parts.push({
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.data
          }
        });
        validReferenceCount++;
        console.log(`✅ Added reference image ${index + 1} to request (${imageData.mimeType}, ${Math.round(imageData.data.length / 1024)}KB)`);
      } else {
        console.warn(`⚠️ Skipped invalid reference image ${index + 1}: data length ${imageData?.data?.length || 0}`);
      }
    }
  }

  const requestPayload = {
    model: model,
    contents: parts,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
      }
    },
  };

  console.log('🔍 [Gemini Request]', {
    model,
    aspectRatio,
    prompt: prompt.substring(0, 50) + '...',
    enhancedPrompt: enhancedPrompt.substring(0, 100) + '...',
    totalParts: parts.length,
    textParts: 1,
    imageParts: validReferenceCount,
    config: requestPayload.config
  });

  const response = await ai.models.generateContent(requestPayload);

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
      numberOfImages: 1,
      aspectRatio: aspectRatio,
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
      console.error(`❌ [Generation Failed] Attempt ${retryCount + 1}:`, {
        model,
        aspectRatio,
        errorMessage: error.message,
        errorStatus: error.status,
        errorCode: error.code,
        errorDetails: error.details,
        fullError: error
      });
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
