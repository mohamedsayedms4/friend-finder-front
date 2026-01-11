/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers.
 */

/***************************************************************************************************
 * GLOBAL POLYFILLS
 * IMPORTANT: must be defined BEFORE any other imports
 **************************************************************************************************/
/***************************************************************************************************
 * GLOBAL POLYFILLS
 * IMPORTANT: must be defined BEFORE any other imports
 **************************************************************************************************/
declare var require: any;

(window as any).global = window;
(window as any).process = (window as any).process || { env: {} };

// Buffer polyfill (use require to guarantee execution order)
(window as any).Buffer = (window as any).Buffer || require('buffer').Buffer;

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/** IE10 and IE11 requires the following for NgClass support on SVG elements */
// import 'classlist.js';

/**
 * Web Animations
 * Only required if AnimationBuilder is used within the application and using IE/Edge or Safari.
 */
// import 'web-animations-js';

/**
 * Zone.js flags (optional)
 * import './zone-flags';
 */

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js/dist/zone';  // Included with Angular CLI.

/***************************************************************************************************
 * APPLICATION IMPORTS
 */
