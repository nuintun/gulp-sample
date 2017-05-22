/**
 * Created by nuintun on 2015/5/5.
 */

'use strict';

// 强制打开彩色控制台
// process.env.DEBUG_COLORS = 'true';
// 开启 DEBUG 开关
// process.env.DEBUG = 'gulp-css,gulp-cmd';

var path = require('path');
var join = path.join;
var relative = path.relative;
var dirname = path.dirname;
var extname = path.extname;
var resolve = path.resolve;
var gulp = require('gulp');
var rimraf = require('del');
var css = require('@nuintun/gulp-css');
var cmd = require('@nuintun/gulp-cmd');
var colors = cmd.colors;
var pedding = require('pedding');
var cssnano = require('cssnano');
var uglify = require('uglify-js');
var chokidar = require('chokidar');
var plumber = require('gulp-plumber');
var switchStream = require('@nuintun/switch-stream');

// alias
var alias = {
  'css-loader': 'util/css-loader/1.0.0/css-loader',
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
  'overlay': 'common/overlay/1.2.0/',
  'dialog': 'common/dialog/1.5.1/dialog',
  'confirmbox': 'common/dialog/1.5.1/confirmbox'
};
// bookmark
var bookmark = Date.now();

// compress javascript file
function compress() {
  return switchStream(function(vinyl) {
    if (extname(vinyl.path) === '.js') {
      return 'js';
    }

    if (extname(vinyl.path) === '.css') {
      return 'css';
    }
  }, {
    js: switchStream.through(function(vinyl, encoding, next) {
      try {
        var result = uglify.minify(vinyl.contents.toString(), {
          compress: { ie8: true },
          mangle: { ie8: true, eval: true },
          output: { ie8: true }
        });

        vinyl.contents = new Buffer(result.code);
      } catch (error) {
        // no nothing
      }

      this.push(vinyl);
      next();
    }),
    css: switchStream.through(function(vinyl, encoding, next) {
      var context = this;

      cssnano.process(vinyl.contents.toString(), { safe: true }).then(function(result) {
        vinyl.contents = new Buffer(result.css);

        context.push(vinyl);
        next();
      });
    })
  });
}

// rewrite cmd plugins
var CMDPLUGINS = {
  css: function(vinyl, options, next) {
    var context = this;

    cssnano.process(vinyl.contents.toString(), { safe: true }).then(function(result) {
      vinyl.contents = new Buffer(result.css);

      cmd.defaults.plugins.css.exec(vinyl, options, function(vinyl) {
        try {
          var result = uglify.minify(vinyl.contents.toString(), {
            compress: { ie8: true },
            mangle: { ie8: true, eval: true },
            output: { ie8: true }
          });

          vinyl.contents = new Buffer(result.code);
        } catch (error) {
          // no nothing
        }

        context.push(vinyl);
        next();
      });
    });
  }
};

['js', 'json', 'tpl', 'html'].forEach(function(name) {
  CMDPLUGINS[name] = function(vinyl, options, next) {
    var context = this;
    // transform
    cmd.defaults.plugins[name].exec(vinyl, options, function(vinyl) {
      try {
        var result = uglify.minify(vinyl.contents.toString(), {
          compress: { ie8: true },
          mangle: { ie8: true, eval: true },
          output: { ie8: true }
        });

        vinyl.contents = new Buffer(result.code);
      } catch (error) {
        // no nothing
      }

      context.push(vinyl);
      next();
    });
  }
});

// rewrite css plugins
var CSSPLUGINS = {
  css: function(vinyl, options, next) {
    var context = this;

    cssnano.process(vinyl.contents.toString(), { safe: true }).then(function(result) {
      vinyl.contents = new Buffer(result.css);

      css.defaults.plugins.css.exec(vinyl, options, function(vinyl) {
        context.push(vinyl);
        next();
      });
    });
  }
};

// file watch
function watch(glob, options, callabck) {
  if (typeof options === 'function') {
    callabck = options;
    options = {};
  }

  // ignore initial add event
  options.ignoreInitial = true;
  // ignore permission errors
  options.ignorePermissionErrors = true;

  // get watcher
  var watcher = chokidar.watch(glob, options);

  // bing event
  if (callabck) {
    watcher.on('all', callabck);
  }

  // return watcher
  return watcher;
}

// css resource path
function onpath(path, property, file, wwwroot) {
  if (/^[^./\\]/.test(path)) {
    path = './' + path;
  }

  if (path.indexOf('.') === 0) {
    path = join(dirname(file), path);
    path = relative(wwwroot, path);
    path = '/' + path;
    path = path.replace(/\\+/g, '/');
  }

  path = path.replace('/static/develop/', '/static/product/');

  return path;
}

// date format
function dateFormat(date, format) {
  // 参数错误
  if (!date instanceof Date) {
    throw new TypeError('Param date must be a Date');
  }

  format = format || 'yyyy-MM-dd hh:mm:ss';

  var map = {
    'M': date.getMonth() + 1, //月份
    'd': date.getDate(), //日
    'h': date.getHours(), //小时
    'm': date.getMinutes(), //分
    's': date.getSeconds(), //秒
    'q': Math.floor((date.getMonth() + 3) / 3), //季度
    'S': date.getMilliseconds() //毫秒
  };

  format = format.replace(/([yMdhmsqS])+/g, function(all, t) {
    var v = map[t];

    if (v !== undefined) {
      if (all.length > 1) {
        v = '0' + v;
        v = v.substr(v.length - 2);
      }

      return v;
    } else if (t === 'y') {
      return (date.getFullYear() + '').substr(4 - all.length);
    }

    return all;
  });

  return format;
}

