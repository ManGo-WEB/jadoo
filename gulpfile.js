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
  return src(['app/images/src/*.*', '!app/images/src/*.svg'], { allowEmpty: true })
    .pipe(newer('build/images'))
    .pipe(avif({ quality : 50}))

    .pipe(src('app/images/src/*.*'))
    .pipe(newer('build/images'))
    .pipe(webp())

    .pipe(src('app/images/src/*.*'))
    .pipe(newer('build/images'))
    .pipe(imagemin())

    .pipe(dest('build/images'))
}

function sprite () {
  return src('app/images/*.svg', { allowEmpty: true })
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: '../sprite.svg',
          example: true 
        }
      }
    }))
    .pipe(dest('build/images'))
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
  watch(['app/scss/**/*.scss'], styles)
  watch(['app/images/src'], images)
  watch(['app/js/main.js'], scripts)
  watch(['app/fonts/**/*.*'], fonts)
  watch(['app/components/*', 'app/pages/*'], pages)
  watch(['app/*.html']).on('change', browserSync.reload);
}


function cleanBuild() {
  return src('build', { allowEmpty: true, read: false })
    .pipe(clean())
}

function createBuildDir() {
  const dir = 'build';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  ['images', 'fonts', 'js', 'css'].forEach(subDir => {
    if (!fs.existsSync(`${dir}/${subDir}`)) {
      fs.mkdirSync(`${dir}/${subDir}`);
    }
  });
}

function building() {
  createBuildDir();
  return src([
    'app/css/style.min.css',
    '!app/images/**/*.html',
    'app/images/*.*',
    '!app/images/*.svg',
    'app/images/sprite.svg',
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

exports.build = series(cleanBuild, building);
exports.default = series(cleanBuild, parallel(styles, images, fonts, scripts, pages), watching);
