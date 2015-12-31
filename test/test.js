var m = require("../model"),
    assert = require('assert')

describe('Key generator works as expected', function() {
    it('key count is > 10', function () {
        assert(m.gen_keys().length > 10)
    });
    it("10 keys of length 2 exist", function() {
        var count = 0;
        m.gen_keys().forEach(function(e, i, a) {
            if (e.length == 2)
                count++
        })
        assert(count == 20)
    });
});

describe("Set and get keys", function() {
    var value_used = "",
        keys = m.gen_keys(),
        key = keys[keys.length - 1],
        value = keys[keys.length - 2],
        large_value = (new Array(1*1024*1024)).join("x");

    it("should set without exception", function(done) {
        var possible_keys = m.gen_keys()
        m.set_key(possible_keys, "test", function(v, e) {
            value_used = v
            done()
        })
    }),

    it("should get without exception", function(done) {
        m.get_key(value_used, function(e, v) {
            assert(v == "test")
            done()
        })
    }),

    it("set_key should find valid key", function(done) {
        m.set_key(["a", key], value, function(v) {
            assert(v == key)
            done()
        })
    }),

    it("get on valid key should return value", function(done) {
        m.get_key(key, function(e, v) {
            assert(v == value)
            done()
        })
    }),

    it("throws error when no key valid", function(done) {
        m.set_key(["a", key], "a", function(e) {
            assert(e instanceof Error)
            assert.throws(e, Error, /No valid key found/)
            done()
        })
    }),

    it("store large value", function(done) {
        m.set_key(m.gen_keys(), large_value, function(v) {
            done()
        })
    })

})





