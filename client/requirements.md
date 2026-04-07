## Packages
framer-motion | For complex animations and page transitions
lucide-react | Beautiful icons
clsx | Utility for conditional class names
tailwind-merge | Utility for merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["'DM Sans'", "sans-serif"],
  display: ["'Outfit'", "sans-serif"],
  mono: ["'JetBrains Mono'", "monospace"],
}

API Integration:
- Uses @shared/routes for API contracts
- Auth via useAuth hook
- Generations API for creating and listing tasks
