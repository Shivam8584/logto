import { FingerPrintIcon, KeyIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

/**
 * PasskeyScene — animated illustration for the passkey (WebAuthn) setup page. A
 * central card "breathes" around a fingerprint glyph, a verified check pops in
 * at its corner, and two factor chips (key + device) float on staggered phases.
 * Hypedrive design language; motion frozen under prefers-reduced-motion.
 */
const PasskeyScene = () => (
  <div
    className="relative mx-auto grid h-[156px] w-full max-w-[var(--max-w)] place-items-center select-none"
    aria-hidden="true"
  >
    {/* glow */}
    <div
      className="scene-glow pointer-events-none absolute inset-0 rounded-[44px] blur-[44px]"
      style={{
        background:
          'radial-gradient(circle at 50% 42%, color-mix(in oklab, var(--success) 24%, transparent), transparent 64%)',
      }}
    />

    {/* central fingerprint card */}
    <div
      className="scene-breathe relative grid size-[84px] place-items-center rounded-[20px] border border-line"
      style={{
        background: 'var(--card-top), var(--bg-elevated)',
        boxShadow: 'var(--edge), var(--sh-float)',
      }}
    >
      <FingerPrintIcon className="size-10 text-ink" />
      <span className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-full bg-elevated">
        <CheckCircleIcon
          className="scene-pop size-7 text-success"
          style={{ animationDelay: '0.4s' }}
        />
      </span>
    </div>

    {/* factor chip — key (left, floating) */}
    <span
      className="scene-float absolute left-2 top-6 grid size-11 place-items-center rounded-[14px] border border-line text-muted"
      style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--edge), var(--sh-soft)' }}
    >
      <KeyIcon className="size-5" />
    </span>

    {/* factor chip — device (right, floating on a different phase) */}
    <span
      className="scene-float absolute right-2 bottom-6 grid size-11 place-items-center rounded-[14px] border border-line text-muted"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--edge), var(--sh-soft)',
        animationDelay: '0.9s',
      }}
    >
      <DevicePhoneMobileIcon className="size-5" />
    </span>
  </div>
);

export default PasskeyScene;
