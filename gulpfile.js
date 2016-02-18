var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var bowerFiles = require('main-bower-files');
var es = require('event-stream');
var Q = require('q');
var del = require('del');
var src = 'src';

var paths = {
  scripts: src + '/**/*.js',
  vendor_scripts: 'bower_components/**/*.min.js',
  styles: src + '/css/*.css',
  index: src + '/popup.html',
  output: '_output',
  my_fonts: src + '/fonts/*.*',
  fa_fonts: 'bower_components/font-awesome/fonts/*.*',
  images: src + '/img/*.*',
  icons: src + '/icons/*.*',
  json: src + '/*.json'
};

var pipes = {};

pipes.moveFonts = function () {
  return es.merge(gulp.src(paths.my_fonts),gulp.src(paths.fa_fonts))
    .pipe(gulp.dest(paths.output + '/fonts'));
};

pipes.moveImages = function () {
  return gulp.src(paths.images)
    .pipe(gulp.dest(paths.output + '/img'));
};

pipes.moveIcons = function () {
  return gulp.src(paths.icons)
    .pipe(gulp.dest(paths.output + '/icons'));
};

pipes.collectJSON = function () {
  return gulp.src(paths.json)
    .pipe(gulp.dest(paths.output));
};

pipes.validateIndex = function () {
  return gulp.src(paths.index)
    .pipe(plugins.htmlhint())
    .pipe(plugins.htmlhint.reporter());
};

pipes.collectStyles = function () {
  return es.merge(gulp.src(bowerFiles({filter: /\.css/})),gulp.src(paths.styles))
    .pipe(gulp.dest(paths.output + '/css'));
};

pipes.collectVendorScripts = function () {
  return gulp.src(paths.vendor_scripts)
  .pipe(gulp.dest(paths.output + '/js'));
};

pipes.collectAppScripts = function () {
  return gulp.src(paths.scripts)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest(paths.output));
};

pipes.collectStatic = function () {
  return es.merge(pipes.moveFonts(),pipes.moveImages(),pipes.moveIcons());
}

pipes.buildIndex = function () {
  var styles = pipes.collectStyles(),
      appScripts = pipes.collectAppScripts(),
      vendorScripts = pipes.collectVendorScripts();

  return pipes.validateIndex()
    .pipe(gulp.dest(paths.output))
    .pipe(plugins.inject(vendorScripts, {relative: true, name: 'bower'}))
    .pipe(plugins.inject(appScripts, {relative: true}))
    .pipe(plugins.inject(styles, {relative: true}))
    .pipe(gulp.dest(paths.output));
};

pipes.buildExtension = function () {
  return es.merge(pipes.collectJSON(),pipes.collectStatic(),pipes.buildIndex());
};

gulp.task('build', pipes.buildExtension);

gulp.task('clean', function () {
  return del(paths.output);
});

gulp.task('clean-build',['clean'],pipes.buildExtension);

gulp.task('watch', ['clean-build'], function () {
  gulp.watch(paths.index, function() {
    return pipes.buildIndex();
  });

  gulp.watch(paths.scripts, function () {
    return pipes.collectAppScripts();
  });

  gulp.watch(paths.json, function () {
    return pipes.collectJSON();
  })
});
