module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      dist: {
        files: {
          'Assets.min.js': 'Assets.js',
          'BGem3.min.js': 'BGem3.js',
          'Game.min.js': 'Game.js'
        }
      }
    },
    watch: {
      js: {
        files: ['Assets.js', 'BGem3.js', 'Game.js'],
        tasks: ['uglify']
      }
    }
  });

  // Load the plugin(s).
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['uglify', 'watch']);

};