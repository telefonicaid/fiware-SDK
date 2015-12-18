# Javascript Orion Client

[![node badge](https://img.shields.io/node/v/fiware-orion-client.svg)](https://www.npmjs.com/package/fiware-orion-client)
[![npm badge](https://img.shields.io/npm/dm/fiware-orion-client.svg)](https://www.npmjs.com/package/fiware-orion-client)
[![license badge](https://img.shields.io/npm/l/fiware-orion-client.svg)](https://opensource.org/licenses/MIT)

This library is **under development** and it is aimed at making it easier for Javascript developers to manage context information.
It is not intended to cover all the functionalities offered by the Orion REST API and you might need to
use the latter in certain cases.

The library is aligned with best practices of Javascript development:
* makes use of Promises
* it is intended to work both in Web Browsers (only queries) and Node environments.

For the sake of flexibility the library provides both a NGSI Helper and a client library.

### Installation

````
npm install fiware-orion-client
````

or

````
bower install https://github.com/telefonicaid/fiware-SDK/raw/master/Javascript/fiware-orion-client-browser.zip
````

### NGSI Helper
```js
var OrionHelper = require('fiware-orion-client').NgsiHelper;
```

```html
  <script defer src="bower_components/fiware-orion-client/orion.js"></script>
```

or if you are only going to use the NgsiHelper component

```html
  <script defer src="bower_components/fiware-orion-client/ngsi-helper.js"></script>
```

#### Query Context
```js
var ngsiChunk = /* Obtain a NGSI Response by querying the Context */
var obj = OrionHelper.parse(ngsiChunk);
```

#### Update Context
```js
var contextData = {
  type: 'Car',
  id: 'P-9873K',
  speed: 98
};
var ngsiChunk = JSON.stringify(OrionHelper.toNgsi(contextData));
/* Now update the context by issuing an HTTP Request */
```

### Client Library

#### Update Context

```js
const ORION_SERVER = 'http://130.206.83.68:1026/v1';

var Orion = require('fiware-orion-client'),
    OrionClient = new Orion.Client({
      url: ORION_SERVER,
      service: 'smartGondor',      // Fiware-Service
      token: 'aTokenForTheBroker', 
      userAgent: 'IOT-Agent',
      timeout: 5000
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
```

#### Query Context

```js
var queryOptions = {
  type: 'Car',
  id: 'P-9873K'
}
OrionClient.queryContext(queryOptions).then(function(contextData) {
  console.log('Context data retrieved: ', JSON.stringify(contextData));
}, function(error) {
    console.log('Error while querying context: ', error);
});

```

#### Query Context (Geolocation)

```js
var geoQuery = {
  type: 'Restaurant'
};
var options = {
  location: {
    coords: '41.3763726, 2.1864475',
    geometry: 'Circle',
    radius: 1000
  }
};
OrionClient.queryContext(geoQuery, options).then(function(contextData) {
  console.log('Context data retrieved: ', JSON.stringify(contextData));
}, function(error) {
    console.log('Error while querying context: ', error);
});
```

#### Query Context (Filters)

```js
var entityQuery = {
  type: 'Car'
};
var options = {
  q: 'brand == Mercedes'
};
OrionClient.queryContext(entityQuery, options).then(function(contextData) {
  console.log('Context data retrieved: ', JSON.stringify(contextData));
}, function(error) {
    console.log('Error while querying context: ', error);
});
```

#### Subscribe to Context

```js
var entity = {
  type: 'Car',
  id: 'P-9873K'
};
var params = {
  callback: 'http://localhost/notify'
};
OrionClient.subscribeContext(entity, params).then(function(subscription) {
  console.log('Subscription done: ', JSON.stringify(subscription));
}, function(error) {
    console.log('Error while subscribing context: ', error);
});
```

#### Register Context Provider

```js
var entity = {
  type: 'Car',
  pattern: '.*',
  attributes: [{
    name: 'buildYear',
    type: typeof ''
  }]
};
var params = {
  callback: 'http://localhost/get_data'
}

OrionClient.registerContext(entity, params).then(function(registration) {
  console.log('Registration done: ', JSON.stringify(registration));
  }, function(error) {
    console.log('Error while registering context: ', error);
  });
});

```
