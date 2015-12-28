'use strict';

// Server must be run with the -multiservice option (multitenant)
const ORION_SERVER = 'http://130.206.83.68:1026/v1';
const ORION_TESTBED_SERVER = 'http://orion.lab.fiware.org:1026/v1';

var Orion = require('../orion-lib'),
    OrionClient = new Orion.Client({
      url: ORION_SERVER,
      userAgent: 'Test'
    }),
    OrionClientService = new Orion.Client({
      url: ORION_SERVER,
      userAgent: 'Test',
      service: 'Test_Service'
    }),
    OrionTestBedService = new Orion.Client({
      url: ORION_TESTBED_SERVER,
      userAgent: 'Test',
      token: 'nBA8EYe0wrzI8nVISMLMlR1CpUWfsF'
    }),
    OrionHelper = Orion.NgsiHelper;

var assert = require('assert');

var fs = require('fs');

const CAR_ID = 'P-9878KLA';
const CAR_TYPE = 'Car';
const PARK_TYPE = 'Park';
const RESTAURANT_TYPE = 'Car';

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

var contextData2 = {
  type: CAR_TYPE,
  id: '8787GYV',
  speed: 120,
  rpm: 2500
};

const TARGET_LOCATION = '41.3763726, 2.1864475';   
var geoContextData = {
  type: RESTAURANT_TYPE,
  id: 'r12345',
  speed: 135,
  location: new Orion.Attribute(TARGET_LOCATION, 'geo:point')
};

// XML Data for testing purposes
var XMLData = require('./xml-data');

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
    assert.equal(objAsNgsiXML, XMLData.contextDataAsXML);
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
  
  it('should parse NGSI Responses - geolocation data', function() {
    var jsonChunk = fs.readFileSync(__dirname + '/ngsi-response-location.json', 'UTF-8');
    var object = OrionHelper.parse(jsonChunk);

    if (object.inError) {
      assert.fail('It cannot be in error');
      return;
    }

    assert.equal(object.location.type, 'geo:point');
    assert.equal(object.location.value, '34, 48');
    assert.equal(!object.metadata, true);
  });
  
  it('should parse NGSI Responses - geolocation data - GeoJSON', function() {
    var jsonChunk = fs.readFileSync(__dirname + '/ngsi-response-location.json', 'UTF-8');
    var options = {
      'GeoJSON': true
    };
    var object = OrionHelper.parse(jsonChunk, options);

    if (object.inError) {
      assert.fail('It cannot be in error');
      return;
    }

    assert.equal(object.location.type, 'Point');
    assert.equal(object.location.coordinates.length, 2);
    assert.equal(object.location.coordinates[1], 34);
    assert.equal(object.location.coordinates[0], 48);
    assert.equal(!object.metadata, true);
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
    var out = OrionHelper.parseNgsiRequest(XMLData.requestAsXML);
    
    assert.equal(out.entities.length, 2);
    assert.equal(out.attributes.length, 2);

    assert.equal(out.entities[0].id, 'Street4');
    assert.equal(out.attributes[0], 'temperature');

    assert.equal(out.entities[1].type, 'Street');
    assert.ok(typeof out.entities[1].pattern === 'undefined');
  });
  
  it('should parse providing requests in JSON', function() {
    var requestAsJson = {
      "contextElements":[
        {
          "type":"House",
          "isPattern":"false",
          "id":"Customer-6790",
          "attributes":[
            {
              "name":"boilerStatus",
              "type":"string",
              "value":"OF"
            }
          ]
        }
      ],
      "updateAction":"UPDATE"
    };
    
    var out = OrionHelper.parseNgsiRequest(requestAsJson);
    
    assert.equal(out.entities.length, 1);
    assert.equal(out.entities[0].id, 'Customer-6790');
    assert.equal(out.entities[0].boilerStatus, 'OF');
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
  
  it('should convert objects to NGSI - geolocation', function() {
    var object = geoContextData;
    var ngsiObject = OrionHelper.toNgsi(object);
    var geoAttr = ngsiObject.contextElements[0].attributes[1];
    
    assert.equal(ngsiObject.contextElements[0].type, RESTAURANT_TYPE);
    assert.equal(geoAttr.type, 'coords');
    assert.equal(geoAttr.coords, geoContextData.coords);
    assert.equal(geoAttr.metadatas[0].value, 'WGS84');
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

    assert.equal(ngsiResponse, XMLData.contextResponseAsXML);
  });
  
  it('should generate query URLs by id', function() {
    var query = {
      id: '7890'
    };
    var url = OrionHelper.toURL(query);
    
    assert.equal(url, 'contextEntities/7890');
  });
  
  it('should generate query URLs by type', function() {
    var query = {
      type: 'Car'
    };
    var url = OrionHelper.toURL(query);
    
    assert.equal(url, 'contextEntityTypes/Car');
  });
});

