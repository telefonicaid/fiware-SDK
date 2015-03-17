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

var contextData = {
  type: CAR_TYPE,
  id: CAR_ID,
  speed: 98,
  rpm: 2000
};

function assertEqualObj(obj1, obj2) {
  assert.equal(JSON.stringify(obj1), JSON.stringify(obj2));
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


  it('should parse NGSI Responses', function() {
    var jsonChunk = fs.readFileSync(__dirname + '/ngsi-response.json', 'UTF-8');
    var object = OrionHelper.parse(jsonChunk);

    if (object.inError) {
      assert.fail('It cannot be in error');
      return;
    }

    assertEqualObj(contextData, object);
  });

  it('should detect NGSI Responses in error', function() {
    var jsonChunk = fs.readFileSync(__dirname + '/ngsi-response-error.json',
                                    'UTF-8');
    var object = OrionHelper.parse(jsonChunk);

    assert.equal(object.inError, true);
    assert.equal(object.errorCode, 400);
  });

  it('should stringify objects to NGSI', function() {
    var object = contextData;
    var ngsiChunk = OrionHelper.stringify(object);

    // Here to check that the stringification was ok we convert again to object
    var asObject = JSON.parse(ngsiChunk);
    assertNgsiObject(asObject.contextElements[0]);
  });
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

    it('should reject due to timeout', function(done) {
      OrionClient.updateContext(contextData,{
        timeout: 5
      }).then(function(updatedData) {
          done('failed!');
      }).catch(function(err) {
          done();
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
      reference: 'http://130.206.83.68/orion/notif_test'
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

    it('should subscribe properly to an existent attribute', function(done) {
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

  });  // SUBSCRIBE

});
