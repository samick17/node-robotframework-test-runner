/*
    Author: Samick.Hsu(boneache@gmail.com)
    */
//
(function() {

	const path = require('path');
	const assert = require('assert');

	const appFolder = path.join(__dirname, '../../../../');
	function requireAppModule(modulepath) { return require(path.join(appFolder, modulepath)); }
	const testCaseName = path.basename(__filename).replace('.mocha'+path.extname(__filename), '');
	const Utils = requireAppModule('core/cli/lib/utils');

	describe(testCaseName, function() {

		it('string format', function(done) {
			assert.equal('name:category - value', '{0}:{2} - {1}'.format('name', 'value', 'category'));
			done();
		});

		it('zfill', function(done) {
			assert.equal('--123', Utils.zfill('123', '-', 5));
			assert.equal('123', Utils.zfill('123', '-', 3));
			done();
		});

		it('isDefined', function(done) {
			assert.equal(true, Utils.isDefined());
			assert.equal(true, Utils.isDefined([]));
			assert.equal(true, Utils.isDefined([false]));
			assert.equal(true, Utils.isDefined([null]));
			assert.equal(true, Utils.isDefined([0]));
			assert.equal(true, Utils.isDefined(['']));
			assert.equal(true, Utils.isDefined(['abc']));
			assert.equal(false, Utils.isDefined([undefined]));
			assert.equal(false, Utils.isDefined([null, undefined]));
			assert.equal(false, Utils.isDefined([undefined, null]));
			assert.equal(false, Utils.isDefined([undefined, 1]));
			assert.equal(true, Utils.isDefined('1'));
			assert.equal(false, Utils.isDefined(undefined, '1'));
			assert.equal(true, Utils.isDefined('', '1'));
			done();
		});

		it('isOneOfArgDefined', function(done) {
			assert.equal(false, Utils.isOneOfArgDefined());
			assert.equal(true, Utils.isOneOfArgDefined([]));
			assert.equal(true, Utils.isOneOfArgDefined([false]));
			assert.equal(true, Utils.isOneOfArgDefined([null]));
			assert.equal(true, Utils.isOneOfArgDefined([0]));
			assert.equal(true, Utils.isOneOfArgDefined(['']));
			assert.equal(true, Utils.isOneOfArgDefined(['abc']));
			assert.equal(true, Utils.isOneOfArgDefined([undefined]));
			assert.equal(true, Utils.isOneOfArgDefined([null, undefined]));
			assert.equal(true, Utils.isOneOfArgDefined([undefined, null]));
			assert.equal(true, Utils.isOneOfArgDefined([undefined, 1]));
			assert.equal(true, Utils.isOneOfArgDefined([null, null]));
			assert.equal(true, Utils.isOneOfArgDefined(''));
			assert.equal(true, Utils.isOneOfArgDefined('abc'));
			assert.equal(true, Utils.isOneOfArgDefined(0));
			assert.equal(true, Utils.isOneOfArgDefined(1));
			done();
		});

		it('inheritPrototype', function(done) {
			function Base(data) {
				this.data = data;
			}
			Base.prototype.foo = function() {
				return 'base';
			};
			function Concrete(data) {
				Base.call(this, data);
			}
			Utils.inheritPrototype(Concrete, Base);
			Concrete.prototype.foo = function() {
				return 'concrete';
			};
			assert.equal('base', new Base().foo());
			assert.equal('concrete', new Concrete().foo());
			done();
		});

		it('getArgumentsRange', function(done) {
			assert.deepEqual([3, 5, 7], Utils.getArgumentsRange([1, 3, 5, 7, 9], 1, 3));
			done();
		});

	});
})();