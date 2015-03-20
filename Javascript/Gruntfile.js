'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      all: ['Gruntfile.js', 'orion/*.js'],
      options: {
        jshintrc: true
      }
    },

    gjslint: {
      options: {
        flags: [
          '--disable 220' //ignore error code 220 from gjslint
        ],
        reporter: {
          name: 'console'
        }
      },
      all: {
        src: '<%= jshint.all %>'
      }
    },

    fixjsstyle: {
      options: {
        flags: [
          '--disable 220' //ignore error code 220 from gjslint
        ],
        reporter: {
          name: 'console'
        }
      },
      all: {
        src: '<%= jshint.all %>'
      }
    },

    mochacli: {
      options: {
        harmony: true
      },
      all: ['orion/test/*.js']
    },

    compress: {
      options: {
        archive: 'fiware-orion-client-browser.zip'
      },
      all: {
        files: [{ expand: true, cwd: 'orion/',
                src: ['ngsi-helper.js', 'orion.js', 'bower.json'], dest: '/'}]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-gjslint');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('default', ['fixjsstyle', 'jshint:all', 'gjslint']);
  grunt.registerTask('test', ['mochacli']);
};
