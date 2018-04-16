var pkg = require('./package.json');
var fs = require('fs');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var karma = require('karma');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var size = require('gulp-size');
var header = require('gulp-header');
var rimraf = require('rimraf');
var runSequence = require('run-sequence');
var argv = require('yargs').argv;

// Helper method for retrieving all banners /*! foo */ in a file.
function getBanners(filePath) {
  var string = fs.readFileSync(filePath, 'utf8');
  var banners = [];
  var bannerRegex = /\/\*\!([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g;
  var banner;
  while (banner = bannerRegex.exec(string)) {
    banners.push(banner[0].replace(/^(\s+)/gm, ' ') + '\n');
  }
  return banners.length ? banners.join('') : '';
}

if (fs.existsSync('./.env')) {
  require('dotenv').load();
}

gulp.task('lint', function () {
  return gulp.src('./' + pkg.main)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('minify', function() {
  return gulp.src('./' + pkg.main)
    .pipe(uglify())
    .pipe(header(getBanners('./' + pkg.main)))
    .pipe(rename(pkg.main.replace('./', '').replace('.js', '.min.js')))
    .pipe(gulp.dest('./'));
});

gulp.task('log-size', function() {
  return gulp.src(['./' + pkg.main, ('./' + pkg.main).replace('.js', '.min.js')])
    .pipe(size({
      showFiles: true,
      showTotal: false
    }))
    .pipe(size({
      showFiles: true,
      showTotal: false,
      title: 'gzipped',
      gzip: true
    }));
});

gulp.task('clean', function (cb) {
  rimraf('./*.log', cb);
});

gulp.task('test-local', function (done) {
  var browsers = [];
  argv.chrome && browsers.push('Chrome');
  argv.firefox && browsers.push('Firefox');
  argv.safari && browsers.push('Safari');
  argv.edge && browsers.push('Edge');
  (new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    action: 'run',
    browsers: browsers.length ? browsers : ['Chrome'] 
  }, function (exitCode) {
    done(exitCode);
  })).start();
});

gulp.task('test-sauce', function (done) {
  var browsers = [];
  argv.chrome && browsers.push('slChrome');
  argv.firefox && browsers.push('slFirefox');
  argv.safari && browsers.push('slSafari');
  argv.edge && browsers.push('slEdge');
  (new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    action: 'run',
    browsers: browsers.length ? browsers : ['slChrome', 'slFirefox', 'slSafari']
  }, function (exitCode) {
    done(exitCode);
  })).start();
});

gulp.task('test', function (done) {
  runSequence('lint', 'test-sauce', 'clean', done);
});
