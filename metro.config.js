const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Set maxWorkers to 0 to run Metro in the main process (avoiding spawn EPERM on Windows)
config.maxWorkers = 0;

module.exports = config;
