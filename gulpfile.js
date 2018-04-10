/**
 * @module gulpfile
 * @license MIT
 * @version 2018/03/26
 */

'use strict';

const util = require('util');
const gulp = require('gulp');
const rimraf = require('del');
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
const CSS_LOADER = '/static/develop/loader/css-loader.js';
const IGNORE = new Set(['static/develop/js/base/jquery/**/*', CSS_LOADER.slice(1)]);

// Plumber configure
const plumberOpts = {
  /**
   * @method errorHandler
   * @param {Error} error
   */
  errorHandler(error) {
    return logger.error(inspectError(error));
  }
};

/**
 * @function unixify
 * @param {string} path
 * @returns {string}
 */
function unixify(path) {
  return path.replace(/\\/g, '/');
}

/**
 * @function progress
 * @description Show progress logger
 */
function progress() {
  return through(function(vinyl, encoding, next) {
    const file = chalk.reset.green(unixify(join(vinyl.base, vinyl.relative)));
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
  error = util.inspect(error, { colors: true });
  error = error.replace(/^\{\s*|\}\s*$/g, '');

  return `${error}\x07`;
}

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
          vinyl.contents = Buffer.from(result.code);
        }

        next(null, vinyl);
      }),
      css: through(async function(vinyl, encoding, next) {
        try {
          const result = await cssnano.process(vinyl.contents.toString(), { safe: true });

          vinyl.contents = Buffer.from(result.css);
        } catch (error) {
          logger.error(inspectError(error));
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

  if (!path.startsWith('/')) {
    path = join(dirname(referer), path);
    path = '/' + unixify(relative(ROOT, path));
  }

  return path.replace('/static/develop/', '/static/product/');
}

/**
 * @function resolveMap
 * @description Resolve map path
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
  return function images() {
    return gulp
      .src('static/develop/images/**/*', { base: 'static/develop/images', nodir: true })
      .pipe(plumber(plumberOpts))
      .pipe(progress())
      .pipe(gulp.dest('static/product/images'));
  };
}

/**
 * @function script
 * @param {boolean} product
 */
function script(product) {
  let uid = 0;
  const manifest = new Map();
  const skipCache = new Map();

  /**
   * @function skipMinifyId
   * @param {string} path
   * @returns {boolean}
   */
  function skipMinifyId(path) {
    if (skipCache.has(path)) return skipCache.get(path);

    const src = unixify(path);
    const skipped = src.includes('/jquery.js') || src.includes('/css-loader.js');

    skipCache.set(path, skipped);

    return skipped;
  }

  /**
   * @function map
   * @param {string} path
   * @param {string} resolved
   * @returns {string}
   */
  function map(path, resolved) {
    if (product && !skipMinifyId(resolved)) {
      if (manifest.has(resolved)) return manifest.get(resolved);

      const id = String(uid++);

      manifest.set(resolved, id);

      return id;
    }

    return resolveMap(path);
  }
  /**
   * @function isBootstrapScript
   * @param {string} path
   * @returns {boolean}
   */
  function isBootstrapScript(path) {
    return extname(path).toLowerCase() === '.js' && /[\\/]view[\\/]/.test(path);
  }

  function common() {
    return gulp
      .src('static/develop/js/view/common.js', { base: 'static/develop/js', nodir: true, allowEmpty: true })
      .pipe(plumber(plumberOpts))
      .pipe(progress())
      .pipe(
        cmd({
          map: (path, resolved) => {
            if (product) {
              IGNORE.add(resolved);
            }

            return map(path, resolved);
          },
          combine: product,
          alias: getAlias(),
          indent: product ? 0 : 2,
          base: 'static/develop/js',
          ignore: product ? [...IGNORE] : [],
          css: { onpath, loader: CSS_LOADER },
          plugins: [cmdAddons({ minify: product, sourceMaps: !product })]
        })
      )
      .pipe(
        through((vinyl, encoding, next) => {
          if (!product) return next(null, vinyl);

          const path = vinyl.path;
          const id = manifest.has(path) ? manifest.get(path) : '/static/product/js/view/common.js';
          const entry = Buffer.from(`${product ? '' : '\n\n'}seajs.use(${JSON.stringify(id)});`);

          vinyl.contents = Buffer.concat([vinyl.contents, entry]);

          return next(null, vinyl);
        })
      )
      .pipe(gulp.dest('static/product/js'));
  }

  function script() {
    return gulp
      .src(['static/develop/js/**/*', '!static/develop/js/view/common.js'], {
        base: 'static/develop/js',
        nodir: true
      })
      .pipe(plumber(plumberOpts))
      .pipe(progress())
      .pipe(
        cmd({
          map,
          alias: getAlias(),
          indent: product ? 0 : 2,
          base: 'static/develop/js',
          ignore: product ? [...IGNORE] : [],
          css: { onpath, loader: CSS_LOADER },
          plugins: [cmdAddons({ minify: product, sourceMaps: !product })],
          combine: module => product && unixify(module).includes('/js/view/')
        })
      )
      .pipe(
        through((vinyl, encoding, next) => {
          if (!product) return next(null, vinyl);

          const path = vinyl.path;

          if (isBootstrapScript(path)) {
            const id = manifest.has(path)
              ? manifest.get(path)
              : ('/' + unixify(relative(ROOT, path))).replace('/static/develop/', '/static/product/');

            const entry = Buffer.from(`${product ? '' : '\n\n'}seajs.use(${JSON.stringify(id)});`);

            vinyl.contents = Buffer.concat([vinyl.contents, entry]);
          }

          return next(null, vinyl);
        })
      )
      .pipe(gulp.dest('static/product/js'));
  }

  return gulp.series(common, script);
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
gulp.task('default', gulp.series(clean, gulp.parallel(runtime(), images(), script(), style())));

// Task product
gulp.task('product', gulp.series(clean, gulp.parallel(runtime(true), images(true), script(true), style(true))));

// Task watch
gulp.task('watch', gulp.series('default', watching));
