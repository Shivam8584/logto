/**
 * Runs via Jest's `setupFiles` — i.e. before the test framework and, crucially, before
 * `jest.setup.ts`'s own module imports are evaluated.
 *
 * `ky` v2 references `TextEncoder`/`TextDecoder` at module-load time. The jsdom test environment
 * does not expose them as globals, so they must be polyfilled here — earlier than any import that
 * transitively loads `ky` (e.g. `@logto/schemas`).
 */
// eslint-disable-next-line n/prefer-global/text-encoder, n/prefer-global/text-decoder -- polyfilled here because they run before jsdom globals exist
import { TextEncoder, TextDecoder } from 'node:util';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the DOM lib types globalThis.TextEncoder as always-defined, but at runtime jsdom does not provide it
if (globalThis.TextEncoder === undefined) {
  // `node:util`'s TextEncoder/TextDecoder are structurally compatible with the DOM lib's but
  // not nominally identical, so cast through `unknown` when assigning to the globals.
  // eslint-disable-next-line @silverhand/fp/no-mutation, no-restricted-syntax
  (globalThis as { TextEncoder: unknown }).TextEncoder = TextEncoder;
  // eslint-disable-next-line @silverhand/fp/no-mutation, no-restricted-syntax
  (globalThis as { TextDecoder: unknown }).TextDecoder = TextDecoder;
}
