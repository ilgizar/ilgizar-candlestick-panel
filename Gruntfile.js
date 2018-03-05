module.exports = (grunt) => {
  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.initConfig({
    tslint: {
      options: {
        configuration: "tslint.json",
      },
      files: {
        src: [ "src/*.js" ]
      },
    },

    clean: ['dist'],

    copy: {
      src_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['**/*', '!**/*.js', '!**/*.scss', '!img/**/*'],
        dest: 'dist'
      },
      pluginDef: {
        expand: true,
        src: ['plugin.json', 'README.md'],
        dest: 'dist',
      },
      img_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['img/*.svg'],
        dest: 'dist/'
      },
      partials_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['partials/*.html'],
        dest: 'dist/'
      },
      vendor_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['vendor/*.js'],
        dest: 'dist/'
      },
    },

    watch: {
      rebuild_all: {
        files: ['src/**/*', 'plugin.json'],
        tasks: ['default'],
        options: {spawn: false}
      },
    },

    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015'],
        plugins: ['transform-es2015-modules-systemjs', 'transform-es2015-for-of'],
      },
      dist: {
        files: [{
          cwd: 'src',
          expand: true,
          src: ['*.js'],
          dest: 'dist',
          ext: '.js'
        }]
      },
    },

    zip: {
      'pack': {
        cwd: '../',
        src: [
          'dist/*', 'dist/*/*', 'src/*', 'src/*/*',
          'Gruntfile.js', 'LICENSE', 'package.json', 'README.md'
        ],
        dest: './pack/ilgizar-candlestick-panel.zip'
      }
    },
  });

  grunt.registerTask('default', [
    'tslint', 'clean', 'copy:src_to_dist', 'copy:pluginDef', 'copy:img_to_dist',
    'copy:vendor_to_dist', 'babel', 'zip'
  ]);
};
