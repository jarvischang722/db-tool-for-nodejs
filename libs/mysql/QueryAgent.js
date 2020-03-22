var config = require("../config.js");
var exprjs = require('exprjs');
var parser = new exprjs();
var DB = require('./DB.js');
var _ = require("underscore");
var _s = require("underscore.string");

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

exports.query = function (dao, param, cb, agent) {
	if (_.isObject(dao)) {
		queryData(agent, 0, cb, dao, param);
	} else {
		queryData(agent, 0, cb, {dao: dao, id: 'default'}, param);
	}

};

exports.queryList = function (dao, param, start, size, cb, agent) {
	if (_.isObject(dao)) {
		queryData(agent, 1, cb, dao, param, start, size);
	} else {
		queryData(agent, 1, cb, {dao: dao, id: 'default'}, param, start, size);
	}
};

function queryDao(daoName, param, cb) {
	var daoBean = DB.loadDao(daoName);
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
		var count = 1;
		if (parameter.kind == 1) {
		} else if (parameter.kind == 2) {
			if (_.isUndefined(param[parameter.key]) == false || _.isEmpty(param[parameter.key]) == false) {
				sql += " and " + parameter.condition;
			}
		} else if (parameter.kind == 3) {
			if (sql.indexOf(':' + parameter.key) >= 0) {
				count = _.str.count(sql, ':' + parameter.key);
				sql = _.str.replaceAll(sql, ':' + parameter.key, '?');
			} else {
				count = 0;
			}
		}
		for (var m = 0; m < count; m++) {
			if (parameter.type == 'likestring') {
				con.push('%' + param[parameter.key] + '%');
			} else if (parameter.type == 'nin') {

			} else if (parameter.type == 'date') {
				if (param[parameter.key] instanceof Date) {
					con.push(param[parameter.key]);
				} else {
					con.push(param[parameter.key]);
				}
			} else {
				con.push(param[parameter.key]);
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
}

function doQuery(connection, sqlstring, condition, mode, start, size, cb) {
	if (mode == 1 && size > 0) {
		sqlstring = sqlstring + " LIMIT " + start + "," + size;
	}
	if (config.debug == 1) {
		console.log("sql:" + sqlstring);
		console.log("parameters:" + JSON.stringify(condition));
	}
	connection.query(sqlstring, condition,
		function (err, result, fields) {
			if (err) {
				console.error(err);
				if (mode == 1) {
					cb(err, []);
				} else {
					cb(err, null);
				}
			} else {
				if (result.length > 0) {
					if (mode == 1) {
						cb(null, result);
					} else {
						cb(null, result[0]);
					}
				}
				else {
					if (mode == 1) {
						cb(null, []);
					} else {
						cb(null, null);
					}
				}
			}
		}
	);
}

function queryData(agent, mode, cb, ddObj, param, start, size) {
	queryDao(ddObj.dao, param, function (err, sql, con) {
		if (err) {
			if (mode == 1) {
				cb(err, [], agent);
			} else {
				cb(err, null, agent);
			}
			return;
		}
		if (agent == null) {
			DB.getConnection(ddObj.id, function (err, connection) {
				doQuery(connection, sql, con, mode, start, size, function (err, result) {
					connection.release();
					cb(err, result, agent);
				});
			});
		} else {
			doQuery(agent.connection, sql, con, mode, start, size, function (err, result) {
				cb(err, result, agent);
			});
		}
	});
}
