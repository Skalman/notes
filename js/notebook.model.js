/*global ko, $, escapeHtml, stripTags */
/*jshint eqnull:true */

'use strict';

exports.Notebook = Notebook;
exports.Section = Section;
exports.Page = Page;
exports.Item = Item;

function coerceItemsAndActive(Class, items, active) {
	var activeIndex =
		typeof active === 'number'
			? active
		: items
			? items.indexOf(active)
		: -1;

	var cItems = (items || []).map(function (x) {
		return x instanceof Class ? x : new Class(x);
	});

	var cActive = activeIndex !== -1
			? cItems[activeIndex]
		: active instanceof Class
			? active
		: active
			? new Class(active)
		: null;

	return {
		items: cItems,
		active: cActive
	};
}

function Notebook(options) {
	var self = this;
	self.idGenerator = Notebook.makeIdGenerator();
	self.colorGenerator = Notebook.makeColorGenerator();
	self.id = options.id || null;
	self.name = ko.observable(options.name);

	var ia = coerceItemsAndActive(Section, options.sections, options.activeSection);
	self.sections = ko.observableArray(ia.items);
	self.activeSection = ko.observable(ia.active);

	// Set IDs.
	var nodes = self.getNodes();
	var maxId = nodes
		.map(function (x) {
			return x.id;
		}).reduce(function (a, b) {
			return (
				a == null ? b :
				b == null ? a :
				Math.max(a, b)
			);
		});
	self.idGenerator(maxId || 0);
	nodes.forEach(function (node) {
		if (node.id == null)
			node.id = self.idGenerator();
	});

	// Update the color generator.
	self.sections().forEach(function (s) {
		self.colorGenerator(s.color.toHexString());
	});
}

Notebook.prototype.toJSON = function() {
	return {
		id: this.id,
		name: this.name(),
		sections: this.sections().map(function (x) {
			return x.toJSON();
		}),
		activeSection: this.sections.indexOf(this.activeSection())
	};
};

Notebook.prototype.getNodes = function() {
	var nodes = [this];
	this.sections().forEach(function (section) {
		nodes.push(section);
		section.pages().forEach(function (page) {
			nodes.push(page);
			page.items().forEach(function (item) {
				nodes.push(item);
			});
		});
	});

	return nodes;
};

Notebook.makeIdGenerator = function (startId) {
	var lastId = startId || 0;

	return function (setLastId) {
		if (arguments.length) {
			lastId = Math.max(lastId, setLastId);
		} else {
			return ++lastId;
		}
	};
};

Notebook.makeColorGenerator = function (putLast) {
	// `colors` is an array, where the first item is the next to be returned.
	var byCode = {};
	var byName = {};
	var colors = this.colors.map(function (color) {
		byCode[color.code] = color.name;
		byName[color.name] = color.code;
		return color.code;
	});
	if (putLast)
		putLast.forEach(generator);

	function generator(setLastColor) {
		if (!setLastColor) {
			colors.push(colors.shift());
			return colors[colors.length - 1];
		} else {
			if (!byCode[setLastColor])
				setLastColor = byName[setLastColor];

			if (setLastColor) {
				// Remove the color from the array.
				colors.splice(colors.indexOf(setLastColor), 1);
				colors.push(setLastColor);
			}
		}
	}
	generator.getName = function (colorCode) {
		return byCode[colorCode];
	};
	generator.getCode = function (colorName) {
		return byName[colorName];
	};
	generator.addColor = function (color) {
		var code = color.code || color;
		var name = color.name || code;
		if (!byCode[code] && !byName[name]) {
			byCode[code] = name;
			byName[name] = code;
			colors.push(code);
		}
	};

	return generator;
};

Notebook.colors = [
	{ code: '#e87d7d', name: 'Color 1' },
	{ code: '#a3d194', name: 'Color 2' },
	{ code: '#7db2e8', name: 'Color 3' },
	{ code: '#d194c2', name: 'Color 4' },
	{ code: '#e8e87d', name: 'Color 5' },
	{ code: '#94d1c2', name: 'Color 6' },
	{ code: '#b27de8', name: 'Color 7' },
	{ code: '#d1a394', name: 'Color 8' },
	{ code: '#7de87d', name: 'Color 9' },
	{ code: '#94a3d1', name: 'Color 10' },
	{ code: '#e87db3', name: 'Color 11' },
	{ code: '#c2d194', name: 'Color 12' },
	{ code: '#7de8e8', name: 'Color 13' },
	{ code: '#c294d1', name: 'Color 14' },
	{ code: '#e8b27d', name: 'Color 15' },
	{ code: '#94d1a3', name: 'Color 16' },
	{ code: '#7d7de8', name: 'Color 17' },
	{ code: '#d194a3', name: 'Color 18' },
	{ code: '#b3e87d', name: 'Color 19' },
	{ code: '#94c2d1', name: 'Color 20' },
	{ code: '#e87de8', name: 'Color 21' },
	{ code: '#d1c294', name: 'Color 22' },
	{ code: '#7de8b3', name: 'Color 23' },
	{ code: '#a394d1', name: 'Color 24' },
	{ code: '#b3b3b3', name: 'Color 25' }
];

function Section(options) {
	this.id = options.id || null;
	this.name = ko.observable(options.name);
	/*eslint-disable new-cap */
	this.color = $.Color(options.color || '#ccc');
	/*eslint-enable new-cap */

	var ia = coerceItemsAndActive(Page, options.pages, options.activePage);
	this.pages = ko.observableArray(ia.items);
	this.activePage = ko.observable(ia.active);
}

Section.prototype.toJSON = function() {
	return {
		id: this.id,
		name: this.name(),
		color: this.color.toHexString(),
		pages: this.pages().map(function (x) {
			return x.toJSON();
		}),
		activePage: this.pages.indexOf(this.activePage())
	};
};

function Page(options) {
	var self = this;
	self.id = options.id || null;

	self.items = ko.observableArray((options.items || []).map(function (x) {
		return x instanceof Item ? x : new Item(x);
	}));

	self.titleItem = ko.computed({
		read: function () {
			var res;
			// Find the title.
			self.items().some(function (item) {
				if (item.isTitle) {
					res = item;
					return true;
				}
			});
			if (!res) {
				res = new Item({
					isTitle: true
				});
				self.items.unshift(res);
			}
			return res;
		}
	});

	var titleItem = self.titleItem();
	if (!titleItem.html() && options.name != null) {
		titleItem.html(escapeHtml(options.name));
	}

	self.name = ko.computed({
		read: function () {
			return stripTags(self.titleItem().html());
		},
		write: function (value) {
			self.titleItem().html(escapeHtml(value));
		}
	});

	// Non-stored, tracks the state of the UI.
	self.farthestPosition = {
		top: ko.observable(0),
		left: ko.observable(0),
	};
}

Page.prototype.toJSON = function() {
	return {
		id: this.id,
		items: this.items()
			.filter(function (x) {
				return stripTags(x.html());
			})
			.map(function (x) {
				return x.toJSON();
			})
	};
};

function Item(options) {
	this.id = options.id || null;
	this.isTitle = !!options.isTitle;
	this.x = ko.observable(options.x || 1);
	this.y = ko.observable(options.y || 1);
	this.html = ko.observable(options.html || '');

	// Non-stored, tracks the state of the UI.
	this.isEmpty = ko.observable(false);
	this.isSelected = ko.observable(false);
}

Item.prototype.toJSON = function() {
	return {
		id: this.id,
		isTitle: this.isTitle || undefined, // Only include in JSON if true.
		x: this.x(),
		y: this.y(),
		html: this.html()
	};
};
