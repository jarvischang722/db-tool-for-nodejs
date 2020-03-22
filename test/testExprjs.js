var exprjs = require('exprjs');
var parser = new exprjs();

var obj1 = {
	one: {two: {three: 1}}
}

var obj2 = {
	myCall: function () {
		return arguments[0];
	}
};

var obj3 = {
	one: {two: {three: 3}}
}


var parsed = parser.parse('myCall(one.two.three) == 1');

// returns true
var result = parser.run(parsed, obj1, obj2);
console.log(result);

// using different object input, returns false
result = parser.run(parsed, obj3, obj2);
console.log(result);
// assignment
parsed = parser.parse('one.two.three = {one:1, two:"two"}');

result = parser.run(parsed, obj1, obj2);
console.log(result);
// mathematical expressions
parsed = parser.parse('1+1*8/4+0x0100');
result = parser.run(parsed, obj1, obj2);
console.log(result);


var aa = {aa: 2};

var test1 = parser.parse('aa == 1');
var result1 = parser.run(test1, aa);
console.log('result1:' + result1);