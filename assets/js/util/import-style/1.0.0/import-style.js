/**
 * The gulp-cmd plugin for embedding style text in JavaScript code
 */

'use strict';

var styleNode;
var doc = document;
var importsStack = '';
var cssTextStack = '';
var head = doc.getElementsByTagName('head')[0] || doc.documentElement;

/**
 * Is string
 * @param value
 * @returns {boolean}
 */

function isString(value){
  return {}.toString.call(value) === "[object String]";
}

/**
 * Get style node
 * @returns {*}
 */

function getNode(){
  var element;

  // Don't share styleNode when id is spectied
  if (!styleNode) {
    element = doc.createElement('style');

    // Set type
    element.type = 'text/css';

    // Adds to DOM first to avoid the css hack invalid
    head.appendChild(element);

    // IE
    if (element.styleSheet !== undefined) {
      // http://support.microsoft.com/kb/262161
      if (doc.getElementsByTagName('style').length > 31) {
        throw new Error('Exceed the maximal count of style tags in IE');
      }
    }

    // Cache style node
    styleNode = element;
  } else {
    element = styleNode;
  }

  return element;
}

/**
 * Insert style
 */

function insertStyle(){
  var element = getNode();

  // IE
  if (element.styleSheet !== undefined) {
    element.styleSheet.cssText = importsStack + cssTextStack;
  }
  // W3C
  else {
    var style = doc.createTextNode(importsStack + cssTextStack);

    if (element.firstChild) {
      element.replaceChild(style, element.firstChild);
    } else {
      element.appendChild(style);
    }
  }
}

/**
 * Insert import
 * @param imports
 */

function imports(imports){
  imports = isString(imports) ? imports : '';

  if (imports) {
    importsStack += imports;

    insertStyle();
  }
}

/**
 * Insert css text
 * @param cssText
 */

function cssText(cssText){
  cssText = isString(cssText) ? cssText : '';

  if (cssText) {
    cssTextStack += cssText;

    insertStyle();
  }
}

// Exports
module.exports.imports = imports;
module.exports.cssText = cssText;
