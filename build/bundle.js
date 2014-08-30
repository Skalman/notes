'use strict';

exports.replace = replace;
exports.find = find;

var regexp = /<!-- bundle: (.+?) -->([\s\S]*?)<!-- \/bundle -->/g;
var utils = require('./utils');

function find(file) {
	var fs = require('fs');
	var path = require('path');

	var found = {};

	var sourceDir = path.dirname(file) + '/';
	if (sourceDir === './')
		sourceDir = '';

	var html = fs.readFileSync(file, { encoding: 'utf-8' });

	html.replace(regexp, function (match, name, content) {
		content = content
			.replace(/<!--[\s\S]*?-->/g, '');

		var targetFiles = utils.regexpExecAll(
				/<script src="([^"]+)"[^>]*>|<link href="([^"]+)" rel="stylesheet">|<link rel="stylesheet" href="([^"]+)">/g,
				content
			).map(function (match) {
				return sourceDir + (match[1] || match[2] || match[3]);
			});
		found[name] = targetFiles;
	});

	return found;
}

function replace(src, bundles) {
	return src.replace(regexp, function (match, name) {
		if (name in bundles) {
			if (!bundles[name])
				return '';
			else if (/<script/.test(match))
				return '<script src="' + bundles[name] + '" defer></script>';
			else
				return '<link href="' + bundles[name] + '" rel="stylesheet">';
		} else {
			return match;
		}
	});
}
