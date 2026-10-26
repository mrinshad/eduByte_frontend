# Testing Rules & Browser Preferences

## Browser & Playwright Testing
- **Headless Mode Disabled**: Always set `{ headless: false }` when launching browsers with Playwright or Chromium for automated testing in this workspace, so tests execute visibly.
- Optional: Use a modest `slowMo` (e.g. 50–100ms) to ensure actions are visually observable on screen.
