"use strict";

const Rx = require('rx');
const http = require('http');

const server = http.createServer();

module.exports.requestStream = Rx.Observable
  .fromEvent(server, 'request', (req, res) => ({ req, res }));

module.exports.listen = Rx.Observable
  .fromCallback(server.listen, server);

module.exports.close = Rx.Observable
  .fromCallback(server.close, server);
