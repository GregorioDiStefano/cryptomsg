var levelup = require('levelup'),
    db = levelup('data.db');

var gen_keys = function() {
   var letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789",
       keys = [],
       tmp = "";

   for (i = 8; i <= 12; i++) {
       for (j = 0; j < 4; j++) {
           for (k = 0; k < i; k++) {
              tmp += letters[Math.floor((Math.random() * letters.length) + 0)];
           }
       keys.push(tmp);
       tmp = "";
       }
   }
   return keys;
};

var set_key = function(keys, value, cb) {
    var possible_key = keys[0];

    if (keys.length === 0) {
        return cb(undefined, Error("No valid key found"));
    } else if (!(keys instanceof Array)) {
        return cb(undefined, Error("Keys is not an array!"));
    }

    db.get(possible_key, function (err, _) {
        if (err && err.notFound) {
            db.put(possible_key, value, function(err) {
                if (err)
                    console.log("Error: ", err);
                else
                    return cb(possible_key, undefined);
            });
        } else {
            set_key(keys.slice(1, keys.length), value, cb);
        }
    });
};

var get_key = function(key, cb) {
    db.get(key, function(err, value) {
        if (err)
            if (err.notFound)
                return cb(Error("Not found"));
        return cb(value);
    });
};

var del_key = function(key, cb) {
    db.del(key, function(err) {
        if (err) {
            if (err.notFound) {
                return cb(Error("Not found"));
            }
        }
        return cb();
    });
};

exports.gen_keys = gen_keys;
exports.get_key = get_key;
exports.set_key = set_key;
exports.del_key = del_key;
