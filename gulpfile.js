/**
 * @module gulpfile
 * @license MIT
 * @version 2017/11/13
 */

'use strict';

const util = require('util');
const path = require('path');
const join = path.join;
const relative = path.relative;
const dirname = path.dirname;
const extname = path.extname;
const resolve = path.resolve;
const gulp = require('gulp');
const rimraf = require('del');
const css = require('@nuintun/gulp-css');
const cmd = require('@nuintun/gulp-cmd');
const chalk = cmd.chalk;
const holding = require('holding');
const cssnano = require('cssnano');
const uglify = require('uglify-es');
const chokidar = require('chokidar');
const plumber = require('gulp-plumber');
const cmdAddons = require('@nuintun/gulp-cmd-plugins');
const cssAddons = require('@nuintun/gulp-css-plugins');
const switchStream = require('@nuintun/switch-stream');

// alias
const alias = {
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
// Bookmark
let bookmark = Date.now();

/**
 * @function progress
 * @description Show progress logger
 * @param {Function} print
 */
function progress(print) {
  return switchStream.through(function(vinyl, encoding, next) {
    const info = chalk.reset.reset('process: ')
      + chalk.reset.green(join(vinyl.base, vinyl.relative).replace(/\\/g, '/'));

    if (print) {
      print(info);
    } else {
      process.stdout.write(chalk.reset.bold.cyan('  gulp-odd ') + info + '\n');
    }

    next(null, vinyl);
  });
}

/**
 * @function finish
 * @description Build finish function
 */
function finish() {
  const now = new Date();

  console.log(
    '  %s [%s] build complete... %s',
    chalk.reset.green.bold.inverse(' √ DONE '),
    dateFormat(now),
    chalk.reset.green('+' + (now - bookmark) + 'ms')
  );
}

/**
 * @function inspectError
 * @param {Error} error
 * @returns {string}
 */
function inspectError(error) {
  return util
    .inspect(error)
    .replace(/^\{\s*|\}\s*$/g, '');
}

/**
 * @function compress
 * @description Compress javascript file
 */
function compress() {
  return switchStream((vinyl) => {
    if (extname(vinyl.path) === '.js') {
      return 'js';
    }

    if (extname(vinyl.path) === '.css') {
      return 'css';
    }
  }, {
    js: switchStream.through(function(vinyl, encoding, next) {
      const result = uglify.minify(vinyl.contents.toString(), {
        ecma: 5,
        ie8: true,
        mangle: { eval: true }
      });

      if (result.error) {
        process.stdout.write(chalk.reset.bold.cyan('  gulp-odd ') + inspectError(result.error) + '\n');
      } else {
        vinyl.contents = new Buffer(result.code);
      }

      this.push(vinyl);
      next();
    }),
    css: switchStream.through(function(vinyl, encoding, next) {
      cssnano
        .process(vinyl.contents.toString(), { safe: true })
        .then((result) => {
          vinyl.contents = new Buffer(result.css);

          context.push(vinyl);
          next();
        })
        .catch((error) => {
          process.stdout.write(chalk.reset.bold.cyan('  gulp-odd ') + inspectError(result.error) + '\n');
          next();
        });
    })
  });
}

/**
 * @function watch
 * @description Files watch
 * @param {string|Array<string>} glob
 * @param {Object} options
 * @param {Function} callabck
 */
function watch(glob, options, callabck) {
  if (typeof options === 'function') {
    callabck = options;
    options = {};
  }

  // Ignore initial add event
  options.ignoreInitial = true;
  // Ignore permission errors
  options.ignorePermissionErrors = true;

  // Get watcher
  const watcher = chokidar.watch(glob, options);

  // Bind event
  if (callabck) {
    watcher.on('all', callabck);
  }

  // Return watcher
  return watcher;
}

/**
 * @function resolveCSSPath
 * @description Resolve css path
 * @param {string} path
 * @param {string} file
 * @param {string} wwwroot
 */
function resolveCSSPath(path, file, wwwroot) {
  if (/^[^./\\]/.test(path)) {
    path = './' + path;
  }

  if (path.charAt(0) === '.') {
    path = join(dirname(file), path);
    path = relative(wwwroot, path);
    path = '/' + path;
    path = path.replace(/\\+/g, '/');
  }

  return path.replace('/static/develop/', '/static/product/');
}

/**
 * @function resolveMapPath
 * @description Resolve js path
 * @param {string} path
 */
function resolveMapPath(path) {
  return path.replace('/static/develop/', '/static/product/');
}

/**
 * @function dateFormat
 * @description Date format
 * @param {Date} date
 * @param {string} format
 */
function dateFormat(date, format) {
  // 参数错误
  if (!date instanceof Date) {
    throw new TypeError('Param date must be a Date.');
  }

  format = format || 'yyyy-MM-dd hh:mm:ss';

  const map = {
    'M': date.getMonth() + 1, // 月份
    'd': date.getDate(), // 日
    'h': date.getHours(), // 小时
    'm': date.getMinutes(), // 分
    's': date.getSeconds(), // 秒
    'q': Math.floor((date.getMonth() + 3) / 3), // 季度
    'S': date.getMilliseconds() // 毫秒
  };

  format = format.replace(/([yMdhmsqS])+/g, (all, t) => {
    let v = map[t];

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

// Clean task
gulp.task('clean', () => {
  bookmark = Date.now();

  rimraf.sync('static/product');
});

// Runtime task
gulp.task('runtime', ['clean'], () => {
  // Loader file
  gulp
    .src('static/develop/loader/**/*.js', { base: 'static/develop', nodir: true })
    .pipe(plumber())
    .pipe(progress())
    .pipe(gulp.dest('static/product'));

  // Image file
  gulp
    .src('static/develop/images/**/*', { base: 'static/develop', nodir: true })
    .pipe(plumber())
    .pipe(progress())
    .pipe(gulp.dest('static/product'));
});

// Runtime product task
gulp.task('runtime-product', ['clean'], () => {
  // Loader file
  gulp
    .src('static/develop/loader/**/*.js', { base: 'static/develop', nodir: true })
    .pipe(plumber())
    .pipe(progress())
    .pipe(compress())
    .pipe(gulp.dest('static/product'));

  // Image file
  gulp
    .src('static/develop/images/**/*', { base: 'static/develop', nodir: true })
    .pipe(plumber())
    .pipe(progress())
    .pipe(gulp.dest('static/product'));
});

// Product task
gulp.task('product', ['runtime-product'], () => {
  // Complete callback
  const complete = holding(1, () => {
    finish();
    process.stdout.write('\x07');
  });

  // JS files
  gulp
    .src('static/develop/js/**/*', { base: 'static/develop/js', nodir: true })
    .pipe(plumber())
    .pipe(progress(cmd.print))
    .pipe(cmd({
      alias: alias,
      map: resolveMapPath,
      ignore: ['jquery'],
      base: 'static/develop/js',
      css: { onpath: resolveCSSPath },
      plugins: cmdAddons({ minify: true }),
      include: (id) => {
        return id && id.indexOf('view') === 0 ? 'all' : 'self';
      }
    }))
    .pipe(gulp.dest('static/product/js'))
    .on('finish', complete);

  // CSS files
  gulp
    .src('static/develop/css/?(base|view)/**/*', { base: 'static/develop', nodir: true })
    .pipe(plumber())
    .pipe(progress(css.print))
    .pipe(css({
      include: true,
      map: resolveMapPath,
      onpath: resolveCSSPath,
      plugins: cssAddons({ minify: true })
    }))
    .pipe(gulp.dest('static/product'))
    .on('finish', complete);
});

// Develop task
gulp.task('default', ['runtime'], () => {
  // Complete callback
  const complete = holding(1, () => {
    finish();
    process.stdout.write('\x07');
  });

  // JS files
  gulp
    .src('static/develop/js/**/*', { base: 'static/develop/js', nodir: true })
    .pipe(plumber())
    .pipe(progress(cmd.print))
    .pipe(cmd({
      alias: alias,
      include: 'self',
      base: 'static/develop/js',
      map: resolveMapPath,
      plugins: cmdAddons(),
      css: { onpath: resolveCSSPath }
    }))
    .pipe(gulp.dest('static/product/js'))
    .on('finish', complete);

  // CSS files
  gulp
    .src('static/develop/css/**/*', { base: 'static/develop', nodir: true })
    .pipe(plumber())
    .pipe(progress(css.print))
    .pipe(css({
      map: resolveMapPath,
      onpath: resolveCSSPath,
      plugins: cssAddons()
    }))
    .pipe(gulp.dest('static/product'))
    .on('finish', complete);
});

// Develop watch task
gulp.task('watch', ['default'], () => {
  const base = join(process.cwd(), 'static/develop');

  /**
   * @function debugWatcher
   * @param {string} event
   * @param {string} path
   */
  function debugWatcher(event, path) {
    console.log(
      '  %s %s: %s',
      chalk.reset.green.bold.inverse(' • WAIT '),
      event,
      chalk.reset.green(join('static/develop', path).replace(/\\/g, '/'))
    );
  }

  // Watch js files
  watch('static/develop/js', (event, path) => {
    const rpath = relative(base, path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('static/product', rpath));
      finish();
    } else {
      gulp
        .src(path, { base: 'static/develop/js' })
        .pipe(plumber())
        .pipe(cmd({
          cache: false,
          alias: alias,
          include: 'self',
          base: 'static/develop/js',
          map: resolveMapPath,
          plugins: cmdAddons(),
          css: { onpath: resolveCSSPath }
        }))
        .pipe(gulp.dest('static/product/js'))
        .on('finish', finish);
    }
  });

  // Watch css files
  watch('static/develop/css', (event, path) => {
    var rpath = relative(base, path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('static/product', relative(base, path)));
      finish();
    } else {
      gulp
        .src(path, { base: 'static/develop' })
        .pipe(plumber())
        .pipe(css({
          map: resolveMapPath,
          onpath: resolveCSSPath,
          plugins: cssAddons()
        }))
        .pipe(gulp.dest('static/product'))
        .on('finish', finish);
    }
  });

  // Watch image files
  watch('static/develop/images', (event, path) => {
    const rpath = relative(base, path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('static/product', relative(base, path)));
      finish();
    } else {
      gulp
        .src(path, { base: 'static/develop' })
        .pipe(plumber())
        .pipe(gulp.dest('static/product'))
        .on('finish', finish);
    }
  });
});
