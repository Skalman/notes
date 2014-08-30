'use strict';

module.exports = function (grunt, conf) {
	var bundle = require('./bundle');
	var buildUtils = require('./utils');

	grunt.registerTask('php-specific', [
		'copy:php-html',
		'copy:php-app',
		'copy:php-api',
		'copy:php-images',
		'mkdir:php',
	]);

	var settings = conf.settings;
	var copy = conf.copy = conf.copy || {};

	copy['php-html'] = {
		expand: true,
		cwd: 'tmp/',
		src: 'index.html',
		dest: 'dist-php/',
		options: {
			process: function (src) {
				src = bundle.replace(src, {
					persona: settings.phpPath + '/js/persona',
				});
				src = buildUtils.htmlSetConfig(src, {
					storage: { type: 'api', path: settings.phpPath },
					account: { type: 'persona' },
				});
				return src;
			},
		},
	};

	copy['php-app'] = {
		expand: true,
		cwd: 'tmp/app/',
		src: '*',
		dest: 'dist-php/',
	};

	// Copy PHP API.
	if (!/(\/|^)\.\.(\/|$)/.test(settings.phpDir)) {
		copy['php-api'] = {
			expand: true,
			cwd: 'api/',
			src: ['**', '!config.php', '!**/cache/**'],
			dest: 'dist-php/' + settings.phpDir,
		};
	} else {
		copy['php-api'] = {};
		grunt.log.writeln("--php-path contains '..', so the PHP API will have to be copied manually");
	}

	copy['php-images'] = {
		src: 'images/*',
		dest: 'dist-php/',
	};

	grunt.registerTask('mkdir:php', 'Make empty directory for PHP distribution.', function () {
		var fs = require('fs');
		var dir = 'dist-php/' + settings.phpDir + '/cache';
		try {
			grunt.file.mkdir(dir);
			fs.chmod(dir, parseInt('777', 8));
			grunt.log.writeln('Created %s', dir);
		} catch (e) {
			grunt.warn.writeln('Failed to create %s', dir);
		}
	});

};
