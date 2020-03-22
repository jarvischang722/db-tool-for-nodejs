var p2 = new Promise(function (resolve, reject) {
	resolve(1);
});

p2.then(function (value) {
	console.log(value); // 1
	return value + 1;
}).then(function (value) {
	console.log(value + '- This synchronous usage is virtually pointless'); // 2- This synchronous usage is virtually pointless
	return value + 1;
}).then(function (value) {
	console.log(value + '- This synchronous usage is virtually pointless'); // 2- This synchronous usage is virtually pointless
	return value + 1;
}).then(function (value) {
	console.log(value + '- This synchronous usage is virtually pointless'); // 2- This synchronous usage is virtually pointless
	return value + 1;
}).then(function (value) {
	console.log(value + '- This synchronous usage is virtually pointless'); // 2- This synchronous usage is virtually pointless
	return value + 1;
});

p2.then(function (value) {
	console.log(value); // 1
	return value;
}).then(function (value) {
	console.log(value); // 1
});