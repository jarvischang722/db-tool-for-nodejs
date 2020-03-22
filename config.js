module.exports = {
	oracle: [{
		id: 'o1',
		connectString: "192.168.99.100:38770/xe",
		user: "webhotel",
		password: "athena",
		months: [1, 2, 3, 4, 5, 6],
		debug: 0
	}, {
		id: 'o2',
		connectString: "192.168.99.100:39770/xe",
		user: "webhotel",
		password: "athena",
		months: [7, 8, 9, 10, 11, 12],
		debug: 0
	}],
	mssql: [
		{
			id: 'm1',
			timezone: 'Etc/Universal',
			user: 'sa',
			password: '123qwe',
			server: '192.168.0.120', // You can use 'localhost\\instance' to connect to named instance
			port: 1433,
			database: 'a6ss',
			options: {
				encrypt: true // Use this if you're on Windows Azure
			},
			pool: {
				max: 3,
				min: 2,
				idleTimeoutMillis: 30000
			},
			debug: 1,
		}
	],
	mysql: [{
		id: 's1',
		host: "192.168.99.100",
		port: 32768,
		user: "mt4",
		password: "mt4mt4",
		database: "a6ss",
		debug: 1,
	}, {
		id: 's2',
		host: "192.168.99.100",
		port: 32768,
		user: "mt4",
		password: "mt4mt4",
		database: "a6ss2"
	}, {
		id: 's3',
		host: "192.168.99.100",
		port: 32768,
		user: "mt4",
		password: "mt4mt4",
		database: "a6ss",
		debug: 1,
	}]
};