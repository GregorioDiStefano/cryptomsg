var privnote = angular.module('privnote', []);

String.prototype.sha256 = function() {
  return sha256(this);
};

function unbase64(str) {
    return new Uint8Array(atob(str).split("").map(function(c) {
        return c.charCodeAt(0); }));
}

function stringToHex (tmp) {
    var str = '',
        i = 0,
        tmp_len = tmp.length,
        c;

    for (; i < tmp_len; i += 1) {
        c = tmp.charCodeAt(i);
        str += d2h(c) + ' ';
    }
    return str;
}

function hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        var v = parseInt(hex.substr(i, 2), 16);
        if (v) str += String.fromCharCode(v);
    }
    return str;
}

function get_key_and_iv(salt, password) {
        var iterations = 100;
        var keySize = 256;
        var ivSize = 128;
        //console.log("Salt: ", salt, salt.toString(CryptoJS.enc.Hex), CryptoJS.enc.Hex.parse(salt.toString(CryptoJS.enc.Hex)))

        var output = CryptoJS.PBKDF2(password, salt, {
                keySize: (keySize+ivSize)/32,
                iterations: iterations
        });

        output.clamp();

        var key = CryptoJS.lib.WordArray.create(output.words.slice(0, keySize/32));
        var iv = CryptoJS.lib.WordArray.create(output.words.slice(keySize/32));

        return { "key": key, "iv": iv }
}

privnote.controller('encryption', ['$scope', "$http", function($scope, $http){
    $scope.submit = function() {
        var message = $scope.data
        var password = $scope.password

        var salt = CryptoJS.lib.WordArray.random(128/8);

        var data = get_key_and_iv(salt, password)
        var key = data["key"]
        var iv = data["iv"]

        var rawEnc = CryptoJS.AES.encrypt(  message,
                                            CryptoJS.enc.Hex.parse(key),
                                            { "iv": iv,
                                              "mode": CryptoJS.mode.CBC
                                            }
                                         );

        //console.log(CryptoJS.enc.Hex.stringify(rawEnc.ciphertext))
        var base64_payload = CryptoJS.enc.Base64.stringify(rawEnc.ciphertext);
        var base64_salt = CryptoJS.enc.Base64.stringify(salt)

        //console.log("Base64: ", base64_payload, base64_salt)

        var plaintext = CryptoJS.AES.decrypt(
          {
            ciphertext: rawEnc.ciphertext,
            salt: salt
          },

          CryptoJS.enc.Hex.parse(key),
          { iv: iv }
        ).toString(CryptoJS.enc.Hex)

        console.log("Data:", plaintext, hex2a(plaintext))

        $http({
            url: '/post',
            method: "POST",
            data: JSON.stringify({"data": base64_payload, "salt": base64_salt}),
            headers: {'Content-Type': 'application/json'}
          }).success(function (data, status, headers, config) {
                $scope.data = base64_payload
            }).error(function (data, status, headers, config) {
                $scope.status = status + ' ' + headers;
            });
    }
}]);
