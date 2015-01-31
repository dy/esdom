/**
 * @module esdom/analyze
 */


var q = require('query-relative');
var closest = require('query-relative/closest');
var find = require('array-find');


/**
 * Add attributes to nodes helpful to analyze stuff
 *
 */
function analyze(el){
	var scopeCounter = 0;

	analyzeScopes(el, {scopeCounter:0, lastScope: null});

	//mark variables
	analyzeDeclarations(el);

	//mark references
	analyzeReferences(el);
}


/**
 * Scopes analyzer for the DOM structure - marks nodes with helpful attributes:
 * `data-scope=<id>` - scope id
 * `data-scope-global` - global scope flag
 * `data-scope-parent=<id>` - parent scope id
 * `data-scope-variables=<count>` - number of variables in scope
 */
function analyzeScopes(el, opts){
	if (el.matches('.Function, .CatchClause, .Program')) {
		el.setAttribute('data-scope', opts.scopeCounter++);

		//save parent scope
		var parentScope = closest(el, '[data-scope]');
		if (parentScope) {
			el.setAttribute('data-scope-parent', parentScope.getAttribute('data-scope'));
		}

		//mark global
		if (el.matches('Program')) el.setAttribute('data-scope-global', '');

		opts.lastScope = el;
	}

	//for each kid mark scope
	q.all('> *', el).forEach(function(el){
		analyzeScopes(el, opts);
	});
}




/**
 * Mark all declarations within the scope
 * `data-variable=<id>` - variable indicator with unique id
 * `data-variable-declaration` - variable declaration flag (implicit doesn’t have)
 * `data-variable-scope=<scope-id>` - variable scope
 *
 * Vars can be declared via:
 * - VariableDeclarator
 * - Function `arguments`, arguments, rest
 * - FunctionDeclaration
 * - CatchClause param
 * - ClassName
 * - ImportBinding
 * - Implicit variables
 */
function analyzeDeclarations(scope){
	if (scope.hasAttribute('data-scope')) {
		var scopeId = scope.getAttribute('data-scope');

		// console.group(scopeId)

		//catch scope arguments
		var args = q.all('> .Identifier[prop*="param"]', scope);

		//mark function/catchclause params
		args.forEach(function(node){
			markDeclaration(node, scope);
		});

		//get list of scope ids
		var ids = q.all('.Identifier', scope)
		.filter(function(el){
			if (args.indexOf(el) >= 0) return false;
			return closest(el, '[data-scope]') === scope;
		});

		ids.forEach(function(id){
			//if identifier is a variable declarator - mark it
			if (id.parentNode.matches('.VariableDeclarator')) {
				markDeclaration(id, scope);
			}

			//if identifier is a function declaration (hoisting) - mark it as belonging to parent scope
			if (id.parentNode.matches('.FunctionDeclaration')){
				if (id.matches(':first-child')) {
					markDeclaration(id, closest(scope, '[data-scope]'));
				}
				else {
					markDeclaration(id, scope);
				}
			}
		});

		// console.groupEnd();
	}


	/**
	 * Mark node as a variable within scope
	 */
	function markDeclaration(node, scope){
		var scopeId = scope.getAttribute('data-scope');
		var scopeVarCounter = +scope.getAttribute('data-scope-variables') || scope.matches('.Function') ? 1 : 0;

		node.setAttribute('data-variable', scopeId + '' + (scopeVarCounter++));
		node.setAttribute('data-variable-scope', scopeId);
		node.setAttribute('data-variable-declaration', '');

		scope.setAttribute('data-scope-variables', scopeVarCounter);
	}


	//analyze nested els
	q.all('> *', scope).forEach(analyzeDeclarations);
}


/**
 * Go by all identifiers, mark their scopes & declarations
 *
 * Non-variable identifiers are:
 * - memberexpression
 * - object keys
 * - labeledstatement label
 * - breakstatement label
 * - continuestatement label
 */
function analyzeReferences(el){
	//ordered scopes, by depth
	var scopes = [], children = [el];

	//calc scopes depth, go from bottom to top
	while (children.length) {
		scopes = scopes.concat(children.filter(function(el){return el.matches('[data-scope]')}));
		children = q.all('> *', children);
	}

	//go from lower scopes to upper, mark variables
	scopes.reverse().forEach(function(scope){
		analyzeScopeRefs(scope);
	});


	function analyzeScopeRefs(scope){
		var scopeId = scope.getAttribute('data-scope');

		//get list of declarations for the scope
		var sel = '[data-variable-declaration][data-variable-scope="' + scopeId + '"]';
		var declarations = q.all(sel, el);

		//get all nested identifiers
		var ids = q.all('.Identifier', scope).filter(function(id){
			//ignore plain properties refs
			if (id.matches('[prop="property"]') && id.parentNode.getAttribute('computed') === 'false') return false;

			//ignore object keys definitions
			if (id.matches('[prop="key"]')) return false;

			//ignore already marked variables
			if (id.hasAttribute('data-variable')) return false;

			//otherwise id is a variable reference
			return true;
		});

		//mark each valid id having declaration within that scope
		ids.forEach(function(id){
			var idName = id.getAttribute('name');

			var decl = find(declarations, function(decl){
				return decl.getAttribute('name') === idName;
			});

			//if decl found - variable is of that scope
			if (decl) {
				id.setAttribute('data-variable', decl.getAttribute('data-variable'));
				id.setAttribute('data-variable-scope', decl.getAttribute('data-variable-scope'));
			}

			//if name is arguments and scope is fn - it belongs to the scope
			else if (idName === 'arguments' && scope.matches('.Function')){
				id.setAttribute('data-variable', scopeId + '' + 0);
				id.setAttribute('data-variable-scope', scopeId);
			}
		});
	}
}


module.exports = analyze;