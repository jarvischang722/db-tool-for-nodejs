var _ = require('underscore');
_.str = require('underscore.string');
var async = require("async");
var config = require('../config');
require('../kplug-oracle/DB').create(config.oracle);//初始化
var ClusterQueryAgent = require('../kplug-oracle/ClusterQueryAgent');

function test1(cb) {
	console.error('test1');
	ClusterQueryAgent.query('testxxxxx', {hotel_cod: '0001', hotel_nam: '宜', atten1_add: '北'}, function (err, row) {
		if (err) {
			console.error(err);
		}
		// console.log(row);
		cb(null, {k: 'test1', data: row});
	});
}

function test2(data, cb) {
	console.error('test2');
	ClusterQueryAgent.query('test_error', {hotel_cod: '0001', hotel_nam: '宜', atten1_add: '北'}, function (err, row) {
		if (err) {
			console.error(err);
		}
		// console.log(row);
		cb(null, {k: 'test2', data: row});
	});
}
function test3(data, cb) {
	console.error('test3');
	ClusterQueryAgent.query({dao: 'test', id: 'o2'}, {hotel_cod: '0001', hotel_nam: '宜', atten1_add: '北'}, function (err, row) {
		if (err) {
			console.error(err);
		}
		// console.log(row);
		cb(null, {k: 'test3', data: row});
	});
}
function test4(data, cb) {
	console.error('test4');
	ClusterQueryAgent.queryList({dao: 'test2', start: 0, size: 2, offset: 0, length: 1}, {hotel_nam: '飯'}, function (err, row) {
		if (err) {
			console.error(err);
		}
		// console.log(row);
		console.error('ClusterQueryAgent %s:' + row.length, JSON.stringify({dao: 'test2', start: 0, size: 1, offset: 0, length: 1}));
		cb(null, {k: 'test4', data: row});
	});
}
function test5(data, cb) {
	console.error('test5');
	var xml = '<dao name="test2">' +
		'<statement><![CDATA[SELECT * FROM hotel_rf  WHERE hotel_nam like ?]]></statement>' +
		'<parameter type="likestring" kind="2" condition="atten1_add like ?">atten1_add</parameter>' +
		'<parameter type="likestring">hotel_nam</parameter>' +
		'</dao>';
	ClusterQueryAgent.queryList({xml: xml, start: 0, size: 2, offset: 0, length: 1}, {hotel_nam: '飯'}, function (err, row) {
		if (err) {
			console.error(err);
		}
		// console.log(row);
		console.error('ClusterQueryAgent By XML %s:' + row.length, JSON.stringify({dao: 'test2', start: 0, size: 1, offset: 0, length: 1}));
		cb(null, {k: 'test5', data: row});
	});
}
function seq(data, cb) {
	console.log('----------------------------------------------------');
	console.log('----------------------------------------------------');
	console.log('----------------------------------------------------');
	if (_.isUndefined(data) == false && _.isNull(data) == false) {
		console.log('>>>>>>>>>>>>>>>>>>>>>>>>>');
		console.log('>>>>>>>>>>>>>>>>>>>>>>>>>%s', JSON.stringify(data));
		console.log('>>>>>>>>>>>>>>>>>>>>>>>>>');
	}
	cb(null, data);
}
async.waterfall([test1, seq, test2, seq, test3, seq, test4, seq, test5, seq], function (err, data) {
	console.log('finish');
});
// db.execute("SELECT * FROM hotel_rf  WHERE hotel_cod = :id", ['0001'], function (err, result) {
// 	if (err) {
// 		console.error(err.message);
// 		return;
// 	}
// 	console.log(JSON.stringify(result.rows));
// });
//
// for (var i = 0; i < 10; i++) {
// 	db.getConnection(function (err, connection) {
// 		connection.execute(
// 			"SELECT * " +
// 			"FROM hotel_rf " +
// 			"WHERE hotel_cod = :id",
// 			['0001'],  // bind value for :id
// 			function (err, result) {
// 				if (err) {
// 					console.error(err.message);
// 					return;
// 				}
// 				console.log(JSON.stringify(result.rows));
// 				setTimeout(function () {
// 					connection.close(
// 						function (err) {
// 							if (err) {
// 								console.error(err.message);
// 							}
// 							console.error('connection.close');
// 						});
// 				}, 1000);
//
// 			});
// 	});
// }



