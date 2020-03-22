var sql = require('mssql');
var path = require('path');
var moment = require('moment');
var async = require('async');
var _ = require("underscore");
var _s = require("underscore.string");
var exprjs = require('exprjs');
var parser = new exprjs();
var XMLUtil = require('../kplug-mssql/XMLUtil.js');

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
var prefix = '@';
var option = {};
var pools = [];
var id = moment().format("YYYYMMDDHHmmssSSS");
var pool;
var daoList = [];
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
	if (Array.isArray(opt) == false) {
		dbObj.options = [opt];
	} else {
		dbObj.options = opt;
	}
	dbObj.clusters = [];
	dbObj.options.forEach(function (option) {
		dbObj.clusters.push(option.id);
		dbObj.debug = option.debug;
	});
	async.each(dbObj.options, function (option, callback) {
		var pool = new sql.Connection(option, function (err) {
			if (err) {
				console.log(err);
				return;
			}
			pools[option.id] = pool;
			pool.id = option.id;
			pool.timezone = option.timezone;
			if (pools['default'] == null) {
				pools['default'] = pool;
			}
			console.log('create pool:' + option.id);
			if (_.isUndefined(option.months) == false) {
				option.months.forEach(function (month) {
					months[month] = pool;
				});
			}
			callback();
		});
	}, function (err) {
	});
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
	cb(null, pools[id]);
}
DB.prototype.getConnection = getConnection;

DB.prototype.execute = function (sqlstring, param, cb) {
	getConnection(function (err, pools) {
		var request = new sql.Request(pools); // or: var request = connection1.request();
		request.query(sqlstring, function (err, result) {
			if (err) {
				cb(err, result);
				return;
			}
			cb(err, result);
		});
	});
}

DB.prototype.loadDao = function (daoKey) {
	if (daoPool[daoKey] != null) {
		return daoPool[daoKey];
	}
	var dNode;
	console.log('-----------------------------------------------------');
	console.log(daoKey + ',daoList:' + daoList.length);
	for (var idx = 0; idx < daoList.length; idx++) {
		console.log('idx:' + idx);
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

DB.prototype.queryDao = function (daoName, param, cb) {
	var daoBean = dbObj.loadDao(daoName);
	if (daoBean == null) {
		cb({message: 'no dao:' + daoName}, null, null);
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

	var con = [];
	daoBean.parameters.forEach(function (parameter) {
		if (parameter.kind == 1) {
			sql = sql.replace('?', prefix + parameter.key);
			if (parameter.type == 'likestring') {
				con.push({col: parameter.key, type: parameter.type});
			} else if (parameter.type == 'date') {
				con.push({col: parameter.key, type: parameter.type});
			} else {
				con.push({col: parameter.key, type: parameter.type});
			}
		} else if (parameter.kind == 2) {
			if (_.isUndefined(param[parameter.key]) == false || _.isEmpty(param[parameter.key]) == false) {
				sql += " and " + parameter.condition;
				sql = sql.replace('?', prefix + parameter.key);
				con.push({col: parameter.key, type: parameter.type});
			}
		} else if (parameter.kind == 3) {
			if (sql.indexOf(':' + parameter.key) >= 0) {
				sql = _.str.replaceAll(sql, ':' + parameter.key, prefix + parameter.key);
				con.push({col: parameter.key, type: parameter.type});
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

// function replaceall(inThis, replaceThis, withThis) {
// 	withThis = withThis.replace(/\$/g, "$$$$");
// 	return inThis.replace(new RegExp(replaceThis.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|<>\-\&])/g, "\\$&"), "g"), withThis);
// }

DB.prototype.doQuery = function (connection, sqlstring, param, condition, mode, start, size, cb) {
	if (mode == 0 || (mode == 1 && size > 0)) {
		//var words = sqlstring.replace('\n', ' ').split(' ');
		//words[0] = 'select SELECT TOP';
		//words.splice(1, 0, size);

		//sqlstring = _.str.trim(sqlstring);
		//sqlstring = _.str.replaceAll('12134', '1', 'AAA');
		// msg.replace('(1)', '' + data.low)

		if (mode == 0) {

		} else if (mode == 1 && size > 0) {
			var selectStr = "", orderStr = "";
			var rows = start + size;
			var val = "";
			selectStr = sqlstring.toLowerCase();
			if (selectStr.indexOf("top") == -1) {
				selectStr = "SELECT TOP " + rows + " " + selectStr.substring(selectStr.indexOf("select") + 6);
			}
			if (selectStr.indexOf("order by") != -1) {
				orderStr = selectStr.substring(selectStr.indexOf("order by"));
				selectStr = selectStr.substring(0, selectStr.indexOf("order by"));
				val = "select * from (SELECT  ROW_NUMBER() OVER(" + orderStr + ") AS AllowPagingId,* FROM  ( select * from ( " +
					selectStr + " )  as  tbs1 ) as Tabl1 ) as table2 where AllowPagingId between " + (start + 1) + " and " + rows;
			} else {
				val = "select * from (SELECT  ROW_NUMBER() OVER(ORDER BY orderbyID DESC) AS AllowPagingId,* FROM (select *, 1 as orderbyID from ( " +
					selectStr + " )  as  tbs1 ) as Tabl1 ) as table2 where  AllowPagingId between " + (start + 1) + " and " + rows;
			}
			sqlstring = val;
		}
	}
	if (dbObj.debug == 1) {
		console.log("sqlstring:" + sqlstring);
		console.log("parameters:" + JSON.stringify(condition));
	}

	var request = new sql.Request(connection);
	_.each(condition, function (dd, idx) {
		if (dd.type == 'int') {
			request.input(dd.col, sql.Int, param[dd.col]);
		} else if (dd.type == 'likestring') {
			request.input(dd.col, sql.VarChar, '%' + param[dd.col] + '%');
		} else if (dd.type == 'date') {
			if (param[dd.col] instanceof Date) {
				request.input(dd.col, sql.DateTime, param[dd.col]);
			} else {
				request.input(dd.col, sql.DateTime, moment.tz(param[dd.col], 'YYYY/MM/DD HH:mm:ss', connection.timezone).toDate());
			}
		} else {
			request.input(dd.col, sql.VarChar, param[dd.col]);
		}
	});
	//console.log(JSON.stringify(request.parameters));
	request.query(sqlstring, function (err, data) {
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
		if (mode == 1) {
			cb(null, data);
		} else {
			if (data.length > 0) {
				cb(null, data[0]);
			} else {
				cb(null, null);
			}
		}
	});
};

var dbObj = new DB();
module.exports = exports = new DB;