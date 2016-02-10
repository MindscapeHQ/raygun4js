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
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
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
          'dist/raygun.js': ['tracekit/tracekit.js', 'src/raygun.tracekit.jquery.js', 'src/raygun.js', 'src/raygun.rum.js', 'src/raygun.js-url.js', 'src/raygun.loader.js'],
          'dist/raygun.vanilla.js': ['tracekit/tracekit.js', 'src/raygun.js', 'src/raygun.rum.js', 'src/raygun.js-url.js', 'src/raygun.loader.js']
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
          'dist/raygun.vanilla.min.js': ['dist/raygun.vanilla.js']
        }
      },
      snippet:{
        options:{
          banner: '',
          sourceMap: false,
          maxLineLen: 60
        },
        files:{
          'src/snippet/minified.js':['src/snippet/unminified.js'],
          'src/snippet/minified.nohandler.js':['src/snippet/unminified.nohandler.js']
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
          ignores: ['src/snippet/**/*.js']
        },
        src: ['src/**/*.js']
      }
    },
    jasmine : {
      src : ['src/raygun.tracekit.jquery.js', 'src/raygun.js', 'src/raygun.rum.js', 'src/raygunjs-url.js', 'src/raygun.loader.js'],
      options : {
        specs : 'spec/**/*.js',
        vendor : ['tracekit/tracekit.js'],
        template : require('grunt-template-jasmine-istanbul'),
        templateOptions: {
          coverage: 'reports/coverage.json',
          report: 'reports/coverage'
        }
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'jasmine']
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
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-string-replace');

  // Default task.
  grunt.registerTask('default', ['jshint', 'jasmine','clean', 'concat', 'string-replace', 'uglify']);
};
