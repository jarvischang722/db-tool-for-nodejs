var _ = require('underscore');
_.str = require('underscore.string');
var moment = require('moment-timezone');
var async = require("async");
var config = require('../config');
require('../kplug-mysql/DB').create(config.mysql);
var QueryAgent = require('../kplug-mysql/QueryAgent');
var DBAgent = require("../kplug-mysql/DBAgent.js");

QueryAgent.query('test_mysql', {seq: 2}, function (err, row) {
	if (err) {
		console.error(err);
	}
	if (row != null)
		console.log(row);
});

QueryAgent.queryList({dao: 'qa_m1', id: 's2'}, {}, 0, 0, function (err, rows) {
	if (err) {
		console.error(err);
	}
	if (rows != null)
		console.log(rows.length);

	async.each(rows, function (dd, cb) {
		QueryAgent.queryList({dao: 'a_member_by_name', id: 's2'}, {name: dd.name}, 0, 0, function (err, dds) {
			if (err) {
				console.error(err);
				cb();
				return;
			}
			if (dds) {
				console.log('dds:' + dds.length);
				if (dds.length == 1) {
					if (_v(dd.email) == '') {
						dd.email = dds[0].email;
					}
					dd.city = dds[0].city;
					dd.area = dds[0].area;
					dd.address = dds[0].address;
					if (_v(dd.comment1) == '') {
						dd.comment1 = dds[0].comment1;
					}
					var dbAgent = new DBAgent.instance();
					dbAgent.startTransaction('s2', function (agent) {
						agent.executeUpdate("update_m1_address", dd, function (ag) {
							agent.endTransaction(function (r) {
								console.log('update_m1_address:' + r);
								cb();
							});
						});
					});
					return;
				}
			}
			cb();
		});
	}, function (err) {
	});
});

QueryAgent.queryList('qa_m2', {}, 0, 0, function (err, rows) {
	if (err) {
		console.error(err);
	}
	if (rows != null)
		console.log(rows.length);

	async.each(rows, function (dd, cb) {
		QueryAgent.queryList('a_member_by_name', {name: dd.name}, 0, 0, function (err, dds) {
			if (err) {
				console.error(err);
				cb();
				return;
			}
			if (dds) {
				console.log('dds:' + dds.length);
				if (dds.length == 1) {
					if (_v(dd.email) == '') {
						dd.email = dds[0].email;
						console.log(JSON.stringify(dds[0]));
					}
					dd.city = dds[0].city;
					dd.area = dds[0].area;
					dd.address = dds[0].address;
					if (_v(dd.comment1) == '') {
						dd.comment1 = dds[0].comment1;
					}
					var dbAgent = new DBAgent.instance();
					dbAgent.startTransaction(function (agent) {
						agent.executeUpdate("update_m2_address", dd, function (ag) {
							agent.endTransaction(function (r) {
								console.log('update_m2_address:' + r);
								cb();
							});
						});
					});
					return;
				}
			}
			cb();
		});
	}, function (err) {
	});
});

// queryAgent.queryList('test_mssql2', {}, 2, 5, function (err, rows) {
// 	if (err) {
// 		console.error(err);
// 	}
// 	if (rows != null) {
// 		console.log('test_mssql2 %d', rows.length);
// 	}
// });
//
// queryAgent.queryList('test_mssql3', {name: 'test'}, 2, 5, function (err, rows) {
// 	if (err) {
// 		console.error(err);
// 	}
// 	if (rows != null) {
// 		console.log('test_mssql3 %d', rows.length);
// 	}
// });
//
// queryAgent.queryList('test_mssql4', {ct_date: '2016/06/07 16:44:41'}, 0, 5, function (err, rows) {
// 	if (err) {
// 		console.error(err);
// 	}
// 	if (rows != null) {
// 		console.log('test_mssql4 %d', rows.length);
// 	}
// });
// queryAgent.queryList('test_mssql4', {ct_date: moment.tz('2016/06/07 16:44:41', 'YYYY/MM/DD HH:mm:ss', config.mssql.timezone).toDate()}, 0, 0, function (err, rows) {
// 	if (err) {
// 		console.error(err);
// 	}
// 	if (rows != null) {
// 		console.log('test_mssql4_2 %d', rows.length);
// 	}
// });
//
// queryAgent.queryList('test_mssql5', {name: 'test3', ct_date: moment.tz('2016/06/07 16:44:41', 'YYYY/MM/DD HH:mm:ss', config.mssql.timezone).toDate(), aa: 2}, 0, 0, function (err, rows) {
// 	if (err) {
// 		console.error(err);
// 	}
// 	if (rows != null) {
// 		console.log('test_mssql5 %d', rows.length);
// 	}
// });


function _v(value) {
	if (_.isUndefined(value) || _.isNull(value)) {
		return "";
	}
	return value;
}

function _d(value) {
	if (_.isUndefined(value) || _.isNull(value)) {
		return 0;
	}
	return value * 1;
}

function _f(value, n) {
	if (value == null) {
		return 0;
	}
	value = value * 1;
	return value.toFixed(n);
}
