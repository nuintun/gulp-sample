define("base/class/1.2.0/class",[],function(t,n,r){"use strict";function o(t){if(!(this instanceof o)&&f(t))return e(t)}function i(t){var n,r;for(n in t)r=t[n],o.Mutators.hasOwnProperty(n)?o.Mutators[n].call(this,r):this.prototype[n]=r}function e(t){return t.extend=o.extend,t.implement=i,t}function s(){}r.exports=o,o.create=function(t,n){function r(){t.apply(this,arguments),this.constructor===r&&this.initialize&&this.initialize.apply(this,arguments)}return f(t)||(n=t,t=null),n||(n={}),t||(t=n.Extends||o),n.Extends=t,t!==o&&u(r,t,t.StaticsWhiteList),i.call(r,n),e(r)},o.extend=function(t){return t||(t={}),t.Extends=this,o.create(t)},o.Mutators={Extends:function(t){var n=this.prototype,r=c(t.prototype);u(r,n),r.constructor=this,this.prototype=r,this.superclass=t.prototype},Implements:function(t){a(t)||(t=[t]);for(var n,r=this.prototype;n=t.shift();)u(r,n.prototype||n)},Statics:function(t){u(this,t)}};var c=Object.__proto__?function(t){return{__proto__:t}}:function(t){return s.prototype=t,new s};function u(t,n,r){for(var o in n)if(n.hasOwnProperty(o)){if(r&&-1===h(r,o))continue;"prototype"!==o&&(t[o]=n[o])}}var p=Object.prototype.toString,a=Array.isArray||function(t){return"[object Array]"===p.call(t)},f=function(t){return"[object Function]"===p.call(t)},h=Array.prototype.indexOf?function(t,n){return t.indexOf(n)}:function(t,n){for(var r=0,o=t.length;r<o;r++)if(t[r]===n)return r;return-1}});