var gulpfile = require('gulp');
var less = require('gulp-less');
var util = require('gulp-util');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pkg = require('./package.json');
var dest = "."

// Set the banner content
var banner = ['/*!\n',
    ' * <%= pkg.name %> v<%= pkg.version %>\n',
    ' * Copyright ' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    ' */\n\n',
    ''
].join('');

// Compile LESS files from /less into /css
gulpfile.task('less', function() {
    return gulpfile.src('./less/style.less')
        .pipe(less())
        .pipe(gulpfile.dest(dest))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify compiled CSS
gulpfile.task('minify-css', gulpfile.series('less', function() {
    return gulpfile.src('./style.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulpfile.dest(dest))
        .pipe(browserSync.reload({
            stream: true
        }))
}));

// Bundle JS
gulpfile.task('bundle-js', function() {
    return browserify('./js/main.js')
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulpfile.dest(dest))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify JS
gulpfile.task('minify-js', function() {
    return gulpfile.src('./bundle.js')
        .pipe(uglify().on('error', util.log))
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulpfile.dest(dest))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulpfile.task('default', gulpfile.series('less', 'minify-css', 'bundle-js', 'minify-js'));

// Configure the browserSync task
gulpfile.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: ''
        },
    })
})

// Dev task with browserSync
gulpfile.task('dev', gulpfile.series('browserSync', 'less', 'minify-css', 'bundle-js', 'minify-js', function() {
    gulpfile.watch('less/*.less', ['less', 'minify-css']);
    gulpfile.watch('js/*.js', ['bundle-js', 'minify-js']);
    // Reloads the browser whenever HTML or JS files change
    gulpfile.watch('*.html', browserSync.reload);
    gulpfile.watch('js/*.js', browserSync.reload);
}));
