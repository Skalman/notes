// Light-weight feature detection and polyfills

/*global $, getSelection */

'use strict';

// IE9-11 support the `input` event for <input> and <textarea>, but not on
// `contenteditable`. There is no way to test this except for listening for
// events, so check the user agents for IE9-11, and assume that IE12 will have
// fixed this.
var supportInputEventOnContenteditable =
	'oninput' in document.createElement('div')
	&& !/MSIE (9|10)\./.test(navigator.userAgent)
	&& !/Trident\/7\.0;.+?rv:11\.0/.test(navigator.userAgent);
exports.supportInputEventOnContenteditable = supportInputEventOnContenteditable;

// Only Firefox supports multiple selections.
var supportMultipleSelections = false;
$(function () {
	var sel = getSelection();
	if (sel.rangeCount > 1) {
		supportMultipleSelections = true;
		return;
	}

	var oldRange = sel.rangeCount && sel.getRangeAt(0);
	sel.addRange(document.createRange());
	sel.addRange(document.createRange());

	supportMultipleSelections = sel.rangeCount > 1;

	// Reset.
	sel.removeAllRanges();
	if (oldRange)
		sel.addRange(oldRange);

	if (!supportMultipleSelections)
		$('html').addClass('no-multiple-selections');
});


// Polyfills
if (!Math.hypot) {
	Math.hypot = function () {
		return Math.sqrt(
			Array.prototype.map.call(arguments, function (x) {
				return x * x;
			}).reduce(function (a, b) {
				return a + b;
			})
		);
	};
}

// Bug-fixes

// In Chromium 34 on Ubuntu, the page area sometimes randomly resizes when
// clicking (probably because the scroll bar disappears). Assume that this will
// be resolved by Chrome 40.
if (/Chrome\/3\d\.0/.test(navigator.userAgent)) {
	$('.pagearea').css('overflow-y', 'scroll');
}
