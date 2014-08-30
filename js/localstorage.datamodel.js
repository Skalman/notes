/*global localStorage, Promise, Notebook, DataModelError, console, confirm */

'use strict';

exports.LocalStorageDataModel = LocalStorageDataModel;
function LocalStorageDataModel(options) {
	var item = options.item;
	var self = this;

	var exampleNotebook = {
		name: 'My Notebook',
		activeSection: 0,
		sections: [{
			name: 'New section',
			color: '#e87d7d',
			activePage: 0,
			pages: [{
				name: 'New page',
				items: [{
					x: 2,
					y: 4,
					html: 'Write something here',
				}],
			}],
		}],
	};

	self.getNotebook = function () {
		return new Promise(function (resolve) {
			var data = localStorage.getItem(item);
			if (data !== null) {
				data = JSON.parse(data);
				try {
					data.notebook = new Notebook(data.notebook);
				} catch (e) {
					/*eslint-disable no-alert, no-console */
					console.log('The data of your notebook:\n\n%s\n', localStorage.getItem(item));
					if (confirm('It looks like your notebook is corrupted. The data of your notebook is available in the web console (press F12 and choose the console).\n\nWould you like to permanently delete your notebook?')) {
						localStorage.removeItem(item);
						data = null;
					} else {
						throw new Error('Notebook data is corrupt');
					}
					/*eslint-enable no-alert, no-console */
				}
			}
			if (data === null) {
				data = {
					revision: null,
					notebook: new Notebook(exampleNotebook),
				};
			}

			resolve(data);
		});
	};

	self.setNotebook = function (options) {
		return self.getNotebook()
		.then(function (data) {
			var message;

			if ((options.revision || '') !== (data.revision || '')) {
				if (data.revision == null) {
					message = 'Notebook deleted';
				} else if (!options.revision) {
					message = 'Notebook already created';
				} else {
					message = 'Edit conflict';
				}

				throw new DataModelError(message, {
					code: 'edit_conflict',
					revision: data.revision,
				});
			}

			data = {
				revision: Math.random(),
				notebook: options.notebook,
			};

			localStorage.setItem(item, JSON.stringify(data));
			return {
				status: 'ok',
				revision: data.revision,
			};
		});
	};

	self.login =
	self.logout = function () {
		return Promise.reject(new DataModelError('The localStorage data model does not support login and logout'));
	};
}
