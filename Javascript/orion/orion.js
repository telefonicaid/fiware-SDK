'use strict';

/* global NgsiHelper */
/* exported OrionClient */

var OrionClient = (function() {
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  function loadHelper() {
    if (window.NgsiHelper) {
      return Promise.resolve();
    }

    return new Promise(function(resolve, reject) {
      // We need to know from what folder is going to be loaded
      var script = document.createElement('script');
      var mainLibSrc = currentScript.src;
      var folder = mainLibSrc.substr(0, mainLibSrc.lastIndexOf('/'));

      script.src = folder + '/' + 'ngsi-helper.js';
      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  function createRequest(params) {
    var xhr = new XMLHttpRequest();
    xhr.open(params.method, params.url, true);

    xhr.responseType = 'json';
    xhr.timeout = params.timeout;
    if (params.headers) {
      for (var header in params.headers) {
        // Skip UA as this is unsafe in Web Browsers
        if (header === 'User-Agent') {
          continue;
        }
        xhr.setRequestHeader(header, params.headers[header]);
      }
    }

    return xhr;
  }

  function queryContext(queryParams, options) {
    var self = this;

    return new Promise(function(resolve, reject) {
      loadHelper().then(function() {
        var url = NgsiHelper.toURL(queryParams);

        var req = createRequest({
          url: self.url + '/' + url,
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        req.send();

        req.onload = function() {
          if (req.status === 200) {
            var parsed = NgsiHelper.parse(req.response);
            if (parsed && parsed.inError) {
              reject(parsed.errorCode);
              return;
            }
            if (queryParams.pattern && !parsed) {
              parsed = [];
            }
            if (parsed && !parsed.id) {
              parsed.id = queryParams.id;
            }
            if (parsed && !parsed.type) {
              parsed.type = queryParams.type;
            }
            resolve(parsed);
          }
          else {
            reject({
              name: 'HTTPError' + req.status
            });
          }
        };

        req.onerror = reject;
      });
    });
  }

  function OrionClient(options) {
    this.url = options.url;
    this.options = options;
  }

  OrionClient.prototype = {
    queryContext: queryContext
  };

  return OrionClient;

})();
