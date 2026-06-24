import classNames from 'classnames';
import type { InputHTMLAttributes, Ref } from 'react';
import { forwardRef } from 'react';

import CheckboxIcon from '@/shared/assets/icons/checkbox-icon.svg?react';

export type Props = {
  readonly size?: 'small' | 'default';
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>;

// Check icon show/hide driven by the sibling <input> state (ported from the SCSS
// sibling selectors). The icon SVG has 3 children; child1 = unchecked box,
// child2/child3 = checked marks. All hidden by default; the matching ones are
// revealed based on the input's checked state.
const checkboxClass = [
  'relative inline-flex items-center',
  // icon children hidden by default + per-child colors
  '[&_.icon>*]:hidden',
  '[&_.icon>*:nth-child(1)]:text-muted',
  '[&_.icon>*:nth-child(2)]:text-ink',
  // unchecked, enabled -> show child1
  '[&_input:not(:checked):not(:disabled)~.icon>*:nth-child(1)]:block',
  // checked, enabled -> show child2 + child3
  '[&_input:checked:not(:disabled)~.icon>*:nth-child(2)]:block',
  '[&_input:checked:not(:disabled)~.icon>*:nth-child(3)]:block',
  // hidden native input overlay
  '[&_input]:absolute [&_input]:w-4 [&_input]:h-4 [&_input]:inset-inline-start-0 [&_input]:top-0 [&_input]:m-0 [&_input]:opacity-0',
].join(' ');

const Checkbox = ({ disabled, size = 'default', ...rest }: Props, ref: Ref<HTMLInputElement>) => {
  return (
    <div className={checkboxClass}>
      <input type="checkbox" disabled={disabled} {...rest} ref={ref} readOnly />
      <CheckboxIcon
        className={classNames(
          // mt-px nudges the box to sit on the text baseline; transition smooths the
          // check/border colour change (both from the refined custom CSS).
          'icon me-2 mt-px shrink-0 w-[18px] h-[18px] mobile:w-[18px] mobile:h-[18px] [&_*]:transition-colors [&_*]:duration-150',
          size === 'small' && 'w-4 h-4 mobile:w-[18px] mobile:h-[18px]'
        )}
      />
    </div>
  );
};

export default forwardRef<HTMLInputElement, Props>(Checkbox);
