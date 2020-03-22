[1, 2, 3,].forEach(function (o) {
	console.log(o);
	return false;
});


var _ = require("underscore");


var aa = _.find([1, 2, 3,], function (dd, idx) {
	console.log(idx);
	return dd == 3;
});

console.log(aa);

var cc = {a: 1, b: 2};

_.each(cc, function (dd, idx) {
	console.log('--------');
	console.log(dd);
});