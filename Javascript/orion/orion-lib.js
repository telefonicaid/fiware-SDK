/**
 *
 *  FIWARE-sdk: Orion Context Broker Client Library and Utilities
 *
 *  var Orion = require('fiware-orion-client'),
 *     OrionClient = new Orion.Client({
 *        url: ORION_SERVER
 *     });
 *
 *  Copyright (c) 2015 Telefónica Investigación y Desarrollo S.A.U.
 *
 *  LICENSE: MIT (See LICENSE file)
 *
 */

'use strict';

var Request = require('request');

var NgsiHelper = require('./ngsi-helper.js').NgsiHelper;
var Attribute = require('./ngsi-helper.js').Attribute;

var RequestFactory = {
  launch: function(params) {
    return new Promise(function(resolve, reject) {
      RequestFactory._createNodeRequest(params, resolve, reject);
    });
  },

  _createNodeRequest: function(params, resolve, reject) {
    Request(params, function(error, response, body) {
      if (error) {
        reject(error);
        return;
      }
      if (response.statusCode !== 200) {
        reject({
          name: 'HTTPError: ' + response.statusCode
        });
        return;
      }

      resolve(body);
    });
  }
};

function post(params) {
  params.method = 'POST';
  return RequestFactory.launch(params);
}

function OrionClient(options) {
  this.options = options;
  this.url = options.url;
}

function updateContext(contextData, options) {
  /*jshint validthis:true */
  var self = this;

  return new Promise(function(resolve, reject) {
    var headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': self.options.userAgent || 'Orion-Client-Library'
    };
    
    var params = extractServicePath(contextData, options);
    if (params.id) {
      contextData.id = params.id;
    }
    if (params.servicePath) {
      headers['Fiware-ServicePath'] = params.servicePath;
    }

    var requestData = NgsiHelper.buildUpdate(contextData);

    post({
      url: self.url + '/updateContext',
      headers: headers,
      body: requestData,
      json: true,
      timeout: options && options.timeout || self.options.timeout
    }).then(resolve.bind(null, contextData), reject);
  });
}

function queryContext(queryParameters, options) {
  /*jshint validthis:true */
  var self = this;

  return new Promise(function(resolve, reject) {
    var headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': self.options.userAgent || 'Orion-Client-Library'
    };

    var params = extractServicePath(queryParameters, options);
    if (params.id) {
      queryParameters.id = params.id;
    }
    if (params.servicePath) {
      headers['Fiware-ServicePath'] = params.servicePath;
    }

    var apiData = NgsiHelper.buildQuery(queryParameters);

    post({
      url: self.url + '/queryContext',
      headers: headers,
      body: apiData,
      json: true,
      timeout: options && options.timeout || self.options.timeout
    }).then(function(body) {
        var parsed = NgsiHelper.parse(body);

        if (parsed && parsed.inError) {
          reject(parsed.errorCode);
          return;
        }
        if (queryParameters.pattern && !parsed) {
          parsed = [];
        }
        resolve(parsed);
    }, reject);
  });
}

function subscribeContext(entity, subscriptionParams, options) {
  /*jshint validthis:true */
  var self = this;

  return new Promise(function(resolve, reject) {
    var subscription = NgsiHelper.buildSubscription(entity,
                                                    subscriptionParams);
    post({
      url: self.url + '/subscribeContext',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': self.options.userAgent || 'Orion-Client-Library'
      },
      body: subscription,
      json: true,
      timeout: options && options.timeout || self.options.timeout
    }).then(function(body) {
        if (body.subscribeError) {
          reject(body.subscribeError.errorCode);
        }
        else {
          resolve(body.subscribeResponse);
        }
    }, reject);
  });
}

function extractServicePath(params, options) {
  var id = params && params.id;
  var path = options && options.path;

  var out = {
    id: id,
    servicePath: path
  };

  if (id && id.startsWith('/')) {
    var lastSlash = id.lastIndexOf('/');
    out.servicePath = id.substring(0, lastSlash);
    out.id = id.substring(lastSlash + 1);
  }

  return out;
}

OrionClient.prototype = {
  updateContext: updateContext,
  queryContext: queryContext,
  subscribeContext: subscribeContext
};

exports.Client = OrionClient;
exports.NgsiHelper = NgsiHelper;
exports.Attribute = Attribute;
