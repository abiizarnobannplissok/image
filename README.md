# 🎨 Nanoo Air - AI Image Generator

Batch image generation powered by Google Gemini AI with Supabase cloud storage.

## ✨ Features

- 🚀 **Batch Generation**: Fire multiple prompts without waiting
- 🎯 **Multiple Models**: Gemini 3 Pro, Gemini 2.5 Flash, Imagen 4 (Fast, Standard, Ultra)
- 📐 **Flexible Aspect Ratios**: 1:1, 3:4, 4:3, 9:16, 16:9
- ☁️ **Cloud Storage**: Auto-upload to Supabase Storage with public URLs
- 💾 **Dual Persistence**: localStorage (fallback) + Supabase (cloud sync)
- 🗑️ **Batch Operations**: Select multiple images to delete
- 🎬 **Veo Integration**: Generate videos from images (coming soon)
- 🔒 **Secure**: Row-level security with Supabase RLS policies

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- [Gemini API Key](https://aistudio.google.com/apikey)
- [Supabase Account](https://supabase.com) (optional, for cloud storage)

### Local Development

1. **Clone repository**
   ```bash
   git clone https://github.com/abiizarnobannplissok/image.git
   cd image
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment** (optional - for Supabase)
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run dev server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:5173
   ```

## 🌐 Deploy to Vercel

Complete deployment guide: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

Quick steps:
1. Setup Supabase (database + storage)
2. Import repo to Vercel
3. Set environment variables
4. Deploy!

## 📦 Project Structure

```
image/
├── components/          # React components
│   ├── GeneratorForm.tsx    # Main generation form
│   ├── ImageGallery.tsx     # Image grid display
│   ├── ImageCard.tsx        # Individual image card
│   └── ...
├── services/           # Backend services
│   ├── geminiService.ts     # Gemini API integration
│   └── supabaseService.ts   # Supabase storage & DB
├── App.tsx             # Main app component
├── types.ts            # TypeScript definitions
└── vite.config.ts      # Vite configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Optional* |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Optional* |

*Without Supabase, images only save to localStorage (not shared across devices)

### Supabase Setup

See **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** for complete instructions:
- Database table schema
- Storage bucket configuration
- RLS (Row Level Security) policies

## 🐛 Troubleshooting

### Images show "Generating..." after refresh

**Check debug logs:**
1. Open browser DevTools (`F12`)
2. Go to Console tab
3. Look for logs starting with 📦 🔍 📸
4. Screenshot and report if issues persist

**Quick fixes:**
- Hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- Clear cache: `localStorage.clear()` in console
- Test in incognito mode

### Supabase upload fails

**Common causes:**
- Missing environment variables
- Bucket not set to public
- RLS policies not configured

**Solution:** Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) carefully

## 📝 How It Works

### Image Generation Flow

```
User Input → Gemini API → Base64 Image → Convert to Blob → Upload to Supabase Storage → Save metadata to DB → Display in UI
```

### Storage Strategy

- **localStorage**: Immediate save (offline-first)
- **Supabase**: Background upload (cloud sync)
- **On Load**: Merge both sources, deduplicate by ID

### Status Tracking

Images have 3 states:
- `pending`: Generation in progress
- `success`: Generated successfully
- `error`: Generation failed

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (utility-first)
- **AI**: Google Gemini API (Imagen, Gemini Pro)
- **Storage**: Supabase (PostgreSQL + Storage)
- **Deployment**: Vercel (recommended)

## 📄 License

MIT

## 🤝 Contributing

PRs welcome! Please follow existing code style.

---

**Built with ❤️ by NanooAir Studio**
