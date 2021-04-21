/* global describe, it, before, beforeEach */
/* eslint-disable prefer-arrow-callback, func-names, import/no-unresolved */

const { assert } = require('chai');
const Cloudworker = require('@dollarshaveclub/cloudworker');
const setup = require('./_setup');

let worker = null;

describe('Splash page', function () {
  before(async function () {
    this.timeout(0);

    worker = await setup({
      SPLASH_ROUTES: [
        '/plans/end-washington-corruption',
        '/plans/ultra-millionaire-tax',
      ],
    });
  });

  it('Response with splash page on first request', async function () {
    this.timeout(0);

    const request = new Cloudworker.Request('https://elizabethwarren.com/');
    const response = await worker.dispatch(request);

    assert.equal(response.status, 200);

    const cookies = response.headers.get('set-cookie');
    assert.include(cookies, 'liberty-splash');

    assert.include([
      '/plans/end-washington-corruption',
      '/plans/ultra-millionaire-tax',
    ], response.headers.get('x-liberty-splash'));
  });

  it('No splash page on second request', async function () {
    this.timeout(0);

    const request = new Cloudworker.Request('https://elizabethwarren.com/', {
      headers: { cookie: { 'liberty-splash': '1.0.0' } },
    });

    const response = await worker.dispatch(request);

    assert.equal(response.status, 200);

    const cookies = response.headers.get('set-cookie');
    assert.notInclude(cookies, 'liberty-splash');
  });
});
