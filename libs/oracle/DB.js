var oracledb = require('oracledb');
var path = require('path');
var moment = require('moment');
var async = require('async');
var _ = require("underscore");
var _s = require("underscore.string");
var exprjs = require('exprjs');
var parser = new exprjs();
var XMLUtil = require('./XMLUtil.js');
var kplugFun = {
	_v: function (value) {
		if (_.isUndefined(value) || _.isNull(value)) {
			return "";
		}
		return value;
	}, _d: function (value) {
		if (_.isUndefined(value) || _.isNull(value)) {
			return 0;
		}
		if (_.isNaN(value * 1)) {
			return 0;
		}
		return value * 1;
	}
};

var prefix = ':';
var pools = [];
var daoList = [];
var months = {};
var daoPool = {};
var daoPath = path.join(__dirname, '../dao/', 'service_dao.xml');
console.log(daoPath);
var daoDoc = XMLUtil.createDocument(daoPath);
var list = XMLUtil.getNodeList(daoDoc, "*//sql-source");
var daoList = [];
list.forEach(function (source) {
	var daoPath2 = path.join(__dirname, '../dao/', XMLUtil.getAttr(source, "path"));
	daoList[daoList.length] = XMLUtil.createDocument(daoPath2);
	console.log("load dao:" + XMLUtil.getAttr(source, "path"));
});

function DB() {

}

DB.prototype.debug = 0;
DB.prototype.clusters = [];
DB.prototype.options = {};
DB.prototype.create = function (opt) {
	dbObj.options = opt;
	if (Array.isArray(opt) == false) {
		options = [opt];
	} else {
		options = opt;
	}
	dbObj.clusters = [];
	options.forEach(function (option) {
		dbObj.clusters.push(option.id);
		dbObj.debug = option.debug;
	});
	async.each(options, function (option, callback) {
		oracledb.createPool(
			{
				user: option.user,
				password: option.password,
				connectString: option.connectString
			},
			function (err, p) {
				console.log(p._createdDate)
				pools[option.id] = p;
				p.id = option.id;
				if (pools['default'] == null) {
					pools['default'] = p;
				}
				console.log('create pool:' + option.id);
				if (_.isUndefined(option.months) == false) {
					option.months.forEach(function (month) {
						months[month] = p;
					});
				}
				callback();
			});
	}, function (err) {
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
		}, 1000);
		return;
	}
	pools[id].getConnection(function (err, connection) {
		if (err) {
			console.error(err);
			cb(err, null);
			return;
		}
		console.log('pool.connectionOpen:' + pools[id].connectionsOpen);
		cb(err, connection);
	});
}
DB.prototype.getConnection = getConnection;

DB.prototype.execute = function (sql, param, cb) {
	getConnection(function (err, con) {
		con.execute(sql, param, function (err, result) {
			if (err) {
				cb(err, result);
				return;
			}
			cb(err, result);
			con.close(
				function (err) {
					if (err) {
						console.error(err.message);
					}
					console.error('connection.close');
				});
		});
	});
}

