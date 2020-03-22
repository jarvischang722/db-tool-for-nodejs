var config = require("../config.js");
var DB = require('./DB.js');
var exprjs = require('exprjs');
var parser = new exprjs();
var moment = require('moment-timezone');
var _ = require("underscore");
var _s = require("underscore.string");
var randomstring = require('randomstring');
var async = require("async");

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

function DBAgent() {
	this.id = moment().format("YYYY/MM/DD HH:mm:ss") + randomstring.generate(4);
	this.data = {};
	this.connection = null;
	this.trans = null;
	this.queue = null;
	this.error = false;
	this.effect = true;
}

DBAgent.prototype.startTransaction = function (arg1, arg2) {
	var cb = arg1;
	var id = 'default';
	if (_.isFunction(arg1) == false) {
		cb = arg2;
		id = arg1;
	}
	var ag = this;
	DB.getConnection(id, function (err, connection) {
		ag.connection = connection;
		connection.beginTransaction(function (err) {
			ag.error = false;
			cb(ag);
		});
	});
}

DBAgent.prototype.holdConnection = function (cb) {
	var ag = this;
	DB.getConnection(function (err, connection) {
		ag.connection = connection;
		cb(ag);
	});
}

DBAgent.prototype.releaseConnection = function (cb) {
	var ag = this;
	ag.connection.release();
	cb(true);
};

DBAgent.prototype.endTransaction = function (cb) {
	var ag = this;
	if (ag.error == true) {
		this.connection.rollback(function (err, info) {
			ag.connection.release();
			cb(ag.error == false);
		});
	} else {
		this.connection.commit(function (err, info) {
			ag.connection.release();
			cb(ag.error == false && err == null);
		});
	}
};

DBAgent.prototype.close = function (agent) {
	agent.connection.end();
};

DBAgent.prototype.execute = function (agent) {
	agent.trans.execute();
};

function updateSeq(agent, param, key, seqIsNew, seqCon, seq, cb) {
	var uSQL = "";
	if (seqIsNew == false) {
		uSQL = "update syssequence set seq=" + seq + " where name= ? and id = ?";
	} else {
		uSQL = "insert into syssequence (name,id,seq) values(?,?,1)";
	}
	agent.connection.query(uSQL, seqCon, function (err, info) {
		if (err) {
			agent.error = true;
			console.error(err);
		} else {
			param[key] = seq;
		}
		cb();
	});
	//agent.trans.execute();
}

