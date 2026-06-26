import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * ErrorScene — a small animated mini-UI illustration for empty / error states.
 *
 * Replaces the old flat stock "browser with X" graphic with a Hypedrive-style
 * scene: a floating card with a search glyph that gently scans, a soft accent
 * glow behind it, and a "no results" row that breathes. All motion is
 * transform/opacity only and frozen under prefers-reduced-motion.
 */
const ErrorScene = () => (
  <div
    className="relative grid h-[148px] w-[148px] place-items-center select-none"
    aria-hidden="true"
  >
    {/* soft glow behind the card */}
    <div
      className="scene-glow pointer-events-none absolute inset-0 rounded-[44px] blur-[40px]"
      style={{
        background:
          'radial-gradient(circle at 50% 40%, color-mix(in oklab, var(--text-muted) 22%, transparent), transparent 65%)',
      }}
    />

    {/* floating card */}
    <div
      className="scene-float relative flex w-[124px] flex-col gap-2 rounded-[16px] border border-line p-3"
      style={{
        background: 'var(--card-top), var(--bg-elevated)',
        boxShadow: 'var(--edge), var(--sh-float)',
      }}
    >
      {/* search header */}
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-[11px] bg-surface-2 text-muted">
          <MagnifyingGlassIcon className="size-4" />
        </span>
        <div className="flex-1">
          <div className="h-2 w-full rounded-full bg-surface-2" />
          <div className="mt-1.5 h-2 w-2/3 rounded-full bg-surface-2" />
        </div>
      </div>

      {/* "no results" rows — fade in/out */}
      <div className="mt-0.5 space-y-1.5">
        <div className="scene-pulse h-2.5 w-full rounded-full bg-surface" />
        <div
          className="scene-pulse h-2.5 w-5/6 rounded-full bg-surface"
          style={{ animationDelay: '0.4s' }}
        />
        <div
          className="scene-pulse h-2.5 w-3/4 rounded-full bg-surface"
          style={{ animationDelay: '0.8s' }}
        />
      </div>
    </div>

    {/* floating accent dot */}
    <span
      className="scene-pop absolute -right-1 -top-1 size-3 rounded-full bg-amber"
      style={{ animationDelay: '0.3s' }}
    />
  </div>
);

export default ErrorScene;
