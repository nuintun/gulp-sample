/**
 * @module gulpfile
 * @license MIT
 * @version 2018/03/26
 */

'use strict';

const util = require('util');
const gulp = require('gulp');
const rimraf = require('del');
const cdeps = require('cmd-deps');
const holding = require('holding');
const cssnano = require('cssnano');
const uglify = require('uglify-es');
const chokidar = require('chokidar');
const concat = require('gulp-concat');
const plumber = require('gulp-plumber');
const css = require('@nuintun/gulp-css');
const cmd = require('@nuintun/gulp-cmd');
const cmdAddons = require('@nuintun/gulp-cmd-plugins');
const cssAddons = require('@nuintun/gulp-css-plugins');
const switchStream = require('@nuintun/switch-stream');
const { join, relative, dirname, extname, resolve } = require('path');

const { chalk, logger } = cmd;
const { through } = switchStream;

const ROOT = process.cwd();
const RUNTIME = ['static/develop/loader/sea.js'];
const CSS_LOADER = 'base/css-loader/1.0.0/css-loader';
const IGNORE = ['jquery', CSS_LOADER];

// Plumber configure
const plumberOpts = {
  errorHandler(error) {
    return logger.error(inspectError(error));
  }
};

/**
 * @function progress
 * @description Show progress logger
 */
function progress() {
  return through(function(vinyl, encoding, next) {
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
  error = util.inspect(error);
  error = error.replace(/^\{\s*|\}\s*$/g, '');

  return `${error}\x07`;
}

/**
 * @function toBuffer
 * @param {string} string
 * @returns {Buffer}
 */
const toBuffer = Buffer.from ? Buffer.from : string => new Buffer(string);

/**
 * @function compress
 * @description Compress javascript file
 */
function compress() {
  return switchStream(
    vinyl => {
      return extname(vinyl.path)
        .slice(1)
        .toLowerCase();
    },
    {
      js: through(function(vinyl, encoding, next) {
        const path = vinyl.path;
        const contents = vinyl.contents.toString();
        const options = { ecma: 5, ie8: true, mangle: { eval: true } };
        const result = uglify.minify({ [path]: contents }, options);

        if (result.error) {
          logger.error(inspectError(result.error));
        } else {
          vinyl.contents = toBuffer(result.code);
        }

        next(null, vinyl);
      }),
      css: through(function(vinyl, encoding, next) {
        try {
          const result = cssnano.process(vinyl.contents.toString(), { safe: true });

          vinyl.contents = toBuffer(result.css);
        } catch (error) {
          logger.error(inspectError(result.error));
        }

        next(null, vinyl);
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
 * @function unixify
 * @param {string} path
 */
function unixify(path) {
  return path.replace(/\\/g, '/');
}

/**
 * @function onpath
 * @description Resolve css path
 * @param {string} prop
 * @param {string} path
 * @param {string} referer
 * @returns {string}
 */
function onpath(prop, path, referer) {
  if (/^(?:[a-z0-9.+-]+:)?\/\/|^data:\w+?\/\w+?[,;]/i.test(path)) {
    return path;
  }

  if (/^[^./\\]/.test(path)) {
    path = './' + path;
  }

  if (!path.startsWith('/')) {
    path = join(dirname(referer), path);
    path = '/' + unixify(relative(ROOT, path));
  }

  return path.replace('/static/develop/', '/static/product/');
}

/**
 * @function resolveMap
 * @description Resolve js path
 * @param {string} path
 * @returns {string}
 */
function resolveMap(path) {
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
  product = Boolean(product);

  return function runtime() {
    // Loader file
    return gulp
      .src(RUNTIME, { base: 'static/develop/loader', nodir: true })
      .pipe(plumber(plumberOpts))
      .pipe(progress())
      .pipe(concat('sea.js'))
      .pipe(product ? compress() : through())
      .pipe(gulp.dest('static/product/loader'));
  };
}

/**
 * @function images
 * @param {boolean} product
 */
function images(product) {
  product = Boolean(product);

  return function images() {
    return gulp
      .src('static/develop/images/**/*', { base: 'static/develop/images', nodir: true })
      .pipe(plumber(plumberOpts))
      .pipe(progress())
      .pipe(gulp.dest('static/product/images'));
  };
}

/**
 * @function common
 * @param {boolean} product
 */
function common(product) {
  product = Boolean(product);

  return function common() {
    return gulp
      .src('static/develop/js/view/common.js', { base: 'static/develop/js', nodir: true, allowEmpty: true })
      .pipe(plumber(plumberOpts))
      .pipe(progress())
      .pipe(
        cmd({
          ignore: IGNORE,
          map: resolveMap,
          combine: product,
          alias: getAlias(),
          indent: product ? 0 : 2,
          base: 'static/develop/js',
          css: { onpath, loader: CSS_LOADER },
          plugins: [cmdAddons({ minify: product })]
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
    .pipe(plumber(plumberOpts))
    .pipe(
      cmd({
        combine: true,
        ignore: IGNORE,
        map: resolveMap,
        alias: getAlias(),
        base: 'static/develop/js',
        css: { onpath, loader: CSS_LOADER }
      })
    )
    .pipe(
      through(function(vinyl, encoding, next) {
        cdeps(vinyl.contents).dependencies.forEach(item => {
          IGNORE.push(item.path);
        });

        next(null, vinyl);
      })
    );
}

/**
 * @function script
 * @param {boolean} product
 */
function script(product) {
  product = Boolean(product);

  function script() {
    return gulp
      .src('static/develop/js/**/*', { base: 'static/develop/js', nodir: true })
      .pipe(plumber(plumberOpts))
      .pipe(progress())
      .pipe(
        cmd({
          map: resolveMap,
          combine: product,
          alias: getAlias(),
          indent: product ? 0 : 2,
          base: 'static/develop/js',
          ignore: product ? IGNORE : [],
          css: { onpath, loader: CSS_LOADER },
          plugins: [cmdAddons({ minify: product })]
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
  product = Boolean(product);

  return function style() {
    return gulp
      .src(product ? 'static/develop/css/?(base|view)/**/*' : 'static/develop/css/**/*', {
        base: 'static/develop/css',
        nodir: true
      })
      .pipe(plumber(plumberOpts))
      .pipe(progress())
      .pipe(
        css({
          onpath,
          map: resolveMap,
          combine: product,
          plugins: [cssAddons({ minify: product })]
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
        .pipe(plumber(plumberOpts))
        .pipe(
          cmd({
            combine: false,
            map: resolveMap,
            alias: getAlias(),
            plugins: [cmdAddons()],
            base: 'static/develop/js',
            css: { onpath, loader: CSS_LOADER }
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
        .pipe(plumber(plumberOpts))
        .pipe(
          css({
            onpath,
            combine: false,
            map: resolveMap,
            plugins: [cssAddons()]
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
        .pipe(plumber(plumberOpts))
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
