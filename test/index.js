var assert = require('assert');
var esprima = require('esprima');
var escodegen = require('escodegen');
var esdom = require('..');
var doc = require('dom-lite').document;

var containerEl = doc.createElement('div');
containerEl.id="ast";


//inlined jquery
var src = [
'var a = 1e10',
'function toAST(el){',
	'var ast = {};',
	'var type = el.getAttribute(\'type\');',
	'var children = slice(el.childNodes);',
'',
	'//take over attributes',
	'var attributes = el.attributes, name, value, _name;',
	'for (var i = 0; i < attributes.length; i++){',
		'name = attributes[i].name;',
		'value = parseAttr(attributes[i].value);',
'',
		'if (ignoreAttr[name]) continue;',
'',
		'ast[name] = value;',
	'}',
'',
	'//for each kid - place it respectively to parent',
	'children.forEach(function (child) {',
		'if (child.nodeType !== 1) return;',
'',
		'var parentProp = child.getAttribute(\'prop\');',
		'if (el.getAttribute(parentProp) === \'[]\') {', //this line fails
			'(isArray(ast[parentProp]) ? ast[parentProp] : (ast[parentProp] = [])).push(toAST(child));',
		'}',
		'else {',
			'ast[parentProp] = toAST(child);',
		'}',
	'});',
'',
	'return ast;',
'}'
].join('\n');



describe('esdom tests', function(){
	it('simple case', function(){
		// var src = [
		// 	'function x(a, b, c){ 1; 2; 3; return a + b;}'
		// ].join('\n');

		var ast = esprima.parse(src);

		console.log(ast);

		var el = esdom.toDOM(ast);

		console.log(el);

		containerEl.appendChild(el);

		var reast = esdom.toAST(el);
		console.log(reast)

		assert.deepEqual(ast, reast);
	});

	it.skip('jquery case', function(){

	});

	it.skip('jquery min case', function(){
		var src = sources.jQueryMin;

		var ast = esprima.parse(src);
		var el = esdom.toDOM(ast);
	});

	it.skip('underscore case', function(){

	});

	it.skip('lodash min case', function(){

	});

	it.skip('RequireJS case', function(){

	});

	it.skip('es6 case', function(){

	});
});


/** Return file by path */
function getFile(path){
	fs.readFileSync(filename, 'utf8');
}