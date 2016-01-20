var privnote = angular.module('privnote', ['ngDialog']);

function get_key_and_iv(salt, password) {
        var iterations = 1000;
        var keySize = 256;
        var ivSize = 128;

        var output = CryptoJS.PBKDF2(password, salt, {
                keySize: (keySize+ivSize)/32,
                iterations: iterations
        });

        output.clamp();

        var key = CryptoJS.lib.WordArray.create(output.words.slice(0, keySize/32));
        var iv = CryptoJS.lib.WordArray.create(output.words.slice(keySize/32));

        return { "key": key, "iv": iv }
}

privnote.controller('encryption', ['$scope', "$rootScope", "$http", "ngDialog", function($scope, $rootScope, $http, ngDialog){
    $scope.file_set = false
    $scope.text_set = false

    var port = (location.port == 80 || location.port == 443) ? "" : ":" + location.port
    $scope.url = location.protocol + "//" + location.hostname + port + "/"

    var filename_to_encrypt = ""
    var file_to_encrypt_data = ""
    var one_time_read

    $rootScope.$on('ngDialog.opened', function (e, $dialog) {
        var qrcode = new QRCode("qrcode", {
            text: $scope.value,
            width: 128*1.5,
            height: 128*1.5,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    });

    $scope.submit = function() {
        var plaintext = $scope.data ? $scope.data : file_to_encrypt_data
        var password = $scope.password

        var salt = CryptoJS.lib.WordArray.random(128/8);
        var data = get_key_and_iv(salt, password)

        var key = data["key"]
        var iv = data["iv"]

        var rawEnc = CryptoJS.AES.encrypt( plaintext,
                                           CryptoJS.enc.Hex.parse(key),
                                           { "iv": iv, "mode": CryptoJS.mode.CBC });

        var base64_payload = CryptoJS.enc.Base64.stringify(rawEnc.ciphertext);
        var base64_salt = CryptoJS.enc.Base64.stringify(salt)


        $http({
            url: '/post',
            method: "POST",
            data: JSON.stringify({ "data": base64_payload,
                                   "salt": base64_salt,
                                   "filename": filename_to_encrypt,
                                   "one_time_read": one_time_read }),
            headers: {'Content-Type': 'application/json'}
          }).success(function (data, status, headers, config) {

                $scope.value = data.id

                ngDialog.open({
                    template: '/static/dialog.html',
                    className: 'ngdialog-theme-default',
                    scope: $scope
                });

            }).error(function (data, status, headers, config) {
                $scope.status = status + ' ' + headers;
            });
    }

    $scope.set_file = function(file) {
        try {
            var filename = event.target.files[0].name
            var file_obj = event.target.files[0]
            var filesize = file_obj.size

            if (filesize > 5 * 1024 * 1024) {
                throw "File larger than 5mb"
                return
            }

            filename_to_encrypt = file_obj.name
            read = new FileReader();
            read.readAsBinaryString(file_obj)

            read.onloadend = function() {
                file_to_encrypt_data = read.result
            }
        } catch (e) {
            filename = undefined
            file_obj = undefined
            document.getElementById("file_input").value = ""
            sweetAlert("Error", e, "error");
        }

        if (filename) {
            $scope.$apply(function() {
                $scope.file_set = true
            })
        } else $scope.$apply(function() {
              $scope.file_set = false
          })
    }

    $scope.set_text = function(c) {
        if (c)
            $scope.text_set = true
        else $scope.text_set = false
    }

    $scope.delete_on_read = function(c) {
        one_time_read = c
    }
}]),



privnote.controller('decryption', ['$scope', "$http", function($scope, $http) {

    $scope.decrypt = function() {
        var id = location.pathname
        var salt = ""
        var ciphertext = ""
        var filename = ""

        var response = function(data) {
                $http.get("/get" + id)
                    .then(function(response) {
                        salt = response.data.salt
                        ciphertext = response.data.data
                        filename = response.data.filename
                        data(salt, ciphertext)
            })
        }

        response(function(salt, cipher){
            ciphertext = CryptoJS.enc.Base64.parse(ciphertext);
            salt = CryptoJS.enc.Base64.parse(salt)

            var data = get_key_and_iv(salt, $scope.password)
            var key = data["key"]
            var iv = data["iv"]

            var plaintext = CryptoJS.AES.decrypt(
              {
                ciphertext: ciphertext,
                salt: salt
              },
              CryptoJS.enc.Hex.parse(key),
              { iv: iv, mode: CryptoJS.mode.CBC }
            ).toString(CryptoJS.enc.Utf8)

            if (filename) {
                var bytes = new Uint8Array(plaintext.length);
                for (var i=0; i<plaintext.length; i++)
                    bytes[i] = plaintext.charCodeAt(i);

                var blob = new Blob([bytes], {type: "application/octet-stream"});
                saveAs(blob, filename);
            } else {
                $scope.message_view = plaintext
            }
        })
    }
}]);
