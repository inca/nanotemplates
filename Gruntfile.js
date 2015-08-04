'use strict';

module.exports = function (grunt) {

  grunt.initConfig({
    peg: {
      compile: {
        src: 'grammar/template.peg',
        dest: 'lib/parser.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-peg');

  grunt.registerTask('default', [ 'peg' ]);

};
