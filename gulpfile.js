/**
 * Created by nuintun on 2015/5/5.
 */

'use strict';

var path = require('path');
var gulp = require('gulp');
var rimraf = require('del');
var colors = require('colors/safe');
var transport = require('gulp-cmd');
var uglify = require('gulp-uglify');
var plumber = require('gulp-plumber');

// set colors theme
colors.setTheme({
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red',
  inputBold: ['grey', 'bold'],
  verboseBold: ['cyan', 'bold'],
  promptBold: ['grey', 'bold'],
  infoBold: ['green', 'bold'],
  dataBold: ['grey', 'bold'],
  helpBold: ['cyan', 'bold'],
  warnBold: ['yellow', 'bold'],
  debugBold: ['blue', 'bold'],
  errorBold: ['red', 'bold']
});

// alias
var alias = {
  'jquery': 'base/jquery/1.11.2/jquery',
  'base': 'base/base/1.2.0/base',
  'class': 'base/class/1.2.0/class',
  'events': 'base/events/1.2.0/events',
  'widget': 'base/widget/1.2.0/widget',
  'template': 'base/template/3.0.3/template',
  'templatable': 'base/templatable/0.10.0/templatable',
  'iframe-shim': 'util/iframe-shim/1.1.0/iframe-shim',
  'position': 'util/position/1.1.0/position',
  'messenger': 'util/messenger/2.1.0/messenger',
  'mask': 'common/overlay/1.2.0/mask',
  'overlay': 'common/overlay/1.2.0/overlay',
  'dialog': 'common/dialog/1.5.1/dialog',
  'confirmbox': 'common/dialog/1.5.1/confirmbox'
};

// complete callback
function complete(){
  var now = new Date();

  console.log(
    '  %s [%s] %s',
    colors.verboseBold('gulp-cmd'),
    now.toLocaleString(),
    colors.infoBold('build complete ...')
  );
}

// clean task
gulp.task('clean', function (callback){
  rimraf('online', callback);
});

// runtime task
gulp.task('images', ['clean'], function (){
  // all js
  gulp.src('assets/images/*.*')
    .pipe(gulp.dest('online/images'))
    .on('end', complete);
});

// runtime task
gulp.task('runtime', ['images'], function (){
  // all js
  gulp.src('assets/loader/*.*')
    .pipe(gulp.dest('online/loader'))
    .on('end', complete);
});

// online task
gulp.task('online', ['runtime'], function (){
  // all js
  gulp.src('assets/js/**/*.js', { base: 'assets/js' })
    .pipe(transport({
      alias: alias,
      include: function (id){
        return id.indexOf('view') === 0 ? 'all' : 'relative';
      },
      oncsspath: function (path){
        return path.replace('assets/', 'online/')
      }
    }))
    .pipe(uglify())
    .pipe(gulp.dest('online/js'))
    .on('end', complete);

  // other file
  gulp.src('assets/js/**/*.!(js|css|json|tpl|html)')
    .pipe(gulp.dest('online/js'));
});

// develop task
gulp.task('default', ['runtime'], function (){
  // all file
  gulp.src('assets/js/**/*.*', { base: 'assets/js' })
    .pipe(transport({
      alias: alias,
      include: 'self',
      oncsspath: function (path){
        return path.replace('assets/', 'online/')
      }
    }))
    .pipe(gulp.dest('online/js'))
    .on('end', complete);
});

// develop watch task
gulp.task('watch', ['default'], function (){
  var base = path.join(process.cwd(), 'assets');

  // watch all file
  gulp.watch('assets/js/**/*.*', function (e){
    if (e.type === 'deleted') {
      rimraf(path.resolve('online', path.relative(base, e.path)));
    } else {
      gulp.src(e.path, { base: 'assets/js' })
        .pipe(plumber())
        .pipe(transport({
          alias: alias,
          include: 'self',
          cache: false,
          oncsspath: function (path){
            return path.replace('assets/', 'online/')
          }
        }))
        .pipe(gulp.dest('online/js'))
        .on('end', complete);
    }
  });

  // watch all file
  gulp.watch('assets/?(images|loader)/**/*.*', function (e){
    if (e.type === 'deleted') {
      rimraf(path.resolve('online', path.relative(base, e.path)));
    } else {
      gulp.src(e.path, { base: 'assets' })
        .pipe(plumber())
        .pipe(gulp.dest('online'))
        .on('end', complete);
    }
  });
});
