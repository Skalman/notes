/*global $, Promise, Notebook, ApiError */

'use strict';

exports.ApiDataModel = ApiDataModel;
function ApiDataModel(options) {
	var path = options.path.replace(/\/?$/, '/');

	function apiAjax(options) {
		options.url = path + options.url;
		options.dataType = 'json';

		return Promise.all([
			$.ajax(options)
		]).then(function (values) {
			if (values[0].status !== 'ok')
				throw new ApiError(values[0].error || 'Unknown error', values[0]);

			return values[0];
		});
	}


	this.login = function (assertion) {
		return apiAjax({
			url: 'accounts/login',
			type: 'POST',
		}).catch(function (error) {
			if (!error.data)
				throw new ApiError('Expected ApiError with data', error);
			else if (!error.data.login_token)
				throw new ApiError('Expected login_token', error);

			return apiAjax({
				url: 'accounts/login',
				type: 'POST',
				data: {
					/*eslint-disable camelcase */
					login_token: error.data.login_token,
					/*eslint-enable camelcase */
					assertion: assertion,
				}
			});
		});
	};

	this.logout = function (options) {
		options = options || {};
		if (options.refresh) {
			location.href = path +
				'accounts/logout?returnUrl=' +
				encodeURIComponent(typeof options.refresh === 'string'
					? options.refresh
					: location.href);
		} else {
			return apiAjax({
				url: 'accounts/logout',
			});
		}
	};

	this.getNotebook = function () {
		return apiAjax({
			url: 'notebook',
		}).then(function (data) {
			data.notebook = new Notebook(data.notebook);
			return data;
		});
	};

	this.setNotebook = function (options) {
		return apiAjax({
			url: 'notebook',
			type: 'PUT',
			data: {
				revision: options.revision,
				notebook: JSON.stringify(options.notebook),
			},
		});
	};
}
