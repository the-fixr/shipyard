# Fixr - Builder's Front Page

A Farcaster mini app for token analysis and builder showcase.

## Features

- **Token Analysis**: Get security scores for any token address
- **Builder Discovery**: View trending builders shipping on Farcaster
- **Shipped Projects**: Browse recently launched projects with mini app detection
- **Rug Alerts**: Stay informed about detected rug pulls
- **Project Submission**: Submit your own projects for showcase

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Configuration

Create a `.env.local` file:

```env
NEXT_PUBLIC_APP_URL=https://your-deployed-url.vercel.app
NEXT_PUBLIC_FIXR_API_URL=https://fixr-agent.[accountName].workers.dev
```

## Deployment

1. Deploy to Vercel:
   ```bash
   npx vercel
   ```

2. After deployment, update `NEXT_PUBLIC_APP_URL` in your environment variables

3. Add frame preview images to `/public/images/`:
   - `frame-preview.png` (1200x630px) - Preview image for frame embed
   - `splash.png` (512x512px) - Splash screen logo

## Project Structure

```
fixr-mini-app/
├── app/
│   ├── components/
│   │   ├── Demo.tsx        # Main app component
│   │   └── ClientPage.tsx  # Client wrapper
│   ├── lib/
│   │   └── api.ts          # Fixr API utilities
│   ├── types/
│   │   └── frame.ts        # Farcaster SDK types
│   ├── layout.tsx          # App layout with frame metadata
│   ├── page.tsx            # Entry point
│   └── globals.css         # Global styles
├── public/
│   └── images/             # Frame preview images
└── package.json
```

## API Integration

The mini app connects to the Fixr worker API for:
- `/api/token/analyze` - Token security analysis
- `/api/builders/trending` - Trending builders
- `/api/builders/feed` - Builder feed with shipped projects
- `/api/rugs` - Recent rug incidents
- `/api/projects/submit` - Project submission

## License

MIT
