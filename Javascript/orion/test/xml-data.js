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


exports.contextDataAsXML = contextDataAsXML;
exports.contextResponseAsXML = contextResponseAsXML;
exports.requestAsXML = requestAsXML;