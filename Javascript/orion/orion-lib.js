/**
 *
 *  Orion Context Broker Client Library
 *
 *  Copyright (c) 2015 Telefónica I+D
 *
 *  You can freely modify and use this software
 *
 * var Orion = require('./orion-lib'),
 *     OrionClient = new Orion.Client({
 *        url: ORION_SERVER
 *     });
 *
 */

'use strict';

var Request = require('request');

const PROPERTY_MAP = {
  'type': 'type',
  'id' : 'id'
};

const TYPE_MAP = {
  'string': 'string',
  'number': 'float'
};

function OrionClient(options) {
  this.options = options;
  this.url = options.url;
}

function updateContext(contextData) {
  /*jshint validthis:true */
  var self = this;

  return new Promise(function(resolve, reject) {
    var apiContextData = {
      isPattern: false,
      attributes: []
    };

    var keys = Object.keys(contextData);
    var attrList = apiContextData.attributes;
    keys.forEach(function(aKey) {
      var mapped = PROPERTY_MAP[aKey];

      if (mapped) {
        apiContextData[mapped] = contextData[aKey];
        return;
      }

      attrList.push({
        name: aKey,
        value: contextData[aKey],
        type: TYPE_MAP[typeof contextData[aKey]]
      });
    });

    var contentData = {
      contextElements: [
        apiContextData
      ],
      updateAction: 'APPEND'
    };

    Request({
      method: 'POST',
      url: self.url + '/updateContext',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: contentData,
      json: true
    }, function(error, response, body) {
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
        var responses = body.contextResponses;
        var statusCode = Array.isArray(responses) &&
                          responses[0].statusCode.code;
        if (body.errorCode || statusCode != 200) {
          reject(body.errorCode || statusCode);
          return;
        }

        resolve(contextData);
    });
  });
}

function queryContext(queryOptions) {
  /*jshint validthis:true */
  var self = this;

  return new Promise(function(resolve, reject) {
    var apiData = {
      entities: []
    };

    var entity = Object.create(queryOptions);
    entity.isPattern = false;

    var keys = Object.keys(queryOptions);
    keys.forEach(function(aKey) {
      var mapped = PROPERTY_MAP[aKey];

      if (mapped) {
        entity[mapped] = queryOptions[aKey];
      }
    });

    apiData.entities.push(entity);

    Request({
      method: 'POST',
      url: self.url + '/queryContext',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: apiData,
      json: true
    }, function(error, response, body) {
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
        var responses = body.contextResponses;
        var statusCode = Array.isArray(responses) &&
                          responses[0].statusCode.code;
        if (body.errorCode || statusCode != 200) {
          reject(body.errorCode || statusCode);
          return;
        }

        resolve(toObject(responses[0].contextElement));
    });
  });
}

function toObject(contextElement) {
  var out = Object.create(null);

  out.type = contextElement.type;
  out.id = contextElement.id;

  contextElement.attributes.forEach(function(aAttr) {
    var value = aAttr.value;
    if (aAttr.type !== 'string') {
      value = Number(aAttr.value);
    }
    out[aAttr.name] = value;
  });

  return out;
}

OrionClient.prototype = {
  updateContext: updateContext,
  queryContext: queryContext
};

exports.Client = OrionClient;
