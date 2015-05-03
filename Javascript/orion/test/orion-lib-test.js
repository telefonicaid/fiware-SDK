'use strict';

const ORION_SERVER = 'http://130.206.83.68:1026/v1';

var Orion = require('../orion-lib'),
    OrionClient = new Orion.Client({
      url: ORION_SERVER,
      userAgent: 'Test'
    }),
    OrionHelper = Orion.NgsiHelper;

var assert = require('assert');

var fs = require("fs");

const CAR_ID = 'P-9878KLA';
const CAR_TYPE = 'Car';
const PARK_TYPE = 'Park';

const VALLADOLID = '/Spain/Valladolid';
const PARKS = 'PublicParks';
const PARK_SERVICE_PATH = VALLADOLID + '/' + PARKS;
const PARK_ID = 'CampoGrande';

var contextData = {
  type: CAR_TYPE,
  id: CAR_ID,
  speed: 98,
  rpm: 2000
};

var contextDataAsXML =
  '<contextElement>' +
    '<entityId type="Car" isPattern="false">' +
      '<id>P-9878KLA</id>' +
    '</entityId>' +
    '<contextAttributeList>' +
      '<contextAttribute>' +
        '<name>speed</name>' +
        '<type>number</type>' +
        '<contextValue>98</contextValue>' +
      '</contextAttribute>' +
      '<contextAttribute>' +
        '<name>rpm</name>' +
        '<type>number</type>' +
        '<contextValue>2000</contextValue>' +
      '</contextAttribute>' +
    '</contextAttributeList>' +
  '</contextElement>';

var contextResponseAsXML =
  '<contextResponseList>' +
    '<contextElementResponse>' + contextDataAsXML +
      '<statusCode>' +
        '<code>200</code>' +
        '<reasonPhrase>OK</reasonPhrase>' +
      '</statusCode>' +
    '</contextElementResponse>' +
  '</contextResponseList>';

var requestAsXML =
  '<queryContextRequest>' +
    '<entityIdList>' +
      '<entityId type="Street" isPattern="false">' +
        '<id>Street4</id>' +
      '</entityId>' +
      '<entityId type="Street" isPattern="false">' +
        '<id>Street6</id>' +
      '</entityId>' +
    '</entityIdList>' +
    '<attributeList>' +
      '<attribute>temperature</attribute>' +
      '<attribute>humidity</attribute>' +
    '</attributeList>' +
  '</queryContextRequest>';


var contextData2 = {
  type: CAR_TYPE,
  id: '8787GYV',
  speed: 120,
  rpm: 2500
};

function assertEqualObj(obj1, obj2) {
  assert.deepEqual(obj1, obj2);
}

