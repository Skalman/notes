'use strict';

module.exports = function (grunt, conf) {
	var buildUtils = require('./utils');
	var bundle = require('./bundle');

	grunt.registerTask('copy-common', [
		'copy:lib',
		'copy:html',
		'copy:app',
	]);

	var copy = conf.copy = conf.copy || {};

	// Move comments to the top.
	copy.lib = {
		src: 'tmp/bundle-lib.js',
		dest: 'tmp/app/lib.min.js',
		options: { process: buildUtils.moveCommentsFirst },
	};

	// Replace bundles and remove whitespace at the beginning of lines.
	copy.html = {
		src: 'index.html',
		dest: 'tmp/',
		options: {
			process: function (src) {
				return (
					// Make bundles.
					bundle.replace(src, {
						css: 'style.min.css',
						lib: 'lib.min.js',
						app: 'app.min.js',
					})

					// Remove indentation.
					.replace(/(^|\n)[ \t]+/g, '$1')
					.replace(/\n{2,}/g, '\n')

					// Knockout specific.
					.replace(/<!\-\-\s*(ko [a-z]+): (.*?)\s*\-\->/g, '<!--$1:$2-->')
					.replace(/<!\-\-\s*\/ko\s*\-\->/g, '<!--/ko-->')
					.replace(/(\sdata\-bind=")([^"]+)(")/g, function (match, p1, p2, p3) {
						return p1 +
							p2.replace(/'([^']|\\')+'|[^']+/g, function (match) {
								if (match[0] === "'")
									return match;
								else
									return match.replace(/\s+/g, '');
							}) +
							p3;
					})
				);
			},
		},
	};

	// Copy the generated app.js, for Uglify minification.
	copy.app = {
		src: 'tmp/app/app.js',
		dest: 'tmp/app-uglify.js',
		options: {
			process: buildUtils.removeCode.bind(null, 'uglify'),
		},
	};

};
