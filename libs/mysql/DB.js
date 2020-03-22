var mysql = require('mysql');
var path = require('path');
var moment = require('moment');
var randomstring = require('randomstring');
var _ = require("underscore");
var _s = require("underscore.string");

var XMLUtil = require('./XMLUtil.js');

var options = [];
DB.prototype.options = options;
var pools = {};
var daoList = [];
var daoPool = {};

var daoPath = path.join(__dirname, '../dao/', 'service_dao.xml');
console.log(daoPath);
var daoDoc = XMLUtil.createDocument(daoPath);
var list = XMLUtil.getNodeList(daoDoc, "*//sql-source");

list.forEach(function (source) {
	var daoPath2 = path.join(__dirname, '../dao/', XMLUtil.getAttr(source, "path"));
	daoList[daoList.length] = XMLUtil.createDocument(daoPath2);
	console.log("load dao:" + XMLUtil.getAttr(source, "path"));
});
var daoList = daoList;


function DB() {

}

DB.prototype.create = function (opt) {
	if (Array.isArray(opt) == false) {
		options = [opt];
	} else {
		options = opt;
	}
	options.forEach(function (option) {
		var pool = mysql.createPool({
			//connectionLimit : 1,
			host: option.host,
			port: option.port,
			user: option.user,
			password: option.password,
			database: option.database,
			timezone: option.timezone
		});
		console.log('create pool is null:' + (pool == null));
		console.log('create pool:' + option.id);
		pools[option.id] = pool;
		if (pools['default'] == null) {
			pools['default'] = pool;
		}
	});
};

DB.prototype.isOk = function (id) {
	if (_.isUndefined(id)) {
		id = 'default';
	}
	return pools[id] == null ? false : true;
};

function getConnection(arg1, arg2) {
	var cb = arg1;
	var id = 'default';
	if (_.isFunction(arg1) == false) {
		cb = arg2;
		if (_.isUndefined(arg1) == false)
			id = arg1;
	}

	if (pools[id] == null) {
		console.log('wait [%s] pool init', id);
		setTimeout(function () {
			getConnection(id, cb);
		}, 100);
		return;
	}
	pools[id].getConnection(function (err, connection) {
		cb(err, connection);
	});
}
DB.prototype.getConnection = getConnection;

DB.prototype.query = function (sql, param, cb, id) {
	if (_.isUndefined(id)) {
		id = 'default';
	}
	pools[id].query(sql, param, function (err, rows, fields) {
		cb(err, rows, fields);
	});
}

DB.prototype.loadDao = function (daoKey) {
	if (daoPool[daoKey] != null) {
		return daoPool[daoKey];
	}
	var dNode;
	//console.log('-----------------------------------------------------');
	//console.log(daoKey + ',daoList:' + daoList.length);
	for (var idx = 0; idx < daoList.length; idx++) {
		//console.log('idx:' + idx);
		var doc = daoList[idx];
		var daoNode = XMLUtil.getNode(doc, "*//dao[@name='" + daoKey + "']");
		if (daoNode != null) {
			dNode = daoNode;
			break;
		}
	}
	if (dNode == null) {
		return null;
	}
	var statementsNode = XMLUtil.getNodeList(dNode, "statement");
	var statements = [];
	statementsNode.forEach(function (node, idx) {
		var sql = XMLUtil.getNodeValue(node);
		var test = XMLUtil.getAttr(node, "test");
		statements.push({sql: sql, test: test});
	});
	var parametersNode = XMLUtil.getNodeList(dNode, "parameter");
	var parameters = [];
	parametersNode.forEach(function (node, idx) {
		var key = XMLUtil.getNodeValue(node);
		key = key.toLowerCase();
		var kind = XMLUtil.getAttr(node, "kind");
		var type = XMLUtil.getAttr(node, "type");
		type = type.toLowerCase();
		if (kind == "" || kind == "1") {
			if (type == "mseq") {
				var seq = XMLUtil.getAttr(node, "seq");
				var seq2 = XMLUtil.getAttr(node, "seq2");
				parameters.push({i: idx, kind: 1, key: key, type: type, seq: seq, seq2: seq2});
			} else {
				parameters.push({i: idx, kind: 1, key: key, type: type});
			}
		} else if (kind == "2") {
			parameters.push({i: idx, kind: 2, key: key, type: type, condition: XMLUtil.getAttr(node, 'condition')});
		} else if (kind == "3") {
			parameters.push({i: idx, kind: 3, key: key, type: type});
		}
	});
	parameters.sort(function (a, b) {
		if (a.kind > b.kind) {
			return 1;
		} else if (a.kind < b.kind) {
			return -1;
		}
		return a.i > b.i ? 1 : -1;
	});
	var groupbysNode = XMLUtil.getNodeList(dNode, "groupby");
	var groupbys = [];
	groupbysNode.forEach(function (node, idx) {
		var sql = XMLUtil.getNodeValue(node);
		var test = XMLUtil.getAttr(node, "test");
		groupbys.push({sql: sql, test: test});
	});

	var orderbysNode = XMLUtil.getNodeList(dNode, "orderby");
	var orderbys = [];
	orderbysNode.forEach(function (node, idx) {
		var sql = XMLUtil.getNodeValue(node);
		var test = XMLUtil.getAttr(node, "test");
		orderbys.push({sql: sql, test: test});
	});

	return {statements: statements, parameters: parameters, groupbys: groupbys, orderbys: orderbys};
};

module.exports = exports = new DB;