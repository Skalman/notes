/*global ko, $, Mousetrap */

'use strict';

/*eslint-disable camelcase */
exports.AppViewModel_KeyboardShortcuts = AppViewModel_KeyboardShortcuts;
function AppViewModel_KeyboardShortcuts(self) {
/*eslint-enable camelcase */
	// Keyboard shortcuts.
	// Mousetrap does the same test, but we can't get the result from there.
	self.keyboardShortcutsActive = ko.observable(false);
	self.keyboardShortcuts = [
		{
			bindGlobal: 'alt+h',
			bind: '?',
			desc: 'Open keyboard shortcut help',
			fn: function () {
				self.keyboardShortcutsActive(!self.keyboardShortcutsActive());
			}
		},
		{
			bind: 'esc',
			fn: function () {
				if (self.keyboardShortcutsActive())
					self.keyboardShortcutsActive(false);
			}
		},
		{
			bindGlobal: 'mod+s',
			desc: 'Save the notebook to localStorage (auto-save triggers when idle for 10 seconds)',
			fn: self.save
		},
		{
			bindGlobal: 'alt+shift+n',
			desc: 'Create a new section',
			fn: self.sectionCreate,
			elem: '.add-section > a'
		},
		{
			bindGlobal: 'alt+shift+pagedown',
			desc: 'Select the next section',
			fn: self.sectionSelectNext
		},
		{
			bindGlobal: 'alt+shift+pageup',
			desc: 'Select the previous section',
			fn: self.sectionSelectPrevious
		},
		{
			bindGlobal: 'alt+n',
			desc: 'Create a new page',
			fn: self.pageCreate,
			elem: '.add-page > a'
		},
		{
			bindGlobal: 'alt+pagedown',
			desc: 'Select the next page',
			fn: self.pageSelectNext,
		},
		{
			bindGlobal: 'alt+pageup',
			desc: 'Select the previous page',
			fn: self.pageSelectPrevious,
		},
	];
	self.keyboardShortcuts.forEach(function (x) {
		// Add keyboard shortcut to the title of the element.
		if (x.elem)
			$(x.elem).attr('title', $(x.elem).attr('title') + ' (' + (x.bindGlobal || x.bind) + ')');

		// Bind the shortcut.
		if (x.bindGlobal)
			Mousetrap.bindGlobal(x.bindGlobal, fn);
		if (x.bind)
			Mousetrap.bind(x.bind, fn);

		function fn() {
			x.fn();
			return false;
		}
	});
}