// clean task
gulp.task('clean', function() {
  bookmark = Date.now();

  rimraf.sync('static/product');
});

// runtime task
gulp.task('runtime', ['clean'], function() {
  // loader file
  gulp.src('static/develop/loader/**/*.js', { base: 'static/develop', nodir: true })
    .pipe(gulp.dest('static/product'));

  // image file
  gulp.src('static/develop/images/**/*', { base: 'static/develop', nodir: true })
    .pipe(gulp.dest('static/product'));
});

// runtime product task
gulp.task('runtime-product', ['clean'], function() {
  // loader file
  gulp.src('static/develop/loader/**/*.js', { base: 'static/develop', nodir: true })
    .pipe(compress())
    .pipe(gulp.dest('static/product'));

  // image file
  gulp.src('static/develop/images/**/*', { base: 'static/develop', nodir: true })
    .pipe(gulp.dest('static/product'));
});

// product task
gulp.task('product', ['runtime-product'], function() {
  // complete callback
  var complete = pedding(2, function() {
    var now = new Date();

    console.log(
      '  %s [%s] build complete... √ %s\x07',
      colors.reset.green.bold.inverse(' √ DONE '),
      dateFormat(now),
      colors.reset.green('+' + (now - bookmark) + 'ms')
    );
  });

  // js files
  gulp.src('static/develop/js/**/*', { base: 'static/develop/js', nodir: true })
    .pipe(cmd({
      alias: alias,
      ignore: ['jquery'],
      plugins: CMDPLUGINS,
      include: function(id) {
        return id && id.indexOf('view') === 0 ? 'all' : 'self';
      },
      css: {
        onpath: onpath
      }
    }))
    .pipe(gulp.dest('static/product/js'))
    .on('finish', complete);

  // css files
  gulp.src('static/develop/css/?(base|view)/**/*', { base: 'static/develop', nodir: true })
    .pipe(css({
      include: true,
      onpath: onpath,
      plugins: CSSPLUGINS
    }))
    .pipe(gulp.dest('static/product'))
    .on('finish', complete);
});

// develop task
gulp.task('default', ['runtime'], function() {
  // complete callback
  var complete = pedding(2, function() {
    var now = new Date();

    console.log(
      '  %s [%s] build complete... %s\x07',
      colors.reset.green.bold.inverse(' √ DONE '),
      dateFormat(now),
      colors.reset.green('+' + (now - bookmark) + 'ms')
    );
  });

  // js files
  gulp.src('static/develop/js/**/*', { base: 'static/develop/js', nodir: true })
    .pipe(cmd({
      alias: alias,
      include: 'self',
      css: { onpath: onpath }
    }))
    .pipe(gulp.dest('static/product/js'))
    .on('finish', complete);

  // css files
  gulp.src('static/develop/css/**/*', { base: 'static/develop', nodir: true })
    .pipe(css({ onpath: onpath }))
    .pipe(gulp.dest('static/product'))
    .on('finish', complete);
});

// develop watch task
gulp.task('watch', ['default'], function() {
  var base = join(process.cwd(), 'static/develop');

  // debug watcher
  function debugWatcher(event, path) {
    console.log(
      '  %s %s: %s',
      colors.reset.green.bold.inverse(' CHANGE '),
      event,
      colors.reset.magenta(join('static/develop', path).replace(/\\/g, '/'))
    );
  }

  // complete callback
  function complete() {
    var now = new Date();

    console.log(
      '  %s [%s] build complete... √ %s',
      colors.reset.green.bold.inverse(' √ DONE '),
      dateFormat(now),
      colors.reset.green('+' + (now - bookmark) + 'ms')
    );
  }

  // watch js files
  watch('static/develop/js', function(event, path) {
    var rpath = relative(base, path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('static/product', rpath));
      complete();
    } else {
      gulp.src(path, { base: 'static/develop/js' })
        .pipe(plumber())
        .pipe(cmd({
          alias: alias,
          include: 'self',
          cache: false,
          css: { onpath: onpath }
        }))
        .pipe(gulp.dest('static/product/js'))
        .on('finish', complete);
    }
  });

  // watch css files
  watch('static/develop/css', function(event, path) {
    var rpath = relative(base, path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('static/product', relative(base, path)));
      complete();
    } else {
      gulp.src(path, { base: 'static/develop' })
        .pipe(plumber())
        .pipe(css({
          onpath: function(path) {
            return path.replace('static/develop/', 'static/product/')
          }
        }))
        .pipe(gulp.dest('static/product'))
        .on('finish', complete);
    }
  });

  // watch image files
  watch('static/develop/images', function(event, path) {
    var rpath = relative(base, path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('static/product', relative(base, path)));
      complete();
    } else {
      gulp.src(path, { base: 'static/develop' })
        .pipe(gulp.dest('static/product'))
        .on('finish', complete);
    }
  });
});
