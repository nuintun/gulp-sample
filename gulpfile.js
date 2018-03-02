/**
 * @module gulpfile
 * @license MIT
 * @version 2017/11/16
 */

'use strict';

const util = require('util');
const path = require('path');
const gulp = require('gulp');
const rimraf = require('del');
const css = require('@nuintun/gulp-css');
const cmd = require('@nuintun/gulp-cmd');
const cdeps = require('cmd-deps');
const holding = require('holding');
const cssnano = require('cssnano');
const uglify = require('uglify-es');
const chokidar = require('chokidar');
const concat = require('gulp-concat');
const plumber = require('gulp-plumber');
const cmdAddons = require('@nuintun/gulp-cmd-plugins');
const cssAddons = require('@nuintun/gulp-css-plugins');
const switchStream = require('@nuintun/switch-stream');

const join = path.join;
const relative = path.relative;
const dirname = path.dirname;
const extname = path.extname;
const resolve = path.resolve;
const chalk = cmd.chalk;
const logger = cmd.logger;

const IGNORE = ['jquery'];
const RUNTIME = ['static/develop/loader/sea.js'];
const CSS_LOADER = 'util/css-loader/1.0.0/css-loader';

/**
 * @function progress
 * @description Show progress logger
 */
function progress() {
  return switchStream.through(function(vinyl, encoding, next) {
    const file = chalk.reset.green(join(vinyl.base, vinyl.relative).replace(/\\/g, '/'));
    const info = chalk.reset.reset('Building ') + file;

    logger.info(info);

    next(null, vinyl);
  });
}

/**
 * @function inspectError
 * @param {Error} error
 * @returns {string}
 */
function inspectError(error) {
  return util.inspect(error).replace(/^\{\s*|\}\s*$/g, '');
}

/**
 * @function compress
 * @description Compress javascript file
 */
