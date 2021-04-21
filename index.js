const { version } = require('./package.json');
const _500 = require('./_500');

const LOCATION_COOKIE_NAME = 'liberty-location-v2';
const LOGGING_URI = '...';

const {
  ROUTE_TABLE,
  STATIC_TABLE,
} = require('./config');

/**
 * Add a trailing slash to the given string if it doesn't
 * already end in one.
 *
 * @param {String} input
 * @return {String}
 */
function addTrailingSlash(input) {
  if (input.endsWith('/')) {
    return input;
  }

  return `${input}/`;
}

/**
 * Remove the trailing slash from a string (ignores root slash).
 *
 * @param  {String} input
 * @return {String}
 */
function removeTrailingSlash(input) {
  if (input === '/') {
    return input;
  }

  if (input.endsWith('/')) {
    return input.substring(0, input.length - 1);
  }

  return input;
}

/**
 * Get the normalized host and path from a Request.
 *
 * @param  {Request} request
 * @return {Object}
 */
function getNormalizedHostAndPath(request) {
  const { url } = request;
  const { pathname, hostname } = new URL(url);

  return {
    pathname: removeTrailingSlash(pathname.toLowerCase()),
    hostname: hostname.toLowerCase(),
    originalPathname: pathname,
    originalHostname: hostname,
  };
}

/**
 * Extract the liberty location cookie from the cookie header and
 * attempt to parse it.
 *
 * @param  {String} header Cookie header from the `Request`
 * @param  {String} name The name of the cookie
 * @return {Object|null} Parsed cookie header or null
 */
function parseCookie(header, name, parseJson = true) {
  if (!header) {
    return null;
  }

  const cookies = header.split(';');
  const match = cookies.find((cookie) => cookie.trim().startsWith(name));

  if (!match) {
    return null;
  }

  const value = match.split('=')[1];

  if (!value) {
    return null;
  }

  try {
    if (parseJson) {
      return JSON.parse(decodeURIComponent(value));
    }

    return decodeURIComponent(value);
  } catch (error) {
    return null;
  }
}

/**
 * Check if the given Response has an HTML content type header..
 *
 * @param  {Response}  response
 * @return {Boolean}
 */
function isHtmlResponse(response) {
  return (response.headers.get('content-type') || '').includes('text/html');
}

/**
 * Make a unique identifier to attach to errors and headers.
 *
 * @return {String}
 */
function makeTraceId() {
  const array = new Uint32Array(10);
  crypto.getRandomValues(array);

  return array[0];
}

/**
 * Log an error to our error logging service and attach optional meta information.
 *
 * @param  {Error} error Javascript Error to log.
 *                       Can optionally attach a `traceId` property to the error.
 * @param  {Request} request (Optional) request that generated this error
 * @return {Promise}
 */
async function logError(error, request, hint) {
  try {
    const params = {
      type: 'error',
      timestamp: new Date().toString(),
      cloudflareWorker: true,
      workerVersion: version,
    };

    if (error.traceId) {
      params.traceId = error.traceId;
    }

    if (hint) {
      params.hint = hint;
    }

    if (request && request.url) {
      params.url = request.url;
    }

    params.error = error.stack || error;

    await fetch(`${LOGGING_URI}/?details=${encodeURIComponent(JSON.stringify(params))}`, { method: 'POST' });
  } catch (reportingError) {
    console.error(reportingError);
  }
}

/**
 * Attach custom headers to all outgoing responses.
 * Applies the `X-Liberty-Version` header by default.
 *
 * @param  {Response} response
 * @param  {Array}  [customHeaders=[]] Custom headers to apply
 * @return {Resonse}
 */
function prepareResponse(response, customHeaders = []) {
  const finalResponse = new Response(response.body, response);
  finalResponse.headers.set('X-Liberty-Version', version);

  if (customHeaders) {
    customHeaders.forEach((pair) => finalResponse.headers.set(pair[0], pair[1]));
  }

  return finalResponse;
}

