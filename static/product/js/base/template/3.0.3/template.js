define("base/template/3.0.3/template",[],function(e,n,t){"use strict";var r=function(e,n){return"string"==typeof n?g(n,{filename:e}):o(e,n)};r.version="3.0.3";var a=r.defaults={openTag:"<?",closeTag:"?>",escape:!0,cache:!0,compress:!1,parser:null},i=r.cache={};r.config=function(e,n){a[e]=n},r.render=function(e,n){return g(e,n)};var o=r.renderFile=function(e,n){var t=r.get(e)||$({filename:e,name:"Render Error",message:"Template not found"});return n?t(n):t};r.get=function(e){var n;if(i[e])n=i[e];else if("object"==typeof document){var t=document.getElementById(e);if(t){var r=(t.value||t.innerHTML).replace(/^\s*|\s*$/g,"");n=g(r,{filename:e})}}return n};var l=function(e,n){return"string"!=typeof e&&("number"===(n=typeof e)?e+="":e="function"===n?l(e.call(e)):""),e},c={"<":"&#60;",">":"&#62;",'"':"&#34;","'":"&#39;","&":"&#38;"},u=function(e){return c[e]},s=Array.isArray||function(e){return"[object Array]"==={}.toString.call(e)},p=r.utils={$helpers:{},$include:o,$string:l,$escape:function(e){return l(e).replace(/&(?![\w#]+;)|[<>"']/g,u)},$each:function(e,n){var t,r;if(s(e))for(t=0,r=e.length;t<r;t++)n.call(e,e[t],t,e);else for(t in e)n.call(e,e[t],t)}};r.helper=function(e,n){f[e]=n};var f=r.helpers=p.$helpers;r.onerror=function(e){var n="Template Error\n\n";for(var t in e)e.hasOwnProperty(t)&&(n+="<"+t+">\n"+e[t]+"\n\n");"object"==typeof console&&console.error(n)};var $=function(e){return r.onerror(e),function(){return"{Template Error}"}},g=r.compile=function(e,n){n=n||{};for(var t in a)a.hasOwnProperty(t)&&n[t]===undefined&&(n[t]=a[t]);var r=n.filename;try{var o=function(e,n){var t=n.debug,r=n.openTag,a=n.closeTag,i=n.parser,o=n.compress,l=n.escape,c=1,u={$data:1,$filename:1,$utils:1,$helpers:1,$out:1,$line:1},s="".trim,$=s?["$out='';","$out+=",";","$out"]:["$out=[];","$out.push(",");","$out.join('')"],g=s?"$out+=text;return $out;":"$out.push(text);",T="function(){var text=''.concat.apply('',arguments);"+g+"}",E="function(filename,data){data=data||$data;var text=$utils.$include(filename,data,$filename);"+g+"}",j="'use strict';var $utils=this,$helpers=$utils.$helpers,"+(t?"$line=0,":""),S=$[0],W="return new String("+$[3]+");";d(e.split(r),function(e){var r=(e=e.split(a))[0],o=e[1];1===e.length?S+=R(r):(S+=function(e){var r=c;i?e=i(e,n):t&&(e=e.replace(/\n/g,function(){return"$line="+ ++c+";"}));if(0===e.indexOf("=")){var a=l&&!/^=[=#]/.test(e);if(e=e.replace(/^=[=#]?|[\s;]*$/g,""),a){var o=e.replace(/\s*\([^\)]+\)/,"");p[o]||/^(include|print)$/.test(o)||(e="$escape("+e+")")}else e="$string("+e+")";e=$[1]+e+$[2]}t&&(e="$line="+r+";"+e);return d((s=e,s.replace(m,"").replace(h,",").replace(v,"").replace(y,"").replace(w,"").split(b)),function(e){var n;e&&!u[e]&&(n="print"===e?T:"include"===e?E:p[e]?"$utils."+e:f[e]?"$helpers."+e:"$data."+e,j+=e+"="+n+",",u[e]=!0)}),e+"\n";var s}(r),o&&(S+=R(o)))});var A=j+S+W;t&&(A="try{"+A+"}catch(e){throw {filename:$filename,name:'Render Error',message:e.message,line:$line,source:"+x(e)+".split(/\\n/)[$line-1].replace(/^\\s+/,'')};}");try{var O=new Function("$data","$filename",A);return O.prototype=p,O}catch(k){throw k.temp="function anonymous($data,$filename) {"+A+"}",k}function R(e){return c+=e.split(/\n/).length-1,o&&(e=e.replace(/\s+/g," ").replace(/<!--[\w\W]*?-->/g,"")),e&&(e=$[1]+x(e)+$[2]+"\n"),e}}(e,n)}catch(c){return c.filename=r||"anonymous",c.name="Syntax Error",$(c)}function l(t){try{return new o(t,r)+""}catch(c){return n.debug?$(c)():(n.debug=!0,g(e,n)(t))}}return l.prototype=o.prototype,l.toString=function(){return o.toString()},r&&n.cache&&(i[r]=l),l},d=p.$each,m=/\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g,h=/[^\w$]+/g,v=new RegExp(["\\b"+"break,case,catch,continue,debugger,default,delete,do,else,false,finally,for,function,if,in,instanceof,new,null,return,switch,this,throw,true,try,typeof,var,void,while,with,abstract,boolean,byte,char,class,const,double,enum,export,extends,final,float,goto,implements,import,int,interface,long,native,package,private,protected,public,short,static,super,synchronized,throws,transient,volatile,arguments,let,yield,undefined".replace(/,/g,"\\b|\\b")+"\\b"].join("|"),"g"),y=/^\d[^,]*|,\d[^,]*/g,w=/^,+|,+$/g,b=/^$|,+/;function x(e){return"'"+e.replace(/('|\\)/g,"\\$1").replace(/\r/g,"\\r").replace(/\n/g,"\\n")+"'"}t.exports=r});