/*global ko, $, Section, Page, confirm, KEY_ENTER, KEY_DEL, KEY_ESC */
/*eslint-disable no-alert */

'use strict';

/*eslint-disable camelcase */
exports.AppViewModel_Nav = AppViewModel_Nav;
function AppViewModel_Nav(self) {
/*eslint-enable camelcase */
	self.deleteButtonKeydown = function (_, e) {
		if (e.which === KEY_ENTER) {
			e.stopPropagation();
			$(e.target).click();
		}
		return true;
	};

	self.sectionSelect = function (section) {
		self.notebook().activeSection(section);
	};

	self.renamedSection = ko.observable(undefined);
	self.sectionRename = function (section) {
		if (section) {
			self.renamedSection(section);
			$('.sections .renaming input').focus()[0].select();
		} else {
			var a = $('.sections .renaming a');
			self.renamedSection(section);
			a.focus();
		}
	};

	self.sectionCreate = function () {
		var section = new Section({
			name: 'New section',
			color: self.notebook().colorGenerator(),
			activePage: 0,
			pages: [{
				name: ''
			}]
		});
		self.notebook().sections.push(section);
		self.sectionSelect(section);
		self.sectionRename(section);
		return section;
	};

	function sectionSelectDirection(dir) {
		var activeSection = self.notebook().activeSection;
		var sections = self.notebook().sections;

		// Find the index of the active section and get the next one, but wrap around if out of bounds.
		var index = (sections.indexOf(activeSection()) + dir + sections().length) % sections().length;
		var section = sections()[index];

		// If the previously active section had focus, focus the new one too.
		if ('section-' + activeSection().id === document.activeElement.parentElement.id)
			$('#section-' + section.id + ' > a').focus();

		activeSection(section);
	}

	self.sectionSelectNext = sectionSelectDirection.bind(null, 1);
	self.sectionSelectPrevious = sectionSelectDirection.bind(null, -1);

	function sectionDelete(section) {
		if (confirm("Are you sure you want to delete section '" + section.name() + "', including its pages?")) {
			var notebook = self.notebook();
			if (notebook.activeSection() === section) {
				if (notebook.sections().length === 1) {
					self.sectionCreate();
				} else {
					var index = notebook.sections().indexOf(section);
					self.sectionSelect(notebook.sections()[index ? index - 1 : index + 1]);
				}
			}
			self.notebook().sections.remove(section);
			return true;
		} else {
			return false;
		}
	}

	self.sectionDelete = function (section, e) {
		e.stopPropagation();
		return sectionDelete(section);
	};

	self.sectionKeydown = function (section, e) {
		var key = e.keyCode;
		if (key === KEY_ENTER && section === self.notebook().activeSection()) {
			e.preventDefault();
			if (section === self.renamedSection()) {
				self.sectionRename(undefined);
			} else {
				self.sectionRename(section);
			}
		} else if (key === KEY_DEL && section !== self.renamedSection()) {
			return !sectionDelete(section);
		} else if (key === KEY_ESC && section === self.renamedSection()) {
			$('.sections .renaming input').val(section.name());
			self.sectionRename(undefined);
		}
		return true;
	};

	self.pageCreate = function (section) {
		if (!section)
			section = self.notebook().activeSection();
		var page = new Page({
			name: '',
			items: []
		});
		section.pages.push(page);
		section.activePage(page);
		self.pageRename();
	};
	self.pageRename = function () {
		$('.pagearea .item.title > .contenteditable').focus();
	};

	function pageDelete(page) {
		$('#page-' + page.id + ' > .delete').focus();
		if (confirm("Are you sure you want to delete page '" + page.name() + "'?")) {
			var section = self.notebook().activeSection();
			if (section.activePage() === page) {
				if (section.pages().length === 1) {
					self.pageCreate(section);
				} else {
					var index = section.pages().indexOf(page);
					section.activePage(section.pages()[index ? index - 1 : index + 1]);
				}
			}
			section.pages.remove(page);
			return true;
		} else {
			return false;
		}
	}

	self.pageDelete = function (page, e) {
		e.stopPropagation();
		return pageDelete(page);
	};

	function pageSelectDirection(dir) {
		var activePage = self.notebook().activeSection().activePage;
		var pages = self.notebook().activeSection().pages;

		// Find the index of the active section and get the next one, but wrap around if out of bounds.
		var index = (pages.indexOf(activePage()) + dir + pages().length) % pages().length;
		var page = pages()[index];

		// If the previously active page had focus, focus the new one too.
		if ('page-' + activePage().id === document.activeElement.parentElement.id)
			$('#page-' + page.id + ' > a').focus();

		activePage(page);
	}

	self.pageSelectNext = pageSelectDirection.bind(null, 1);
	self.pageSelectPrevious = pageSelectDirection.bind(null, -1);
	self.pageKeydown = function (page, e) {
		if (e.keyCode === KEY_DEL) {
			return !pageDelete(page);
		}
		return true;
	};

	function keepFocus(parent, focusableChildren) {
		var timeout;
		$('body').on('focus blur', focusableChildren.replace(/&/g, parent), function (e) {
			clearTimeout(timeout);
			var parentElem = $(this).is(parent) ? this : $(this).parents(parent)[0];

			if (e.type === 'focusin') {
				$(parentElem).add(parent + '.focus').each(function () {
					if (this === parentElem)
						$(this).addClass('focus');
					else
						$(this).removeClass('focus');
				});
			} else {
				timeout = setTimeout(function () {
					$(parentElem).removeClass('focus');
				}, 50);
			}
		});
	}

	keepFocus('.pages a', '&, & > .delete');
	keepFocus('.sections a', '&, & > .delete');
}

/*eslint-enable no-alert */