/**
 * Build an Error (5xx) Response.
 *
 * @param  {String} [errorTraceId=null] Error trace ID that generated this error.
 * @return {Response}
 */
async function buildErrorResponse(errorTraceId = null) {
  const customHeaders = [];

  if (errorTraceId) {
    customHeaders.push(['X-Liberty-Error-Trace', errorTraceId]);
  }

  const errorResponse = new Response([_500], { status: 500, headers: { 'content-type': 'text/html' } });
  return prepareResponse(errorResponse, customHeaders);
}

/**
 * Forward a request to the origin server.
 *
 * @param  {Request} request
 * @return {Promise}
 */
async function forwardRequestToOrigin(request) {
  try {
    await fetch(request);
  } catch (error) {
    await logError(error, request, 'forwardRequestToOrigin()');
  }
}

/**
 * Retry fetching a request.
 *
 * @param  {FetchEvent} event
 * @param  {String} path
 * @param  {Object} options
 * @param  {Number} [count=1]
 * @param  {Number} [maxRetry=3]
 * @return {Response}
 */
async function fetchRetry(event, path, options, count = 1, maxRetry = 3) {
  function tryAgainLater() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(fetchRetry(event, path, options, count + 1, maxRetry)), 100 * count);
    });
  }

  try {
    const response = await fetch(path, options);

    if (response.status === 404 || response.status === 403 || response.status < 400) {
      return response;
    }

    throw new Error(`Failed to fetch file in fetchRetry(), status:${response.status}`);
  } catch (error) {
    error.traceId = makeTraceId();
    event.waitUntil(logError(error, null, `fetchRetry() path:${path} count=${count}`));

    if (count >= maxRetry) {
      return buildErrorResponse(error.traceId);
    }

    return tryAgainLater();
  }
}

/**
 * Fetch the static file associated with this Request. Additionally,
 *  - Forward the request to origin in the background to run renreder logic
 *  - Check if this is a redirect
 *  - Serve the proper 404 page
 *  - Fallback to our 5xx page if necessary
 *
 * @param  {FetchEvent} event
 * @param  {Request} request
 * @param  {Array}  [customHeaders=[]]
 * @return {Promise<Response>}
 */
async function fetchStaticFile(event, request, customHeaders = []) {
  try {
    const { pathname, hostname } = getNormalizedHostAndPath(request);

    const staticPath = `${addTrailingSlash(`https://s3.amazonaws.com/cdn.elizabethwarren.com/render/${hostname}${addTrailingSlash(pathname)}`)}index.html`;

    const forwardRequestCopy = request.clone();

    const response = await fetchRetry(event, staticPath, { cf: { cacheKey: `https://${hostname}${pathname}` } });

    event.waitUntil(forwardRequestToOrigin(forwardRequestCopy));

    if (response.status < 400) {
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();

      if (text.indexOf('redirect::') === 0) {
        const redirectTarget = text.replace('redirect::', '');

        if (!redirectTarget) {
          throw new Error('Invalid redirect');
        }

        if (redirectTarget.startsWith('/')) {
          return prepareResponse(
            Response.redirect(`https://${hostname}${redirectTarget}`, 302),
          );
        }

        return prepareResponse(
          Response.redirect(redirectTarget, 302),
        );
      }

      return prepareResponse(response, customHeaders);
    }

    if (response.status === 404 || response.status === 403) {
      // TODO:
      // const notFoundPath = `https://cdn.elizabethwarren.com/render/${hostname}/_404.html`;
      const notFoundPath = 'https://cdn.elizabethwarren.com/404.html';
      const notFoundResponse = await fetch(notFoundPath, request);

      return prepareResponse(notFoundResponse);
    }

    return response;
  } catch (error) {
    error.traceId = makeTraceId();
    event.waitUntil(logError(error, request, 'fetchStaticFile()'));

    return buildErrorResponse(error.traceId);
  }
}

/**
 * Safely pull a value from the location cookie.
 *
 * @param  {Object} cookie
 * @param  {String} key
 * @param  {Mixed} defaultValue
 * @return {Mixed} The value in the cookie if its not undefined or null,
 *                 otherwise the `defaultValue`.
 */
