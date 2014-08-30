// Highly inspired by http://jsfiddle.net/rniemeyer/JksKx/

/*global ko */
/*eslint-disable no-underscore-dangle */

'use strict';

ko.bindingHandlers.htmlValue = {
	init: function(element, valueAccessor, allBindingsAccessor) {
		ko.utils.registerEventHandler(element, 'blur', function() {
			var modelValue = valueAccessor();
			var elementValue = element.innerHTML;
			if (ko.isWriteableObservable(modelValue)) {
				modelValue(elementValue);
			} else { //handle non-observable one-way binding
				var allBindings = allBindingsAccessor();
				if (allBindings._ko_property_writers && allBindings._ko_property_writers.htmlValue)
					allBindings._ko_property_writers.htmlValue(elementValue);
			}
		});
	},
	update: function(element, valueAccessor) {
		var value = ko.utils.unwrapObservable(valueAccessor()) || '';

		if (element.innerHTML !== value)
			element.innerHTML = value;
	}
};

ko.bindingHandlers.textValue = {
	init: function(element, valueAccessor, allBindingsAccessor) {
		ko.utils.registerEventHandler(element, 'blur', function() {
			var modelValue = valueAccessor();
			var elementValue = element.textContent;
			if (ko.isWriteableObservable(modelValue)) {
				modelValue(elementValue);
			} else { //handle non-observable one-way binding
				var allBindings = allBindingsAccessor();
				if (allBindings._ko_property_writers && allBindings._ko_property_writers.textValue)
					allBindings._ko_property_writers.textValue(elementValue);
			}
		});
	},
	update: function(element, valueAccessor) {
		var value = ko.utils.unwrapObservable(valueAccessor()) || '';

		if (element.textContent !== value)
			element.textContent = value;
	}
};

/*eslint-enable no-underscore-dangle */
