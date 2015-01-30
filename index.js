/**
 * @module  esdom
 */

var assert = require('assert');
var types = require('ast-types');
var isPlainObject = require('is-plain-object');
var isArray = require('is-array');
var slice = require('sliced');
var parseAttr = require('parse-attr').typeBased;
var stringifyAttr = require('parse-attr').stringify;
var doc = require('get-doc') || require('dom-lite').document;
var q = require('query-relative');
var closest = require('query-relative/closest');


//TODO: Ensure that HTML is analyzable by escope
//TODO: add validation
//TODO: use builders instead of manual creation
//TODO: register proper web-components with getters on props
//TODO: acquire on-component toAST method, returning AST subtree
//TODO: acquire on-component toCode methods, returning source code
//TODO: mark/analyze scopes



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
	el = doc.createElement(ast.type);

	//append proper classes
	el.className = ast.type;
	var superTypes = types.getSupertypeNames(ast.type);
	superTypes.forEach(function(type){
		el.className += ' ' + type;
	});

	//take over all attributes
	// types.eachField(ast, function(attr, value){
	var value;
	for (var attr in ast) {
		value = ast[attr];

		if (ignoreAttr[attr]) continue;

		//for arrays - append inner elements
		if (isArray(value)) {
			value.forEach(function(item){
				var subEl = toDOM(item);
				subEl.setAttribute('prop', attr);
				// defineAttrGetter(subEl, 'prop');

				el.appendChild(subEl);
			});

			//preset selector attribute (fetch items from children)
			el.setAttribute(attr, '[]');

			//add prop list getter
			//FIXME: move to web-components
			// Object.defineProperty(el, attr, {
			// 	get: (function(selector){
			// 		return function(){
			// 			return this.parentNode.querySelectorAll(this.type + '>' + selector);
			// 		};
			// 	})('[prop=' + value.type + ']')
			// });
		}
		//for objects - just create inner element and set attr reference to it
		else if (isPlainObject(value)) {
			var child = toDOM(value);
			el.appendChild(child);
			el.setAttribute(attr, value.type);
			// defineAttrGetter(el, attr);

			child.setAttribute('prop', attr);

			//add inner object getter by the prop
			//FIXME: move to web-components
			// Object.defineProperty(el, attr, {
			// 	get: (function(selector){
			// 		return function(){
			// 			//FIXME: enhance this selector (may fail to work)
			// 			return this.querySelector(selector);
			// 		};
			// 	})(value.type)
			// });
		}
		//otherwise simply stringify
		else {
			el.setAttribute(attr, stringifyAttr(value));
			// defineAttrGetter(el, attr);
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
		name = camelNames[attributes[i].name] || attributes[i].name;

		if (ignoreAttr[name]) continue;

		//transform value from raw
		if (name === 'value' && el.getAttribute('raw')) {
			//FIXME: this might be an unsafe place
			value = eval(el.getAttribute('raw'));
		}
		//don’t parse raws
		else if (name === 'raw' || name === 'name'){
			value = attributes[i].value;
		}
		//just parse
		else {
			value = parseAttr(attributes[i].value);
		}


		ast[name] = value;
	}

	//for each kid - place it respectively to parent
	children.forEach(function (child) {
		if (child.nodeType !== 1) return;

		var parentProp = child.getAttribute('prop');
		if (el.getAttribute(parentProp) === '[]') {
			(isArray(ast[parentProp]) ? ast[parentProp] : (ast[parentProp] = [])).push(toAST(child));
		}
		else {
			ast[parentProp] = toAST(child);
		}
	});

	return ast;
}


/** Define attribute getter on element */
function defineAttrGetter(el, attr) {
	Object.defineProperty(el, attr, {
		get: function(){
			return this.getAttribute(attr);
		}
	});
}



/** List of attributes to ignore */
//FIXME: remove this when builder params get available
var ignoreAttr = {
	class: true,
	prop: true,
	loc: true,
	original: true
};


/** Dist of lc → cc prop names */
//FIXME: collect all the camelcase names
var camelNames = {
	guardedhandlers: 'guardedHandlers'
};


/**
 * Add attributes to nodes helpful to analyze stuff
 *
 */
function analyze(el){
	var scopeCounter = 0;

	analyzeScopes(el, scopeCounter);
	analyzeVariables(el);
}


/**
 * Scopes analyzer for the DOM structure - marks nodes with helpful attributes:
 * `data-scope=<id>` - scope id
 * `data-scope-global` - global scope flag
 * `data-scope-parent=<id>` - parent scope id
 */
function analyzeScopes(el, scopeCounter, lastScope){
	if (el.matches('.Function, .CatchClause, .Program')) {
		el.setAttribute('data-scope', scopeCounter++);

		//save parent scope
		var parentScope = closest(el, '[data-scope]');
		if (parentScope) {
			el.setAttribute('data-scope-parent', parentScope.getAttribute('data-scope'));
		}

		//mark global
		if (el.matches('Program')) el.setAttribute('data-scope-global', '');

		lastScope = el;
	}

	//for each kid mark scope
	q.all('> *', el).forEach(function(el){
		analyzeScopes(el, scopeCounter, lastScope);
	});
}


/**
 * Mark variables within a scope with helpful attributes:
 * `data-variable` - identifier is a variable
 * `data-variable-global` - identifier is global variable
 * `data-variable-scope=<id>` - element is a variable in the scope <id>
 *
 * Vars can be:
 * - VariableDeclaration, patterns
 * - Function arguments, patterns
 * - `arguments` within function scope
 * - Switch - what?
 * - ClassName
 * - ImportBinding
 * - Implicit variables
 *
 * Every id not declared within scope is considered global one
 */
function analyzeVariables(scope){
	var scopeId = scope.getAttribute('data-scope');

	//mark function/catchclause params
	if (scope.matches('.Function')){
		q.all('> .Identifier[prop*="param"]', scope).forEach(function(node){
			markVariable(node, scopeId);
		});
	}

	//get list of scope ids
	var ids = q.all('Identifier', scope)
	.filter(function(el){ return closest(el, '[data-scope]') === scope; });


	ids.forEach(function(id){
		//mark all `arguments` identifiers as variable within the scope
		if (id.name === 'arguments' && scope.matches('.Function')) {
			markVariable(node, scopeId);
		}
	});

	//analyze nested scopes
	q.all('> [data-scope]', scope).forEach(analyzeVariables);
}

/**
 * Mark node as a variable within scope
 */
function markVariable(node, scopeId){
	node.setAttribute('data-variable', '');
	node.setAttribute('data-variable-scope', scopeId);
}



/**
 * For each scope compose a list of references somehow touched by this scope
 *
 * @return {[type]} [description]
 */
function analyzeReferences(scope){
	var scopeId = scope.getAttribute('data-scope');

	var idNodes = q.all('Identifier', scope)

	//filter all identifiers which closest scope isn’t the current one
	.filter(function(el){
		var closestScope = closest(el, '[data-scope]');
		return closestScope && closestScope.getAttribute('data-scope') === scopeId;
	})

	//filter non-variable identifiers, like property, arrow fn etc
	.filter(function(el){
		//TODO
		return true;
	})

	//mark each identifier's current scope
	.forEach(function(el){
		el.setAttribute('data-scope-ref', scopeId);
	});
}


/** Exports */
module.exports = {
	toDOM: toDOM,
	toAST: toAST,
	analyze: analyze
};