function getLocationCookieValue(cookie, key, defaultValue) {
  if (cookie) {
    const existingValue = cookie[key];

    if (typeof existingValue !== 'undefined' && existingValue !== null) {
      return existingValue;
    }
  }

  return defaultValue;
}

/**
 * Handle incoming request.
 *
 * @param  {FetchEvent} event
 * @return {Response}
 */
async function handleRequest(event) {
  try {
    const { request } = event;
    const { url, cf } = request;

    const { pathname, originalPathname } = getNormalizedHostAndPath(request);

    /**
     * Pathnames that should not interact with custom routing logic.
     */
    if (pathname.startsWith('/wp-assets') || pathname.startsWith('/wp-content')) {
      return fetch(`https://s3.amazonaws.com/ew-wordpress-files${originalPathname}`, request);
    }

    if (pathname.startsWith('/_api')) {
      return fetch(request);
    }

    if (STATIC_TABLE[pathname]) {
      return fetch(STATIC_TABLE[pathname], request);
    }

    const cookies = request.headers.get('cookie');

    if (!cf) {
      const response = await fetchStaticFile(event, request, [
        ['X-Liberty-Debug', 'missing-cf'],
      ]);

      return response;
    }

    const { country } = cf;

    const existingLocationCookie = parseCookie(cookies, LOCATION_COOKIE_NAME);

    const latitude = getLocationCookieValue(existingLocationCookie, 'latitude', cf.latitude);
    const longitude = getLocationCookieValue(existingLocationCookie, 'longitude', cf.longitude);
    const zip = getLocationCookieValue(existingLocationCookie, 'zip', cf.postalCode);
    const stateCode = getLocationCookieValue(existingLocationCookie, 'stateCode', cf.regionCode);
    const city = getLocationCookieValue(existingLocationCookie, 'city', cf.city);
    const disableLiberty = getLocationCookieValue(existingLocationCookie, 'disableLiberty', false);
    const isOverride = getLocationCookieValue(existingLocationCookie, 'isOverride', false);

    if ((country !== 'US' && !isOverride) || !stateCode || disableLiberty) {
      const response = await fetchStaticFile(event, request, [
        ['X-Liberty-Debug', 'disabled'],
      ]);

      return response;
    }

    const customHeaders = [['X-Liberty-State', stateCode]];

    let response = null;
    let libertyRoute = null;

    const geoRoute = ROUTE_TABLE[removeTrailingSlash(pathname)];
    if (!libertyRoute && geoRoute && geoRoute.includes(stateCode)) {
      const geoEncodedUrl = new URL(url);

      geoEncodedUrl.pathname = `${pathname}--${stateCode}`.toLowerCase();
      libertyRoute = geoEncodedUrl.pathname;

      const geoEncodedRequest = new Request(geoEncodedUrl, request);
      response = await fetchStaticFile(event, geoEncodedRequest);
    }

    if (!response) {
      response = await fetchStaticFile(event, request);
    }

    if (isHtmlResponse(response) && !isOverride) {
      const defaultLocationCookie = encodeURIComponent(
        JSON.stringify({
          latitude,
          longitude,
          city,
          zip,
          stateCode,
          disableLiberty,
          isOverride,
        }),
      );

      customHeaders.push(['Set-Cookie', `${LOCATION_COOKIE_NAME}=${defaultLocationCookie}; Max-Age=${60 * 60 * 24 * 365 * 10}; Path=/`]);
    }

    if (isHtmlResponse(response) && libertyRoute) {
      customHeaders.push(['X-Liberty-Route', libertyRoute]);
    }

    return prepareResponse(response, customHeaders);
  } catch (error) {
    error.traceId = makeTraceId();
    event.waitUntil(logError(error, event.request, 'handleRequest()'));

    return buildErrorResponse(error.traceId);
  }
}

// eslint-disable-next-line no-restricted-globals
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});
