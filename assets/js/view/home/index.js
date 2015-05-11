/**
 * Created by Newton on 2015/5/10.
 */

'use strict';

var $ = require('jquery');
var Dialog = require('dialog');

var dialog = new Dialog();

$('#open-dialog').on('click', function (){
  dialog.set('content', '<div style="height: 300px; text-align: center; line-height: 300px;">sample</div>');
  dialog.show();
});