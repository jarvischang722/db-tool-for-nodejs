var _ = require('underscore');
_.str = require('underscore.string');
var moment = require('moment-timezone');
var config = require('../config');
require('../kplug-mssql/DB').create(config.mssql);
var queryAgent = require('../kplug-mssql/QueryAgent');

queryAgent.query('test_mssql', {id: 1}, function (err, row) {
	if (err) {
		console.error(err);
	}
	if (row != null)
		console.log(row);
});

queryAgent.queryList('test_mssql2', {}, 2, 5, function (err, rows) {
	if (err) {
		console.error(err);
	}
	if (rows != null) {
		console.log('test_mssql2 %d', rows.length);
	}
});

queryAgent.queryList('test_mssql3', {name: 'test'}, 2, 5, function (err, rows) {
	if (err) {
		console.error(err);
	}
	if (rows != null) {
		console.log('test_mssql3 %d', rows.length);
	}
});

queryAgent.queryList('test_mssql4', {ct_date: '2016/06/07 16:44:41'}, 0, 5, function (err, rows) {
	if (err) {
		console.error(err);
	}
	if (rows != null) {
		console.log('test_mssql4 %d', rows.length);
	}
});
queryAgent.queryList('test_mssql4', {ct_date: moment.tz('2016/06/07 16:44:41', 'YYYY/MM/DD HH:mm:ss', config.mssql.timezone).toDate()}, 0, 0, function (err, rows) {
	if (err) {
		console.error(err);
	}
	if (rows != null) {
		console.log('test_mssql4_2 %d', rows.length);
	}
});

queryAgent.queryList('test_mssql5', {name: 'test3', ct_date: moment.tz('2016/06/07 16:44:41', 'YYYY/MM/DD HH:mm:ss', config.mssql.timezone).toDate(), aa: 2}, 0, 0, function (err, rows) {
	if (err) {
		console.error(err);
	}
	if (rows != null) {
		console.log('test_mssql5 %d', rows.length);
	}
});

// var sql = require('mssql');
//
// var config = {
// 	user: 'sa',
// 	password: '123qwe',
// 	server: '192.168.4.12', // You can use 'localhost\\instance' to connect to named instance
// 	port: 22791,
// 	database: 'a6ss',
// 	options: {
// 		encrypt: true // Use this if you're on Windows Azure
// 	},
// 	pool: {
// 		max: 3,
// 		min: 2,
// 		idleTimeoutMillis: 30000
// 	}
// }
//
//
// var cp = new sql.Connection(config);

// var connection1 = new sql.Connection(config, function (err) {
// 	if (err) {
// 		console.log(err);
// 	}
// 	var request = new sql.Request(connection1); // or: var request = connection1.request();
// 	request.query('select * from test', function (err, recordset) {
// 		if (err) {
// 			console.log(err);
// 		}
// 		console.dir(recordset);
// 	});
// });

// setInterval(function () {
// 	for (var i = 0; i <= 30; i++) {
// 		var request = new sql.Request(connection1); // or: var request = connection1.request();
// 		request.query('select * from test', function (err, recordset) {
// 			if (err) {
// 				console.log(err);
// 			}
// 			console.dir(recordset);
// 		});
// 	}
// }, 1000);
