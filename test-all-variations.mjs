import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

async function testAllVariations() {
  console.log('Testing ALL variations for Gemini 2.5 Flash Image Preview...\n');
  
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const prompt = 'A nano banana - tiny microscopic banana';
  
  // Variation 1: responseModalities: ['TEXT', 'IMAGE'] with imageConfig
  try {
    console.log('1. Testing: responseModalities: [\'TEXT\', \'IMAGE\'] + imageConfig');
    const response1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: [{ text: prompt }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
        }
      },
    });
    console.log('✅ SUCCESS with Variation 1!');
    console.log('Parts:', response1.candidates?.[0]?.content?.parts?.length);
  } catch (error) {
    console.log('❌ FAILED Variation 1');
    console.log('   Error:', error.message);
  }
  
  // Variation 2: responseModalities: ['IMAGE'] only
  try {
    console.log('\n2. Testing: responseModalities: [\'IMAGE\'] only');
    const response2 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
        }
      },
    });
    console.log('✅ SUCCESS with Variation 2!');
  } catch (error) {
    console.log('❌ FAILED Variation 2');
    console.log('   Error:', error.message);
  }
  
  // Variation 3: WITHOUT imageConfig
  try {
    console.log('\n3. Testing: responseModalities WITHOUT imageConfig');
    const response3 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    console.log('✅ SUCCESS with Variation 3!');
  } catch (error) {
    console.log('❌ FAILED Variation 3');
    console.log('   Error:', error.message);
  }
  
  // Variation 4: Using generationConfig instead of config
  try {
    console.log('\n4. Testing: generationConfig instead of config');
    const response4 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: prompt,
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    console.log('✅ SUCCESS with Variation 4!');
  } catch (error) {
    console.log('❌ FAILED Variation 4');
    console.log('   Error:', error.message);
  }
  
  // Variation 5: Just contents as string, minimal config
  try {
    console.log('\n5. Testing: Minimal - just prompt string');
    const response5 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: prompt,
    });
    console.log('✅ SUCCESS with Variation 5 (minimal)!');
    console.log('Parts:', response5.candidates?.[0]?.content?.parts?.length);
    for (const part of response5.candidates[0].content.parts) {
      if (part.inlineData) {
        console.log('   - Found IMAGE in response!');
      }
      if (part.text) {
        console.log('   - Found TEXT in response!');
      }
    }
  } catch (error) {
    console.log('❌ FAILED Variation 5');
    console.log('   Error:', error.message);
  }
  
  // Variation 6: Try gemini-3-pro-image-preview for comparison
  try {
    console.log('\n6. Testing: gemini-3-pro-image-preview (for comparison)');
    const response6 = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
        }
      },
    });
    console.log('✅ SUCCESS with gemini-3-pro-image-preview!');
  } catch (error) {
    console.log('❌ FAILED gemini-3-pro-image-preview');
    console.log('   Error:', error.message);
  }
}

testAllVariations().catch(console.error);