function compress() {
  return switchStream(
    vinyl => {
      if (extname(vinyl.path) === '.js') {
        return 'js';
      }

      if (extname(vinyl.path) === '.css') {
        return 'css';
      }
    },
    {
      js: switchStream.through(function(vinyl, encoding, next) {
        const result = uglify.minify(vinyl.contents.toString(), {
          ecma: 5,
          ie8: true,
          mangle: { eval: true }
        });

        if (result.error) {
          logger.error(gutil.chalk.reset.red.bold(inspectError(result.error)) + '\x07');
        } else {
          vinyl.contents = new Buffer(result.code);
        }

        this.push(vinyl);
        next();
      }),
      css: switchStream.through(function(vinyl, encoding, next) {
        cssnano
          .process(vinyl.contents.toString(), { safe: true })
          .then(result => {
            vinyl.contents = new Buffer(result.css);

            this.push(vinyl);
            next();
          })
          .catch(error => {
            logger.error(gutil.chalk.reset.red.bold(inspectError(result.error)) + '\x07');
            next();
          });
      })
    }
  );
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
 * @function getAlias
 */
function getAlias() {
  delete require.cache[require.resolve('./alias.json')];

  return require('./alias.json');
}

/**
 * @function resolveCSSPath
 * @description Resolve css path
 * @param {string} path
 * @param {string} file
 * @param {string} wwwroot
 * @returns {string}
 */
function resolveCSSPath(path, file, wwwroot) {
  if (/^data:/.test(path)) {
    return path;
  }

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
 * @returns {string}
 */
function resolveMapPath(path) {
  return path.replace('/static/develop/', '/static/product/');
}

/**
 * @function clean
 */
function clean() {
  return rimraf('static/product');
}

/**
 * @function runtime
 * @param {boolean} product
 */
function runtime(product) {
  return function runtime() {
    // Loader file
    return gulp
      .src(RUNTIME, { base: 'static/develop/loader', nodir: true })
      .pipe(plumber())
      .pipe(progress())
      .pipe(concat('sea.js'))
      .pipe(product ? compress() : switchStream.through())
      .pipe(gulp.dest('static/product/loader'));
  };
}

/**
 * @function images
 * @param {boolean} product
 */
function images(product) {
  return function images() {
    return gulp
      .src('static/develop/images/**/*', { base: 'static/develop/images', nodir: true })
      .pipe(plumber())
      .pipe(progress())
      .pipe(gulp.dest('static/product/images'));
  };
}

/**
 * @function common
 * @param {boolean} product
 */
function common(product) {
  return function common() {
    return gulp
      .src('static/develop/js/view/common.js', { base: 'static/develop/js', nodir: true, allowEmpty: true })
      .pipe(plumber())
      .pipe(progress())
      .pipe(
        cmd({
          ignore: IGNORE,
          alias: getAlias(),
          map: resolveMapPath,
          indent: product ? 0 : 2,
          base: 'static/develop/js',
          include: product ? 'all' : 'self',
          plugins: cmdAddons({ minify: product }),
          css: { onpath: resolveCSSPath, loader: CSS_LOADER }
        })
      )
      .pipe(gulp.dest('static/product/js'));
  };
}

/**
 * @function getIgnore
 */
function getIgnore() {
  return gulp
    .src('static/develop/js/view/common.js', { base: 'static/develop/js', nodir: true, allowEmpty: true })
    .pipe(plumber())
    .pipe(
      cmd({
        cache: false,
        include: 'all',
        ignore: IGNORE,
        alias: getAlias(),
        map: resolveMapPath,
        base: 'static/develop/js',
        css: { onpath: resolveCSSPath, loader: CSS_LOADER }
      })
    )
    .pipe(
      switchStream.through(function(vinyl, encoding, next) {
        cdeps(vinyl.contents).forEach(item => {
          IGNORE.push(item.path);
        });

        this.push(vinyl);
        next();
      })
    );
}

/**
 * @function script
 * @param {boolean} product
 */
function script(product) {
  function script() {
    return gulp
      .src('static/develop/js/**/*', { base: 'static/develop/js', nodir: true })
      .pipe(plumber())
      .pipe(progress())
      .pipe(
        cmd({
          alias: getAlias(),
          map: resolveMapPath,
          indent: product ? 0 : 2,
          base: 'static/develop/js',
          ignore: product ? IGNORE : [],
          plugins: cmdAddons({ minify: product }),
          css: { onpath: resolveCSSPath, loader: CSS_LOADER },
          include: id => {
            return product && id && id.indexOf('view') === 0 ? 'all' : 'self';
          }
        })
      )
      .pipe(gulp.dest('static/product/js'));
  }

  return product ? gulp.series(getIgnore, script) : script;
}

/**
 * @function style
 * @param {boolean} product
 */
function style(product) {
  return function style() {
    return gulp
      .src(product ? 'static/develop/css/?(base|view)/**/*' : 'static/develop/css/**/*', {
        base: 'static/develop/css',
        nodir: true
      })
      .pipe(plumber())
      .pipe(progress())
      .pipe(
        css({
          include: product,
          map: resolveMapPath,
          onpath: resolveCSSPath,
          plugins: cssAddons({ minify: product })
        })
      )
      .pipe(gulp.dest('static/product/css'));
  };
}

/**
 * @function watching
 */
function watching() {
  let bookmark = new Date();
  const base = join(process.cwd(), 'static/develop');

  /**
   * @function finish
   * @description Build finish function
   */
  function finish() {
    const now = new Date();

    logger.info(
      '%s build complete... %s',
      chalk.reset.green.bold.inverse(' √ DONE '),
      chalk.reset.green('+' + (now - bookmark) + 'ms')
    );
  }

  /**
   * @function debugWatcher
   * @param {string} event
   * @param {string} path
   */
  function debugWatcher(event, path) {
    const now = new Date();

    logger.info(
      '%s %s: %s',
      chalk.reset.green.bold.inverse(' • READ '),
      event,
      chalk.reset.green(join('static/develop', path).replace(/\\/g, '/'))
    );
  }

  // Watch js file
  watch('static/develop/js', (event, path) => {
    const rpath = relative(base, path);

    bookmark = new Date();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf(resolve('static/product', rpath)).then(finish);
    } else {
      gulp
        .src(path, { base: 'static/develop/js' })
        .pipe(plumber())
        .pipe(
          cmd({
            cache: false,
            include: 'self',
            alias: getAlias(),
            map: resolveMapPath,
            plugins: cmdAddons(),
            base: 'static/develop/js',
            css: { onpath: resolveCSSPath, loader: CSS_LOADER }
          })
        )
        .pipe(gulp.dest('static/product/js'))
        .on('finish', finish);
    }
  });

  // Watch css file
  watch('static/develop/css', (event, path) => {
    const rpath = relative(base, path);

    bookmark = new Date();
    event = event.toLowerCase();

    debugWatcher(event, rpath);

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf(resolve('static/product', rpath)).then(finish);
    } else {
      gulp
        .src(path, { base: 'static/develop/css' })
        .pipe(plumber())
        .pipe(
          css({
            map: resolveMapPath,
            plugins: cssAddons(),
            onpath: resolveCSSPath
          })
        )
        .pipe(gulp.dest('static/product/css'))
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
      rimraf(resolve('static/product', relative(base, path))).then(finish);
    } else {
      gulp
        .src(path, { base: 'static/develop/images' })
        .pipe(plumber())
        .pipe(gulp.dest('static/product/images'))
        .on('finish', finish);
    }
  });
}

// Task default
gulp.task('default', gulp.series(clean, gulp.parallel(runtime(), images(), common(), script(), style())));

// Task product
gulp.task(
  'product',
  gulp.series(clean, gulp.parallel(runtime(true), images(true), common(true), script(true), style(true)))
);

// Task watch
gulp.task('watch', gulp.series('default', watching));
