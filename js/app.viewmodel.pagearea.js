/*global
	getSelection, $, Item, AppViewModel_PageArea_Selection,
	stripTags, supportInputEventOnContenteditable,
	getFocusedElement, measureScrollbarWidth,
	KEY_ESC, KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_PAGEUP, KEY_PAGEDOWN */

'use strict';

/*eslint-disable camelcase */
exports.AppViewModel_PageArea = AppViewModel_PageArea;
function AppViewModel_PageArea(self) {
/*eslint-enable camelcase */

	/*jshint newcap:false */
	/*eslint-disable new-cap */
	AppViewModel_PageArea_Selection(self);
	/*jshint newcap:true */
	/*eslint-enable new-cap */

	self.pxPerUnit = 25;

	self.pageareaClick = function (page, pos) {
		var id = self.notebook().idGenerator();
		var item = new Item({
			id: id,
			x: Math.round(pos.x / self.pxPerUnit),
			y: Math.round(pos.y / self.pxPerUnit),
			html: ''
		});
		page.items.push(item);
		if (!removeItemOnOverlap(item)) {
			if (supportInputEventOnContenteditable) {
				item.isEmpty(true);
			}
			itemGetContenteditableById(id).focus();
		}
		self.recalculateFarthestPosition();
	};

	self.saveUiState = function () {
		// In almost every regard, the UI directly represents the model.

		// If an item is focused, save it's state.
		var elem = getFocusedElement();
		var parent = $(elem).parent();
		if (parent.is('.item')) {
			var id = +parent.attr('id').replace('item-', '');
			self.notebook().activeSection().activePage().items().forEach(function (item) {
				if (item.id === id) {
					item.html(elem.innerHTML);
				}
			});
		}
	};

	function itemGetContenteditableById(itemId) {
		return $('#item-' + itemId + ' > .contenteditable');
	}
	self.itemMousedown = function (item, e) {
		e.stopPropagation();
		return true;
	};
	self.itemFocus = function (item) {
		$('#item-' + item.id).addClass('focus');
		$('.item.is-selected').removeClass('is-selected');
	};
	self.itemBlur = function (item) {
		if (!stripTags(item.html()) && !item.isTitle) {
			self.notebook().activeSection().activePage().items.remove(item);
		}
		$('#item-' + item.id).removeClass('focus');
		$('.item.is-selected').removeClass('is-selected');
	};

	// Difficult to achieve with Knockout. (clickBubble:false doesn't work)
	$('.pagearea').on('click', '.item', function (e) {
		e.stopPropagation();
	});

	function itemMargin($item) {
		if (!itemMargin.cached) {
			itemMargin.cached = {
				top: parseFloat($item.css('marginTop')),
				left: parseFloat($item.css('marginLeft')),
			};
		}
		return itemMargin.cached;
	}
	function itemKeydownPageUpDown(item, key, shiftKey) {
		var contenteditable = itemGetContenteditableById(item.id)[0];
		var sel = getSelection();
		var range = sel.getRangeAt(0);

		// Make a range out of everything from the cursor/selection position to
		// the beginning/end.
		var tmpRange = document.createRange();
		tmpRange.selectNodeContents(contenteditable);

		if (key === KEY_PAGEUP)
			range.setStart(tmpRange.startContainer, tmpRange.startOffset);
		else
			range.setEnd(tmpRange.endContainer, tmpRange.endOffset);

		if (range + '' !== '') {
			// The range contains something, so set the range as the cursor/selection
			// position.
			if (!shiftKey) {
				if (key === KEY_PAGEUP)
					range.setEnd(tmpRange.startContainer, tmpRange.startOffset);
				else
					range.setStart(tmpRange.endContainer, tmpRange.endOffset);
			}
			sel.removeAllRanges();
			sel.addRange(range);
		} else {
			// The range contains nothing. Actually move a page up or down by
			// simulating a click there.
			var area = $('.pagearea');
			var scrollAmount =
				Math.floor(area.outerHeight() / self.pxPerUnit - 1) // Number of units...
				* self.pxPerUnit // ...in pixels...
				* (key === KEY_PAGEUP ? -1 : 1); // ...up or down.

			var curPosition = $('#item-' + item.id).position();
			var origScrollTop = area.scrollTop();
			contenteditable.blur();

			// Click.
			self.pageareaClick(
				self.notebook().activeSection().activePage(),
				{
					x: curPosition.left,
					y: Math.max(curPosition.top + origScrollTop + scrollAmount, 1),
				}
			);

			// Scroll.
			area
				// pageareaClick() focuses the element, so first scroll back.
				.scrollTop(origScrollTop)
				// And then animate to the focused element.
				.animate({
					scrollTop: origScrollTop + scrollAmount
				}, 'fast');

			return;
		}
	}
	function itemKeydownArrow(item, key) {
		// Store as variables in order to not rerender.
		var x = item.x();
		var y = item.y();
		var diffX = 0;
		var diffY = 0;
		var area = $('.pagearea');

		if (key === KEY_UP && y !== 1)
			diffY = -1;
		else if (key === KEY_LEFT && x !== 1)
			diffX = -1;
		else if (key === KEY_DOWN)
			diffY = 1;
		else if (key === KEY_RIGHT)
			diffX = 1;
		else if (key === KEY_UP && y === 1)
			area.scrollTop(0);
		else if (key === KEY_LEFT && x === 1)
			area.scrollLeft(0);


		if ((diffX || diffY) && !removeItemOnOverlap(item, diffX, diffY)) {
			item.x(x + diffX);
			item.y(y + diffY);

			var $item = $('#item-' + item.id);
			var margin = itemMargin($item);

			// If needed, scroll so that the whole item is in view.
			var offset = $item.position();

			if (diffY === -1 && offset.top + margin.top < 0) {
				area.scrollTop(area.scrollTop() - self.pxPerUnit);
			} else if (diffY === 1 && area.outerHeight() - measureScrollbarWidth() < offset.top + margin.top + $item.outerHeight()) {
				area.scrollTop(area.scrollTop() + self.pxPerUnit);
			} else if (diffX === -1 && offset.left + margin.left < 0) {
				area.scrollLeft(area.scrollLeft() - self.pxPerUnit);
			} else if (diffX === 1 && area.outerWidth() - measureScrollbarWidth() < offset.left + margin.left + $item.outerWidth()) {
				area.scrollLeft(area.scrollLeft() + self.pxPerUnit);
			}
		}
	}
	self.itemKeydown = function (item, e) {
		// Cannot check item.html(), because it's only updated after blur.
		var key = e.keyCode;
		if ((key === KEY_PAGEUP || key === KEY_PAGEDOWN) && !e.metaKey && !e.ctrlKey && !e.altKey) {
			itemKeydownPageUpDown(item, key, e.shiftKey);
		} else if ((key === KEY_UP || key === KEY_DOWN || key === KEY_LEFT || key === KEY_RIGHT)
				&& !itemGetContenteditableById(item.id).text()) {
			itemKeydownArrow(item, key);
		} else {
			return true;
		}
	};
	self.itemInput = function (item) {
		var $item = $('#item-' + item.id);
		var $editable = $item.find('.contenteditable');
		var html = $editable.html();

		item.isEmpty(!html || html === '<br>');
	};

	// Drag-and-drop item
	self.itemDragbarMousedown = function (item, e) {
		if (e.which !== 1) {
			// Don't inhibit right-click and scroll wheel.
			return true;
		}
		e.stopPropagation();
		e.preventDefault();


		var items;
		if ($('#item-' + item.id).hasClass('is-selected')) {
			items = self.getSelectedItems();
			$('.item.is-selected').addClass('dragging');
		} else {
			if (getFocusedElement())
				getFocusedElement().blur();

			items = [item];
			$('#item-' + item.id).addClass('dragging');
			$('.item.is-selected').removeClass('is-selected');
		}
		var origPositions = items.map(function (item) {
			return { x: item.x(), y: item.y() };
		});
		$('html').addClass('dragging-item');
		$(window).on('keydown', keydown);
		$('body').on('mousemove mouseup', move);
		var origX = e.pageX;
		var origY = e.pageY;
		var lastGridX = 0;
		var lastGridY = 0;
		function move(e) {
			var gridDiffX = Math.round((e.pageX - origX) / self.pxPerUnit);
			var gridDiffY = Math.round((e.pageY - origY) / self.pxPerUnit);
			if (gridDiffX !== lastGridX) {
				items.forEach(function (item, i) {
					item.x(Math.max(origPositions[i].x + gridDiffX, 1));
				});
				lastGridX = gridDiffX;
			}
			if (gridDiffY !== lastGridY) {
				items.forEach(function (item, i) {
					item.y(Math.max(origPositions[i].y + gridDiffY, 1));
				});
				lastGridY = gridDiffY;
			}
			if (e.type === 'mouseup') {
				off();
			}
		}
		function keydown(e) {
			if (e.keyCode === KEY_ESC)
				off();
		}
		function off() {
			if (items.length === 1)
				itemGetContenteditableById(item.id).focus();
			$('.item.dragging').removeClass('dragging');
			$('html').removeClass('dragging-item');
			$('body').off('mousemove mouseup', move);
			$(window).off('keydown', keydown);
			self.recalculateFarthestPosition();
		}
		return true;
	};

	// Must be a currently visible item.
	// Returns true if the item was removed, else false.
	function removeItemOnOverlap(item, moveX, moveY) {
		var $item = $('#item-' + item.id);

		// Position of current item.
		var cur = $item.position();
		var top = cur.top + (moveY || 0) * self.pxPerUnit;
		var left = cur.left + (moveX || 0) * self.pxPerUnit;
		var bottom = top + $item.outerHeight();
		var right = left + $item.outerWidth();

		// Overlaps any (other) item?
		var $overlappedItem;
		$('.pagearea .item').each(function () {
			if (this.id === 'item-' + item.id)
				return;

			var $t = $(this);
			var pos = $t.position();

			if (pos.top < bottom && top < pos.top + $t.outerHeight() &&
					pos.left < right && left < pos.left + $t.outerWidth()) {
				$overlappedItem = $t;
				return false;
			}
		});

		if ($overlappedItem) {
			$overlappedItem.find('.contenteditable').focus();
			self.notebook().activeSection().activePage().items.remove(item);
			return true;
		} else {
			return false;
		}
	}

	self.getActivePage = function () {
		var tmp;
		return (
			(tmp = self.notebook()) &&
			(tmp = tmp.activeSection()) &&
			tmp.activePage()
		) || undefined;
	};

	// Recalculate farthest position within a page.
	self.recalculateFarthestPosition = function() {
		var activePage = self.getActivePage();
		if (!activePage)
			return;

		var farthestPosition = self.getItemDimensions().reduce(function (a, b) {
			return {
				bottom: Math.max(a.bottom, b.bottom),
				right: Math.max(a.right, b.right),
			};
		}, { bottom: 0, right: 0 });
		activePage.farthestPosition
			.top(farthestPosition.bottom)
			.left(farthestPosition.right);
	};


	// Recalculate farthest position within a page every time the notebook,
	// section or page changes.
	var activeSectionSub, activePageSub;
	self.notebook.subscribe(notebookChanged);
	notebookChanged(self.notebook()); // Initialize.

	function notebookChanged(newNotebook) {
		if (activeSectionSub)
			activeSectionSub.dispose();

		window.nnb = newNotebook;

		activeSectionSub = newNotebook && newNotebook.activeSection.subscribe(activeSectionChanged);
		activeSectionChanged(newNotebook && newNotebook.activeSection());
	}
	function activeSectionChanged(newSection) {
		if (activePageSub)
			activePageSub.dispose();

		activePageSub = newSection && newSection.activePage.subscribe(recalculateFarthestPositionOnNextTick);
		recalculateFarthestPositionOnNextTick();
	}

	// Ensure that recalculation is done after Knockout has had a chance to
	// render.
	function recalculateFarthestPositionOnNextTick() {
		setTimeout(self.recalculateFarthestPosition, 0);
	}
}
