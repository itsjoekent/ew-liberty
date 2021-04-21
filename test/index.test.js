/* global before */

const fs = require('fs').promises;
const { join } = require('path');

before(async () => {
  const configPath = join(__dirname, '../config.js');
  await fs.unlink(configPath);
});
