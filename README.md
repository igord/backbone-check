backbone-check
=========

[http://backbonejs.org/] (Backbone.js) plugin that checks(validates) model properties. Definition syntax is clean and easy to read. Nested models are supported.

## Example:

```js
var Example = Backbone.Model.extend({
    defaults: {
	    repeat: 0,
	    delay: 0.6,
	    paused: false,
	    title: "My Model",
	    days: ["Monday", "Friday", "Tuesday"],
	    hash: null,
	    color: "yellow",
	    unknown: 23423,
	    custom: getCustomValue(),
	    exampleCollection: new app.Collection(),
	    exampleModel: new app.Model()
    },
    check: {
	    repeat: 'int min:-1', // integer, minimum value = -1
	    delay: 'min:0', // number minimum value = 0
	    paused: 'bool', // boolean value
	    title: 'str length:1,"Infinity"', // string value with at least one character
	    days: "array", // value is array
	    hash: "opt obj", // value is either null(optional) or object
	    color: 'is:"white","black","yellow"', // value is either "white" or "black" or "yellow"
	    unknown: 'or:"num","str"', // value is either number or string
	    custom: 'customCheck', // function named 'customCheck' will be used
	    exampleCollection: 'collection:"app.Model2","app.Model3"', // value is Backbone collection of models app.Model2 or app.Model3
	    exampleModel: 'model:"app.Model"' // value is Backbone model app.Model
    },
    // enable validation checks
    validate: Backbone.check
});

var example = new Example();
// enable checking whenever property of model is changed
Backbone.check.change(example);
```
## Check(validation) functions
These functions are defined as string:
```js
title: 'str',
counter: 'int',
switch: 'bool'
```
When more then one check is needed, separate them by space character:
```js
hash: 'opt obj'
```
When check funcion needs parameters define each as JSON string after the colon, and separate them with comma:
```js
shape: 'is:"circle","ellipse"',
elements: 'collection:"app.Text","app.Rectangle","app.Stage"'
```
### Included check functions
```js
'opt'       // if used, value is optional(can be null)
'bool'      // value is boolean
'int'       // value is integer
'num'       // value is number
'str'       // value is string
'array'     // value is array
'obj'       // value is object
'instance'  // value is instance of parameter
'model'     // value is instance of paramater and Backbone.Model
'collection'// value is instance of Backbone.Collection that contains models passed as parameters
'or'        // value passes either of the checks passed as parameters
'is'        // value is equal to one of the parameters
'min'       // value is number >= from the parameter
'max'       // value is number <= from the parameter
'range'     // value is min first parameter and max second parameter
'length'    // value has 'length' property which is a value between first and second parameter
'regex'     // value passes RegExp.test for paramater
```
### Defining custom check functions
To define custom check functions extend Backbone.check.fn object:
```js
Backbone.check.fn.custom = function(value, par1, par2) {
    if (value === par1) return true;
    return false;
}
```
Then, if you define check as:
```js
myProp: 'custom:"foo"'
```
... you can run tests like this:
```js
// this will pass
instance.set('myProp', 'foo');
// this will log
// 'myProp' check failed: moo ≠ custom:foo 
instance.set('myProp', 'moo');
```
#### Using space, colon and comma characters in check parameters
These characters are used by parser so it won't work.
If you need to use them in check parameters, define check function as an array:
```js
custom: ['is:"my%%space","comma%%separated"', ' ', ',']
```
When check function is defined as array, parser will replace every '%%' with corresponding array element.
## Methods

### Backbone.check(attributes)
Use as validate function when defining the model.
### Backbone.check.change(instance, noDeep)
Subscribe to change event of each property to check values as they change.
### Backbone.check.offChange(instance, noDeep)
Unsubscribe from change events.
```js
var myModel = Backbone.Model.extend({
    default: {
        counter: 0,
        title: "Hello"
    },
    check: {
        counter: "int min:0",
        title: "str"
    },
    validate: Backbone.check
});

var my = new myModel();

// monitor changes
Backbone.check.change(my);
// this will log error
// 'counter' check failed: -1 ≠ min:0 
my.set('counter', -1);
// disable change checks
Backbone.check.offChange(my);
```

### Backbone.check.callback
Overwrite this method if you want errors to be handled in different way. By default, validation errors are sent to console.log. This function will run in the context of the instance which properties are being checked.

```js
// default callback
Backbone.check.callback = function(errors) {
    _.each(errors, function(v) {
		console.log("'" + v.property + "' check failed: " + 
		    JSON.stringify(v.value) + " \u2260 " + 
		    v.name + ":" + 
		    v.args
		);
    });
}

```

#### error object
Backbone.check returns collection of error objects. The same collection is passed to Backbone.check.callback function.

Error object has the following properties:
- property - name of the property that is not valid
- value - value that is not valid
- name - name of the check function that has failed
- args - parameters of the check function


