/**
 *
 *  FIWARE-sdk: Orion Context Broker Client Library and Utilities
 *
 *  var Orion = require('fiware-orion-client'),
 *     OrionHelper = Orion.NgsiHelper;
 *
 * This library is intended to work both in Web Browsers and Node
 *
 *  Copyright (c) 2015 Telefónica Investigación y Desarrollo S.A.U.
 *
 *  LICENSE: MIT (See LICENSE file)
 *
 */

'use strict';

const PROPERTY_MAP = {
    'type': 'type',
    'id' : 'id'
  };

const EXT_PROPERTY_MAP = {
  'attributes': 'attributes',
  'pattern': 'pattern'
};

const TYPE_MAP = {
  'string': 'string',
  'number': 'float'
};

function Attribute(value, metadata) {
  this.value = value;
  this.metadata = metadata;
}

var NgsiHelper = {
  parse: function(jsonChunk) {
    var self = this;

    var ngsiData = jsonChunk;
    if (typeof jsonChunk === 'string') {
      ngsiData = JSON.parse(jsonChunk);
    }

    var responses = ngsiData.contextResponses;
    // In this case the response has not been wrapped around contextReponses
    if (!responses && !ngsiData.errorCode && !ngsiData.attributes) {
      responses = [ngsiData];
    }
    if (ngsiData.attributes) {
      responses = [{
        contextElement: {
          attributes: ngsiData.attributes
        }
      }];
    }

    var statusCode = (ngsiData.errorCode && ngsiData.errorCode.code) ||
                      (ngsiData.statusCode && ngsiData.statusCode.code) ||
                    (Array.isArray(responses) && responses[0].statusCode.code);
    if (statusCode != 200) {
      if (statusCode == 404) {
        return null;
      }
      return {
        inError: true,
        errorCode: statusCode
      };
    }

    if (responses.length === 1) {
      return this._toObject(responses[0].contextElement);
    }
    else {
      var out = [];
      responses.forEach(function(aResponse) {
        out.push(self._toObject(aResponse.contextElement));
      });

      return out;
    }
  },

  toNgsi: function(contextData) {
    var ctxElements = Array.isArray(contextData) ?
                                                  contextData : [contextData];
    var ngsiElements = [];
    ctxElements.forEach(function(aElement) {
      ngsiElements.push(NgsiHelper.toNgsiObject(aElement));
    });

    return {
      contextElements: ngsiElements
    };
  },

  // Converts an object to a NGSI Object
  toNgsiObject: function(object) {
    var self = this;

    if (!object) {
      return null;
    }

    var out = {
      isPattern: object.pattern ? true : false,
      id: object.pattern
    };

    var keys = Object.keys(object);
    keys.forEach(function(aKey) {
      var mapped = PROPERTY_MAP[aKey];
      var extProperty = EXT_PROPERTY_MAP[aKey];

      if (mapped && !extProperty) {
        out[mapped] = object[aKey];
        return;
      }

      if (extProperty) {
        return;
      }

      out.attributes = out.attributes || [];
      var attributeData = {
        name: aKey,
        value: self._getAttrValue(object[aKey]),
        type: TYPE_MAP[typeof object[aKey]]
      };

      // Now dealing with metadata (if present)
      var metadata = object[aKey].metadata;
      if (metadata) {
        attributeData.metadatas = [];
        for (var p in metadata) {
          var metaValue = metadata[p];
           attributeData.metadatas.push({
            name: p,
            value: metaValue,
            type: TYPE_MAP[metaValue]
          });
        }
      }
      out.attributes.push(attributeData);
    });

    return out;
  },

  _getAttrValue: function(attrValue) {
    if (attrValue instanceof Attribute) {
      return attrValue.value;
    }

    return attrValue;
  },

  _toValue: function(ngsiAttr) {
    return ngsiAttr.type !== 'string' && ngsiAttr.type !== 'object' ?
                    Number(ngsiAttr.value) : ngsiAttr.value;
  },

  _attrList2Obj: function(attrList) {
    var self = this;

    var out = Object.create(null);

    if (Array.isArray(attrList)) {
      attrList.forEach(function(aAttr) {
        var value = self._toValue(aAttr);

        if (Array.isArray(aAttr.metadatas)) {
          var metaObj = Object.create(null);
          aAttr.metadatas.forEach(function(aMeta) {
            metaObj[aMeta.name] = self._toValue(aMeta);
          });
          // If the attribute has metadata, then the value is a compound one
          // represented by the Attribute object
          value = new Attribute(value, metaObj);
        }

        out[aAttr.name] = value;
      });
    }

    return out;
  },

  _toObject: function(contextElement) {
    if (!contextElement) {
      return null;
    }

    var out = this._attrList2Obj(contextElement.attributes);
    out.type = contextElement.type;
    out.id = contextElement.id;

    return out;
  },

  buildSubscription: function(entity, subscriptionParams) {
    var entities = Array.isArray(entity) ? entity : [entity];

    var subscription = {
      entities: [],
      attributes: []
    };

    var entityList = subscription.entities;
    var attrList = subscription.attributes;

    entities.forEach(function(aEntity) {
      if (Array.isArray(aEntity.attributes)) {
        subscription.notifyConditions = [];

        aEntity.attributes.forEach(function(aAttr) {
          subscription.notifyConditions.push({
            type: 'ONCHANGE',
            condValues: aAttr
          });
          attrList.push(aAttr);
        });
      }

      delete aEntity.attributes;
      entityList.push(NgsiHelper.toNgsiObject(aEntity));
    });

    if (Array.isArray(subscriptionParams.attributes)) {
      subscription.notifyConditions = subscription.notifyConditions || [];

      subscriptionParams.attributes.forEach(function(aAttr) {
        subscription.notifyConditions.push({
          type: 'ONCHANGE',
          condValues: aAttr
        });
        attrList.push(aAttr);
      });
    }

    for (var option in subscriptionParams) {
      if (option === 'attributes') {
        continue;
      }

      if (option === 'callback') {
        subscription.reference = subscriptionParams.callback;
        continue;
      }
      subscription[option] = subscriptionParams[option];
    }

    return subscription;
  },

  buildRegistration: function(entity, registrationParams) {
    var entities = Array.isArray(entity) ? entity : [entity];

    var registration = {
      contextRegistrations: []
    };

    entities.forEach(function(aEntity) {
      var aRegistration = {
        entities: [],
        attributes: [],
        providingApplication: aEntity.callback || registrationParams.callback
      };
      var entityList = aRegistration.entities;
      var attrList = aRegistration.attributes;

      if (Array.isArray(aEntity.attributes)) {
        aEntity.attributes.forEach(function(aAttr) {
          attrList.push(NgsiHelper._toAttr(aAttr));
        })
        delete aEntity.attributes;
      }
      entityList.push(NgsiHelper.toNgsiObject(aEntity));
      registration.contextRegistrations.push(aRegistration);
      
      // We are not checking for attribute duplicity
      if (Array.isArray(registrationParams.attributes)) {
        registrationParams.attributes.forEach(function(aAttr) {
          attrList.push(NgsiHelper._toAttr(aAttr));
        });
      }
    });

    for (var option in registrationParams) {
      if (option === 'providingApplication' || option === 'attributes' ||
          option === 'callback') {
        continue;
      }
      registration[option] = registrationParams[option];
    }

    return registration;
  },

  _toAttr: function(attrData) {
    if (typeof attrData === 'string') {
      return {
        name: attrData,
        type: 'string',
        isDomain: false
      }
    }
    
    attrData.isDomain = false;
    return attrData;
  },

  buildUpdate: function(contextData) {
    var request = this.toNgsi(contextData);
    request.updateAction = 'APPEND';

    return request;
  },

  buildQuery: function(queryParameters) {
    return {
      entities: [
        this.toNgsiObject(queryParameters)
      ],
      attributes: queryParameters.attributes
    };
  },

  toURL: function(queryParameters) {
    var out = ['contextEntities'];

    out.push(encodeURIComponent(queryParameters.id));

    if (queryParameters.attributes) {
      out.push('attributes');
      out.push(encodeURIComponent(queryParameters.attributes[0]));
    }

    return out.join('/');
  }
};

var theWindow = this.window || null;
if (!theWindow) {
  exports.NgsiHelper = NgsiHelper;
  exports.Attribute = Attribute;
}
