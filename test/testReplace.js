console.log(replaceall(":a :a",':a','@a'));
function replaceall(inThis,replaceThis, withThis) {
	withThis = withThis.replace(/\$/g,"$$$$");
	return inThis.replace(new RegExp(replaceThis.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|<>\-\&])/g,"\\$&"),"g"), withThis);
}