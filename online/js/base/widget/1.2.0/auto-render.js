define("base/widget/1.2.0/auto-render",["base/jquery/1.11.2/jquery"],function(e,t,a){var r=e("base/jquery/1.11.2/jquery"),n="data-widget-auto-rendered";t.autoRender=function(e){return new this(e).render()},t.autoRenderAll=function(e,a){"function"==typeof e&&(a=e,e=null),e=r(e||document.body);var u=[],d=[];e.find("[data-widget]").each(function(e,a){t.isDataApiOff(a)||(u.push(a.getAttribute("data-widget").toLowerCase()),d.push(a))}),u.length&&seajs.use(u,function(){for(var e=0;e<arguments.length;e++){var t=arguments[e],u=r(d[e]);if(!u.attr(n)){var o={initElement:u,renderType:"auto"},i=u.attr("data-widget-role");o[i?i:"element"]=u,t.autoRender&&t.autoRender(o),u.attr(n,"true")}}a&&a()})};var u="off"===r(document.body).attr("data-api");t.isDataApiOff=function(e){var t=r(e).attr("data-api");return"off"===t||"on"!==t&&u}});