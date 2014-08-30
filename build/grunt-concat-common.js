'use strict';

module.exports = function (grunt, conf) {
	var buildUtils = require('./utils');
	var bundle = require('./bundle');

	var bundles = bundle.find('index.html');
	if (Object.keys(bundles).join() !== 'css,persona,lib,app') {
		throw new Error('index.html must contain exactly four bundles: css, persona, lib and app.');
	}

	grunt.registerTask('concat-common', [
		'concat',
		'eslint:concatenated',
		'jshint:concatenated',
		'eslint:htmljs',
		'jshint:htmljs',
	]);

	var eslint = conf.eslint = conf.eslint || {};
	var jshint = conf.jshint = conf.jshint || {};

	conf.concat = {
		// Concat CSS.
		css: {
			files: {
				'tmp/app/style.css': bundles.css,
			},
			options: {
				separator: '\n',
			}
		},

		// Concat libraries.
		lib: {
			files: {
				'tmp/bundle-lib.js': bundles.lib,
			},
			options: {
				separator: '\n',
			}
		},

		// Concat app JS.
		app: {
			files: {
				'tmp/app/app.js': bundles.app,
			},

			options: concatOptions({
				banner: conf.settings.banner +
					'/*global config, jQuery, ko, Mousetrap, Promise, alert, confirm, console */\n',
				import: {
					this: 'window',
					jQuery: '$',
					ko: 'ko',
					'': 'undefined',
				},
				export: [
					'AppViewModel',
					'Notebook',
				],
				useStrict: true,
				process: function (code, file) {
					return buildUtils.removeCode(
						'concat',
						'// Source: ' + file + '\n' +
						code
							// 'use strict' will be added to the top.
							.replace(/'use strict';\n*/, '')
							// In the combined file all dependencies should be fulfilled.
							.replace(/\/\* ?(global)\s[^\*]+\*\/\n*/g, '')
							.replace(/(^|\n)exports\.([a-zA-Z0-9_]+) = \2;(?=\n)/g, '')
					);
				},
				separator: '\n\n',
			}),
		},

		// Extract JS from the HTML file to run it through JSHint.
		htmljs: {
			files: {
				'tmp/index.html.js': ['index.html'],
			},
			options: {
				process: function (src) {
					var unescapeHtml = require('../js/utils').unescapeHtml;

					var bindings =
						buildUtils.regexpExecAll(/\sdata\-bind="([^"]+)"/g, src)

						.map(function (match) {
							// Try to beatify the code, for easier debugging when JSHint
							// does find issues.
							var origIndent;
							var codeBefore = src.substr(0, match.index);
							var lineNumber = codeBefore.replace(/[^\n]+/g, '').length + 1;
							if (match[1][0] === '\n')
								lineNumber++;

							var code =
								// Unescape the match.
								unescapeHtml(match[1])

								// Singleline: add tab.
								.replace(/^([^\n]+)$/, '\t$1')

								// Multiline: the first line might not be indented at all.
								.replace(/^(\S[^\n]*)\n\t(\t*)/, '\n$1$2\n\t$2')

								// Multiline: De-indent.
								.replace(/\n(\t*)/g, function (match, p1) {
									if (!origIndent)
										origIndent = p1;

									return match.replace(origIndent, '') + '\t';
								})

								// Careful trim.
								.replace(/^\n|\s+$/g, '');

							return '{ // line ' + lineNumber + '\n' +
								code +
								'\n}';
						})
						.join(',\n');
					return (
						'(function () { return [\n' + bindings + '\n] }());\n'
					);
				},
			},
		},
	};


	eslint.concatenated = {
		files: {
			src: ['tmp/app/app.js'],
		},
		options: {
			rule: grunt.util._.extend({}, eslint.options.rule, {
				// Allow use of 'undefined' argument.
				'no-shadow-restricted-names': 0,
			}),
			env: ['browser'],
		},
	};

	eslint.htmljs = {
		files: {
			src: ['tmp/index.html.js'],
		},
		options: {
			rule: grunt.util._.extend({}, eslint.options.rule, {
				'no-undef': 0,
				strict: 0,

				// Ideally, it just wouldn't warn about the last statement in a block.
				semi: 0,
			}),
		},
	};


	jshint.concatenated = {
		files: {
			src: ['tmp/app/app.js'],
		},
	};

	jshint.htmljs = {
		options: {
			strict: false,
			undef: false,
			lastsemic: true,
		},
		files: {
			src: ['tmp/index.html.js'],
		},
	};

};


// Replaces properties 'import', 'export' and 'useStrict' with a 'banner' and 'footer'.
function concatOptions(opts) {

	// Import
	var toImport = getKeysAndValues(opts.import);

	// The last parameter may be undefined
	if (toImport.keys[toImport.keys.length - 1] === '') {
		toImport.keys.pop();
	}
	var importBanner = '(function (' + toImport.values.join(', ') + ') {\n';
	var importFooter = '}(' + toImport.keys.join(', ') + '));\n';

	// Export
	var global = opts.import.this || 'window';
	var exportFooter = (opts.export || []).map(function (variable) {
		return global + '.' + variable + ' = ' + variable + ';\n';
	}).join('') + '\n';

	var useStrictBanner = opts.useStrict ? "'use strict';\n" : '';

	delete opts.import;
	delete opts.export;
	delete opts.useStrict;

	var separator = opts.separator || '\n';

	opts.banner = (opts.banner || '') +
		importBanner +
		useStrictBanner +
		separator;

	opts.footer = separator +
		exportFooter +
		importFooter +
		(opts.footer || '');

	return opts;
}

function getKeysAndValues(obj) {
	var keys = Object.keys(obj);
	return {
		keys: keys,
		values: keys.map(function (key) {
			return obj[key];
		}),
	};
}
