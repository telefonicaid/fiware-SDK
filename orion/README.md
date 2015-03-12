This library is under development and it is aimed at making it easier for Javascript developers to manage context information. It is not intended to cover all the functionalities offered by the Orion REST API and you might need to use the latter in certain cases.  

The library is aligned with best practices of Javascript development:
* makes use of Promises
* it is intended to work both in Web Browsers and Node environments.

Basic usage

```js
const ORION_SERVER = 'http://130.206.83.68:1026/v1';

var Orion = require('./orion-lib'),
    OrionClient = new Orion.Client({
      url: ORION_SERVER
    });

var contextData = {
  type: 'Car',
  id: 'P-9873K',
  speed: 98
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

```` 
