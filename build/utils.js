'use strict';

exports.regexpExecAll = regexpExecAll;
exports.removeCode = removeCode;
exports.moveCommentsFirst = moveCommentsFirst;
exports.htmlSetConfig = htmlSetConfig;

function regexpExecAll(regexp, string) {
	var matches = [];
	var match;
	while ((match = regexp.exec(string)) !== null) {
		matches.push(match);
	}
	return matches;
}

function removeCode(what, src) {
	return src.replace(
		/\/\*\s*remove\-start:\s*([a-z-]+)\s*\*\/[\s\S]*?\/\*\s*remove\-end:\s*\1\s*\*\//g,
		function (match, p1) {
			if (p1 === what)
				return '/* remove: removed ' + what + ' */';
			else
				return match;
		});
}

function moveCommentsFirst(src) {
	var comments = [];
	src = src
		.replace(/\r\n|\r/g, '\n')
		.replace(/(^|\n)(\/\*[\s\S]*?\*\/|(\/\/[^\n]+(\n|$)))+/g, function (match) {
			comments.push(
				match
					.trim()
					.replace(/^\/\*!? ?| ?\*\/$/g, '')
					.replace(/(^|\n)\/\/ ?/g, '$1')
			);
			return '\n';
		})
		.replace(/\n{2,}/g, '\n')
		.trim();
	return (
		'/*!\n'
		+ comments.join('\n\n')
		+ '\n*/\n'
		+ src
	);
}

function htmlSetConfig(src, config) {
	return src.replace(
		/<script>\s*var config\s*=[\s\S]+?<\/script>/,

		'<script>var config=' +
		JSON.stringify(config).replace(/"([a-z]+)":/g, '$1:') +
		'</script>'
	);
}