DB.prototype.loadDao = function (dao) {
	if (_.isUndefined(dao.xml) == true && daoPool[dao.dao] != null) {
		return daoPool[dao.dao];
	}
	var dNode;
	if (_.isUndefined(dao.xml) == false) {
		var doc = XMLUtil.createDocumentFromString('<?xml version="1.0" encoding="UTF-8"?>\r\n' + dao.xml);
		dNode = XMLUtil.getNode(doc, "dao");
	} else {
		//console.log('-----------------------------------------------------');
		//console.log(dao.dao + ',daoList:' + daoList.length);
		for (var idx = 0; idx < daoList.length; idx++) {
			//console.log('idx:' + idx);
			var doc = daoList[idx];
			var daoNode = XMLUtil.getNode(doc, "*//dao[@name='" + dao.dao + "']");
			if (daoNode != null) {
				dNode = daoNode;
				break;
			}
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
			parameters.push({kind: 1, key: key, i: idx, type: type});
		} else if (kind == "2") {
			parameters.push({kind: 2, key: key, i: idx, type: type, condition: XMLUtil.getAttr(node, 'condition')});
		} else if (kind == "3") {
			parameters.push({kind: 3, key: key, i: idx, type: type});
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

DB.prototype.queryDao = function (dao, param, cb) {
	var daoBean = this.loadDao(dao);
	if (daoBean == null) {
		cb({message: 'no dao:' + dao.name}, null, null);
		return;
	}
	var sql = "";
	daoBean.statements.forEach(function (statement) {
		if (statement.test != '') {
			var test = parser.parse(statement.test);
			var r = parser.run(test, kplugFun, {
				param: param
			});
			test = null;
			if (r) {
				sql += ' ' + statement.sql;
			}
		} else {
			sql += ' ' + statement.sql;
		}
	});

	var con = {};
	daoBean.parameters.forEach(function (parameter) {
		if (parameter.kind == 1) {
			sql = sql.replace('?', prefix + parameter.key);
			if (parameter.type == 'likestring') {
				con[parameter.key] = '%' + param[parameter.key] + '%';
			} else if (parameter.type == 'date') {
				if (param[parameter.key] instanceof Date) {
					con[parameter.key] = param[parameter.key];
				} else {
					con[parameter.key] = new moment(param[parameter.key], 'YYYY/MM/DD HH:mm:ss').toDate();
				}
			} else {
				con[parameter.key] = param[parameter.key];
			}
		} else if (parameter.kind == 2) {
			if (_.isUndefined(param[parameter.key]) == false || _.isEmpty(param[parameter.key]) == false) {
				sql += " and " + parameter.condition;
				sql = sql.replace('?', prefix + parameter.key);
				if (parameter.type == 'likestring') {
					con[parameter.key] = '%' + param[parameter.key] + '%';
				} else if (parameter.type == 'date') {
					if (param[parameter.key] instanceof Date) {
						con[parameter.key] = param[parameter.key];
					} else {
						con[parameter.key] = new moment(param[parameter.key], 'YYYY/MM/DD HH:mm:ss').toDate();
					}
				} else {
					con[parameter.key] = param[parameter.key];
				}
			}
		} else if (parameter.kind == 3) {
			if (sql.indexOf(prefix + parameter.key) >= 0) {
				if (parameter.type == 'likestring') {
					con[parameter.key] = '%' + param[parameter.key] + '%';
				} else if (parameter.type == 'date') {
					if (param[parameter.key] instanceof Date) {
						con[parameter.key] = param[parameter.key];
					} else {
						con[parameter.key] = new moment(param[parameter.key], 'YYYY/MM/DD HH:mm:ss').toDate();
					}
				} else {
					con[parameter.key] = param[parameter.key];
				}
			}
		}
	});

	daoBean.groupbys.forEach(function (statement) {
		if (statement.test != '') {
			var test = parser.parse(statement.test);
			var r = parser.run(test, kplugFun, {
				param: param
			});
			test = null;
			if (r) {
				sql += ' ' + statement.sql;
			}
		} else {
			sql += ' ' + statement.sql;
		}
	});

	daoBean.orderbys.forEach(function (statement) {
		if (statement.test != '') {
			var test = parser.parse(statement.test);
			var r = parser.run(test, kplugFun, {
				param: param
			});
			test = null;
			if (r) {
				sql += ' ' + statement.sql;
			}
		} else {
			sql += ' ' + statement.sql;
		}
	});
	cb(null, sql, con);
};

DB.prototype.doQuery = function (connection, sqlstring, condition, mode, start, size, cb) {
	if (mode == 0 || (mode == 1 && size > 0)) {
		if (connection.oracleServerVersion >= 1201000000) {
			sqlstring += " OFFSET :offset ROWS FETCH NEXT :maxnumrows ROWS ONLY";
		} else {
			sqlstring = "SELECT * FROM (SELECT A.*, ROWNUM AS MY_RNUM FROM"
				+ "(" + sqlstring + ") A "
				+ "WHERE ROWNUM <= :maxnumrows + :offset) WHERE MY_RNUM > :offset";
		}
		if (mode == 0) {
			condition['offset'] = 0;
			condition['maxnumrows'] = 1;
		} else if (mode == 1 && size > 0) {
			condition['offset'] = start;
			condition['maxnumrows'] = size;
		}
	}
	if (dbObj.debug == 1) {
		console.log("sqlstring:" + sqlstring);
		console.log("parameters:" + JSON.stringify(condition));
	}
	connection.execute(sqlstring, condition, function (err, result) {
		if (err) {
			if (mode == 1) {
				cb(err, []);
			} else {
				cb(err, null);
			}
			connection.close(
				function (err) {
					if (err) {
						console.error(err.message);
					}
					// console.info('connection.close');
				});
			return;
		}
		var data = [];
		_.each(result.rows, function (row, idx) {
			var dd = {};
			for (var i = 0; i < row.length; i++) {
				dd[result.metaData[i].name.toLowerCase()] = row[i];
			}
			data.push(dd);
		});
		if (mode == 1) {
			cb(null, data);
		} else {
			if (data.length > 0) {
				cb(null, data[0]);
			} else {
				cb(null, null);
			}
		}
		connection.close(
			function (err) {
				if (err) {
					console.error(err.message);
				}
				//console.info('connection.close');
			});
	});
};

var dbObj = new DB();
module.exports = exports = dbObj;