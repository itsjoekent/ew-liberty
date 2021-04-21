/**
 * Define geo-location routes.
 */
const ROUTE_TABLE = {
  '/': ['IA', 'NH', 'NV', 'SC', 'AL', 'AR', 'CA', 'CO', 'ME', 'MA', 'MN', 'NC', 'OK', 'TN', 'TX', 'UT', 'VT', 'VA'],
  '/es/inicio': ['IA'],
  '/pledge': ['IA'],
  '/comprometete': ['IA'],
};

/**
 * List of state codes to exclude from the splash page.
 *
 * @type {Array<String>}
 */
const SPLASH_EXCLUDE_STATES = [
  'SC',
];

/**
 * Static root paths to override routing logic.
 */
const STATIC_TABLE = {
  '/google38ca7a096f6126b6.html': 'https://cdn.elizabethwarren.com/_public/google38ca7a096f6126b6.html',
  '/ozk3ab5xvr8qe02s6k3m732zzkdkld.html': 'https://cdn.elizabethwarren.com/_public/ozk3ab5xvr8qe02s6k3m732zzkdkld.html',
};

module.exports = {
  ROUTE_TABLE,
  SPLASH_EXCLUDE_STATES,
  STATIC_TABLE,
};
