var gulpfile = require('gulp');
var less = require('gulp-less');
var util = require('gulp-util');
//var browserify = require('gulp-browserify');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pkg = require('./package.json');

// Set the banner content
var banner = ['/*!\n',
    ' * <%= pkg.name %> v<%= pkg.version %>\n',
    ' * Copyright ' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    //' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n',
    ' */\n\n',
    ''
].join('');

// Compile LESS files from /less into /css
gulpfile.task('less', function() {
    return gulpfile.src('src/style.less')
        .pipe(less())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulpfile.dest('src'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify compiled CSS
gulpfile.task('minify-css', gulpfile.series('less', function() {
    return gulpfile.src('src/style.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulpfile.dest('src'))
        .pipe(browserSync.reload({
            stream: true
        }))
}));

// Minify JS
gulpfile.task('minify-js', function() {
    return gulpfile.src('src/script.js')
        // .pipe(browserify({
        //     insertGlobals : true,
        //     debug : !gulp.env.production
        // }))
        .pipe(uglify().on('error', util.log))
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulpfile.dest('src'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulpfile.task('default', gulpfile.series('less', 'minify-css', 'minify-js'));

// Configure the browserSync task
gulpfile.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: ''
        },
    })
})

// Dev task with browserSync
gulpfile.task('dev', gulpfile.series('browserSync', 'less', 'minify-css', 'minify-js', function() {
    gulpfile.watch('src/*.less', ['less']);
    gulpfile.watch('src/*.css', ['minify-css']);
    gulpfile.watch('src/*.js', ['minify-js']);
    // Reloads the browser whenever HTML or JS files change
    gulpfile.watch('*.html', browserSync.reload);
    gulpfile.watch('src/*.js', browserSync.reload);
}));
