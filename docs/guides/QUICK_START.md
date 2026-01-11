# Quick Start Guide

> Get started with local development in 5 minutes

## 🚀 Setup Steps

### 1. Install Dependencies
```bash
npm install
# or
bun install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Environment
VITE_ENVIRONMENT=development
VITE_ENABLE_DEBUG=false
```

**Note**: Currently, Supabase credentials are hardcoded in `src/integrations/supabase/client.ts`. For local development, you can either:
- Use the existing hardcoded values (for quick start)
- Update the client.ts to use environment variables (recommended for better flexibility)

### 3. Start Development Server
```bash
npm run dev
```

The site will be available at `http://localhost:8080`

## 📋 Available Commands

### Development
- `npm run dev` - Start dev server
- `npm run dev:open` - Start dev server and open browser
- `npm run dev:host` - Start dev server accessible on network

### Building
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run build:analyze` - Build with bundle analysis

### Quality
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues automatically

### Preview
- `npm run preview` - Preview production build
- `npm run preview:local` - Preview on port 8080

## 🎯 Next Steps

1. **Read the Strategy**: Check out `REDESIGN_STRATEGY.md` for the full plan
2. **Development Guide**: See `LOCAL_DEVELOPMENT.md` for detailed workflow
3. **Checklist**: Use `DEVELOPMENT_CHECKLIST.md` when working on features

## 💡 Tips

- The site shows a "STAGING" banner when not in production
- Hot reload is enabled - changes appear instantly
- Use React DevTools for debugging
- Check browser console for any errors

## 🐛 Troubleshooting

**Port 8080 in use?**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Dependencies issues?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors?**
- Check `tsconfig.json` settings
- Restart TypeScript server in VS Code (Ctrl+Shift+P → "TypeScript: Restart TS Server")

---

**Ready to start? Run `npm run dev` and begin iterating! 🎨**

