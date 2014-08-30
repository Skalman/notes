'use strict';

module.exports = function (grunt) {

	// Set common initConfig.
	var phpPath = grunt.option('php-path') || 'api/index.php?path=';
	var phpDir = phpPath.replace(/\/index.php\?path=$|\/$/, '');
	var localstorageItem = grunt.option('localstorage-item') || 'notes-notebook';

	var initConfig = {
		pkg: grunt.file.readJSON('package.json'),
		settings: {
			banner:
				'/* Notes <%= pkg.version %> (built <%= grunt.template.today("yyyy-mm-dd") %>)' +
				' | (c) 2014 Dan Wolff' +
				' | License: <%= pkg.licenses[0].type %>' +
				' | github.com/Skalman/notes */\n',

			phpPath: phpPath,
			phpDir: phpDir,
			localstorageItem: localstorageItem,
		},
		eslint: {
			options: {
				rule: grunt.file.readJSON('.eslintrc').rules,
			},
		},
		jshint: {
			options: {
				browser: true,
				strict: true,
				unused: true,
				eqeqeq: true,
				eqnull: true,

				// Bad line breaking before 'x'. Unfortunately must be turned off to
				// allow e.g.:
				// return cond
				//   ? 'yes'
				//   : 'no';
				// https://github.com/jshint/jshint/issues/735
				'-W014': true,
			},
		},
	};


	// Meta-tasks.
	var tasks = {
		default: [
			'common',
			'php-specific',
			'localstorage-specific',
			'clean',
		],

		common: [
			'lint-source',
			'concat-common',
			'copy-common',
			'minify',
		],

		php: [
			'common',
			'php-specific',
			'clean',
		],

		localstorage: [
			'common',
			'localstorage-specific',
			'clean',
		],
	};
	grunt.util._.each(tasks, function (task, name) {
		grunt.registerTask(name, task);
	});


	// Import tasks from build/grunt-*.js.
	[].concat(
		tasks.common,
		'php-specific',
		'localstorage-specific',
		'clean'
	).forEach(function (task) {
		require('./build/grunt-' + task)(grunt, initConfig);
	});


	grunt.initConfig(initConfig);

	// Load plugins.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.loadNpmTasks('grunt-eslint');

};
