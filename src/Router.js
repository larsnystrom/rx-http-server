"use strict";

const Rx = require('rx');
const Server = require('./Server');

const getNotFound = sendClosure(404, 'Not found');
const headNotFound = sendClosure(404);
const notAllowed = sendClosure(405, 'Method not allowed');

const Resources = [
  {
    key: undefined,
    cond: o => true,
    methods: {
      GET: getNotFound,
      HEAD: headNotFound,
    },
  }
];

function sendClosure(status, message) {
  return function send(o) {
    o.res.writeHead(status, { 'Content-Type': 'text/plain' });
    o.res.end(message);
  }
}

function logError(err) {
  console.error((new Date()).toString(), '[ERROR]', err.stack);
}

function getRoute(key, method) {
  const route = Resources.find(r => r.key === key);

  if (route.methods.hasOwnProperty(method)) {
    return route.methods[method];
  } else {
    return notAllowed;
  }
}

function groupByResource(o) {
  return Resources.find(r => r.cond(o)).key;
}

function groupByMethod(o) {
  return o.req.method;
}

const groupedRequestStream = Server.requestStream
  .groupBy(groupByResource);

const requestSubscription = groupedRequestStream
  .subscribe(resourceRequestStream => {
    const resourceId = resourceRequestStream.key;

    resourceRequestStream
      .groupBy(groupByMethod)
      .subscribe(
        resourceMethodRequestStream => resourceMethodRequestStream.subscribe(
          getRoute(resourceId, resourceMethodRequestStream.key),
          logError
        )
      );
  });

module.exports.addRoute = function addRoute(route) {
  if (process.env.NODE_ENV !== 'production') {
    const methods = Object.keys(route.methods);

    // "The methods GET and HEAD MUST be supported by all general-purpose servers." [1]
    //
    // [1] https://tools.ietf.org/html/rfc2616#section-5.1.1
    if (!methods.find(m => m === 'GET') || !methods.find(m => m === 'HEAD')) {
      throw new Error('All routes must support both GET and HEAD');
    }
  }

  Resources.unshift(route);
}
