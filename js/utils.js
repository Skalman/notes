/*global getSelection */

'use strict';

exports.NotFoundError = NotFoundError;
exports.ApiError = ApiError;
exports.hasScrollbar = hasScrollbar;
exports.measureScrollbarWidth = measureScrollbarWidth;
exports.getFocusedElement = getFocusedElement;
exports.selectElements = selectElements;
exports.stripTags = stripTags;
exports.escapeHtml = escapeHtml;
exports.unescapeHtml = unescapeHtml;

// Errors.
function NotFoundError(message) {
	this.message = message;
	this.stack = new Error().stack;
}
NotFoundError.prototype = new Error();
NotFoundError.prototype.name = 'NotFoundError';

function ApiError(message, data) {
	this.message = message;
	this.data = data;
	this.stack = new Error().stack;
}
ApiError.prototype = new Error();
ApiError.prototype.name = 'ApiError';

function DataModelError(message, data) {
	if (data && !data.error)
		data.error = message;

	this.message = message;
	this.data = data;
	this.stack = new Error().stack;
}
DataModelError.prototype = new Error();
DataModelError.prototype.name = 'DataModelError';


// Scrollbars.
function hasScrollbar($elem) {
	var overflowX = $elem.css('overflow-x');
	var overflowY = $elem.css('overflow-y');
	return {
		x: overflowX === 'scroll' ||
			(overflowX === 'auto' && $elem[0].scrollWidth > $elem.innerWidth()),
		y: overflowY === 'scroll' ||
			(overflowY === 'auto' && $elem[0].scrollHeight > $elem.innerHeight())
	};
}

var scrollbarWidth;
function measureScrollbarWidth() {
	/*global $ */
	if (scrollbarWidth === undefined) {
		var outer = $('<div>', {
			css: {
				visibility: 'hidden',
				position: 'absolute',
				overflow: 'scroll',
				width: 50,
				height: 50
			}
		}).appendTo('body');
		var inner = $('<div>', {
			css: {
				height: 1
			}
		}).appendTo(outer);
		scrollbarWidth = outer.width() - inner.width();
		outer.remove();
	}
	return scrollbarWidth;
}


// Focus.
function getFocusedElement() {
	/*jshint eqnull:true */
	var elem = document.activeElement;
	return (elem === document.body || elem == null) ? null : elem;
}

// Select elements.
function selectElements(elems) {
	if (!Array.isArray(elems)) {
		elems = [elems];
	}
	var sel = getSelection();
	sel.removeAllRanges();
	elems.forEach(function (elem) {
		var range = document.createRange();
		range.selectNodeContents(elem);
		sel.addRange(range);
	});
}

// HTML utilities
function stripTags(str) {
	return str.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
}

function escapeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// Not used in the app, added here for completeness.
/*remove-start:concat */
function unescapeHtml(str) {
	return stripTags(str)
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&');
}
/*remove-end:concat */
