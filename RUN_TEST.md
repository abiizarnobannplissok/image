# Test Script untuk Debug Gemini Image

Jalankan test ini dengan API key Anda:

```bash
export GEMINI_API_KEY="your_actual_api_key_here"
node test-all-variations.mjs
```

Script ini akan test 6 variasi berbeda untuk menemukan konfigurasi yang benar.

## Yang Akan Ditest:

1. `responseModalities: ['TEXT', 'IMAGE']` + `imageConfig`
2. `responseModalities: ['IMAGE']` only
3. `responseModalities: ['TEXT', 'IMAGE']` WITHOUT `imageConfig`
4. Using `generationConfig` instead of `config`
5. Minimal config (no responseModalities, no imageConfig)
6. gemini-3-pro-image-preview untuk comparison

## Expected Output:

Salah satu variasi harus SUCCESS dengan output:
```
✅ SUCCESS with Variation X!
Parts: 1
```

Jika semua FAILED, share full error message untuk analisis lebih lanjut.
