var jexl = require('jexl');

var context = {
	name: {first: 'Sterling', last: 'Archer'},
	assoc: [
		{first: 'Lana', last: 'Kane'},
		{first: 'Cyril', last: 'Figgis'},
		{first: 'Pam', last: 'Poovey'}
	],
	age: 36
};

// Filter an array
jexl.eval('assoc[.first == "Lana"].last', context).then(function (res) {
	console.log(res); // Output: Kane
});

// Do math
jexl.eval('age * (3 - 1)', context, function (err, res) {
	console.log(res); // Output: 72
});

// Concatenate
jexl.eval('name.first + " " + name["la" + "st"]', context).then(function (res) {
	console.log(res); // Output: Sterling Archer
});

// Compound
jexl.eval('assoc[.last == "Figgis"].first == "Cyril" && assoc[.last == "Poovey"].first == "Pam"', context)
	.then(function (res) {
		console.log(res); // Output: true
	});

// Use array indexes
jexl.eval('assoc[1]', context, function (err, res) {
	console.log(res.first + ' ' + res.last); // Output: Cyril Figgis
});

// Use conditional logic
jexl.eval('age > 62 ? "retired" : "working"', context).then(function (res) {
	console.log(res); // Output: working
});

// Transform
jexl.addTransform('upper', function (val) {
	return val.toUpperCase();
});
jexl.eval('"duchess"|upper + " " + name.last|upper', context).then(function (res) {
	console.log(res); // Output: DUCHESS ARCHER
});

// Transform asynchronously, with arguments
jexl.addTransform('getStat', function (val, stat) {
	return dbSelectByLastName(val, stat); // Returns a promise
});

jexl.eval('name.last|getStat("weight")', context, function (err, res) {
	if (err) console.log('Database Error', err.stack);
	else console.log(res); // Output: 184
});

// Add your own (a)synchronous operators
// Here's a case-insensitive string equality
jexl.addBinaryOp('_=', 20, function (left, right) {
	return left.toLowerCase() === right.toLowerCase();
});
jexl.eval('"Guest" _= "gUeSt"').then(function (val) {
	console.log(res); // Output: true
});