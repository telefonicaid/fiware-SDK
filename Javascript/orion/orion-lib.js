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

var NgsiParser = {
  parse: function(jsonChunk) {
    var ngsiData = jsonChunk;
    if (typeof jsonChunk === 'string') {
      ngsiData = JSON.parse(jsonChunk);
    }

    var responses = ngsiData.contextResponses;
    var statusCode = Array.isArray(responses) &&
                          responses[0].statusCode.code;
    if (ngsiData.errorCode || statusCode != 200) {
      return {
        inError: true,
        errorCode: ngsiData.errorCode || statusCode
      };
    }

    return this._toObject(responses[0].contextElement);
  },

  stringify: function(object) {
    return JSON.stringify({
      contextElements: [this.toNgsiObject(object)]
    });
  },

  // Converts an object to a NGSI Object
  toNgsiObject: function(object) {
    var out = {
      isPattern: false
    };

    var keys = Object.keys(object);
    keys.forEach(function(aKey) {
      var mapped = PROPERTY_MAP[aKey];

      if (mapped) {
        out[mapped] = object[aKey];
        return;
      }

      out.attributes = out.attributes || [];

      out.attributes.push({
        name: aKey,
        value: object[aKey],
        type: TYPE_MAP[typeof object[aKey]]
      });
    });

    return out;
  },

  _toObject: function(contextElement) {
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
};

function OrionClient(options) {
  this.options = options;
  this.url = options.url;
}

function updateContext(contextData, options) {
  /*jshint validthis:true */
  var self = this;

  return new Promise(function(resolve, reject) {
    var contentData = {
      contextElements: [
        NgsiParser.toNgsiObject(contextData)
      ],
      updateAction: 'APPEND'
    };

    Request({
      method: 'POST',
      url: self.url + '/updateContext',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': self.options.userAgent || 'Orion-Client-Library'
      },
      body: contentData,
      json: true,
      timeout: options && options.timeout || self.options.timeout
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
        var ngsiResponse = NgsiParser.parse(body);
        if (ngsiResponse.inError) {
          reject(ngsiResponse.errorCode);
          return;
        }
        resolve(contextData);
    });
  });
}

function queryContext(queryParameters, options) {
  /*jshint validthis:true */
  var self = this;

  return new Promise(function(resolve, reject) {
    var apiData = {
      entities: [
        NgsiParser.toNgsiObject(queryParameters)
      ]
    };

    Request({
      method: 'POST',
      url: self.url + '/queryContext',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': self.options.userAgent || 'Orion-Client-Library'
      },
      body: apiData,
      json: true,
      timeout: options && options.timeout || self.options.timeout
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

        var parsed = NgsiParser.parse(body);

        if (parsed.inError) {
          reject(parsed.errorCode);
          return;
        }
        resolve(parsed);
    });
  });
}

OrionClient.prototype = {
  updateContext: updateContext,
  queryContext: queryContext
};

exports.Client = OrionClient;
exports.NgsiParser = NgsiParser;
