import { Component, type ReactNode } from 'react';

// Records WHEN we last force-reloaded for a chunk failure. We only treat a failure
// as a non-recoverable loop if the previous reload was very recent (i.e. reloading
// did NOT fix it). A failure long after the last reload is a fresh deploy and should
// be recovered with another reload — so the guard must not latch for the whole session.
const reloadAtKey = 'logto:chunk-reload-at';
// If a fresh failure lands within this window of the last reload, reloading clearly
// didn't help — stop and show the fallback instead of looping.
const loopWindowMs = 10_000;

type Props = {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
};

type State = {
  readonly hasError: boolean;
};

/**
 * Heuristic: is this error a failed dynamic `import()` of a route chunk (vs a normal
 * render/runtime error)? We only force a reload for the former — reloading a
 * deterministic render crash would just loop crash→reload→crash. Browsers/bundlers
 * surface chunk failures with a distinct name or message, so match on those.
 */
const isChunkLoadError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'ChunkLoadError' ||
    /loading chunk|loading css chunk|dynamically imported module|failed to fetch dynamically imported|importing a module script failed/i.test(
      error.message
    )
  );
};

/**
 * Error boundary for lazily-loaded route chunks.
 *
 * After a deploy, the hashed chunk filenames change. A user holding an old, cached
 * `index.html` can request a chunk URL that no longer exists, and the dynamic
 * `import()` rejects — which would otherwise white-screen the whole app. We catch
 * ONLY that case and force a hard reload to fetch the fresh `index.html` + chunk map.
 * If the failure recurs immediately after a reload (or the error is a generic render
 * crash, not a chunk failure), we render the static fallback instead of looping.
 */
class ChunkLoadBoundary extends Component<Props, State> {
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  state: State = { hasError: false };

  componentDidCatch(error: Error) {
    if (!isChunkLoadError(error)) {
      // Generic render error — never reload (would loop); just show the fallback.
      return;
    }

    const lastReloadAt = Number(sessionStorage.getItem(reloadAtKey) ?? 0);
    const reloadedRecently = lastReloadAt > 0 && Date.now() - lastReloadAt < loopWindowMs;

    // Only suppress the reload if we *just* reloaded and it still failed (a real loop).
    if (!reloadedRecently) {
      sessionStorage.setItem(reloadAtKey, String(Date.now()));
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default ChunkLoadBoundary;
