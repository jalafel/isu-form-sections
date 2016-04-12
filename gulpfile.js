var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var karma = require('karma').server;
var gulpIf = require('gulp-if');
var rename = require('gulp-rename');
var pkg = require('./package.json');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');

gulp.task('default',function() {
  // place code for your default task here
});



gulp.task('test', function() {
  // place code for your default task here
});


gulp.task('docs-karma', function(done) {
  var karmaConfig = {
    singleRun: true,
    autoWatch: false,
    browsers: ['Chrome'],
    configFile: __dirname + '/karma.conf.js'
  };

  karma.start(karmaConfig, function(exitCode) {
    if (exitCode != 0) {
      gutil.log(gutil.colors.red("Karma exited with the following exit code: " + exitCode));
      process.exit(exitCode);
    }
    done();
  });
});


gulp.task('minify', function(){
  return gulp.src(['src/*.js', 'src/directives/*.js', 'src/tpl/*.js', 'src/factories/*.js'])
    // Minifies only if it's a JavaScript file
    .pipe(concat('isu-form-sections.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(ngAnnotate())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulp.dest('dist'))
});