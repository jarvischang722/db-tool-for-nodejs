var _ = require('underscore');
_.str = require('underscore.string');
var config = require('../config');
var moment = require('moment');
require('../kplug-oracle/DB').create(config.oracle);
var queryAgent = require('../kplug-oracle/ClusterQueryAgent');

queryAgent.query('test_test', {hotel_cod: '0001', hotel_nam: '宜', atten1_add: '北', aa: '2'}, function (err, row) {
	if (err) {
		console.error(err);
	}
	if (row != null)
		console.log('query : %s', JSON.stringify(row));
});

queryAgent.queryList('test_test', {hotel_cod: '0001', hotel_nam: '宜', atten1_add: '北', aa: '2'}, function (err, row) {
	if (err) {
		console.error(err);
	}
	if (row != null) {
		console.log('queryList : %s', JSON.stringify(row));
	}

});

for (var i = 0; i < 120; i++) {
	queryAgent.queryList({dao: 'test3', start: 0, size: 10, offset: 1, length: 2}, {}, function (err, row) {
		if (err) {
			console.error(err);
		}
		if (row != null) {
			console.log('queryList test3: %s', JSON.stringify(row));
			console.log('queryList testd: %s', row.length);
		}
	});
	queryAgent.queryList({dao: 'test3', start: 0, size: 10, offset: 0, length: 5}, {}, function (err, row) {
		if (err) {
			console.error(err);
		}
		if (row != null) {
			console.log('queryList test3: %s', JSON.stringify(row));
			console.log('queryList testd: %s', row.length);
		}
	});

}


// queryAgent.queryList('test_test2', {hotel_cod: '0001', keep_dat: new moment('2016/05/15  22:03:11', 'YYYY/MM/DD HH:mm:ss').toDate()}, 0, 0, function (err, row) {
// 	if (err) {
// 		console.error(err);
// 	}
// 	console.log('row:' + row.length);
// 	if (row.length > 0) {
// 		console.log('row:' + row[0].rvreserve_nos);
// 		console.log('row:' + row[0].keep_dat);
// 	}
// });
//
// queryAgent.queryList('test_test2', {hotel_cod: '0001', keep_dat: '2016/05/15  22:03:11'}, 0, 0, function (err, row2) {
// 	if (err) {
// 		console.error(err);
// 	}
// 	console.log('row2:' + row2.length);
// 	if (row2.length > 0) {
// 		console.log('row2:' + row2[0].rvreserve_nos);
// 		console.log('row2:' + row2[0].keep_dat);
// 	}
// });
