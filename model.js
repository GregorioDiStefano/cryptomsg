var levelup = require('levelup'),
    db = levelup('data.db')


var gen_keys = function() {
   var letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
   var keys = []
   var tmp = ""

   for (i = 2; i <= 5; i++) {
       for (j = 0; j < 20; j++) {
           for (k = 0; k < i; k++) {
              tmp += letters[Math.floor((Math.random() * letters.length) + 0)]
           }
       keys.push(tmp)
       tmp = ""
       }
   }
   return keys
}

var set_key = function(keys, value, cb) {

    if (keys.length == 0) {
        return cb(Error("No valid key found"))
    }

    var possible_key = keys[0]
    db.get(possible_key, function (err, _) {
        if (err && err.notFound) {
            db.put(possible_key, value, function(err) {
                if (err)
                    console.log("Error: ", err)
                else
                    return cb(possible_key)
            })
        } else {
            set_key(keys.slice(1, keys.length), value, cb)
        }
    });
}


var get_key = function(key, cb) {
    db.get(key, function(err, value) {
        if (err)
            console.log(err)
        return cb(err, value)
    })
}

exports.gen_keys = gen_keys;
exports.get_key = get_key;
exports.set_key = set_key;
