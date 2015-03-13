'use strict';

const ORION_SERVER = 'http://130.206.83.68:1026/v1';

var Orion = require('../orion-lib'),
    OrionClient = new Orion.Client({
      url: ORION_SERVER
    });
var assert = require('assert');

const CAR_ID = 'P-9877K';
const CAR_TYPE = 'Car';

var contextData = {
  type: CAR_TYPE,
  id: CAR_ID,
  speed: 98
};

describe('Context Operations > ', function() {
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
      });
    });

  }); // QUERY

});
