'use strict';

function serializeAttrs(attrs) {
  var out = '';
  var num = attrs.length;

  for (var i = 0; i < num; i++) {
    out += ' ' + attrs[i].name + '=' + '"' + attrs[i].value + '"';
  }

  return out;
}

function XmlBuilder(rootTagName) {
  this.root = new Element(rootTagName);
}

function Element(name, parent) {
  this.attrs = [];
  this.children = [];

  this.eleName = name;

  if (parent) {
    this.parent = parent;
    this.parent.child(this);
  }
}

Element.prototype = {
  attr: function(attrName, attrVal) {
    this.attrs.push({
      name: attrName,
      value: attrVal
    });
    return this;
  },

  child: function(theChild) {
    var ele;

    if (typeof theChild === 'string') {
      ele = new Element(theChild, this);
    }
    else if (typeof theChild === 'object') {
      ele = theChild;
      ele.parent = this;
      this.children.push(ele);
    }

    return ele;
  },

  text: function(text) {
    this.eleText = text;
    return this;
  },

  build: function() {
    var out = '<';
    out += this.eleName;

    out += serializeAttrs(this.attrs);

    out += '>';

    // For each of the children serialize
    var numc = this.children.length;
    for (var i = 0; i < numc; i++) {
      out += this.children[i].build();
    }

    // Text of the element
    if (this.eleText) {
      out += this.eleText;
    }

    out += '</' + this.eleName + '>';

    return out;
  }
};

XmlBuilder.prototype = {
  // Constructor for an element
  child: function(theChild) {
    var ele;
    if (typeof theChild === 'string') {
      ele = new Element(theChild, this.root);
    }
    if (typeof theChild === 'object') {
      ele = theChild;
      ele.parent = this.root;
      this.root.children.push(ele);
    }

    return ele;
  },

  build: function(startWithXmlPi) {
    var out = '';

    if (startWithXmlPi === true) {
      out += '<?xml version="1.0" charset="UTF-8"?>';
    }

    out += this.root.build();
    return out;
  }
};

module.exports = XmlBuilder;
