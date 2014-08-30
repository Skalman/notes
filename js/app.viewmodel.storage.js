/*global $, ko, config,
	ApiDataModel, LocalStorageDataModel, PersonaAccountViewModel, AccountViewModel,
	alert, confirm, console */

'use strict';

/*eslint-disable camelcase */
exports.AppViewModel_Storage = AppViewModel_Storage;
function AppViewModel_Storage(self) {
/*eslint-enable camelcase */
	self.loadingNotebook = ko.observable(false);
	self.notebookRevision = ko.observable(null);

	// Set self.dataModel
	if (config.storage.type === 'api') {
		self.dataModel = new ApiDataModel(config.storage);
	} else if (config.storage.type === 'localstorage') {
		self.dataModel = new LocalStorageDataModel(config.storage);
	} else {
		throw new Error('Unknown storage type');
	}

	// Set self.account
	if (config.account.type === 'persona') {
		self.account = new PersonaAccountViewModel(self.dataModel);
	} else if (config.account.type === 'noauth') {
		self.account = new AccountViewModel(config.account);
	} else {
		throw new Error('Unknown account type');
	}

	self.account.isLoggedIn.subscribe(function (newValue) {
		if (newValue) {
			self.load();
		} else {
			self.notebook(null);
		}
	});


	self.load = function () {
		self.loadingNotebook(true);
		self.dataModel.getNotebook()
		.then(function (data) {
			self.loadingNotebook(false);
			self.notebook(data.notebook);
			self.notebookRevision(data.revision);
		}).catch(function (error) {
			self.loadingNotebook(false);

			if (error.responseJSON)
				error = error.responseJSON;
			else if (error.responseText)
				error = error.responseText;

			var message =
				error instanceof Error ? error :
				error.status === 'error' && error.error ? error.error :
				error;

			window.err = error;

			/*eslint-disable no-alert */
			alert('Cannot load notebook.\n' + message +
				(error.stack ? '\n\nTeknisk information:\n' + error.stack : '')
			);
			/*eslint-enable no-alert */
		});
	};

	self.isSaving = ko.observable(false);
	self.save = function () {
		if (!self.notebook() || self.isSaving())
			return;

		self.isSaving(true);
		self.saveUiState();

		self.dataModel.setNotebook({
			revision: self.notebookRevision(),
			notebook: self.notebook(),
		}).then(function (data) {
			self.notebookRevision(data.revision);
			self.isSaving(false);
		}).catch(function (error) {
			/*eslint-disable no-alert, no-console */
			if (error.data && error.data.error_code === 'edit_conflict') {
				if (confirm('Edit conflict: It looks like your notebook has been modified by someone else. Would you like to discard your changes?')) {
					self.isSaving(false);
					self.load();
				} else if (confirm("Edit conflict: Would you like to discard the other person's changes?")) {
					self.notebookRevision(error.data.revision);
					self.isSaving(false);
					self.save();
				} else {
					// Do nothing.
					self.isSaving(false);
				}
			} else {
				alert('Cannot save notebook.\n' + error);
				console.error(error);

				self.isSaving(false);
			}
			/*eslint-enable no-alert, no-console */
		});
	};

	// Auto-save 15 seconds after something blurred.
	var saveTimeout;
	$('body').on('blur', '[contenteditable], a, input', function () {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(self.save, 15 * 1000);
	});
}
