# HTTP & HTTPS Compatibility Guide

## Build Info
- **Hash:** _O85Yzp2
- **Size:** 490.50 KB
- **Date:** Dec 22, 2025

## Features by Protocol

### ✅ HTTPS Mode (Full Features)
1. **Copy Image Button**
   - Direct copy to clipboard as image blob
   - Icon: Copy symbol → Checkmark (2s)
   - Works with Ctrl+V to paste anywhere

2. **Paste Image**
   - Ctrl+V works globally
   - "Paste From Clipboard" button available
   - Preview with Enter to upload

3. **Drag & Drop**
   - Drag generated cards to reference slots
   - Visual feedback during drag

### ⚠️ HTTP Mode (Limited but Functional)
1. **Copy Image Button**
   - Opens image in new tab
   - Icon: External link → Checkmark (2s)
   - Tooltip: "Open Image (Right-click to Copy)"
   - User can right-click → Copy Image from new tab

2. **Paste Image**
   - Ctrl+V works in paste area (contentEditable)
   - "Paste From Clipboard" button shows helpful alert
   - Preview with Enter to upload still works
   - Alert explains: "Direct clipboard access requires HTTPS"

3. **Drag & Drop**
   - Fully functional (no HTTPS required)
   - Drag generated cards to reference slots
   - Best method for HTTP users

4. **HTTP Mode Banner**
   - Yellow info banner at top of form
   - Explains available features:
     - ✅ Paste works: Click paste area + Ctrl+V
     - ✅ Drag & Drop cards works
     - ⚠️ Direct clipboard button disabled

## Testing Guide

### HTTP (e.g., http://192.168.x.x:3000)
1. Generate image
2. Hover card → Click "Open Image" button
3. New tab opens → Right-click → Copy Image
4. Go back → Click paste area → Ctrl+V → Enter
5. OR: Drag card directly to reference slot

### HTTPS (Production)
1. Generate image
2. Hover card → Click "Copy Image" button
3. See green checkmark feedback
4. Click paste area → Ctrl+V → Enter
5. OR: Drag card directly to reference slot

## API Summary

### Clipboard API Support
| Feature | HTTPS | HTTP |
|---------|-------|------|
| `navigator.clipboard.write()` | ✅ | ❌ |
| `navigator.clipboard.read()` | ✅ | ❌ |
| `event.clipboardData.items` | ✅ | ✅ |
| contentEditable paste | ✅ | ✅ |
| Drag & Drop API | ✅ | ✅ |

### Workarounds for HTTP
1. **Copy:** Open in new tab → Right-click copy
2. **Paste:** Click contentEditable area → Ctrl+V
3. **Transfer:** Drag & drop (recommended)

## User Messages

### HTTP Alert (Clipboard Button)
```
Direct clipboard access requires HTTPS.

✅ You can still paste images:
• Click the paste area and press Ctrl+V (or Cmd+V)
• Or drag & drop generated cards directly to slots
• Or use file upload buttons
```

### HTTP Banner
```
HTTP MODE - Limited Clipboard Features
✅ Paste works: Click paste area + Ctrl+V | 
✅ Drag & Drop cards works | 
⚠️ Direct clipboard button disabled
```

## Recommendations

For best experience:
1. **Development/Testing:** HTTP works fine with drag & drop + manual paste
2. **Production:** Deploy to HTTPS for full clipboard features
3. **Hybrid:** Use drag & drop as primary method (works everywhere)

