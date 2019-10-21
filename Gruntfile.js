const webpackDev = require('./webpack.dev.js');
const webpackProd = require('./webpack.prod.js');
const path = require('path');
var webpack = require("webpack");
console.log('Running', process.env.NODE_ENV, 'build');

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        connect: {
            server: {
                options: {
                    port: 3030,
                    base: 'dist/',

                }
            }
        },
        webpack: {
            myConfig: process.env.NODE_ENV === 'production' ? webpackProd : webpackDev,

        },
        watch: {
            options: {
                livereload: true,
            },
            js: {
                files: ['src/**/*.js'],
                tasks: ['webpack'],
                options: {
                    interrupt: true,
                },
            },

        }
    })

    grunt.loadNpmTasks('grunt-webpack');

    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('default', ['webpack', 'connect', 'watch']);
};
