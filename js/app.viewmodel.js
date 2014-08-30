/*global ko,
	AppViewModel_Nav,
	AppViewModel_PageArea,
	AppViewModel_Storage,
	AppViewModel_KeyboardShortcuts */

'use strict';

exports.AppViewModel = AppViewModel;
function AppViewModel() {
	/*jshint newcap:false */
	var self = this;

	self.notebook = ko.observable();

	/*eslint-disable new-cap */

	// Methods for navigation between sections and pages.
	AppViewModel_Nav(self);

	// Methods for handling the page area and items.
	AppViewModel_PageArea(self);

	// Storing the notebook.
	AppViewModel_Storage(self);

	// Keyboard shortcuts.
	AppViewModel_KeyboardShortcuts(self);

	/*eslint-enable new-cap */
}
