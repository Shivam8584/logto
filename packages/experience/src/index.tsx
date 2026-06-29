/* eslint-disable-next-line import/no-unassigned-import, unicorn/no-unnecessary-polyfills -- polyfill by design */
import 'core-js/actual';
import { createRoot } from 'react-dom/client';
import ReactModal from 'react-modal';

import App from './App';
// Vite resolves this to the fingerprinted, self-hosted font URL. Preloading the
// above-the-fold latin subset lets the browser start the font fetch before the
// CSS is parsed, cutting the swap flash on first paint (FCP/LCP win).
import geistFontUrl from './assets/fonts/geist-latin-wght-normal.woff2?url';

const fontPreload = document.createElement('link');
// Use setAttribute (a DOM method call) rather than property assignment, to satisfy the
// repo's functional-style lint while still emitting a real <link rel=preload>.
fontPreload.setAttribute('rel', 'preload');
fontPreload.setAttribute('as', 'font');
fontPreload.setAttribute('type', 'font/woff2');
fontPreload.setAttribute('crossorigin', 'anonymous');
fontPreload.setAttribute('href', geistFontUrl);
document.head.append(fontPreload);

const app = document.querySelector('#app');
const root = app && createRoot(app);
ReactModal.setAppElement('#app');
root?.render(<App />);