describe('Context Operations > ', function() {
  this.timeout(10000);

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
    
    it('should update context with service', function(done) {
      // Same as contextData but in a different service and with different speed
      // Thus the object will be different
      const TEST_SERVICE_SPEED = 400;
      var data = {
        id: CAR_ID,
        type: CAR_TYPE,
        speed: TEST_SERVICE_SPEED
      };
      
      OrionClientService.updateContext(data).then(function(updatedData) {
        return OrionClientService.queryContext({
          type: CAR_TYPE,
          id: CAR_ID
        });
      }).then(function(queryResult) {
          assert.equal(queryResult.speed, TEST_SERVICE_SPEED);
          // Now query the same entity and id but in the default service
          return OrionClient.queryContext({
            type: CAR_TYPE,
            id: CAR_ID
          });
      }).then(function(queryResult2) {
          assert.equal(queryResult2.speed, contextData.speed);
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
      OrionClient.updateContext(contextData).then(() => done(), () => done());
    });

    it('should query context data', function(done) {
      OrionClient.queryContext(queryParams).then(function(retrievedData) {
        assertEqualObj(contextData, retrievedData);
        done();
      }).catch(function(err) {
          done(err);
      });
    });
    
    it('should query multiple context data by id', function(done) {
      OrionClient.updateContext(contextData2).then(function() {
        return OrionClient.queryContext([
          {
            id: contextData.id,
          },
          {
            id: contextData2.id
          }
        ]);
      }).then(function(result) {
          assert.equal(result.length, 2);
          done();
      }).catch(function(err) {
          done(err);
      });
    });
    
    it('should query context data using a token', function(done) {
      var tokenQuery = {
        id: 'urn:smartsantander:testbed:357'
      };
      
      OrionTestBedService.queryContext(tokenQuery).then(function(retrievedData) {
        assert.equal(retrievedData.type, 'santander:soundacc');
        done();
      }).catch(function(err) {
          done(err);
      });
    });
    
    it('should query context data by location - circle', function(done) {
      var geoQuery = {
        type: RESTAURANT_TYPE
      };
      var locationOptions = {
        location: {
          coords: TARGET_LOCATION,
          geometry: 'Circle',
          radius: 1000
        }
      };
      
      OrionClient.updateContext(geoContextData).then(function() {
        return OrionClient.queryContext(geoQuery, locationOptions);    
      }).then(function(retrievedData) {
          assert.equal(retrievedData.id, 'r12345');
          assert.equal(retrievedData.location.value, TARGET_LOCATION);
          assert.equal(retrievedData.location.type, 'geo:point');
          done();
      }).catch(function(err) {
        done(err);
      });
    });
    
    it('should query context data by location - circle - GeoJSON', function(done) {
      var geoQuery = {
        type: RESTAURANT_TYPE
      };
      var locationOptions = {
        location: {
          coords: TARGET_LOCATION,
          geometry: 'Circle',
          radius: 1000
        },
        GeoJSON: true
      };
      
      OrionClient.updateContext(geoContextData).then(function() {
        return OrionClient.queryContext(geoQuery, locationOptions);    
      }).then(function(retrievedData) {
          assert.equal(retrievedData.id, 'r12345');
          assert.equal(retrievedData.location.coordinates[1], 41.3763726);
          assert.equal(retrievedData.location.coordinates[0], 2.1864475);
          assert.equal(retrievedData.location.type, 'Point');
          done();
      }).catch(function(err) {
        done(err);
      });
    });
    
    it('should query context data by location - inverted', function(done) {
      var geoQuery = {
        type: RESTAURANT_TYPE
      };
      var locationOptions = {
        location: {
          coords: TARGET_LOCATION,
          geometry: 'Circle;external',
          radius: 1000
        }
      };
      
      OrionClient.queryContext(geoQuery, locationOptions).then(function(retrievedData) {
        assert.equal(retrievedData, null);
        done();
      }).catch(function(err) {
        done(err);
      });
    });
    
    it('should query context data by location - polygon', function(done) {
      var geoQuery = {
        type: RESTAURANT_TYPE
      };
      var locationOptions = {
        location: {
          // Roughly speaking a polygon which denotes Spain
          coords: '42.90,-9.26, 42.35,1.45, 37.21,-7.40, 37.98,-1.15',
          geometry: 'Polygon'
        }
      };
      
      OrionClient.queryContext(geoQuery, locationOptions).then(function(retrievedData) {
        assert.equal(retrievedData, null);
        done();
      }).catch(function(err) {
        done(err);
      });
    });
    
    it('should query context data by filtering it', function(done) {
      var query = {
        type: CAR_TYPE
      };
      
      var carData = {
        type: CAR_TYPE,
        id: '12345G',
        speed: 135,
        brand: 'Mercedes'
      };
      
      OrionClient.updateContext(carData).then(function() {
        return OrionClient.queryContext(query, {
          q: 'brand == Mercedes'
        });
      }).then(function(result) {
          assert.equal(result.id, carData.id);
          done();
      }).catch(function(error) {
          done(error);
      });
    });

    it('should query context data with associated metadata', function(done) {
      var contextData2 = {
        type: CAR_TYPE,
        id: '8787GYH',
        speed: new Orion.Attribute(120, 'Speed', {
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
        speed: new Orion.Attribute(150, 'Speed', {
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
    
    it('should query context data with date as data', function(done) {
      var date = new Date();
      var contextData3 = {
        type: CAR_TYPE,
        id: '1111GYH',
        timestamp: date
      };

      OrionClient.updateContext(contextData3).then(function() {
        return OrionClient.queryContext({
          type: CAR_TYPE,
          id: '1111GYH'
        });
      }).then(function(retrievedData) {
          assert.equal(retrievedData.timestamp.getTime(), date.getTime());
          done();
      }).catch(function(error) {
          done(error);
      });
    });
    
    it('should query context data with limit and offset', function(done) {
      OrionClient.queryContext({
        type: CAR_TYPE
      }, {
            offset: 0,
            limit: 1
      }).then(function(data) {
          // As limit is one the library returns the object directly
          assert.equal(typeof data, 'object');
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
        pattern: '.*',
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

    it('should update an existing registration', function(done) {
      var params = Object.create(registrationParams);
      var registrationId;
      OrionClient.registerContext(entity, registrationParams).then(
        function(registration) {
          registrationId = registration.registrationId;
          params.registrationId = registrationId;
          return OrionClient.registerContext(entity, params);
      }).then(function(registration) {
          assert.equal(registration.registrationId, registrationId);
          done();
      }).catch(function(err) {
          done(err);
      });
    });

    it('should reject with error code 404 if updating non existent',
      function(done) {
        var params = Object.create(registrationParams);
        params.registrationId = '000000000000000000000000';
        OrionClient.registerContext(entity, params).then(
          function(registration) {
            done('should fail!');
        }).catch(function(err) {
            assert.equal(err.code, 404);
            done();
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
