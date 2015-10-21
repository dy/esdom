/**
 * @module esdom/query
 *
 * Extension for queried, providing high-level pseudos.
 *
 *
 */

var queried = require('queried');


/**
 * esquery pseudos
 */
queried.registerFilter(':statement', function(){

});
queried.registerFilter(':expression', function(){

});
queried.registerFilter(':declaration', function(){

});
queried.registerFilter(':function', function(){

});
queried.registerFilter(':pattern', function(){

});



/**
 * Select all variable instances having passed selector as a initial value.
 *
 * Variable:declaration(:require());
 */
queried.registerFilter('declaration', function(els, selecto){

});


/**
 * Select all references related to the signature.
 *
 * Variable:signature()
 */
queried.registerFilter('signature', function(){

});


/**
 * Eval code within brackets
 *
 * Variable:declaration(`require('x')`)
 */


module.exports = queried;