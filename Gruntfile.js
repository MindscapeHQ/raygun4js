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
          'dist/raygun.js': ['tracekit/tracekit.js', 'src/raygun.tracekit.jquery.js', 'src/raygun.js', 'src/raygun.js-url.js'],
          'dist/raygun.vanilla.js': ['tracekit/tracekit.js', 'src/raygun.js', 'src/raygun.js-url.js']
        }
      },
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        files: {
          'dist/raygun.min.js': ['dist/raygun.js'],
          'dist/raygun.vanilla.min.js': ['dist/raygun.vanilla.js']
        }
      },
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
          jshintrc: 'src/.jshintrc'
        },
        src: ['src/**/*.js']
      },
    },
    jasmine : {
      src : ['src/raygun.tracekit.jquery.js', 'src/raygun.js', 'src/raygunjs-url.js'],
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
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // Default task.
  grunt.registerTask('default', ['jshint', 'jasmine', 'clean', 'concat', 'uglify']);

};
