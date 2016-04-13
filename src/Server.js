"use strict";

const Rx = require('rx');
const http = require('http');

const server = http.createServer();

module.exports.requestStream = Rx.Observable
  .fromEvent(server, 'request', (req, res) => ({ req, res, start: Date.now() }))
  .tap(o => {
    if (process.env.NODE_ENV === 'development') {
      console.log((new Date()).toString(), '[INFO]', o.req.method, o.req.url);
    }
  })
  .publish()
  .refCount();

module.exports.listen = Rx.Observable
  .fromCallback(server.listen, server);

module.exports.close = Rx.Observable
  .fromCallback(server.close, server);
