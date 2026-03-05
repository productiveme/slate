# Agent Guide for Slate

## Build & Development Commands
- `bun run dev` - Start development server at http://localhost:3000
- `bun run build` - Build for production
- `bun install` - Install dependencies
- No test/lint commands configured in package.json

## Tech Stack
- Vue 3 + Nuxt 4 with SSR, TipTap editor, Tailwind CSS
- Supabase (auth/storage), OpenAI (AI features), localforage (IndexedDB)
- Uses `bun` as package manager

## Code Style
- **TypeScript**: Explicit types for interfaces, function params/returns (see composables/useStorage.ts, server/api/*.ts)
- **Imports**: Framework imports from `#imports` (Nuxt convention), then external deps, then local files (components/composables/utils)
- **Components**: Vue SFC, setup script (not `<script setup lang="ts">`), ref/computed from Vue, emit/props via defineProps/defineEmits
- **Server**: Use Nuxt server utilities (`defineEventHandler`, `readBody`, `createError`), explicit types for request/response
- **Naming**: camelCase for functions/vars, PascalCase for components, SCREAMING_SNAKE_CASE for constants
- **Error Handling**: Try-catch blocks, console.error for logging, throw createError in server routes
- **Functions**: JSDoc comments for utility functions (see server/utils/formats.ts)
- **No Comments**: Do not add code comments unless explicitly requested