describe('NGSI Helper > ', function() {

  function assertNgsiObject(obj) {
    assert.equal(obj.type, CAR_TYPE);
    assert.equal(obj.id, CAR_ID);
    assert.equal(obj.isPattern, false);
    assert.equal(obj.attributes[0].value, '98');
    assert.equal(obj.attributes[1].value, '2000');
  }


  it('should convert JS objects to NGSI Objects', function() {
    var ngsiObj = OrionHelper.toNgsiObject(contextData);
    assertNgsiObject(ngsiObj);
  });

  it('should convert NGSI Objects to XML', function() {
    var objAsNgsiXML = OrionHelper.toNgsiObject(contextData).toXML();
    assert.equal(objAsNgsiXML, contextDataAsXML);
  });

  it('should parse NGSI Responses', function() {
    var jsonChunk = fs.readFileSync(__dirname + '/ngsi-response.json', 'UTF-8');
    var object = OrionHelper.parse(jsonChunk);

    if (object.inError) {
      assert.fail('It cannot be in error');
      return;
    }

    assertEqualObj(contextData, object);
  });

  it('should parse NGSI Responses in XML', function() {
    var xmlChunk = fs.readFileSync(__dirname + '/ngsi-response.xml', 'UTF-8');
    var object = OrionHelper.parse(xmlChunk);

    if (object.inError) {
      assert.fail('It cannot be in error');
      return;
    }

    assertEqualObj(contextData, object);
  });

  it('should parse providing requests in XML', function() {
    var out = OrionHelper.parseNgsiRequest(requestAsXML);
    
    assert.equal(out.entities.length, 2);
    assert.equal(out.attributes.length, 2);

    assert.equal(out.entities[0].id, 'Street4');
    assert.equal(out.attributes[0], 'temperature');

    assert.equal(out.entities[1].type, 'Street');
    assert.ok(typeof out.entities[1].pattern === 'undefined');
  });

  it('should detect NGSI Responses in error', function() {
    var jsonChunk = fs.readFileSync(__dirname + '/ngsi-response-error.json',
                                    'UTF-8');
    var object = OrionHelper.parse(jsonChunk);

    assert.equal(object.inError, true);
    assert.equal(object.errorCode, 400);
  });

  it('should convert objects to NGSI', function() {
    var object = contextData;
    var ngsiObject = OrionHelper.toNgsi(object);

    assertNgsiObject(ngsiObject.contextElements[0]);
  });

  it('should build NGSI Responses', function() {
    var object = contextData;
    var ngsiResponse = OrionHelper.buildNgsiResponse(object);

     assertNgsiObject(ngsiResponse.contextResponses[0].contextElement);
     assert.equal(ngsiResponse.contextResponses[0].statusCode.code, 200);
  });

  it('should build NGSI Responses as XML', function() {
    var object = contextData;
    var ngsiResponse = OrionHelper.buildNgsiResponse(object).toXML();

    assert.equal(ngsiResponse, contextResponseAsXML);
  })
});

