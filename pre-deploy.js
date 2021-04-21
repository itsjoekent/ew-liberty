const fs = require('fs').promises;
const { join } = require('path');

(async function preDeploy() {
  const args = process.argv;
  const packagePath = join(__dirname, './package.json');

  const stage = (args
    .find((arg) => arg.startsWith('stage')) || '')
    .replace('stage=', '');

  const packageText = await fs.readFile(packagePath);
  const packageConfig = JSON.parse(packageText);

  const { version } = packageConfig;
  const [major, minor, patch] = version.split('.');

  let updatedVersion = `${major}.${minor}.${patch}`;

  if (stage === 'production') {
    updatedVersion = `${parseInt(major, 10) + 1}.${minor}.0`;
  }

  if (stage === 'release') {
    updatedVersion = `${major}.${minor}.${parseInt(patch, 10) + 1}`;
  }

  const updatedPackage = {
    ...packageConfig,
    version: updatedVersion,
  };

  await fs.writeFile(packagePath, `${JSON.stringify(updatedPackage, null, 2)}\n`);
}());
