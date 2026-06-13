# 🧪 Testing Guide

## Quick Start

เพิ่ม scripts ต่อไปนี้ใน `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Run Tests

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Run with UI (interactive)
npm run test:ui
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts           # Test setup (URL mock, localStorage cleanup)
│   └── utils.tsx           # Custom render, test factories
│
├── store.test.ts           # Unit tests for store functions
├── integration.test.tsx    # Full app integration tests
│
└── components/
    ├── FileUploader.test.tsx
    ├── AIAssistant.test.tsx
    ├── SettingsPanel.test.tsx
    └── MeetingHistory.test.tsx
```

## Test Categories

### Unit Tests (`store.test.ts`)
- ✅ CRUD operations for meetings
- ✅ Settings management
- ✅ API key handling
- ✅ Local summarization
- ✅ Utility functions

### Component Tests
- ✅ FileUploader: File selection, validation, drag & drop
- ✅ AIAssistant: API key, meeting selection, chat flow
- ✅ SettingsPanel: Provider selection, API keys, model settings
- ✅ MeetingHistory: List, search, filter, expand, delete

### Integration Tests (`integration.test.tsx`)
- ✅ Navigation between tabs
- ✅ Full flow: Upload → History → AI
- ✅ Settings persistence
- ✅ Meeting count badge updates
- ✅ Error handling (corrupted localStorage)

## Coverage Goals

| Category | Target |
|----------|--------|
| Statements | > 80% |
| Branches | > 75% |
| Functions | > 80% |
| Lines | > 80% |

## Running Specific Tests

```bash
# Run tests matching pattern
npx vitest store

# Run single file
npx vitest src/store.test.ts

# Run tests with specific name
npx vitest -t "should save meetings"
```

## Debugging Tips

1. **Use `screen.debug()`** to print current DOM
2. **Use `logRoles(container)`** to see available roles
3. **Add `{ timeout: 5000 }` to waitFor** for async operations
4. **Check fetch mocks** if API calls fail
