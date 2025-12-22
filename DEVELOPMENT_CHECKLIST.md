# Development Checklist

> Quick reference checklist for common development tasks

## 🎯 Before Starting Work

- [ ] Pull latest changes from `develop` branch
- [ ] Create a new feature branch: `git checkout -b feature/your-feature`
- [ ] Start dev server: `npm run dev`
- [ ] Verify local environment is working
- [ ] Review relevant documentation

## 🧩 Component Development

### Creating a Component
- [ ] Create component file with proper naming
- [ ] Define TypeScript interface for props
- [ ] Use proper TypeScript types (no `any`)
- [ ] Add className prop with `cn()` utility
- [ ] Make component accessible (ARIA, keyboard nav)
- [ ] Add responsive styles
- [ ] Test component in isolation
- [ ] Test component in context
- [ ] Document component usage (if complex)

### Component Checklist
- [ ] TypeScript types are correct
- [ ] Props are properly typed
- [ ] Component is accessible
- [ ] Responsive design works
- [ ] Dark/light mode works (if applicable)
- [ ] No console errors/warnings
- [ ] Follows project conventions
- [ ] Reusable and composable

## 🎨 Styling

### Styling Checklist
- [ ] Use Tailwind classes primarily
- [ ] Custom styles in appropriate files
- [ ] Responsive breakpoints are correct
- [ ] Colors use design tokens/CSS variables
- [ ] Spacing is consistent
- [ ] Typography follows scale
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Hover/focus states are defined
- [ ] Works in dark/light mode

## 🔧 Functionality

### Feature Development
- [ ] Feature works as expected
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Edge cases are considered
- [ ] User feedback is provided (toasts, etc.)
- [ ] No console errors
- [ ] Performance is acceptable

### State Management
- [ ] Server state uses React Query
- [ ] Local state uses useState/useReducer
- [ ] State is properly typed
- [ ] No unnecessary re-renders
- [ ] Memoization used where appropriate

## 🧪 Testing

### Manual Testing
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (iOS Safari, Chrome)
- [ ] Test on tablet
- [ ] Test keyboard navigation
- [ ] Test with screen reader (if applicable)
- [ ] Test dark/light mode
- [ ] Test with slow network (throttle)
- [ ] Test error scenarios

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint errors/warnings
- [ ] Code follows project conventions
- [ ] No console.logs left in code
- [ ] No commented-out code
- [ ] No unused imports
- [ ] No unused variables

## 📱 Responsive Design

### Breakpoints
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)
- [ ] Large desktop (1280px+)

### Responsive Checklist
- [ ] Layout works on all breakpoints
- [ ] Text is readable on mobile
- [ ] Touch targets are adequate (44px minimum)
- [ ] Images scale appropriately
- [ ] Navigation works on mobile
- [ ] Forms are usable on mobile
- [ ] No horizontal scrolling

## ♿ Accessibility

### Accessibility Checklist
- [ ] Semantic HTML elements used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Alt text for images
- [ ] Form labels are associated
- [ ] Error messages are accessible
- [ ] No keyboard traps

## 🚀 Performance

### Performance Checklist
- [ ] Images are optimized
- [ ] Components are lazy loaded if heavy
- [ ] No unnecessary re-renders
- [ ] Bundle size is reasonable
- [ ] Code splitting is used appropriately
- [ ] Assets are properly cached
- [ ] Loading states are smooth
- [ ] No layout shift (CLS)

## 🔐 Security

### Security Checklist
- [ ] Input validation implemented
- [ ] XSS prevention (sanitization)
- [ ] No sensitive data in client code
- [ ] API keys in environment variables
- [ ] Rate limiting considered
- [ ] CSRF protection (if applicable)

## 📝 Documentation

### Documentation Checklist
- [ ] Code is self-documenting
- [ ] Complex logic has comments
- [ ] Component props are documented (if complex)
- [ ] README updated if needed
- [ ] Changelog updated (if applicable)

## 🎯 Before Committing

### Pre-Commit Checklist
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code is formatted
- [ ] All changes are tested
- [ ] No console.logs
- [ ] No commented code
- [ ] Git status is clean
- [ ] Commit message is clear

### Commit Message Format
```
type: brief description

Longer description if needed
- Bullet point 1
- Bullet point 2
```

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `perf`, `chore`

## 🚢 Before Pushing

### Pre-Push Checklist
- [ ] All commits are ready
- [ ] Branch is up to date with develop
- [ ] No merge conflicts
- [ ] Code review done (self-review)
- [ ] All changes are tested
- [ ] Ready for PR

## 🔍 Code Review (Self-Review)

### Review Checklist
- [ ] Code follows project conventions
- [ ] TypeScript types are correct
- [ ] No obvious bugs
- [ ] Performance is acceptable
- [ ] Accessibility is considered
- [ ] Security is considered
- [ ] Documentation is adequate
- [ ] Tests are included (if applicable)

## 🐛 Bug Fixes

### Bug Fix Checklist
- [ ] Bug is reproducible
- [ ] Root cause is identified
- [ ] Fix is implemented
- [ ] Fix doesn't break other features
- [ ] Tests are added/updated
- [ ] Bug is verified as fixed
- [ ] Similar bugs are checked

## ✨ Feature Completion

### Feature Completion Checklist
- [ ] Feature works as specified
- [ ] All edge cases handled
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] User feedback provided
- [ ] Responsive design works
- [ ] Accessibility requirements met
- [ ] Performance is acceptable
- [ ] Code is reviewed
- [ ] Documentation updated
- [ ] Ready for merge

## 🔄 Refactoring

### Refactoring Checklist
- [ ] Tests exist for code being refactored
- [ ] Refactoring doesn't change behavior
- [ ] Code is more maintainable
- [ ] Performance is same or better
- [ ] All tests still pass
- [ ] Documentation updated

## 📦 Dependency Updates

### Dependency Update Checklist
- [ ] Check changelog for breaking changes
- [ ] Update in development branch first
- [ ] Test thoroughly after update
- [ ] Check for security vulnerabilities
- [ ] Update related code if needed
- [ ] Document any breaking changes

## 🎨 Design Implementation

### Design Checklist
- [ ] Matches design specifications
- [ ] Spacing is accurate
- [ ] Colors are correct
- [ ] Typography matches
- [ ] Animations match
- [ ] Responsive behavior matches
- [ ] Interactive states match
- [ ] Edge cases handled

---

## 📋 Quick Reference

### Common Commands
```bash
# Start dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Preview build
npm run preview
```

### Git Workflow
```bash
# Create branch
git checkout -b feature/name

# Commit
git add .
git commit -m "type: description"

# Push
git push origin feature/name
```

### File Locations
- Components: `src/components/`
- Pages: `src/pages/`
- Utils: `src/utils/`
- Styles: `src/styles/`
- Types: `src/types/` (if exists)

---

**Use this checklist to ensure quality and consistency! ✅**

