import { ComputerDesktopIcon } from '@heroicons/react/24/outline';

/**
 * DeviceScene — animated mini-UI illustration for the device-code activation
 * page. A floating card shows a segmented device code being entered (one cell
 * pulses, like the active digit), and a desktop/TV chip floats alongside with a
 * green "linked" pulse dot. Hypedrive design language; motion is
 * transform/opacity only and frozen under prefers-reduced-motion.
 */
const codeCells = ['W', 'D', 'J', 'B'] as const;

const DeviceScene = () => (
  <div
    className="relative mx-auto grid h-[148px] w-full max-w-[var(--max-w)] place-items-center select-none"
    aria-hidden="true"
  >
    {/* soft neutral glow behind the card */}
    <div
      className="scene-glow pointer-events-none absolute inset-0 rounded-[44px] blur-[44px]"
      style={{
        background:
          'radial-gradient(circle at 50% 42%, color-mix(in oklab, var(--text-muted) 22%, transparent), transparent 64%)',
      }}
    />

    {/* central card — segmented device code */}
    <div
      className="scene-float relative flex w-[180px] flex-col gap-2.5 rounded-[16px] border border-line p-3"
      style={{
        background: 'var(--card-top), var(--bg-elevated)',
        boxShadow: 'var(--edge), var(--sh-float)',
      }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        Device code
      </div>
      <div className="flex items-center gap-1.5">
        {codeCells.map((cell, index) => (
          <span
            key={cell}
            className={`grid h-8 flex-1 place-items-center rounded-[11px] bg-surface-2 text-[13px] font-bold text-ink tabular-nums${
              index === 2 ? ' scene-pulse' : ''
            }`}
          >
            {cell}
          </span>
        ))}
      </div>
    </div>

    {/* device chip — floats with a green "linked" pulse dot */}
    <span
      className="scene-float absolute right-2 bottom-5 grid size-11 place-items-center rounded-[14px] border border-line text-muted"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--edge), var(--sh-soft)',
        animationDelay: '0.9s',
      }}
    >
      <ComputerDesktopIcon className="size-5" />
      <span
        className="scene-pulse absolute -right-1 -top-1 size-3 rounded-full bg-success"
        style={{ animationDelay: '0.4s' }}
      />
    </span>
  </div>
);

export default DeviceScene;
