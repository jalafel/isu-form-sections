var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var karma = require('karma').server;
var argv = require('minimist')(process.argv.slice(2));
var pkg = require('./package.json');

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