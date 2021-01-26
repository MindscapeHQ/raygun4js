'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed MIT */\n',
    // Task configuration.
    clean: {
      files: ['dist']
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        files: {
          'dist/raygun.js': ['tracekit/tracekit.js', 'src/raygun.tracekit.jquery.js', 'src/polyfills.js', 'src/raygun.utilities/index.js', 'src/raygun.network-tracking.js', 'src/raygun.breadcrumbs.js', 'src/raygun.rum/core-web-vitals.js', 'src/raygun.js', 'src/raygun.rum/web-vitals-polyfills.vendor.js', 'src/raygun.rum/web-vitals.vendor.js', 'src/raygun.rum/index.js', 'src/raygun.loader.js'],
          'dist/raygun.vanilla.js': ['tracekit/tracekit.js', 'src/polyfills.js', 'src/raygun.utilities/index.js', 'src/raygun.network-tracking.js', 'src/raygun.breadcrumbs.js', 'src/raygun.rum/core-web-vitals.js', 'src/raygun.js', 'src/raygun.rum/web-vitals-polyfills.vendor.js', 'src/raygun.rum/web-vitals.vendor.js', 'src/raygun.rum/index.js', 'src/raygun.loader.js'],
          'dist/raygun.umd.js': ['src/umd.intro.js', 'tracekit/tracekit.js', 'src/polyfills.js', 'src/raygun.tracekit.jquery.js', 'src/raygun.utilities/index.js', 'src/raygun.network-tracking.js', 'src/raygun.breadcrumbs.js', 'src/raygun.rum/core-web-vitals.js', 'src/raygun.js', 'src/raygun.rum/web-vitals-polyfills.vendor.js', 'src/raygun.rum/web-vitals.vendor.js', 'src/raygun.rum/index.js', 'src/raygun.loader.js', 'src/umd.outro.js']
        }
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        sourceMap: true
      },
      dist: {
        files: {
          'dist/raygun.min.js': ['dist/raygun.js'],
          'dist/raygun.vanilla.min.js': ['dist/raygun.vanilla.js'],
          'dist/raygun.umd.min.js': ['dist/raygun.umd.js']
        }
      },
      snippet:{
        options:{
          banner: '',
          sourceMap: false,
          maxLineLen: 60
        },
        files:{
          'dist/snippet/minified.js':['src/snippet/unminified.js'],
          'dist/snippet/minified.nohandler.js':['src/snippet/unminified.nohandler.js'],
          'dist/snippet/minified.fetchhandler.js':['src/snippet/unminified.fetchhandler.js']
        }
      }
    },
    jshint: {
      gruntfile: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: 'src/.jshintrc',
          ignores: ['src/snippet/**/*.js', 'src/umd.*', 'src/**/*.spec.js', 'src/helpers/*']
        },
        src: ['src/**/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['build']
      }
    },
    'string-replace': {
      dist: {
        files: {
          'dist/': 'dist/*.js'
        },
        options: {
          replacements: [{
            pattern: /({{VERSION}})/gmi,
            replacement: '<%= pkg.version %>'
          }]
        }
      },
      bower: {
        files: {
          './': 'bower.json'
        },
        options: {
          replacements: [{
            pattern: /"version": (.*),/gmi,
            replacement: '"version": "<%= pkg.version %>",'
          }]
        }
      },
      nuspec: {
        files: {
          './': 'raygun4js.nuspec'
        },
        options: {
          replacements: [{
            pattern: /<version>(.*)<\/version>/gmi,
            replacement: "<version><%= pkg.version %></version>"
          }]
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-string-replace');

  grunt.registerTask('compile', ['jshint', 'clean', 'concat', 'uglify:dist']);

  grunt.registerTask('build', ['jshint', 'clean', 'concat', 'string-replace', 'uglify']);

  grunt.registerTask('default', ['compile']);
};
