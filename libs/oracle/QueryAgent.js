var DB = require('./DB.js');
var _ = require("underscore");
var _s = require("underscore.string");

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

exports.queryData = queryData;
function queryData(agent, mode, cb, ddObj, param, start, size) {
	DB.queryDao(ddObj, param, function (err, sql, con) {
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
				DB.doQuery(connection, sql, con, mode, start, size, function (err, result) {
					cb(err, result, agent);
				});
			});
		} else {
			DB.doQuery(agent.connection, sql, con, mode, start, size, function (err, result) {
				cb(err, result, agent);
			});
		}
	});
}
