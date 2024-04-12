let webpack = require('vortex-api/bin/webpack').default;

module.exports = webpack('api-limit-checker', __dirname, 5);