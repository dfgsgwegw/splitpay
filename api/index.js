'use strict';
const app = require('../artifacts/api-server/src/app').default;
module.exports = (req, res) => app(req, res);
