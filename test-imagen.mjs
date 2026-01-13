import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

async function testImagen() {
  console.log('Testing Imagen API...');
  console.log('API Key:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 10) + '...' : 'NOT_SET');
  
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  try {
    console.log('\n1. Testing with imagen-4.0-fast-generate-001...');
    const response1 = await ai.models.generateImages({
      model: 'imagen-4.0-fast-generate-001',
      prompt: 'A red apple on a white table',
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
      },
    });
    console.log('✅ Success with imagen-4.0-fast-generate-001');
    console.log('Generated images:', response1.generatedImages?.length || 0);
  } catch (error) {
    console.error('❌ Error with imagen-4.0-fast-generate-001:');
    console.error('Status:', error.status || 'N/A');
    console.error('Message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
  
  try {
    console.log('\n2. Testing with imagen-4.0-generate-001...');
    const response2 = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: 'A red apple on a white table',
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
      },
    });
    console.log('✅ Success with imagen-4.0-generate-001');
    console.log('Generated images:', response2.generatedImages?.length || 0);
  } catch (error) {
    console.error('❌ Error with imagen-4.0-generate-001:');
    console.error('Status:', error.status || 'N/A');
    console.error('Message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
  
  try {
    console.log('\n3. Testing Gemini model for comparison...');
    const response3 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: 'A red apple on a white table',
      config: {
        responseModalities: ['image'],
      },
    });
    console.log('✅ Success with gemini-2.5-flash-image-preview');
  } catch (error) {
    console.error('❌ Error with gemini-2.5-flash-image-preview:');
    console.error('Status:', error.status || 'N/A');
    console.error('Message:', error.message);
  }
}

testImagen().catch(console.error);
