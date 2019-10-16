'use strict';

// Some common tasks:
//
// * serve -> builds the application and starts a webpack dev server
//
// * build:dist -> builds the application for distribution (i.e. minifies and
// performs other optimisations), see webpack.dist.config.js
//
// * maven-install -> builds for distribution, then creates and installs (in the
// local repository) a jar that contains the build output
//
// If things are not working as expected, check config.js!

var serverPort = 8000;

var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

var webpackDistConfig = require('./webpack.dist.config.js'),
    webpackDevConfig = require('./webpack.config.js');

var snapshot = true;

var nexus = {
  repository: {
    id: 'CLARIN',
    url: 'https://nexus.clarin.eu/content/repositories/Clarin'
  },
  snapshot: {
    id: 'CLARIN-Snapshot',
    url: 'https://nexus.clarin.eu/content/repositories/clarin-snapshot'
  }
};

module.exports = function (grunt) {
  // Let *load-grunt-tasks* require everything
  require('load-grunt-tasks')(grunt);

  // Read configuration from package.json
  var pkgConfig = grunt.file.readJSON('package.json');

  grunt.initConfig({
    pkg: pkgConfig,

    webpack: {
      options: webpackDistConfig,

      dist: {
        cache: false
      }
    },

    'webpack-dev-server': {
      options: {
        hot: true,
        port: serverPort,
        webpack: webpackDevConfig,
        publicPath: '/assets/',
        contentBase: './<%= pkg.src %>/',
//       },
//
//       start: {
//         keepAlive: true,
      }
    },

    connect: {
      options: {
        port: serverPort
      },

      dist: {
        options: {
          keepalive: true,
          middleware: function (connect) {
            return [
              mountFolder(connect, pkgConfig.dist)
            ];
          }
        }
      }
    },

    open: {
      dev: {
        path: 'http://localhost:<%= connect.options.port %>/webpack-dev-server/',
        options: {
          delay: 500
        }
      },
      dist: {
        path: 'http://localhost:<%= connect.options.port %>/',
        options: {
          openOn: 'serverListening'
        }
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          captureFile: 'results.txt', // Optionally capture the reporter output to a file
          quiet: false, // Optionally suppress output to standard out (defaults to false)
          clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
        },
        src: ['test/spec/jsonix/**/*.js']
      }
    },

    copy: {
      dist: {
        files: [
          // includes files within path
          {
            flatten: true,
            expand: true,
            src: ['<%= pkg.src %>/*'],
            dest: '<%= pkg.dist %>/',
            filter: 'isFile'
          },
          {
            flatten: true,
            expand: true,
            src: ['<%= pkg.src %>/images/*'],
            dest: '<%= pkg.dist %>/images/'
          },
          {
            //copy libraries for inclusion via html header
            cwd: '<%= pkg.src %>',
            nonull: true,
            expand: true,
            src: ['libjs/**'],
            dest: '<%= pkg.dist %>/'
          },
        ]
      }
    },

    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= pkg.dist %>'
          ]
        }]
      }
    },

    jsdoc: {
        dist: {
            src: ['src/**/*.jsx', 'src/**/*.js', 'test/spec/components/*.js'],
            jsdoc: '/usr/local/bin/jsdoc',
            options: {
                destination: 'docs',
                package: './package.json',
                template : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                configure : "jsdoc.conf.json"
            }
        }
    },

    maven_deploy: {
      options: {
        groupId: 'eu.clarin.cmdi',
        artifactId: 'component-registry-react-ui',
        snapshot: snapshot,
        file: function(options) {
          return 'target/' + options.artifactId + '-' + options.version + '.' + options.packaging;
        }
      },
      jar: {
        options: {
          packaging: 'jar',
          goal: 'install', //deploy?
          injectDestFolder: ''
        },
        files: [{expand: true, cwd: 'dist/', src: ['**'], dest: ''/*classes?*/}]
      },
      jar_deploy: {
        options: {
          packaging: 'jar',
          goal: 'deploy',
          url: (snapshot ? nexus.snapshot.url : nexus.repository.url),
          repositoryId: (snapshot ? nexus.snapshot.id : nexus.repository.id),
          injectDestFolder: ''
        },
        files: [{expand: true, cwd: 'dist/', src: ['**'], dest: ''/*classes?*/}]
      },
      src: {
        options: {
          url: 'https://nexus.clarin.eu/content/repositories/Clarin',
          repositoryId: 'CLARIN',
          classifier: 'sources',
          goal: 'install' //deploy
        },
        files: [{src: ['**', '!node_modules/**', '!dist/**', '!target/**'], dest: ''}]
      }
    }
  });


  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-maven-deploy');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      grunt.event.once('connect.dist.listening', function(host, port) {
        grunt.event.emit('serverListening');
      });

      return grunt.task.run(['build', 'open:dist', 'connect:dist']);
    }

    grunt.task.run(['open:dev', 'webpack-dev-server']);
  });

  grunt.registerTask('test', ['mochaTest'
                              //,'karma'
                              ]);

  grunt.registerTask('build', ['clean', 'copy', 'webpack']);

  grunt.registerTask('maven-install', ['build:dist', 'maven_deploy:jar']);

  grunt.registerTask('maven-deploy', ['build:dist', 'maven_deploy:jar_deploy']);

  grunt.registerTask('default', []);
};
