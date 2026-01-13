# 🔧 Imagen API Error 400 INVALID_ARGUMENT - Panduan Troubleshooting

## Masalah
Error: `{"error": {"code": 400, "message": "Request contains an invalid argument.", "status": "INVALID_ARGUMENT"}}`

Terjadi saat menggunakan model Imagen (imagen-4.0-fast/generate/ultra) dengan prompt "nano banana".

## Kemungkinan Penyebab & Solusi

### 1. **API Key Tidak Memiliki Akses ke Imagen** ⚠️ PALING MUNGKIN

**Imagen models memerlukan allowlist/approval khusus** untuk digunakan di Gemini Developer API.

**Cara Mengecek:**
1. Jalankan test script:
   ```bash
   GEMINI_API_KEY=your_actual_key node test-imagen.mjs
   ```

2. Jika error tetap muncul untuk Imagen tapi Gemini works → API key Anda **tidak memiliki akses Imagen**

**Solusi:**
- **Opsi A:** Gunakan Vertex AI (memerlukan Google Cloud Project)
  ```typescript
  const ai = new GoogleGenAI({
    vertexai: true,
    project: 'your-gcp-project-id',
    location: 'us-central1',
  });
  ```

- **Opsi B:** Request akses Imagen di Google AI Studio
  - Pergi ke https://aistudio.google.com/
  - Check available models
  - Request access jika Imagen belum tersedia

- **Opsi C:** Gunakan model Gemini yang support image generation (RECOMMENDED untuk testing):
  ```typescript
  // Ganti di types.ts dan UI
  model: 'gemini-2.5-flash-image-preview'  // atau 'gemini-3-pro-image-preview'
  ```

### 2. **Versi SDK Lama**

**Status:** ✅ SUDAH DIPERBAIKI (upgraded ke 1.35.0)

Versi @google/genai sudah diupdate dari 1.34.0 → 1.35.0

### 3. **Struktur Parameter Salah**

**Status:** ✅ SUDAH DIPERBAIKI

Kode sudah menggunakan struktur yang benar:
```typescript
const response = await ai.models.generateImages({
  model: model,  // 'imagen-4.0-fast-generate-001'
  prompt: prompt,
  config: {
    numberOfImages: 1,
    aspectRatio: aspectRatio,  // '1:1', '3:4', '4:3', '9:16', '16:9'
  },
});
```

### 4. **Format Aspect Ratio Salah**

**Status:** ✅ SUDAH BENAR

Format yang digunakan (`'1:1' | '3:4' | '4:3' | '9:16' | '16:9'`) sudah sesuai dokumentasi.

## Testing

### Manual Test:
```bash
# Set API key
export GEMINI_API_KEY="your_actual_api_key_here"

# Run test
node test-imagen.mjs
```

### Expected Output (jika API key tidak punya akses Imagen):
```
❌ Error with imagen-4.0-fast-generate-001:
Status: 400
Message: Request contains an invalid argument.
```

### Expected Output (jika API key PUNYA akses Imagen):
```
✅ Success with imagen-4.0-fast-generate-001
Generated images: 1
```

## Rekomendasi Aksi

**LANGKAH 1:** Jalankan `test-imagen.mjs` untuk konfirmasi masalah

**LANGKAH 2a:** Jika error 400 pada Imagen:
- Gunakan model Gemini alternatif: `gemini-2.5-flash-image-preview`
- ATAU setup Vertex AI
- ATAU request Imagen access di AI Studio

**LANGKAH 2b:** Jika sukses:
- Lanjutkan menggunakan Imagen
- Report hasil di issue/PR

## URLs Berguna

- Gemini API Imagen Docs: https://ai.google.dev/gemini-api/docs/imagen
- Google AI Studio: https://aistudio.google.com/
- Vertex AI Setup: https://cloud.google.com/vertex-ai/docs/start/cloud-environment
- SDK Docs: https://googleapis.github.io/js-genai/

## File Yang Sudah Dimodifikasi

1. ✅ `services/geminiService.ts` - Updated generateWithImagen function
2. ✅ `package.json` - Updated @google/genai to 1.35.0
3. ✅ `test-imagen.mjs` - Created for debugging

## Next Steps

Setelah mengidentifikasi root cause:
1. Update konfigurasi sesuai akses API yang tersedia
2. Test dengan berbagai model
3. Update UI untuk disable model yang tidak tersedia
4. Add error handling yang lebih informatif

---

**Last Updated:** $(date)
**Status:** Menunggu hasil testing dengan API key aktual
