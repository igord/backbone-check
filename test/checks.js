var c;
QUnit.testStart(function( details ) {
    c = Backbone.check.fn[details.name];
});

module( 'Checks' );
test('num', function() {
    expect( 4 );
    equal( false, c(2.34, 1), 'false, (2.34, 1)' );
    equal( true, c(2, 1), '(2, 1)' );
    equal( true, c(-345342.10000, 1), '(-345342.10, 1)' );
    equal( true, c(-4, 0), '(-4, 0)' );
});
test('min', function() {
    expect( 4 );
    equal( false, c(2.34, 2.34394587394), '(false, 2.34, 2.3439458739)' );
    equal( true, c(-93247, -100000), '(-93247, -100000)' );
    equal( true, c(-345, -345), '(-345, -345)' );
    equal( true, c(-4, -8), '(-4, -8)' );
});
test('max', function() {
    expect( 4 );
    equal( false, c(2.34, 1, 2.33394587394), '(false, 2.34, 2.3339458739)' );
    equal( false, c(-93247, -100000.23), '(false, -93247, -100000.23)' );
    equal( false, c(-345, -345.999), '(false, -345, -345.999)' );
    equal( true, c(-4, -3), '(-4, -8)' );
});
test('range', function() {
    expect( 4 );
    equal( false, c(2.34, 1, 2.33394587394), '(false, 2.34, 1, 2.3339458739)' );
    equal( true, c(-93247, -100000.23, 0), '(-93247, -100000.23, 0)' );
    equal( true, c(-345, -345.999, -345), '(-345, -345.999, -345)' );
    equal( true, c(-4, -8, 9), '(-4, -8, 9)' );
});
test('length', function() {
    expect( 4 );
    equal( false, c({a:3}, 2, 6), 'false, has no length prop' );
    equal( true, c({a:3, length:2}, 0, 6), 'has length' );
    equal( false, c("string", -1, 1), 'false, string, -1, 1' );
    equal( true, c([0, 1, 2], 2, 6), 'array(3), 2, 6' );
});
test('is', function() {
    expect( 4 );
    equal( true, c(true), 'boolean' );
    equal( true, c("one", "two", "three", "one"), 'string comparison' );
    equal( false, c(true, "", null, 0), 'false, true, "", null, 0' );
    var a = [0, 1, 2];
    equal( true, c(a, a), 'a, a' );
});
test('instance', function() {
    expect( 4 );
    var o = {};
    equal( true, c.call(o, o, "Object"), '{}, Object' );
    o = [1, 2];
    equal( true, c.call(o, o, "Array"), '[], Array' );
    o = "string"
    equal( false, c.call(o, o, "Object"), 'false, "string", Object' );
    o = /123/;
    equal( true, c.call(o, o, "RegExp"), '/123/ is RegExp' );
});
