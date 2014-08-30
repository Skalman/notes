'use strict';

module.exports = function (grunt, conf) {

	grunt.registerTask('lint-source', [
		'eslint:browser',
		'jshint:browser',
		'eslint:node',
		'jshint:node',
	]);

	var eslint = conf.eslint = conf.eslint || {};
	var jshint = conf.jshint = conf.jshint || {};

	eslint.browser = {
		options: {
			global: ['exports'],
			env: ['browser'],
		},
		files: {
			src: ['js/*.js'],
		},
	};

	eslint.node = {
		options: {
			env: ['node'],
		},
		files: {
			src: ['Gruntfile.js', 'build/*.js'],
		},
	};

	jshint.browser = {
		options: {
			// The files will be concatenated anyway, so it doesn't matter.
			globalstrict: true,
			globals: {
				exports: true,
			},
		},
		files: {
			src: ['js/*.js'],
		}
	};

	jshint.node = {
		options: {
			node: true,
		},
		files: {
			src: ['Gruntfile.js', 'build/*.js'],
		},
	};

};