function update(agent, sql, con, cb) {
	if (config.debug == 1) {
		console.log("sql:" + sql);
		console.log("con:" + JSON.stringify(con));
	}
	agent.connection.query(sql, con, function (err, info) {
		if (err || info == null) {
			agent.err = err;
			agent.error = true;
			console.error(JSON.stringify(con));
			console.error("err sql:" + sql);
			console.error("err:" + err);
			cb(agent);
		}
		else {
			//affectedRows add update 有
			//changedRows update有
			if (agent.effect == false || info.affectedRows > 0) {
				cb(agent);
			} else {
				console.log("sql:" + sql);
				agent.error = true;
				agent.msg = "無影響比數";
				cb(agent);
			}
		}
	});
	//agent.trans.execute();
}
function bUpdate(agent, sql, con, cb) {
	agent.connection.query(sql, [con], function (err, info) {
		if (err || info == null) {
			agent.err = err;
			agent.error = true;
			console.error(JSON.stringify(con));
			console.error("err sql:" + sql);
			console.error("err:" + err);
			cb(agent);
		}
		else {
			//affectedRows add update 有
			//changedRows update有
			if (agent.effect == false || info.affectedRows > 0) {
				cb(agent);
			} else {
				console.log("sql:" + sql);
				agent.error = true;
				agent.msg = "無影響比數";
				cb(agent);
			}
		}
	});
	//agent.trans.execute();
}
DBAgent.prototype.executeUpdate = function (daoName, param, cb) {
	var agent = this;
	var daoBean = DB.loadDao(daoName);
	if (daoBean == null) {
		agent.error = true;
		cb(agent);
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
		sql += '\r\n';
	});

	var con = [];
	var seqPool = [];

	daoBean.parameters.forEach(function (parameter) {
		var type = parameter.type;
		var key = parameter.key;
		if (type == "mseq") {
			var position = con.length;
			con[position] = 0;
			seqPool.push({
				name: parameter.seq,
				id: parameter.seq2,
				position: position,
				key: key
			});
		} else if (type == "now") {
			con[con.length] = new Date();
		} else if (type == "op") {
			con[con.length] = "test";
		} else if (type == "defaultn") {
			con[con.length] = "N";
		} else if (type == "timestamp" || type == "date") {
			con[con.length] = param[key];
		} else if (type == "long" || type == "int" || type == "double") {
			con[con.length] = _d(param[key]);
		} else {
			con[con.length] = param[key];
		}
	});

	async.waterfall([
		function (cb1) {
			if (seqPool.length == 0) {
				cb1(null, {});
				return;
			}
			async.eachSeries(seqPool, function (dd, cb2) {
				async.waterfall([
					function (cb3) {
						var mSQL = "select seq from syssequence where name = ? and id = ? for update";
						var seqCon = [dd.name, dd.id];
						var q = agent.connection.query(mSQL, seqCon,
							function (err, result, fields) {
								if (err) {
									agent.error = true;
									cb3(null, {});
								} else {
									var seq = 1;
									var seqIsNew = true;
									if (result.length > 0) {
										seq = result[0].seq + 1;
										seqIsNew = false;
									}
									con[dd.position] = seq;
									cb3(null, {seqIsNew: seqIsNew, seqCon: seqCon, seq: seq});
								}
							});
					},
					function (data, cb3) {
						if (agent.error) {
							cb3(null, data);
						} else {
							updateSeq(agent, param, dd.key, data.seqIsNew, data.seqCon, data.seq, function () {
								cb3(null, data);
							});
						}
					}
				], function (err, data) {
					cb2();
				});
			}, function (err) {
				cb1(null, {});
			});
		},
		function (data, cb1) {
			if (agent.error) {
				cb1(null, data);
			} else {
				update(agent, sql, con, function () {
					cb1(null, data);
				});
			}
		}
	], function (err, data) {
		cb(agent);
	});
}
DBAgent.prototype.batchUpdate = function (daoName, params, cb) {
	var agent = this;
	if (agent.error) {
		cb(agent);
		return;
	}
	var daoBean = DB.loadDao(daoName);
	if (daoBean == null || params == null || params.length == 0) {
		agent.error = true;
		cb(agent);
		return;
	}
	var sql = "";
	daoBean.statements.forEach(function (statement) {
		if (statement.test != '') {
			var test = parser.parse(statement.test);
			var r = parser.run(test, kplugFun, {
				param: params[0]
			});
			test = null;
			if (r) {
				sql += ' ' + statement.sql;
			}
		} else {
			sql += ' ' + statement.sql;
		}
		sql += '\r\n';
	});
	var dataPool = []
	_.each(params, function (param, idx) {
		var con = [];
		daoBean.parameters.forEach(function (parameter) {
			var type = parameter.type;
			var key = parameter.key;
			if (type == "now") {
				con[con.length] = new Date();
			} else if (type == "op") {
				con[con.length] = "test";
			} else if (type == "defaultn") {
				con[con.length] = "N";
			} else if (type == "timestamp" || type == "date") {
				con[con.length] = moment(param[key]).toDate();
			} else if (type == "long" || type == "int" || type == "double") {
				con[con.length] = _d(param[key]);
			} else {
				con[con.length] = param[key];
			}
		});
		dataPool.push(con);
	});
	bUpdate(agent, sql, dataPool, function () {
		cb(agent);
	});
};
function _d(value) {
	if (_.isUndefined(value) || _.isNull(value)) {
		return 0;
	}
	return value * 1;
}

exports.instance = DBAgent;