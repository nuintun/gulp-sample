/**
 * Created by nuintun on 2015/5/5.
 */

'use strict';

var path = require('path');
var gulp = require('gulp');
var rimraf = require('del');
var uglify = require('gulp-uglify');
var css = require('gulp-css');
var cmd = require('gulp-cmd');
var plumber = require('gulp-plumber');
var colors = cmd.colors;

// alias
var alias = {
  'import-style': 'util/import-style/1.0.0/import-style',
  'jquery': 'base/jquery/1.11.3/jquery',
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

var startTime = Date.now();

// clean task
gulp.task('clean', function (callback){
  startTime = Date.now();

  rimraf('online', callback);
});

// runtime task
gulp.task('runtime', ['clean'], function (){
  gulp.src('assets/loader/**/*.js', { base: 'assets' })
    .pipe(uglify())
    .pipe(gulp.dest('online'));

  gulp.src('assets/!(loader|js|css)/**/*.*', { base: 'assets' })
    .pipe(gulp.dest('online'));
});

// online task
gulp.task('online', ['runtime'], function (){
  var tasks = 3;

  // complete callback
  function complete(){
    if (--tasks) return;

    var now = new Date();

    console.log(
      '  %s [%s] build complete ... %s%s',
      colors.green.bold('gulp-online'),
      now.toLocaleString(),
      colors.green(now - startTime),
      colors.cyan('ms')
    );
  }

  // all js
  gulp.src('assets/js/**/*.js', { base: 'assets/js' })
    .pipe(cmd({
      alias: alias,
      ignore: ['jquery'],
      include: function (id){
        return id.indexOf('view') === 0 ? 'all' : 'self';
      },
      css: {
        onpath: function (path){
          // TODO 注意相对路径要转换为绝对路径，建议样式中的资源路径使用绝对路径
          return path.replace('assets/', 'online/')
        }
      }
    }))
    .pipe(uglify())
    .pipe(gulp.dest('online/js'))
    .on('end', complete);

  // other file
  gulp.src('assets/js/**/*.!(js|css|json|tpl|html)')
    .pipe(gulp.dest('online/js'))
    .on('end', complete);

  // css
  gulp.src('assets/css/?(base|view)/**/*.*', { base: 'assets' })
    .pipe(css({
      compress: true,
      onpath: function (path){
        return path.replace('assets/', 'online/')
      }
    }))
    .pipe(gulp.dest('online'))
    .on('end', complete);
});

// develop task
gulp.task('default', ['runtime'], function (){
  var tasks = 2;

  // complete callback
  function complete(){
    if (--tasks) return;

    var now = new Date();

    console.log(
      '  %s [%s] build complete ... %s%s',
      colors.green.bold('gulp-default'),
      now.toLocaleString(),
      colors.green(now - startTime),
      colors.cyan('ms')
    );
  }

  // all file
  gulp.src('assets/js/**/*.*', { base: 'assets/js' })
    .pipe(cmd({
      alias: alias,
      include: 'self',
      css: {
        onpath: function (path){
          // TODO 注意相对路径要转换为绝对路径，建议样式中的资源路径使用绝对路径
          return path.replace('assets/', 'online/')
        }
      }
    }))
    .pipe(gulp.dest('online/js'))
    .on('end', complete);

  gulp.src('assets/css/?(base|view)/**/*.*', { base: 'assets' })
    .pipe(css({
      onpath: function (path){
        return path.replace('assets/', 'online/')
      }
    }))
    .pipe(gulp.dest('online'))
    .on('end', complete);
});

// develop watch task
gulp.task('watch', ['default'], function (){
  var base = path.join(process.cwd(), 'assets');

  // complete callback
  function complete(){
    var now = new Date();

    console.log(
      '  %s [%s] build complete ... %s%s',
      colors.green.bold('gulp-watch'),
      now.toLocaleString(),
      colors.green(now - startTime),
      colors.cyan('ms')
    );
  }

  // watch all file
  gulp.watch('assets/js/**/*.*', function (e){
    if (e.type === 'deleted') {
      rimraf(path.resolve('online', path.relative(base, e.path)));
    } else {
      startTime = Date.now();

      gulp.src(e.path, { base: 'assets/js' })
        .pipe(plumber())
        .pipe(cmd({
          alias: alias,
          include: 'self',
          cache: false,
          css: {
            onpath: function (path){
              return path.replace('assets/', 'online/')
            }
          }
        }))
        .pipe(gulp.dest('online/js'))
        .on('end', complete);
    }
  });

  // watch all file
  gulp.watch('assets/css/?(base|view)/**/*.*', function (e){
    if (e.type === 'deleted') {
      rimraf(path.resolve('online', path.relative(base, e.path)));
    } else {
      startTime = Date.now();

      gulp.src(e.path, { base: 'assets' })
        .pipe(plumber())
        .pipe(css({
          onpath: function (path){
            return path.replace('assets/', 'online/')
          }
        }))
        .pipe(gulp.dest('online'))
        .on('end', complete);
    }
  });

  // watch all file
  gulp.watch('assets/!(loader|js|css)/**/*.*', function (e){
    if (e.type === 'deleted') {
      rimraf(path.resolve('online', path.relative(base, e.path)));
    } else {
      startTime = Date.now();

      gulp.src(e.path, { base: 'assets' })
        .pipe(plumber())
        .pipe(gulp.dest('online'))
        .on('end', complete);
    }
  });
});
