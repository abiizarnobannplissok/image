import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

async function testCorrectModel() {
  console.log('Testing with CORRECT model names...\n');
  
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // Test 1: gemini-2.5-flash-image (GA - CORRECT)
  try {
    console.log('1. Testing gemini-2.5-flash-image (GA - WITHOUT preview)...');
    const response1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: 'A nano banana',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    console.log('✅ SUCCESS with gemini-2.5-flash-image!');
    console.log('   Parts:', response1.candidates?.[0]?.content?.parts?.length);
    
    let foundImage = false;
    for (const part of response1.candidates[0].content.parts) {
      if (part.inlineData) {
        foundImage = true;
        console.log('   ✅ Image data found!');
      }
    }
    if (!foundImage) console.log('   ⚠️  No image data');
    
  } catch (error) {
    console.log('❌ FAILED gemini-2.5-flash-image');
    console.log('   Status:', error.status);
    console.log('   Message:', error.message);
  }
  
  // Test 2: gemini-2.5-flash-image-preview (RETIRED - WRONG)
  try {
    console.log('\n2. Testing gemini-2.5-flash-image-preview (RETIRED - with -preview)...');
    const response2 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: 'A nano banana',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    console.log('✅ SUCCESS with gemini-2.5-flash-image-preview (unexpected!)');
    
  } catch (error) {
    console.log('❌ FAILED gemini-2.5-flash-image-preview (expected)');
    console.log('   Status:', error.status);
    console.log('   Message:', error.message);
    console.log('   → This is EXPECTED because -preview is retired');
  }
  
  // Test 3: gemini-3-pro-image-preview (for comparison)
  try {
    console.log('\n3. Testing gemini-3-pro-image-preview (for comparison)...');
    const response3 = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: 'A nano banana',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    console.log('✅ SUCCESS with gemini-3-pro-image-preview!');
    
  } catch (error) {
    console.log('❌ FAILED gemini-3-pro-image-preview');
    console.log('   Message:', error.message);
  }
}

testCorrectModel().catch(console.error);
