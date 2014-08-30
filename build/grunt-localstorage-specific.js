'use strict';

module.exports = function (grunt, conf) {
	var bundle = require('./bundle');
	var buildUtils = require('./utils');

	grunt.registerTask('localstorage-specific', [
		'copy:localstorage-html',
		'copy:localstorage-app',
		'copy:localstorage-images',
	]);

	var settings = conf.settings;
	var copy = conf.copy = conf.copy || {};

	copy['localstorage-html'] = {
		expand: true,
		cwd: 'tmp/',
		src: 'index.html',
		dest: 'dist-localstorage/',
		options: {
			process: function (src) {
				src = bundle.replace(src, {
					persona: false,
				});
				src = buildUtils.htmlSetConfig(src, {
					storage: { type: 'localstorage', item: settings.localstorageItem },
					account: { type: 'noauth', item: settings.localstorageItem + '-state' },
				});
				return src;
			},
		},
	};

	copy['localstorage-app'] = {
		expand: true,
		cwd: 'tmp/app/',
		src: '*',
		dest: 'dist-localstorage/',
	};

	copy['localstorage-images'] = {
		src: 'images/*',
		dest: 'dist-localstorage/',
	};

};
