# Local Development Guide

> Quick reference for working on the website redesign in your local environment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (or Bun)
- Git
- Code editor (VS Code recommended)
- Supabase account (for backend features)

### Initial Setup

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd suphian.com

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your local Supabase credentials

# Start development server
npm run dev
# or
bun run dev
```

The site will be available at `http://localhost:8080`

## 🛠 Development Commands

### Basic Commands
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

### Recommended Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Make changes** - Files are watched and hot-reloaded automatically

4. **Test your changes** - Check in browser, test different screen sizes

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

6. **Push to remote**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🎯 Development Tips

### Hot Module Replacement (HMR)
- Vite automatically reloads changes
- Component state is preserved when possible
- If HMR doesn't work, do a full page refresh

### Staging Indicator
- The site shows a "STAGING" banner when not in production
- Production domains: `suphian.com`, `www.suphian.com`
- All other domains show the staging indicator

### Component Development
- Components are in `src/components/`
- UI components are in `src/components/ui/`
- Section components are in `src/components/sections/`
- Use TypeScript for all new components

### Styling
- Use Tailwind CSS classes primarily
- Custom styles go in `src/styles/`
- Use CSS variables for theming (defined in `src/index.css`)

### State Management
- Server state: Use React Query (`@tanstack/react-query`)
- Local UI state: Use `useState` or `useReducer`
- Global UI state: Consider Zustand if needed (not currently used)

## 🔍 Debugging

### Browser DevTools
- React DevTools: Install browser extension
- Network tab: Check API calls
- Console: Check for errors/warnings

### Vite DevTools
- Open browser console
- Look for Vite-specific messages
- Check Network tab for HMR updates

### TypeScript Errors
- Check terminal for TypeScript errors
- VS Code shows errors inline
- Run `npm run lint` to check code quality

### Common Issues

**Port already in use**
```bash
# Kill process on port 8080 (Windows)
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Or change port in vite.config.ts
```

**Module not found**
- Clear `node_modules` and reinstall
- Check import paths (use `@/` alias)
- Restart dev server

**HMR not working**
- Hard refresh (Ctrl+Shift+R)
- Clear browser cache
- Restart dev server

## 📁 Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # Base UI components (Shadcn)
│   ├── sections/     # Page sections
│   └── ...           # Other components
├── pages/            # Route pages
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
│   ├── analytics/    # Analytics utilities
│   ├── security/     # Security utilities
│   └── validation/   # Validation utilities
├── lib/              # Library configurations
├── styles/           # Global styles
└── data/             # Static data
```

## 🎨 Component Development

### Creating a New Component

1. **Create component file**
   ```typescript
   // src/components/MyComponent.tsx
   import { cn } from "@/lib/utils";
   
   interface MyComponentProps {
     className?: string;
     // other props
   }
   
   export default function MyComponent({ className, ...props }: MyComponentProps) {
     return (
       <div className={cn("base-styles", className)}>
         {/* component content */}
       </div>
     );
   }
   ```

2. **Use TypeScript**
   - Define prop interfaces
   - Use proper types
   - Avoid `any` types

3. **Follow naming conventions**
   - PascalCase for components
   - camelCase for functions/variables
   - kebab-case for files (optional, but consistent)

4. **Add to appropriate location**
   - UI components → `components/ui/`
   - Section components → `components/sections/`
   - Page-specific → `components/`

## 🧪 Testing Locally

### Manual Testing Checklist
- [ ] Test on different screen sizes (mobile, tablet, desktop)
- [ ] Test dark/light mode (if applicable)
- [ ] Test keyboard navigation
- [ ] Test with JavaScript disabled (progressive enhancement)
- [ ] Check browser console for errors
- [ ] Test all interactive elements
- [ ] Verify accessibility (screen reader, keyboard)

### Browser Testing
- Chrome/Edge (Chromium)
- Firefox
- Safari (if on Mac)
- Mobile browsers (Chrome, Safari)

## 🔐 Environment Variables

### Required Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Optional Variables
```env
VITE_ENVIRONMENT=development
VITE_ENABLE_DEBUG=true
VITE_API_URL=your_api_url
```

### Security Note
- Never commit `.env.local` to git
- Add to `.gitignore`
- Use `.env.example` for documentation

## 📦 Dependencies

### Adding New Dependencies
```bash
# Production dependency
npm install package-name

# Development dependency
npm install -D package-name
```

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update specific package
npm install package-name@latest

# Update all (be careful!)
npm update
```

## 🚢 Building for Production

### Local Production Build
```bash
# Build
npm run build

# Preview build locally
npm run preview
```

### Build Output
- Production build goes to `dist/`
- Optimized and minified
- Ready for deployment

### Before Deploying
- [ ] Test production build locally
- [ ] Check bundle size
- [ ] Verify all features work
- [ ] Test performance
- [ ] Check for console errors

## 🐛 Troubleshooting

### Dev Server Won't Start
1. Check if port 8080 is available
2. Verify Node.js version (18+)
3. Clear `node_modules` and reinstall
4. Check for syntax errors in config files

### Changes Not Reflecting
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Restart dev server
4. Check if file is being watched

### TypeScript Errors
1. Check `tsconfig.json` settings
2. Verify import paths
3. Check for type mismatches
4. Restart TypeScript server in VS Code

### Styling Issues
1. Check Tailwind classes are correct
2. Verify CSS is being imported
3. Check for conflicting styles
4. Inspect element in browser

## 📚 Useful Resources

### Documentation
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [TypeScript](https://www.typescriptlang.org/docs)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

## 💡 Best Practices

### Code Quality
- Write TypeScript, not JavaScript
- Use meaningful variable names
- Keep components small and focused
- Extract reusable logic to hooks/utils
- Comment complex logic

### Performance
- Use React.memo for expensive components
- Lazy load heavy components
- Optimize images before adding
- Use code splitting for routes

### Accessibility
- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers

### Git Workflow
- Write clear commit messages
- Commit often, push regularly
- Use feature branches
- Review code before committing

---

**Happy coding! 🚀**

*For questions or issues, refer to the main strategy document or create an issue.*

