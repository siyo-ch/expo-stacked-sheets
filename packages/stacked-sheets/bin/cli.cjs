#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { dirname, join, resolve } = require('node:path');
const { name, version, peerDependencies } = require('../package.json');

function install() {
  const fromApp = createRequire(resolve('package.json'));
  let expoManifest;
  try {
    expoManifest = fromApp.resolve('expo/package.json');
  } catch {
    console.error('Run this command from an Expo app with its dependencies installed.');
    return 1;
  }

  const expoCLI = join(dirname(expoManifest), require(expoManifest).bin.expo);
  const nativePeers = Object.keys(peerDependencies).filter(
    (peer) => peer !== 'react' && peer !== 'react-native',
  );
  const result = spawnSync(
    process.execPath,
    [expoCLI, 'install', `${name}@${version}`, ...nativePeers],
    { stdio: 'inherit' },
  );
  if (result.error) console.error(result.error.message);
  return result.status ?? 1;
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === 'install') {
  process.exitCode = install();
} else {
  console.log('Usage: npx expo-stacked-sheets@latest install');
  const helpRequested = args.length === 1 && ['-h', '--help'].includes(args[0]);
  if (args.length > 0 && !helpRequested) process.exitCode = 1;
}
