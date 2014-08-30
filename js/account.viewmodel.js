/*global ko */

'use strict';

exports.AccountViewModel = AccountViewModel;
function AccountViewModel(options) {
	var item = options.item;
	var self = this;

	self.type = 'noauth';
	self.isLoggedIn = ko.observable(false);
	self.isLoggingIn = ko.observable(false);

	self.login = function () {
		localStorage.setItem(item, '1');
		self.isLoggedIn(true);
	};

	self.logout = function () {
		localStorage.setItem(item, '');
		self.isLoggedIn(false);
	};

	if (localStorage.getItem(item))
		setTimeout(self.login, 0);
}
