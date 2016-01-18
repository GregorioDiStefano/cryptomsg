var model = require("../model");



//get encrypted payload with cipher text, and salt.
//data is deleted 1 minute after it was requested.

function get_encrypted(id, callback) {
    return model.get_key(id, function(v) {
        if (v instanceof Error)
            return callback("No data")

        var json = JSON.parse(v)

        if (json["one_time_read"]) {
            setTimeout(function() {
                model.del_key(id, function() {
                    console.log("Deleted: ", id)
                })
            }, 1000 * 1)
        }
        callback(v)
    })
}

exports.get_encrypted = get_encrypted;
