var oracledb = require('oracledb');
var _ = require('underscore');
_.str = require('underscore.string');
var config = require('../config');

oracledb.getConnection(
	{
		user: config.oracle.user,
		password: config.oracle.password,
		connectString: config.oracle.connectString
	},
	function (err, connection) {
		if (err) {
			console.error(err.message);
			return;
		}
		connection.execute(
			"SELECT * " +
			"FROM hotel_rf " +
			"WHERE hotel_cod = :id",
			{id: '0002'},  // bind value for :id
			function (err, result) {
				if (err) {
					console.error(err.message);
					return;
				}
				//console.log(JSON.stringify(result.metaData));
				//console.log(JSON.stringify(result.rows[0]));
				var data = [];
				_.each(result.rows, function (row, idx) {
					var dd = {};
					for (var i = 0; i < row.length; i++) {
						dd[result.metaData[i].name.toLowerCase()] = row[i];
					}
					data.push(dd);
				});
				console.log(data);
				connection.release(
					function (err) {
						if (err) {
							console.error(err.message);
							return;
						}
						console.log('release');
					});
			});
	});