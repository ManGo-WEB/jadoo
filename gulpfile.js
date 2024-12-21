const {src, dest, watch, parallel, series} = require('gulp');
const fs = require('fs');

const scss   = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const clean = require('gulp-clean');
const avif = require('gulp-avif');
const webp = require('gulp-webp');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const fonter = require('gulp-fonter');
const ttf2woff2 = require('gulp-ttf2woff2');
const svgSprite = require('gulp-svg-sprite');
const include = require('gulp-include');

function pages() {
  return src('app/pages/*.html')
    .pipe(include({
      includePaths: 'app/components'
    }))
    .pipe(dest('build'))
    .pipe(browserSync.stream())
}

function fonts() {
  return src('app/fonts/**/*.*')
    .pipe(fonter({
      formats: ['woff', 'ttf']
    }))
    .pipe(src('app/fonts/src/*.ttf'))
    .pipe(ttf2woff2())
    .pipe(dest('build/fonts'))
}

function images(){
  return src(['app/img/**/*.*', '!app/img/**/*.svg'])
    .pipe(newer('build/img'))
    .pipe(avif({ quality : 50}))
    .pipe(dest('build/img'))

    .pipe(src(['app/img/**/*.*', '!app/img/**/*.svg']))
    .pipe(newer('build/img'))
    .pipe(webp())
    .pipe(dest('build/img'))

    .pipe(src(['app/img/**/*.*', '!app/img/**/*.svg']))
    .pipe(newer('build/img'))
    .pipe(imagemin())
    .pipe(dest('build/img'));
}

function sprite () {
  return src('app/img/***.svg')
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: 'sprite.svg',
          example: true
        }
      }
    }))
    .pipe(dest('build/img'))
}

function scripts() {
  return src(['app/js/main.js'], { allowEmpty: true })
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('build/js'))
    .pipe(browserSync.stream())
    .on('end', function() {
      return src(['app/js/main.js'])
        .pipe(dest('build/js'));
    });
}

function styles() {
  return src('app/scss/style.scss', { allowEmpty: true })
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 version'] }))
    .pipe(concat('style.min.css'))
    .pipe(scss({ outputStyle: 'compressed' }))
    .pipe(dest('build/css'))
    .pipe(browserSync.stream())
    .on('end', function() {
      return src('app/scss/style.scss')
        .pipe(scss({ outputStyle: 'expanded' }))
        .pipe(dest('build/css'));
    });
}

function watching() {
  browserSync.init({
    server: {
      baseDir: "build/"
    }
  });
  watch(['app/scss/**/*.scss', 'app/components/**/*.scss'], styles)
  watch(['app/img/*.*'], parallel(images, sprite))
  watch(['app/js/main.js'], scripts)
  watch(['app/components/**/*.html', 'app/pages/*.html'], pages)
  watch(['app/fonts/**/*.*'], fonts)
  watch(['app/*.html']).on('change', browserSync.reload);
}


function cleanBuild() {
  return src('build', { allowEmpty: true, read: false })
    .pipe(clean())
}

function createBuildDir() {
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
  }
  if (!fs.existsSync('build/js')) {
    fs.mkdirSync('build/js');
  }
  if (!fs.existsSync('build/css')) {
    fs.mkdirSync('build/css');
  }
  if (!fs.existsSync('build/fonts')) {
    fs.mkdirSync('build/fonts');
  }
  if (!fs.existsSync('build/img')) {
    fs.mkdirSync('build/img');
  }
}

function building() {
  createBuildDir();
  return src([
    'app/css/style.min.css',
    '!app/img/**/*.html',
    'app/img/*.*',
    '!app/img/*.svg',
    'app/img/sprite.svg',
    'app/fonts/*.*',
    'app/js/main.min.js',
    'app/**/*.html'
  ], {base : 'app', allowEmpty: true })
    .pipe(dest('build'))
}

exports.styles = styles;
exports.images = images;
exports.fonts = fonts;
exports.pages = pages;
exports.building = building;
exports.sprite = sprite;
exports.scripts = scripts;
exports.watching = watching;

exports.build = series(cleanBuild, parallel(building, images, sprite));
exports.default = series(cleanBuild, parallel(styles, images, sprite, fonts, scripts, pages), watching);
