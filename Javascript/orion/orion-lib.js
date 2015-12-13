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
var XmlBuilder = require('./ngsi-helper.js').XmlBuilder;

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

  if (!contextData) {
    return Promise.resolve();
  }

  return new Promise(function(resolve, reject) {
    var params = extractServicePath(contextData, options);
    if (params.id) {
      contextData.id = params.id;
    }

    var requestData = NgsiHelper.buildUpdate(contextData,
                                  options && options.updateAction || 'APPEND');

    post({
      url: self.url + '/updateContext',
      headers: fillHeaders(self.options, params.servicePath),
      body: requestData,
      json: true,
      timeout: options && options.timeout || self.options.timeout
    }).then(function(body) {
        var parsed = NgsiHelper.parse(body);
        if (!parsed) {
          reject(404);
        }

        if (parsed && parsed.inError) {
          reject(parsed.errorCode);
          return;
        }

        resolve(contextData);
    }, reject).catch (function(err) {
      reject(err);
    });
  });
}

function deleteContext(contextData, options) {
  var theOptions = options || Object.create(null);
  theOptions.updateAction = 'DELETE';
  return this.updateContext(contextData, theOptions);
}

function queryContext(queryParameters, options) {
  /*jshint validthis:true */
  var self = this;

  if (!queryParameters) {
    return Promise.resolve(null);
  }

  var parseOptions = {};
  if (options && options.GeoJSON) {
    parseOptions.GeoJSON = true;
  }

  return new Promise(function(resolve, reject) {
    var params = extractServicePath(queryParameters, options);
    if (params.id) {
      queryParameters.id = params.id;
    }

    var apiData = NgsiHelper.buildQuery(queryParameters, options);
    
    var url = self.url + '/queryContext';
    if (options) {
      if (options.limit || options.offset) {
        url += '?';
      }
    
      if (options.limit) {
        url += 'limit' + '=' + options.limit;
      }
      if (options.offset) {
        url += 'offset' + '=' + options.offset;
      }
    }

    post({
      url: url,
      headers: fillHeaders(self.options, params.servicePath),
      body: apiData,
      json: true,
      timeout: options && options.timeout || self.options.timeout
    }).then(function(body) {
        var parsed = NgsiHelper.parse(body, parseOptions);

        if (parsed && parsed.inError) {
          reject(parsed.errorCode);
          return;
        }
        if (queryParameters.pattern && !parsed) {
          parsed = [];
        }
        resolve(parsed);
    }, reject).catch (function(err) {
      reject(err);
    });
  });
}

function subscribeContext(entity, subscriptionParams, options) {
  /*jshint validthis:true */
  var self = this;

  return new Promise(function(resolve, reject) {
    var params = extractServicePath(entity, options);
    if (params.id) {
      entity.id = params.id;
    }

    var subscription = NgsiHelper.buildSubscription(entity,
                                                    subscriptionParams);
    var resource = 'subscribeContext';
    // If subscription Id already exists then entities and reference are
    // removed
    if (subscription.subscriptionId) {
      resource = 'updateContextSubscription';

      if (subscription.entities) {
        delete subscription.entities;
      }
      if (subscription.reference) {
        delete subscription.reference;
      }
    }

    post({
      url: self.url + '/' + resource,
      headers: fillHeaders(self.options, params.servicePath),
      body: subscription,
      json: true,
      timeout: options && options.timeout || self.options.timeout
    }).then(function(body) {
        if (body.subscribeError || body.orionError) {
          var errorCode = (body.subscribeError &&
                            body.subscribeError.errorCode) ||
                          (body.orionError && body.orionError.code);
          reject(errorCode);
        }
        else {
          resolve(body.subscribeResponse);
        }
    }, reject).catch (function(err) {
      reject(err);
    });
  });
}

function registerContext(entity, registrationParams, options) {
  /*jshint validthis:true */
  var self = this;

  if (!registrationParams || (!registrationParams.providingApplication &&
        !registrationParams.callback)) {
    return Promise.reject('No provider provided');
  }

  return new Promise(function(resolve, reject) {
    var params = extractServicePath(entity, options);
    if (params.id) {
      entity.id = params.id;
    }
    var registration = NgsiHelper.buildRegistration(entity, registrationParams);

     post({
      url: self.url + '/registry/registerContext',
      headers: fillHeaders(self.options, params.servicePath),
      body: registration,
      json: true,
      timeout: options && options.timeout || self.options.timeout
    }).then(function(body) {
        if (body.registerError || body.orionError || body.errorCode) {
          var errorCode = (body.errorCode) ||
                          (body.registerError) ||
                          (body.orionError);
          reject(errorCode);
        }
        else {
          resolve(body);
        }
    }, reject).catch (function(err) {
      reject(err);
    });
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

function fillHeaders(options, servicePath) {
  var headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': options && options.userAgent || 'Orion-Client-Library'
  };

  if (options && options.service) {
    headers['Fiware-Service'] = options.service;
  }

  if (options && options.token) {
    headers['X-Auth-Token'] = options.token;
  }

  if (servicePath) {
    headers['Fiware-ServicePath'] = servicePath;
  }

  return headers;
}

OrionClient.prototype = {
  updateContext: updateContext,
  queryContext: queryContext,
  deleteContext: deleteContext,
  subscribeContext: subscribeContext,
  registerContext: registerContext
};

exports.Client = OrionClient;
exports.NgsiHelper = NgsiHelper;
exports.Attribute = Attribute;
exports.XmlBuilder = XmlBuilder;
