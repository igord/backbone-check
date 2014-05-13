// backbone-check v0.1
//
// Author: Igor Dimitrijevic <igor@ground.gr>
// Distributed under MIT License
//
(function(){
    "use strict";

    // collection to hold check function definitions for each model
    // populated by check.parse method
    // checks: collection of property check functions: {propertyName: {functionName: arguments || null}, ...}
    // constructor: reference to model constructor
    var data = [],

	c = Backbone.check = function(attrs) {
	    return c.run.call(this, attrs)
	};

    _.extend(Backbone.check, {
	// enables checking for backbone instance by subscribing to change events for each property
	change: function(instance, noDeep) {
	    var currentValues = {};
	    
	    _.each(c.getDefinitions.call(instance), function(v, k) {
		instance.on('change:' + k, function(e) {
		    c.run.call(e, e.changed);
		});
		if (!noDeep) {
		    if (instance[k] instanceof Backbone.Model) {
			c.change(instance[k]);
		    } else if (instance[k] instanceof Backbone.Collection) {
			_.each(instance[k].models, function(model) {
			    c.change(model);
			});
		    }
		}
		currentValues[k] = instance.get(k);
	    });
	    c.run.call(instance, currentValues);
	},
	// disables checking on change
	offChange: function(instance, noDeep) {
	    _.each(c.getDefinitions.call(instance), function(v, k) {
		instance.off('change:' + k);
		if (!noDeep) {
		    if (instance[k] instanceof Backbone.Model) {
			c.offChange(instance[k]);
		    } else if (instance[k] instanceof Backbone.Collection) {
			_.each(instance[k].models, function(model) {
			    c.offChange(model);
			});
		    }
		}
	    });
	},
	// look up proto chain and return all checks
	// because __proto__ is not working in IE, just return check object
	// TODO: see if it is possible to emulate __proto__ in IE
	getDefinitions: function() {
	    return this.check;
	    // IE?
	    var p = this.__proto__,
		checks  = {};
	    do {
		checks = _.extend({}, p.check, checks);
	    } while (p = p.__proto__);
	    return checks;
	},
	// main method that checks if properties are valid for defined checks
	// if there are errors, it will call check.callback and returns error object
	run: function(props) {
	    var co = c.get.call(this),
		errors = [],
		ctx = this, k, cname;

	    for (k in props) {
		for (cname in co[k]) {
		    if (cname === "opt") {
			if (c.fn.opt(props[k])) break;
			continue;
		    }
		    if (!c.fn[cname].apply(ctx[k], co[k][cname]? [props[k]].concat(co[k][cname]) : [props[k]])) errors.push({
			property: k,
			value: props[k],
			name: cname,
			args: co[k][cname]
		    });
		};
	    };
	    if (errors.length > 0) {
		if (c.callback) c.callback.call(this, errors);
		return errors;
	    }
	},
	// returns check object with functions as values
	get: function() {
	    var ci = _.where(data, {constructor: this.constructor});
	    // if check definition strings are not parsed, do it
	    if (_.isEmpty(ci)) return c.parse.call(this);
	    return ci[0].checks;
	},
	// parses check definition strings to functions and adds them to data collection
	parse: function() {
	    var o = {
		    constructor: this.constructor,
		    checks: {}
		},
		props = c.getDefinitions.call(this),
		val, colon, args, co;

	    _.each(props, function(v, k) {
		o.checks[k] = {};
		val = _.isArray(v)? v[0] : v;
		_.each(val.split(" "), function(exp, i) {
		    colon = exp.split(":");
		    if (!c.fn[colon[0]]) {
			console.log("check function '" + colon[0] + "' is not defined");
		    } else if (colon[1]) {
			args = colon[1].split(",");
			// if check is array, do replace
			if (val !== v) {
			    _.each(args, function(arg, j) {
				args[j] = args[j].replace(/%%/g, function(){return v.splice(1, 1)});
			    });
			}
			o.checks[k][colon[0]] = JSON.parse("[" + args + "]");
			console.log(o.checks[k][colon[0]]);
		    } else {
			o.checks[k][colon[0]] = null;
		    }
		});
	    });
	    data.push(o);
	    return o.checks;
	},
	// called before check errors are returned
	callback: function(errors) {
	    _.each(errors, function(v) {
		console.log("'" + v.property + "' check failed: " + JSON.stringify(v.value) + " \u2260 " + v.name + ":" + v.args);
	    });
	},
	// used by check function instance
	getClass: function(s) {
	    var w = window,
		p = s.split(".");
	    for (var i = 0; i < p.length; i++) {
		if (w = w[p[i]]) continue;
		return null;
	    }
	    return w;
	},
	// CHECK FUNCTIONS 
	fn: {
	    opt: function(value) {
		return value === null;
	    },
	    or: function(value) {
		for (var i = 1; i < arguments.length; i++) {
		    if (c.fn[arguments[i]].call(this, value)) return true;
		};
	    },
	    num: function(value, decimal) {
		if (!_.isNumber(value)) return false;
		if (!decimal) return true;
		var n = value * Math.pow(10, decimal);
		return Math.floor(n) === n;
	    },
	    int: function(value, measure) {
		if (!_.isNumber(value)) return false;
		return value % 1 === 0;
	    },
	    str: function(value) {
		return _.isString(value);
	    },
	    array: function(value) {
		return _.isArray(value);
	    },
	    obj: function(value) {
		return _.isObject(value);
	    },
	    bool: function(value) {
		return _.isBoolean(value);
	    },
	    instance: function(value, className) {
		var mClass;
		if (mClass = c.getClass(className)) return this instanceof mClass;
		return false;
	    },
	    model: function(value, className) {
		return c.fn.instance.apply(this, arguments) && this instanceof Backbone.Model;
	    },
	    collection: function(value) {
		if (!(this instanceof Backbone.Collection) || arguments.length < 2) return false;
		for (var ok, j, i = 0; i < this.models.length; i++) {
		    ok = false;
		    for (j = 1; j < arguments.length; j++) {
			if (c.fn.model.call(this.models[i], null, arguments[j])) {
			    ok = true;
			    break;
			}
		    };
		    if (!ok) return false;
		}
		return true;
	    },
	    min: function(value, min) {
		if (!_.isNumber(value)) return false;
		return value >= min;
	    },
	    max: function(value, max) {
		if (!_.isNumber(value)) return false;
		return value <= max;
	    },
	    range: function(value, min, max) {
		return c.fn.min(value, min) && c.fn.max(value, max);
	    },
	    // for every object with length property
	    length: function(value, from, to) {
		if (!_.has(value, "length")) return false;
		var len = value.length;
		if (!len) return false;
		if (_.isNumber(from) && to === undefined) return len === from;
		if (from === "-Infinity") from = -Infinity;
		if (to === "Infinity") to = Infinity;
		if (!_.isNumber(from) || !_.isNumber(to)) return false;
		return len >= from && len <= to;
	    },
	    is: function(value) {
		if (arguments.length === 1) return Boolean(value);
		for (var i = 1; i < arguments.length; i++) {
		    if (value === arguments[i]) return true;
		};
		return false;
	    },
	    regex: function(value, pattern) {
		if (!_.isString(value)) return false;
		var rx = new RegExp(pattern);
		return rx.test(value);
	    }
	}
    });


})();
