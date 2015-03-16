'use strict';

const ORION_SERVER = 'http://130.206.83.68:1026/v1';

var Orion = require('../orion-lib'),
    OrionClient = new Orion.Client({
      url: ORION_SERVER,
      userAgent: 'Test'
    }),
    OrionParser = Orion.NgsiParser;

var assert = require('assert');

var fs = require("fs");

const CAR_ID = 'P-9878KL';
const CAR_TYPE = 'Car';

var contextData = {
  type: CAR_TYPE,
  id: CAR_ID,
  speed: 98
};

describe('NGSI Parser > ', function() {

  function assertNgsiObject(obj) {
    assert.equal(obj.type, CAR_TYPE);
    assert.equal(obj.id, CAR_ID);
    assert.equal(obj.isPattern, false);
    assert.equal(obj.attributes[0].value, '98');
  }


  it('should convert JS objects to NGSI Objects', function() {
    var ngsiObj = OrionParser.toNgsiObject(contextData);
    assertNgsiObject(ngsiObj);
  });


  it('should parse NGSI Responses', function() {
    var jsonChunk = fs.readFileSync(__dirname + '/ngsi-response.json', 'UTF-8');
    var object = OrionParser.parse(jsonChunk);

    assert.equal(JSON.stringify(contextData), JSON.stringify(object));
  });

  it('should stringify objects to NGSI', function() {
    var object = contextData;
    var ngsiChunk = OrionParser.stringify(object);

    // Here to check that the stringification was ok we convert again to object
    var asObject = JSON.parse(ngsiChunk);
    assertNgsiObject(asObject.contextElements[0])
  });
});

describe('Context Operations > ', function() {
  this.timeout(5000);

  describe('UPDATE', function(done) {

    it('should update context data', function(done) {
      OrionClient.updateContext(contextData).then(function(updatedData) {
          assert.equal(JSON.stringify(contextData),
                       JSON.stringify(updatedData));
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
        assert.equal(JSON.stringify(contextData),
                       JSON.stringify(retrievedData));
        done();
      }).catch(function(err) {
          done(err);
      });
    });

  }); // QUERY

});
