import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

const tagName = 'logto-icon';

/**
 * LogtoIcon: A custom element for consistent icon rendering
 *
 * It allows configuring the icon size within the shadow DOM using the `--logto-icon-size` CSS variable,
 * which is necessary because external CSS cannot affect styles inside the shadow DOM
 */
@customElement(tagName)
export class LogtoIcon extends LitElement {
  static tagName = tagName;

  static styles = css`
    ::slotted(svg) {
      display: block;
      width: var(--logto-icon-size, 24px);
      height: var(--logto-icon-size, 24px);
    }
  `;

  render() {
    // The icon is purely decorative — the adjacent text (or the host element's own
    // accessible name) conveys the meaning — so hide it from assistive tech.
    return html`<slot aria-hidden="true"></slot>`;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface HTMLElementTagNameMap {
    [tagName]: LogtoIcon;
  }
}
