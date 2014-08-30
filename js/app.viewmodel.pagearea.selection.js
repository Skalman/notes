/*global ko, $, hasScrollbar, measureScrollbarWidth, getFocusedElement, selectElements,
	supportMultipleSelections,
	KEY_DEL, KEY_BACKSPACE, KEY_SHIFT, KEY_CTRL, KEY_ALT, KEY_META, KEY_ALTGR,
	KEY_ESC, KEY_PAGEUP, KEY_PAGEDOWN, KEY_TAB, KEY_END, KEY_HOME, KEY_LEFT,
	KEY_UP, KEY_RIGHT, KEY_DOWN */

'use strict';

/*eslint-disable camelcase */
exports.AppViewModel_PageArea_Selection = AppViewModel_PageArea_Selection;
function AppViewModel_PageArea_Selection(self) {
/*eslint-enable camelcase */
	var prevSelection;
	var selectionKeydownActive = false;
	function selectionKeydown(e) {
		if (getFocusedElement() || !$('.item.selected').length) {
			selectionKeydownActive = false;
			$(window).off('keydown', selectionKeydown);
			return;
		}

		var focusElem;

		switch (e.which) {
			case KEY_DEL:
			case KEY_BACKSPACE:
				// Remove selected items.
				self.notebook().activeSection().activePage().items.remove(function (item) {
					return item.isSelected();
				});
				self.recalculateFarthestPosition();
				e.preventDefault();
				break;

			case KEY_SHIFT:
			case KEY_CTRL:
			case KEY_ALT:
			case KEY_META:
			case KEY_ALTGR:
			case KEY_ESC:
			case KEY_PAGEUP:
			case KEY_PAGEDOWN:
				// Do nothing.
				break;

			case KEY_TAB:
			case KEY_END:
			case KEY_HOME:
			case KEY_LEFT:
			case KEY_UP:
			case KEY_RIGHT:
			case KEY_DOWN:
				focusElem = $('.item.selected > [contenteditable]').first();
				break;

			default:
				if (e.ctrlKey || e.metaKey) {
					// Probably a browser shortcut. Do nothing.
					break;
				}
				// Assume it's a character key. Focus the first item and remove all others.
				if (prevSelection.indexOf(',') !== -1) {
					var isFirst = true;
					self.notebook().activeSection().activePage().items.remove(function (item) {
						if (item.isSelected() && isFirst) {
							isFirst = false;
							return false;
						} else {
							return item.isSelected();
						}
					});
					self.recalculateFarthestPosition();
				}
				focusElem = $('.item.selected > [contenteditable]'); // Should be only one left.
		}
		if (focusElem) {
			focusElem.focus();
			selectElements(focusElem[0]);
		}
	}

	function selectOverlapping(items, top, right, bottom, left) {
		var selectedIds = [];

		// Set datamodel.
		items.forEach(function (o) {
			var selected =
				o.top < bottom && top < o.bottom &&
				o.left < right && left < o.right;

			o.item.isSelected(selected);
			if (selected)
				selectedIds.push(o.item.id);
		});

		// Set selection.
		if (prevSelection !== selectedIds.join()) {
			prevSelection = selectedIds.join();
			if (selectedIds.length) {
				if (!selectionKeydownActive) {
					$(window).on('keydown', selectionKeydown);
					selectionKeydownActive = true;
				}
			}

			if (supportMultipleSelections) {
				selectElements(selectedIds.map(function (itemId) {
					return $('#item-' + itemId + ' > [contenteditable]')[0];
				}));
			}
		}
	}

	self.getItemDimensions = function() {
		var activePage = self.getActivePage();
		if (!activePage)
			return;

		var scrollTop = $('.page-area').scrollTop();
		var scrollLeft = $('.page-area').scrollLeft();

		return activePage.items()
		.filter(function (item) {
			return !item.isTitle;
		})
		.map(function (item) {
			var $item = $('#item-' + item.id);
			var pos = $item.position();
			pos.top += parseFloat($item.css('marginTop')) + scrollTop;
			pos.left += parseFloat($item.css('marginLeft')) + scrollLeft;
			return {
				top: pos.top,
				bottom: pos.top + $item.outerHeight(),
				left: pos.left,
				right: pos.left + $item.outerWidth(),
				item: item
			};
		});
	};

	self.getSelectedItems = function () {
		return self.notebook().activeSection().activePage().items()
		.filter(function (item) {
			return item.isSelected();
		});
	};

	self.pageareaSelection = {
		isActive: ko.observable(false),
		left: ko.observable(0),
		top: ko.observable(0),
		width: ko.observable(0),
		height: ko.observable(0),
	};

	self.pageareaMousedown = function (page, e) {
		if (e.which !== 1) {
			// Don't inhibit right-click and scroll wheel.
			return true;
		}
		var offset = $('.page-area').offset();
		var areaHeight = $('.page-area').outerHeight();
		var areaWidth = $('.page-area').outerWidth();
		var scrollbars = hasScrollbar($('.page-area'));
		var scrollbarWidth = measureScrollbarWidth();

		// Set height and width to the area available for content (i.e. exclude scrollbars).
		if (scrollbars.y)
			areaWidth -= scrollbarWidth;
		if (scrollbars.x)
			areaHeight -= scrollbarWidth;

		if (
				(scrollbars.y && offset.left + areaWidth < e.pageX) ||
				(scrollbars.x && offset.top + areaHeight < e.pageY)) {
			// Don't inhibit clicking on the scrollbar.
			return true;
		}

		$(document.activeElement).blur();
		self.notebook().activeSection().activePage().items().forEach(function (item) {
			item.isSelected(false);
		});
		e.preventDefault();
		$(window).on('keydown', onkeydown);
		$('body').on('mousemove', onmousemove);
		$('body').on('mouseup', onmouseup);
		var scrollTop, scrollLeft;
		var scrollHeight = $('.page-area').prop('scrollHeight');
		var scrollWidth = $('.page-area').prop('scrollWidth');
		onscroll();
		$('.page-area').on('scroll', onscroll);
		var origX = e.pageX - offset.left + scrollLeft;
		var origY = e.pageY - offset.top + scrollTop;
		var items = self.getItemDimensions();

		self.pageareaSelection
			.left(origX)
			.top(origY)
			.width(0)
			.height(0)
			.isActive(true);

		function onscroll() {
			scrollTop = $('.page-area').scrollTop();
			scrollLeft = $('.page-area').scrollLeft();
		}
		function onmousemove(e) {
			var pageX = Math.max(1, e.pageX - offset.left + scrollLeft);
			var pageY = Math.max(1, e.pageY - offset.top + scrollTop);

			var left = Math.min(pageX, origX);
			var top = Math.min(pageY, origY);
			var width = Math.min(Math.abs(pageX - origX), scrollWidth - left - 1);
			var height = Math.min(Math.abs(pageY - origY), scrollHeight - top - 1);
			self.pageareaSelection
				.left(left)
				.top(top)
				.width(width)
				.height(height);

			selectOverlapping(items,
					top,
					left + width,
					top + height,
					left);
			borderScroll(e);
		}
		var scrollInterval = setInterval(borderScroll, 50);
		var lastScroll = Date.now();
		var mouseX = e.pageX;
		var mouseY = e.pageY;
		function borderScroll(e) {
			var now = Date.now();
			if (e) {
				mouseX = e.pageX;
				mouseY = e.pageY;
			}
			if (now - lastScroll < 40)
				return;
			lastScroll = now;

			var scrolled = false;

			if (scrollTop && mouseY < offset.top + 10) {
				scrollTop = Math.max(0, scrollTop - 10);
				scrolled = true;
			} else if (scrollTop !== scrollHeight && offset.top + areaHeight - 10 < mouseY) {
				scrollTop = Math.min(scrollHeight - areaHeight, scrollTop + 10);
				scrolled = true;
			}
			if (scrollLeft && mouseX < offset.left + 10) {
				scrollLeft = Math.max(0, scrollLeft - 10);
				scrolled = true;
			} else if (scrollLeft !== scrollWidth && offset.left + areaWidth - 10 < mouseX) {
				scrollLeft = Math.min(scrollWidth - areaWidth, scrollLeft + 10);
				scrolled = true;
			}

			if (scrolled) {
				$('.page-area')
					.scrollTop(scrollTop)
					.scrollLeft(scrollLeft);

				if (!e)
					onmousemove({ pageX: mouseX, pageY: mouseY });
			}
		}
		function onmouseup(e) {
			var pageX = e.pageX - offset.left + scrollLeft;
			var pageY = e.pageY - offset.top + scrollTop;
			if (Math.hypot(pageX - origX, pageY - origY) < 10) {
				self.pageareaClick(page, {x: pageX, y: pageY});
			}
			off();
		}
		function onkeydown(e) {
			if (e.keyCode === KEY_ESC)
				off();
		}
		function off() {
			$(window).off('keydown', onkeydown);
			$('body').off('mousemove', onmousemove);
			$('body').off('mouseup', onmouseup);
			$('.page-area').off('scroll', onscroll);
			self.pageareaSelection.isActive(false);
			clearInterval(scrollInterval);
		}
		return true;
	};
}
