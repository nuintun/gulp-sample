define("common/dialog/1.5.1/confirmbox",["base/jquery/1.11.3/jquery","./dialog","./confirmbox.tpl"],function(t,e,i){"use strict";var n=t("base/jquery/1.11.3/jquery"),o=t("./dialog"),s=t("./confirmbox.tpl"),l=o.extend({attrs:{title:"默认标题",confirmTpl:'<a class="ui-dialog-button-orange" href="javascript:;">确定</a>',cancelTpl:'<a class="ui-dialog-button-white" href="javascript:;">取消</a>',message:"默认内容"},setup:function(){l.superclass.setup.call(this);var t={classPrefix:this.get("classPrefix"),message:this.get("message"),title:this.get("title"),confirmTpl:this.get("confirmTpl"),cancelTpl:this.get("cancelTpl"),hasFoot:this.get("confirmTpl")||this.get("cancelTpl")};this.set("content",this.compile(s,t))},events:{"click [data-role=confirm]":function(t){t.preventDefault(),this.trigger("confirm")},"click [data-role=cancel]":function(t){t.preventDefault(),this.trigger("cancel"),this.hide()}},_onChangeMessage:function(t){this.$("[data-role=message]").html(t)},_onChangeTitle:function(t){this.$("[data-role=title]").html(t)},_onChangeConfirmTpl:function(t){this.$("[data-role=confirm]").html(t)},_onChangeCancelTpl:function(t){this.$("[data-role=cancel]").html(t)}});l.alert=function(t,e,i){var o={message:t,title:"提示",cancelTpl:"",closeTpl:"",onConfirm:function(){e&&e.apply(this,arguments),this.hide()}};new l(n.extend(null,o,i)).show().after("hide",function(){this.destroy()})},l.confirm=function(t,e,i,o,s){"object"!=typeof o||s||(s=o,o=undefined);var a={message:t,title:e||"确认框",closeTpl:"",onConfirm:function(){n.isFunction(i)&&!1!==i.apply(this,arguments)&&this.hide()},onCancel:function(){n.isFunction(o)&&o.apply(this,arguments),this.hide()}};new l(n.extend(null,a,s)).show().after("hide",function(){this.destroy()})},l.show=function(t,e,i){var o={message:t,title:"",confirmTpl:!1,cancelTpl:!1};new l(n.extend(null,o,i)).show().before("hide",function(){e&&e.apply(this,arguments)}).after("hide",function(){this.destroy()})},i.exports=l});