/*global ko, alert */

'use strict';

exports.PersonaAccountViewModel = PersonaAccountViewModel;
function PersonaAccountViewModel(dataModel) {
	if (!navigator.id)
		throw new ReferenceError('navigator.id not supported.');

	var self = this;
	self.type = 'persona';

	navigator.id.watch({
		onlogin: function (assertion) {
			self.isLoggingIn(true);

			// Get token.
			dataModel.login(assertion)
			.then(function () {
				self.isLoggingIn(false);
				self.isLoggedIn(true);
			}).catch(function (error) {
				navigator.id.logout();
				if (error.responseJSON)
					error = error.responseJSON;
				else if (error.responseText)
					error = error.responseText;

				var message =
					error instanceof Error ? error :
					error.status === 'error' && error.error ? error.error :
					error;

				/*eslint-disable no-alert */
				alert('Login failed.\n' + message);
				/*eslint-enable no-alert */
				self.isLoggingIn(false);
			});
		},

		onlogout: function () {
			if (self.isLoggedIn()) {
				dataModel.logout()
				.then(function () {
					self.isLoggedIn(false);
				}).catch(function () {
					// Try again, and this time actually refresh the page.
					dataModel.logout({refresh: true});
				});
			}
		},
	});

	self.isLoggedIn = ko.observable(false);
	self.isLoggingIn = ko.observable(false);

	self.login = function () {
		if (self.isLoggingIn())
			return;
		navigator.id.request();
	};

	self.logout = function () {
		navigator.id.logout();
	};
}
