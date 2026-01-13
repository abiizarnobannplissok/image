import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

async function testGeminiImage() {
  console.log('Testing Gemini 2.5 Flash Image Preview...');
  console.log('API Key:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 10) + '...' : 'NOT_SET');
  
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // Test 1: Basic image generation
  try {
    console.log('\n1. Testing basic image generation with gemini-2.5-flash-image-preview...');
    const response1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: 'A nano banana - a tiny microscopic banana under a microscope',
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
        }
      },
    });
    
    console.log('✅ Success!');
    console.log('Response parts:', response1.candidates?.[0]?.content?.parts?.length || 0);
    
    // Check if we got image data
    let foundImage = false;
    for (const part of response1.candidates[0].content.parts) {
      if (part.inlineData) {
        foundImage = true;
        const dataLength = part.inlineData.data?.length || 0;
        console.log('  - Image data found! Size:', Math.round(dataLength / 1024), 'KB');
        console.log('  - MIME type:', part.inlineData.mimeType);
      }
    }
    
    if (!foundImage) {
      console.log('⚠️  No image data in response parts');
      console.log('Response:', JSON.stringify(response1, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error with gemini-2.5-flash-image-preview:');
    console.error('Status:', error.status || 'N/A');
    console.error('Message:', error.message);
    if (error.errorDetails) {
      console.error('Details:', JSON.stringify(error.errorDetails, null, 2));
    }
  }
  
  // Test 2: Different aspect ratio
  try {
    console.log('\n2. Testing with different aspect ratio (16:9)...');
    const response2 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: 'A beautiful sunset over the ocean',
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '16:9',
        }
      },
    });
    
    console.log('✅ Success with 16:9 aspect ratio!');
    
  } catch (error) {
    console.error('❌ Error with aspect ratio 16:9:');
    console.error('Message:', error.message);
  }
  
  // Test 3: Test gemini-3-pro-image-preview as alternative
  try {
    console.log('\n3. Testing alternative: gemini-3-pro-image-preview...');
    const response3 = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: 'A red apple on a white table',
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
        }
      },
    });
    
    console.log('✅ Success with gemini-3-pro-image-preview!');
    
  } catch (error) {
    console.error('❌ Error with gemini-3-pro-image-preview:');
    console.error('Message:', error.message);
  }
}

testGeminiImage().catch(console.error);
