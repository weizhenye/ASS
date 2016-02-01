var gulp = require('gulp');
var concat = require('gulp-concat');
var fileInsert = require("gulp-file-insert");
var minifyCSS = require('gulp-minify-css');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var umd = require('gulp-umd');

var srcFiles = [
  './src/index.js',
  './tmp/global.js',
  './src/uuid.js',
  './src/parser/ass.js',
  './src/parser/dialogue.js',
  './src/parser/drawing.js',
  './src/parser/effect.js',
  './src/parser/format.js',
  './src/parser/style.js',
  './src/parser/tags.js',
  './src/parser/time.js',
  './src/renderer/renderer.js',
  './src/renderer/animation.js',
  './src/renderer/border-and-shadow.js',
  './src/renderer/clip.js',
  './src/renderer/collision.js',
  './src/renderer/drawing.js',
  './src/renderer/font-size.js',
  './src/renderer/rgba.js',
  './src/renderer/transform.js',
];

gulp.task('minify-css', function() {
  return gulp.src('./src/ass.css')
    .pipe(minifyCSS())
    .pipe(rename({extname: '.min.css'}))
    .pipe(gulp.dest('./tmp/'));
});

gulp.task('insert-css', ['minify-css'], function() {
  return gulp.src('./src/global.js')
    .pipe(fileInsert({
      '__ASS_MIN_CSS__': './tmp/ass.min.css'
    }))
    .pipe(gulp.dest('./tmp/'));
});

gulp.task('build', ['insert-css'], function() {
  return gulp.src(srcFiles)
    .pipe(concat('ass.js'))
    .pipe(umd({
      exports: function() {
        return 'ASS';
      },
      namespace: function() {
        return 'ASS';
      }
    }))
    .pipe(gulp.dest('./dist/'))
    .pipe(uglify())
    .pipe(rename({extname: '.min.js'}))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['build']);

gulp.watch('src/**/*.*', ['default']);
