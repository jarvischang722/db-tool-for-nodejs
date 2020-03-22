var oracledb = require('oracledb');
var config = require('../config');

var rowCount = 0;
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
			['0001'],  // bind value for :id
			{ resultSet: true },
			function (err, result) {
				if (err) {
					console.error(err.message);
					return;
				}
				//console.log(JSON.stringify(result.metaData));
				//console.log(JSON.stringify(result.rows[0]));
				fetchOneRowFromRS(connection, result.resultSet);
				// connection.release(
				// 	function (err) {
				// 		if (err) {
				// 			console.error(err.message);
				// 			return;
				// 		}
				// 		console.log('release');
				// 	});
			});
	});

function fetchOneRowFromRS(connection, resultSet) {
	resultSet.getRow( // get one row
		function (err, row) {
			if (err) {
				console.error(err.message);
				doClose(connection, resultSet); // always close the result set
			} else if (!row) {                // no rows, or no more rows
				doClose(connection, resultSet); // always close the result set
			} else {
				rowCount++;
				console.log("fetchOneRowFromRS(): row " + rowCount);
				console.log(row);
				fetchOneRowFromRS(connection, resultSet);
			}
		});
}

function doRelease(connection)
{
	connection.release(
		function(err)
		{
			if (err) { console.error(err.message); }
		});
}

function doClose(connection, resultSet)
{
	resultSet.close(
		function(err)
		{
			if (err) { console.error(err.message); }
			doRelease(connection);
		});
}