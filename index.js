var assert = require('assert');
var types = require('ast-types');
var isObject = require('is-object');
var isArray = require('is-array');


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

	//create element
	el = document.createElement(ast.type);
	el.classList.add(ast.type);

	//append proper classes
	var superTypes = types.getSupertypeNames(ast.type);
	superTypes.forEach(function(type){
		el.classList.add(type);
	});

	//take over all attributes
	types.eachField(ast, function(attr, value){
		//serialize object values specially
		if (isObject(value)) {
			//for arrays - append inner elements
			if (isArray(value)) {
				value.forEach(function(item){
					el.appendChild(domify(item));
				});

				//preset empty attribute (list items might be mixed)
				el.setAttribute(attr, '');
			}
			//for objects - just create inner element and set attr reference to it
			else {
				var child = domify(value);
				el.appendChild(child);
				el.setAttribute(attr, child.type);
			}
		}
		//otherwise simply stringify
		else {
			if (!value) el.setAttribute(attr, '');
			else el.setAttribute(attr, value);
		}
	});

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
	var ast;

	//TODO: use builders
	// var type = el.getAttribute('type');
	// var builder = types.builders[type[0].toLowerCase() + type.slice(1)];

	// builder();

	return ast;
}


module.exports = domify;
domify.parse = parse;