/**
 * Runs via Jest's `setupFiles` — i.e. before the test framework and, crucially, before
 * `jest.setup.ts`'s own module imports are evaluated.
 *
 * `ky` v2 references `TextEncoder`/`TextDecoder` at module-load time. The jsdom test environment
 * does not expose them as globals, so they must be polyfilled here — earlier than any import that
 * transitively loads `ky` (e.g. `@logto/schemas`).
 */
import { TextEncoder, TextDecoder } from 'node:util';

if (typeof globalThis.TextEncoder === 'undefined') {
  // `node:util`'s TextEncoder/TextDecoder are structurally compatible with the DOM lib's but
  // not nominally identical, so cast through `unknown` when assigning to the globals.
  // eslint-disable-next-line @silverhand/fp/no-mutation, @typescript-eslint/no-unsafe-member-access, no-restricted-syntax
  (globalThis as { TextEncoder: unknown }).TextEncoder = TextEncoder;
  // eslint-disable-next-line @silverhand/fp/no-mutation, @typescript-eslint/no-unsafe-member-access, no-restricted-syntax
  (globalThis as { TextDecoder: unknown }).TextDecoder = TextDecoder;
}
