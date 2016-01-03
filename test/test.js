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
        key2 = m.gen_keys().slice(-1)[0],
        large_value = (new Array(25*1024*1024)).join("x");

    it("should set without exception", function(done) {
        var possible_keys = m.gen_keys()
        m.set_key(possible_keys, "test", function(v, e) {
            value_used = v
            done()
        })
    }),

    it("should get without exception", function(done) {
        m.get_key(value_used, function(v) {
            assert(v == "test")
            done()
        })
    }),

    it("should find valid key in list", function(done) {
        m.set_key(["a", key], value, function(v) {
            assert(v == key)
            done()
        })
    }),

    it("should return value with valid key", function(done) {
        m.get_key(key, function(v) {
            assert(v == value)
            done()
        })
    }),

    it("should throw error when no key valid", function(done) {
        m.set_key(["a", key], "a", function(v, e) {
            assert(e instanceof Error)
            assert.throws(e, Error, /No valid key found/)
            done()
        })
    }),

    it("should throw error when keys is not array", function(done) {
        m.set_key(1, "a", function(v, e) {
            assert(e instanceof Error)
            assert.throws(e, Error, /Keys is not an array!/)
            done()
        })
    })

    it("should store large value", function(done) {
        m.set_key([key2], large_value, function(v) {
            done()
        })
    }),

    it("should get large value", function(done) {
        m.get_key([key2], function(v) {
            assert(v == large_value)
            done()
        })
    }),

    it("should delete keys", function(done) {
        m.del_key(key2, function(e) {
            done()
        })
    }),

    it("should get Error for deleted key", function(done) {
        m.get_key(key2, function(v) {
            assert(v instanceof Error)
            assert.throws(v, Error, /Keys is not an array!/)
            done()
        })
    })
})
