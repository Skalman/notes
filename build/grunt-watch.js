'use strict';

module.exports = function (grunt, conf) {

	conf.less = {
		options: {
			strictMath: true,
		},

		compile: {
			files: {
				'css/site.css': 'css/site.less',
			},
		},
	};

	conf.watch = {
		less: {
			files: ['css/*.less'],
			tasks: ['less:compile'],
		},
	};

};
