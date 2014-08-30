/*global ko, AppViewModel, $ */

'use strict';

var app = new AppViewModel();
exports.app = app;

ko.applyBindings(app);

$('html').removeClass('not-loaded');
