'use strict';

const ORION_SERVER = 'http://130.206.83.68:1026/v1';

var Orion = require('./orion-lib'),
    OrionClient = new Orion.Client({
      url: ORION_SERVER
    });

var contextData = {
  type: 'Car',
  id: 'P-9873K',
  speed2: 98
};

OrionClient.updateContext(contextData).then(function() {
  console.log('Context Properly updated');
}, function(error) {
    console.log('Error while updating context: ', error);
});

var queryOptions = {
  type: 'Car',
  id: 'P-9873K'
}


OrionClient.queryContext(queryOptions).then(function(contextData) {
  console.log('Context Properly retrieved: ', JSON.stringify(contextData));
}, function(error) {
    console.log('Error while querying context: ', error);
});

