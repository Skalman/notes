'use strict';

module.exports = function (grunt, conf) {

	grunt.registerTask('minify', [
		'cssmin',
		'uglify',
	]);

	conf.cssmin = {
		minify: {
			files: {
				'tmp/app/style.min.css': ['tmp/app/style.css'],
			}
		},
	};

	conf.uglify = {
		options: {
			banner: conf.settings.banner,
			compress: {
				/*eslint-disable camelcase */
				global_defs: getConstants(),
				/*eslint-enable camelcase */
			},
		},
		app: {
			files: {
				'tmp/app/app.min.js': 'tmp/app-uglify.js',
			}
		},
	};

};

function getConstants() {
	var fs = require('fs');
	var utils = require('./utils');
	var src = fs.readFileSync('js/constants.js', 'utf-8');
	var matches = utils.regexpExecAll(/\bvar\s+([^\s=]+)\s*=([^;]+);/g, src);
	var constants = {};
	matches.forEach(function (match) {
		/*jshint evil:true */
		/*eslint-disable no-eval */
		constants[match[1]] = eval(match[2]);
		/*eslint-enable no-eval */
	});
	return constants;
}
