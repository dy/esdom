var assert = require('assert');
var types = require('ast-types');
var isObject = require('is-object');
var isArray = require('is-array');
var slice = require('sliced');
var q = require('query-relative');
var parseAttr = require('parse-attr').typeBased;
var stringifyAttr = require('parse-attr').stringify;

//TODO: source formatting
//TODO: tests, esp. for minified jquery


/**
 * Domify AST compliant with esquery as much as possible
 *
 * @param {Object} ast Target AST to serialize
 *
 * @return {HTMLElement} Resulting HTML subtree
 */
function domify(ast){
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
					el.appendChild(domify(item));
				});

				//preset empty attribute (items in list might be various)
				el.setAttribute(attr, '');

				//define getter on element returning children list
				Object.defineProperty(el, getPropName(attr), {
					enumerable: true,
					configurable: true,
					get: function(){
						return slice(this.childNodes);
					}
				});
			}
			//for objects - just create inner element and set attr reference to it
			else {
				var child = domify(value);
				el.appendChild(child);
				el.setAttribute(attr, value.type);

				//define getter returning inner element
				Object.defineProperty(el, getPropName(attr), {
					enumerable: true,
					configurable: true,
					get: (function(type){
						return function(){
							return q('> .' + type, this);
						}
					})(value.type)
				});
			}
		}
		//otherwise simply stringify
		else {
			if (!value) el.setAttribute(attr, '');
			else el.setAttribute(attr, stringifyAttr(value));
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
function parse(el){
	var ast = {};

	var type = el.getAttribute('type');

	//TODO: use builders instead of manual creation
	// var lType = type[0].toLowerCase() + type.slice(1);
	// var builder = types.builders[lType];
	// builder();

	//take over attributes
	var attributes = el.attributes, name, value, _name;
	for (var i = 0; i < attributes.length; i++){
		name = attributes[i].name;
		_name = getPropName(name);
		value = parseAttr(attributes[i].value);

		if (ignoreAttr[name]) continue;

		ast[name] = value;

		//if attr prop isn’t empty - create inner AST structure
		if (value = el[_name]) {
			if (isArray(value)) {
				ast[name] = [];
				value.forEach(function(item){
					ast[name].push(parse(item));
				});
			}
			else if (value instanceof HTMLElement) {
				ast[name] = parse(value);
			}
		}
	}

	return ast;
}


/** List of attributes to ignore */
//FIXME: remove this when builder params get available
var ignoreAttr = {
	class: true
};


/** Return [hidden] prop name for the attr */
function getPropName(name){
	return '_' + name;
}



module.exports = domify;
domify.parse = parse;
domify.domify = domify;