/**
 * @module  esdom
 */

var assert = require('assert');
var types = require('ast-types');
var isObject = require('is-object');
var isArray = require('is-array');
var slice = require('sliced');
var q = require('query-relative');
var parseAttr = require('parse-attr').typeBased;
var stringifyAttr = require('parse-attr').stringify;

//TODO: tests, esp. for minified jquery
//TODO: add validation
//TODO: use builders instead of manual creation


/**
 * Domify AST compliant with esquery as much as possible
 *
 * @param {Object} ast Target AST to serialize
 *
 * @return {HTMLElement} Resulting HTML subtree
 */
function toDOM(ast){
	var el;

	assert(ast.type, 'Node type should be defined');
	assert(types.namedTypes[ast.type], 'Bad AST type ' + ast.type);

	// console.log(types.namedTypes[ast.type])

	//create element
	el = document.createElement(ast.type);

	//append proper classes
	el.classList.add(ast.type);
	var superTypes = types.getSupertypeNames(ast.type);
	superTypes.forEach(function(type){
		el.classList.add(type);
	});

	//take over all attributes
	// types.eachField(ast, function(attr, value){
	var value;
	for (var attr in ast) {
		value = ast[attr];
		//serialize object values specially
		if (isObject(value)) {
			//for arrays - append inner elements
			if (isArray(value)) {
				value.forEach(function(item){
					var subEl = toDOM(item);
					subEl.setAttribute('prop', attr);
					el.appendChild(subEl);
				});

				//preset selector attribute (fetch items from children)
				el.setAttribute(attr, 'multiple');
			}
			//for objects - just create inner element and set attr reference to it
			else {
				var child = toDOM(value);
				el.appendChild(child);
				el.setAttribute(attr, value.type);
				child.setAttribute('prop', attr);
			}
		}
		//otherwise simply stringify
		else {
			el.setAttribute(attr, stringifyAttr(value));
		}
	};

	return el;
}



/**
 * Parse AST from DOM element
 *
 * @param {HTMLElement} el Root element
 *
 * @return {Object} AST tree
 */
function toAST(el){
	var ast = {};
	var type = el.getAttribute('type');
	var children = slice(el.childNodes);

	//take over attributes
	var attributes = el.attributes, name, value, _name;
	for (var i = 0; i < attributes.length; i++){
		name = attributes[i].name;
		value = parseAttr(attributes[i].value);

		if (ignoreAttr[name]) continue;

		ast[name] = value;
	}

	//for each kid - place it respectively to parent
	children.forEach(function(child){
		if (child.nodeType !== 1) return;

		var parentProp = child.getAttribute('prop');
		if (el.getAttribute(parentProp) === 'multiple') {
			(isArray(ast[parentProp]) ? ast[parentProp] : (ast[parentProp] = [])).push(toAST(child));
		}
		else {
			ast[parentProp] = toAST(child);
		}
	});

	return ast;
}


/** List of attributes to ignore */
//FIXME: remove this when builder params get available
var ignoreAttr = {
	class: true,
	prop: true
};


module.exports = {
	toDOM: toDOM,
	toAST: toAST
};