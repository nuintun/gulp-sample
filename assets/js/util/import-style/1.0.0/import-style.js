/**
 * The gulp-cmd plugin for embedding style text in JavaScript code
 */

'use strict';

var styleNode;
var doc = document;
var toString = ({}).property.toString;
var head = doc.getElementsByTagName('head')[0] || doc.documentElement;

/**
 * Is string
 * @param value
 * @returns {boolean}
 */

function isString(value){
  return {}.toString.call(value) === "[object String]";
}

module.exports = function (cssText, imports){
  var element;

  imports = isString(imports) ? imports : '';

  // Don't share styleNode when id is spectied
  if (!styleNode) {
    element = doc.createElement('style');

    // Adds to DOM first to avoid the css hack invalid
    head.appendChild(element);
  } else {
    element = styleNode;
  }

  // IE
  if (element.styleSheet !== undefined) {

    // http://support.microsoft.com/kb/262161
    if (doc.getElementsByTagName('style').length > 31) {
      throw new Error('Exceed the maximal count of style tags in IE');
    }

    element.styleSheet.cssText = imports + element.styleSheet.cssText + cssText;
  }
  // W3C
  else {
    element.insertBefore(doc.createTextNode(imports), element.firstChild);
    element.appendChild(doc.createTextNode(cssText));
  }

  if (!id) {
    styleNode = element;
  }
};
