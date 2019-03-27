/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

const gulp = require('gulp');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const del = require('del');
const spawn = require('child_process').spawn;
const browserSync = require('browser-sync');
const change = require('gulp-change');
const sass = require('gulp-sass');

sass.compiler = require('node-sass');

/**
 * Cleans the prpl-server build in the server directory.
 */
gulp.task('prpl-server:clean', () => {
  return del('server/build');
});

/**
 * Copies the prpl-server build to the server directory while renaming the
 * node_modules directory so services like App Engine will upload it.
 */
gulp.task('prpl-server:build', () => {
  const pattern = 'node_modules';
  const replacement = 'node_assets';

  return gulp.src('build/**')
    .pipe(rename(((path) => {
      path.basename = path.basename.replace(pattern, replacement);
      path.dirname = path.dirname.replace(pattern, replacement);
    })))
    .pipe(replace(pattern, replacement))
    .pipe(gulp.dest('server/build'));
});

gulp.task('prpl-server', gulp.series(
  'prpl-server:clean',
  'prpl-server:build'
));


gulp.task('browser-sync', () => {
  setTimeout(() => {
    browserSync.init({
      proxy: 'http://localhost:8080',
      open: true
    })
  }, 10000);
});

gulp.task('sass', () => {
  return gulp.src('src/**/*.scss')
    .pipe(sass({
      includePaths: ['./node_modules']
    }).on('error', sass.logError))
    .pipe(change(content => `
      import { css } from 'lit-element';

      export default css \`
        ${content}
      \`;
    `)).pipe(rename(file => {
      file.extname = '.css.ts'
    })).pipe(gulp.dest('src'));
})

/**
 * Gulp task to run `tsc --watch` and `polymer serve` in parallel.
 */
gulp.task('serve', () => {
  const spawnOptions = {
    // `shell` option for Windows compatability. See:
    // https://nodejs.org/api/child_process.html#child_process_spawning_bat_and_cmd_files_on_windows
    shell: true,
    stdio: 'inherit'
  };
  spawn('tsc', ['--watch'], spawnOptions);
  spawn('polymer', ['serve', '--port 8080'], spawnOptions);
});

gulp.task('sass:watch', () => {
  return gulp.watch('src/**/*.scss', gulp.parallel('sass'));
})

gulp.task('js:watch', () => {
  return gulp.watch('src/**/*.js').on('change', browserSync.reload);
});

gulp.task('start', gulp.parallel('sass', 'serve', 'browser-sync', 'sass:watch', 'js:watch'));
