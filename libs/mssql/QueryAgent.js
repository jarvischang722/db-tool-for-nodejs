var sql = require('mssql');
var _ = require("underscore");
var _s = require("underscore.string");
var exprjs = require('exprjs');
var parser = new exprjs();
var moment = require('moment-timezone');
var XMLUtil = require('./XMLUtil.js');
var DB = require('./DB.js');

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

function queryData(agent, mode, cb, dao, param, start, size) {
	DB.queryDao(dao.dao, param, function (err, sql, con) {
		if (err) {
			if (mode == 1) {
				cb(err, [], agent);
			} else {
				cb(err, null, agent);
			}
			return;
		}
		if (agent == null) {
			DB.getConnection(function (err, connection) {
				DB.doQuery(connection, sql, param, con, mode, start, size, function (err, result) {
					cb(err, result, agent);
				});
			});
		} else {
			DB.doQuery(agent.connection, sql, param, con, mode, start, size, function (err, result) {
				cb(err, result, agent);
			});
		}
	});
}
