bannerTemplate = '/*\n mwydmuch.pl / mwydmuch.github.io\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %>\n*/\n';
srcJs = 'src/js/*.js';
srcLess = 'src/less/*.less';
srcCss = 'src/css/*.css';

module.exports = function(grunt) {
    require('jit-grunt')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        browserify: {
            build: {
                src: 'src/js/main.js',
                dest: 'bundle.js'
            }
        },

        jshint: {
            options: {
                reporter: require('jshint-stylish'),
                force: true
            },
            build: ['Gruntfile.js', srcJs]
        },

        uglify: {
            options: {
                banner: bannerTemplate
            },
            build: {
                files: { 'bundle.js': 'src/js/bundle.js' }
            }
        },

        clean: {
            build: {
                src: ['src/js/bundle.js']
            }
        },

        copy: {
            files: {
                expand: true,
                cwd: 'node_modules/font-awesome/fonts/',
                src: '**',
                dest: 'fonts/'
            }
        },

        less: {
            build: {
                files: { 'src/css/style.css': 'src/less/style.less' }
            }
        },

        cssmin: {
            options: {
                banner: bannerTemplate
            },
            build: {
                files: {'style.css': 'src/css/style.css'}
            }
        },

        watch: {
            stylesheets: {
                files: [srcCss, srcLess],
                tasks: ['less', 'cssmin']
            },
            scripts: {
                files: srcJs,
                tasks: ['jshint', 'uglify']
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['clean', 'copy', 'less', 'cssmin', 'jshint', 'uglify', 'browserify']);
};
