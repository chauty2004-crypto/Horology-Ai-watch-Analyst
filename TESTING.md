# Testing Guide for Horology AI

## Setup

The testing infrastructure has been set up with **Vitest** and **React Testing Library**.

### Dependencies Added

```json
{
  "devDependencies": {
    "vitest": "^3.0.0",
    "@vitest/ui": "^3.0.0",
    "@testing-library/react": "^15.0.7",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^24.0.0"
  }
}
```

## Running Tests

### Install Dependencies First

```bash
npm install
```

### Run Tests in Watch Mode

```bash
npm run test
```

This will run all `*.test.ts` and `*.test.tsx` files and watch for changes.

### Run Tests Once

```bash
npm run test:run
```

Use this for CI/CD pipelines or one-time verification.

### View Test UI Dashboard

```bash
npm run test:ui
```

Opens an interactive UI dashboard showing all tests and their results.

## Test Files Structure

### Unit Tests

- **`types.test.ts`** - Tests for TypeScript type definitions and data models
  - WatchIdentity validation
  - MarketData structure
  - AppraisalReport format
  - AppState enum

### Component Tests

- **`components/Spinner.test.tsx`** - Tests for the Spinner component
- Add more component tests as needed following this pattern

## Writing New Tests

### Example Unit Test

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Example Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeTruthy();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Updated Text')).toBeTruthy();
  });
});
```

## Test Coverage

Currently covered:
- ✅ Type definitions and data models
- ✅ Component rendering

To add coverage for:
- API integration tests (geminiService.ts)
- State management
- User interactions
- Error handling

## Debugging Tests

### Using console.log in Tests

```typescript
it('should work', () => {
  const data = processData();
  console.log('[test] data:', data); // Will show in test output
  expect(data).toBeTruthy();
});
```

### View Detailed Test Output

```bash
npm run test -- --reporter=verbose
```

## Configuration

### Vitest Config (`vitest.config.ts`)

- **Environment**: jsdom (for DOM testing)
- **Globals**: true (no need to import describe, it, expect)
- **CSS**: true (handles CSS imports in components)

## Best Practices

1. **Test Behavior, Not Implementation** - Test what users see and do
2. **Use Descriptive Names** - `should render error message when API fails`
3. **Keep Tests Focused** - One assertion per test when possible
4. **Avoid Mocking Extensively** - Test real component behavior first
5. **Mock External APIs** - For geminiService and external API calls

## Next Steps

1. Add integration tests for geminiService
2. Add E2E tests with Playwright for full user workflows
3. Set up CI/CD pipeline to run tests on push
4. Aim for >80% code coverage

## Troubleshooting

### Tests Not Found

Ensure files end with `.test.ts` or `.test.tsx`

### Module Import Errors

Check that `vitest.config.ts` path aliases match `tsconfig.json`

### Environment Variables

Set up `.env.test` for test-specific environment variables (e.g., mock API keys)

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://testing-library.com/docs/queries/about)
