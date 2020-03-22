var oracledb = require('oracledb');
var _ = require('underscore');
_.str = require('underscore.string');
var config = require('../config');

var oracledb = require('oracledb');

oracledb.createPool(
	{
		user: config.oracle.user,
		password: config.oracle.password,
		connectString: config.oracle.connectString
	},
	function (err, pool) {
		console.log(pool._createdDate)
		pool.getConnection(
			function (err, connection) {
				connection.close(
					function (err) {
						if (err) {
							console.error(err.message);
						}
					});
			});
	});


