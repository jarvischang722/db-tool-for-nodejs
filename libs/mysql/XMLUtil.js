var xpath = require('xpath');
var _ = require("underscore");
_.str = require('underscore.string');
var fs = require('fs');
var xmldom = require('xmldom');
var dom = xmldom.DOMParser;
var serializer = xmldom.XMLSerializer;

exports.createDocument = function (path) {
	var data = fs.readFileSync(path, 'utf-8');
	var doc = new dom().parseFromString(data);
	return doc;
};

exports.createDocumentFromString = function (data) {
	var doc = new dom().parseFromString(data);
	return doc;
};

exports.saveDocument = function (doc, path) {
	var data = fs.writeFileSync(path, doc.toString(), 'utf-8');
};

exports.getNodeList = function (doc, path) {
	var nodes = xpath.select(path, doc);
	return nodes;
};

exports.getNode = function (doc, path) {
	var node = xpath.select1(path, doc);
	return node;
};

exports.getNodeValue = function (node) {
	return node.firstChild.data;
};

exports.toString = function (doc) {
	return serializer.serializeToString(doc);
};


exports.getAttr = function (node, name) {
	if (node == null) {
		return "";
	}
	return node.getAttribute(name);
};