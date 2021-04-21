const fs = require('fs').promises;
const { join } = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Cloudworker = require('@dollarshaveclub/cloudworker');

const defaultConfig = {
  ROUTE_TABLE: {},
  SPLASH_ROUTES: [],
  SPLASH_EXCLUDE_STATES: [],
  STATIC_TABLE: {},
};

async function setup(config = {}) {
  try {
    const mergedConfig = {
      ...defaultConfig,
      ...config,
    };

    const configPath = join(__dirname, '../config.json');
    await fs.writeFile(configPath, `${JSON.stringify(mergedConfig, null, 2)}\n`);

    const { stdout, stderror } = await exec('npm run build', { cwd: process.cwd() });
    console.log({ stdout, stderror });

    const script = await fs.readFile(join(__dirname, '../worker/script.js'), 'utf8');
    const worker = new Cloudworker(script);

    return worker;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  return null;
}

module.exports = setup;