describe('Context Operations > ', function() {
  this.timeout(5000);

  describe('UPDATE', function(done) {

    it('should update context data', function(done) {
      OrionClient.updateContext(contextData).then(function(updatedData) {
        assertEqualObj(contextData, updatedData);
        done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should update multiple context data', function(done) {
      var dataList = [
        contextData,
        contextData2
      ];
      OrionClient.updateContext(dataList).then(function(updatedData) {
        assertEqualObj(dataList, updatedData);
        done();
      });
    });

    it('should update context with entity paths', function(done) {
      var data = {
        id: PARK_SERVICE_PATH + '/' + PARK_ID,
        type: PARK_TYPE,
        extension: 2000
      };
      OrionClient.updateContext(data).then(function(updatedData) {

        return OrionClient.queryContext({
          type: 'Park',
          id: PARK_ID
        }, { path: VALLADOLID + '/#' });

      }).then(function(queryResult) {
          assert.equal(queryResult.extension, 2000);
          done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should reject due to timeout', function(done) {
      OrionClient.updateContext(contextData,{
        timeout: 1
      }).then(function(updatedData) {
          done('failed!');
      }).catch(function(err) {
          done();
      });
    });

    it('should be rejected if a non existing entity is updated',
      function(done) {
        OrionClient.updateContext({
          type: 'test',
          id: 'not-exists2',
          speed: 100
        }, { updateAction: 'UPDATE' }).then(function() {
            done('failed!');
        }, function(err) {
            done();
        });
    });

    it('should delete context entities', function(done) {
      var deleteData = {
        type: 'test',
        id: 'test-1',
        testAttr: 'testVal'
      };
      var deleteQuery = {
        type: 'test',
        id: 'test-1'
      };

      OrionClient.updateContext(deleteData).then(function(updatedData) {
        return OrionClient.deleteContext(deleteQuery);
      }).then(function() {
          return OrionClient.queryContext(deleteQuery);
      }).then(function(queryResult) {
          assert.equal(queryResult, null);
          done();
      }).catch(function(err) {
          done(err);
      });
    });
  }); // UPDATE

  describe('QUERY', function() {
    var queryParams = {
      type: CAR_TYPE,
      id: CAR_ID
    };

    before(function(done) {
      OrionClient.updateContext(contextData).then(() => done(), ()=> done());
    });

    it('should query context data', function(done) {
      OrionClient.queryContext(queryParams).then(function(retrievedData) {
        assertEqualObj(contextData, retrievedData);
        done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should query context data with associated metadata', function(done) {
      var contextData2 = {
        type: CAR_TYPE,
        id: '8787GYH',
        speed: new Orion.Attribute(120, {
          accuracy: 0.9
        })
      };

      OrionClient.updateContext(contextData2).then(function() {
        return OrionClient.queryContext({
          type: CAR_TYPE,
          id: '8787GYH'
        });
      }).then(function(retrievedData) {
          assert.equal(retrievedData.speed.value, 120);
          assert.equal(retrievedData.speed.metadata.accuracy, 0.9);
          done();
      }).catch(function(error) {
          done(error);
      });
    });

    it('should query context data with date as metadata', function(done) {
      var date = new Date();
      var contextData3 = {
        type: CAR_TYPE,
        id: '9999GYH',
        speed: new Orion.Attribute(150, {
          timestamp: date
        })
      };

      OrionClient.updateContext(contextData3).then(function() {
        return OrionClient.queryContext({
          type: CAR_TYPE,
          id: '9999GYH'
        });
      }).then(function(retrievedData) {
          assert.equal(retrievedData.speed.value, 150);
          assert.equal(retrievedData.speed.metadata.timestamp.getTime(),
                       date.getTime());
          done();
      }).catch(function(error) {
          done(error);
      });
    });

    it('should query context data with attribute restriction', function(done) {
      queryParams.attributes = ['speed'];

      OrionClient.queryContext(queryParams).then(function(retrievedData) {
        assert.equal(typeof retrievedData.rpm, 'undefined');
        done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should return null if no element is found', function(done) {
      var noMatch = {
        type: CAR_TYPE,
        id: '123456'
      };

      OrionClient.queryContext(noMatch).then(function(retrievedData) {
        assert.equal(retrievedData, null);
        done();
      }).catch(function(err) {
          done(err);
      });
    });

    describe('QUERY pattern', function() {
      var contextData = [
        {
          type: 'City',
          id: 'Spain-Madrid',
          currentTemperature: 25.6,
          estimatedTemperature: 28
        },
        {
          type: 'City',
          id: 'Spain-Valladolid',
          currentTemperature: 21.8,
          estimatedTemperature: 23
        }
      ];

      before(function(done) {
        OrionClient.updateContext(contextData).then(() => done(), () => done());
      });

      var queryParams = {
        pattern: 'Spain-*',
        type: 'City'
      };

      it('should return a collection which matches a pattern', function(done) {
        OrionClient.queryContext(queryParams).then(function(retrievedData) {
          assert.equal(retrievedData.length, 2);
          assertEqualObj(retrievedData[0], contextData[0]);
          assertEqualObj(retrievedData[1], contextData[1]);
          done();
        }).catch(function(error) {
            done(error);
        });
      });

      it('should return an empty collection if no object matches',
        function(done) {
          var noMatches = {
            type: 'City',
            pattern: 'France-*'
          };

          OrionClient.queryContext(noMatches).then(function(retrievedData) {
            assert.equal(retrievedData.length, 0);
            done();
          }).catch(function(error) {
              done(error);
          });
      });
    });

  }); // QUERY

  describe('SUBSCRIBE', function() {
    var entity = {
      type: CAR_TYPE,
      id: CAR_ID
    };

    var subscrParams = {
      callback: 'http://130.206.83.68/orion/notif_test',
      type: 'ONCHANGE', // By default if nothing said
      attributes: ['speed']
    };

    it('should subscribe properly to an existent entity', function(done) {
      OrionClient.subscribeContext(entity, subscrParams).then(
        function(subscription) {
          assert.equal(typeof subscription.subscriptionId, 'string');
          done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should update an existing subscription', function(done) {
      var subscriptionId;
      OrionClient.subscribeContext(entity, subscrParams).then(
        function(subscription) {
          subscriptionId = subscription.subscriptionId;
          var updateParams = Object.create(subscrParams);
          updateParams.subscriptionId = subscriptionId;

          return OrionClient.subscribeContext(entity, updateParams);
      }).then(function(updatedSubscription) {
          assert.equal(updatedSubscription.subscriptionId, subscriptionId);
          done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should return error 404 if updating a non existent subscription',
      function(done) {
        var params = Object.create(subscrParams);
        params.subscriptionId = '000000000000000000000000';
        
        OrionClient.subscribeContext(entity, params).then(function() {
          done('failed!');
        }).catch(function(err) {
            assert.equal(err.code, 404);
            done();
        });
    });

    it('should subscribe properly filtering by attribute', function(done) {
      var entityAttr = {
        type: CAR_TYPE,
        id: CAR_ID,
        attributes: ['speed']
      };

      OrionClient.subscribeContext(entityAttr, subscrParams).then(
        function(subscription) {
          assert.equal(typeof subscription.subscriptionId, 'string');
          done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should subscribe properly by providing a pattern', function(done) {
      var entityAttr = {
        type: CAR_TYPE,
        pattern: '*',
        attributes: ['speed']
      };

      OrionClient.subscribeContext(entityAttr, subscrParams).then(
        function(subscription) {
          assert.equal(typeof subscription.subscriptionId, 'string');
          done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should subscribe to a list of entities', function(done) {
      var entities = [{
          type: CAR_TYPE,
          id: CAR_ID
        },
        {
          type: CAR_TYPE,
          id: '8787GV'
        }
      ];

      subscrParams.attributes = [
        'speed',
        'rpm'
      ];

      OrionClient.subscribeContext(entities, subscrParams).then(
        function(subscription) {
          assert.equal(typeof subscription.subscriptionId, 'string');
          done();
      }).catch(function(err) {
          done(err);
      });
    });

  });  // SUBSCRIBE

  describe('REGISTER', function() {
    var entity = {
      type: CAR_TYPE,
      id: CAR_ID,
      attributes: [{
        name: 'buildYear',
        type: typeof ''
      }]
    };
    var registrationParams = {
      callback: 'http://localhost/orion/provider'
    };

    it('should register a context provider', function(done) {
      OrionClient.registerContext(entity, registrationParams).then(
        function(registration) {
          assert.equal(typeof registration.registrationId, 'string');
          done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should register a context provider. simplified attribute naming',
       function(done) {
        var registration = {
          type: CAR_TYPE,
          id: 'M-45678',
          attributes: [
            'byDefaultString'
          ]
        };
        
        OrionClient.registerContext(entity, registrationParams).then(
          function(registration) {
            assert.equal(typeof registration.registrationId, 'string');
            done();
          }).catch(function(err) {
            done(err);
          });
    });

    it('should register a context provider. pattern provided', function(done) {
      var entityDesc = {
        type: CAR_TYPE,
        pattern: '*',
        attributes:  [{
          name: 'buildYear',
          type: typeof ''
        }]
      };

      OrionClient.registerContext(entityDesc, registrationParams).then(
        function(registration) {
          assert.equal(typeof registration.registrationId, 'string');
          done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should register a context provider for various entities',
      function(done) {
        // This time the attributes will be passed as registration params
        registrationParams.attributes =  [{
          name: 'buildYear',
          type: typeof ''
        }];
        delete entity.attributes;

        var entities = [
          entity,
          {
            type: CAR_TYPE,
            id: '8787GYV'
          }
        ];

        OrionClient.registerContext(entities, registrationParams).then(
          function(registration) {
            assert.equal(typeof registration.registrationId, 'string');
            done();
        }).catch(function(err) {
            done(err);
        });
    });

  });  // REGISTER
});
