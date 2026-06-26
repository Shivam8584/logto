import { ShieldCheckIcon, DevicePhoneMobileIcon, KeyIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

/**
 * MfaScene — animated 2-step-verification illustration for the MFA onboarding
 * page. A central shield "breathes", a soft accent glow pulses behind it, and
 * two factor chips (device + key) pop in with a verified check. Hypedrive
 * design language; motion frozen under prefers-reduced-motion.
 */
const MfaScene = () => (
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

    {/* central shield card */}
    <div
      className="scene-breathe relative grid size-[84px] place-items-center rounded-[20px] border border-line"
      style={{
        background: 'var(--card-top), var(--bg-elevated)',
        boxShadow: 'var(--edge), var(--sh-float)',
      }}
    >
      <ShieldCheckIcon className="size-10 text-ink" />
      <span className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-full bg-elevated">
        <CheckCircleIcon
          className="scene-pop size-7 text-success"
          style={{ animationDelay: '0.4s' }}
        />
      </span>
    </div>

    {/* factor chip — device (left, floating) */}
    <span
      className="scene-float absolute left-2 top-6 grid size-11 place-items-center rounded-[14px] border border-line text-muted"
      style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--edge), var(--sh-soft)' }}
    >
      <DevicePhoneMobileIcon className="size-5" />
    </span>

    {/* factor chip — key (right, floating on a different phase) */}
    <span
      className="scene-float absolute right-2 bottom-6 grid size-11 place-items-center rounded-[14px] border border-line text-muted"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--edge), var(--sh-soft)',
        animationDelay: '0.9s',
      }}
    >
      <KeyIcon className="size-5" />
    </span>
  </div>
);

export default MfaScene;
