var privnote = angular.module('privnote', ['ngDialog']);

function get_key_and_iv(salt, password, cb) {
    var mypbkdf2 = new PBKDF2(password, salt, 2500, 32);

    var result_callback = function(key) {
        var iv = CryptoJS.lib.WordArray.create(key.slice(0, 32));
        cb({ "key": key, "iv": iv });
    };

    var status_callback = function(status) {
        document.getElementById("key_generation_status").innerHTML = status.toFixed(2) + "%";
    };
    mypbkdf2.deriveKey(status_callback, result_callback);
}


Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj));
};
Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key));
};

privnote.controller('encryption', ['$scope', "$rootScope", "$http", "ngDialog", function($scope, $rootScope, $http, ngDialog){
    $scope.file_set = false;
    $scope.text_set = false;
    $scope.storage_set = get_recent_links();
    $scope.links = get_recent_links();
    $scope.id = "";
    $scope.note = "";

    var port = (location.port == 80 || location.port == 443) ? "" : ":" + location.port;
    $scope.url = location.protocol + "//" + location.hostname + port + "/";

    var filename_to_encrypt = "";
    var file_to_encrypt_data = "";
    var one_time_read;

    function set_recent_link(uid, note) {
        if (note.length > 10)
            note = note.substr(0, 10) + "..";
        else if (note === "" || !note)
            note = undefined;
        if (localStorage.getObj("links") === null) {
            localStorage.setObj("links", [{"uid": uid, "note": note}]);
            $scope.links = get_recent_links();
            $scope.storage_set = true;
        } else {
            var data = localStorage.getObj("links");
            data.unshift({"uid": uid, "note": note});
            localStorage.setObj("links", data);
            $scope.links = get_recent_links();
        }
    }

    function get_recent_links() {
        var links = localStorage.getObj("links");

        if (links)
            return links;

        return false;
    }

    $rootScope.$on('ngDialog.opened', function (e, $dialog) {
        set_recent_link($scope.id, $scope.note);
        var qrcode = new QRCode("qrcode", {
            text: $scope.url + $scope.id,
            width: 128*1.5,
            height: 128*1.5,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    });

    $scope.submit = function($event) {
        var button = $event.currentTarget;

        if (!$scope.password) {
            return;
        } else if (!$scope.file_set && !$scope.text_set) {
            sweetAlert("Error", "No message entered or file selected!");
            return;
        }

        button.setAttribute("disabled", "true");

        var plaintext = $scope.data ? $scope.data : file_to_encrypt_data;
        var password = $scope.password;

        var salt = CryptoJS.lib.WordArray.random(128/8);
        get_key_and_iv(salt, password, function(data) {

            var key = data.key;
            var iv = data.iv;

            var rawEnc = CryptoJS.AES.encrypt( plaintext,
                                           CryptoJS.enc.Hex.parse(key),
                                           { "iv": iv, "mode": CryptoJS.mode.CBC });

            var base64_payload = rawEnc.toString();
            var base64_salt = CryptoJS.enc.Base64.stringify(salt);


            $http({
                url: '/post',
                method: "POST",
                data: JSON.stringify({ "data": base64_payload,
                                       "salt": base64_salt,
                                       "filename": filename_to_encrypt,
                                       "note": $scope.note,
                                       "one_time_read": one_time_read }),
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                $scope.id = data.id;
                button.removeAttribute("disabled");

                ngDialog.open({
                    template: '/static/dialogs/new_key.html',
                    className: 'ngdialog-theme-default',
                    scope: $scope
                });

            }).error(function (data, status, headers, config) {
                $scope.status = status + ' ' + headers;
                button.removeAttribute("disabled");
            });
        });


    };

    $scope.set_file = function(file) {
        var filename, file_obj, filesize;
        try {
            filename = document.getElementById("file_input").files[0].name;
            file_obj = document.getElementById("file_input").files[0];
            filesize = file_obj.size;

            if (filesize > 5 * 1024 * 1024) {
                throw "File larger than 5mb";
                return;
            }

            filename_to_encrypt = file_obj.name;
            read = new FileReader();
            read.readAsBinaryString(file_obj);

            read.onloadend = function() {
                file_to_encrypt_data = read.result;
            };
        } catch (e) {
            filename = undefined;
            file_obj = undefined;
            document.getElementById("file_input").value = "";
            sweetAlert("Error", e, "error");
        }

        if (filename) {
            $scope.file_set = true;
            $scope.$digest();
        } else {
            $scope.file_set = false;
            $scope.$digest();
        }
    };

    $scope.set_text = function(c) {
        if (c)
            $scope.text_set = true;
        else $scope.text_set = false;
    };

    $scope.delete_on_read = function(c) {
        one_time_read = c;
    };
}]),



privnote.controller('decryption', ['$scope', "$http", function($scope, $http) {
    $scope.spinner = false;

    $scope.decrypt = function() {
        var id = location.pathname;
        var salt = "";
        var ciphertext = "";
        var filename = "";
        $scope.message_view = "";

        var response = function(data) {
                $scope.spinner = true;
                $http.get("/get" + id)
                    .then(function(response) {
                        salt = response.data.salt;
                        ciphertext = response.data.data;
                        filename = response.data.filename;
                        data(salt, ciphertext);
            });
        };

        response(function(salt, cipher){

            ciphertext = CryptoJS.enc.Base64.parse(ciphertext);
            salt = CryptoJS.enc.Base64.parse(salt);

            get_key_and_iv(salt, $scope.password, function(data) {
                var key = data.key;
                var iv = data.iv;

                var plaintext = CryptoJS.AES.decrypt(
                                {
                                    ciphertext: ciphertext,
                                    salt: salt
                                },
                                CryptoJS.enc.Hex.parse(key),
                                { iv: iv, mode: CryptoJS.mode.CBC }
                );


            try {
                plaintext = plaintext.toString(CryptoJS.enc.Utf8);
                if (plaintext === "")
                    throw Error();
            } catch (e) {
                sweetAlert("Error", "Wrong password", "error");
                $scope.spinner = false;
                $scope.$digest();
                return;
            }

            if (filename) {
                var bytes = new Uint8Array(plaintext.length);
                for (var i=0; i<plaintext.length; i++)
                    bytes[i] = plaintext.charCodeAt(i);

                var blob = new Blob([bytes], {type: "application/octet-stream"});
                saveAs(blob, filename);
            } else {
                $scope.message_view = plaintext;
                $scope.$digest();
            }
            $scope.spinner = false;
            $scope.$digest();
        });
        });
    };
}]);
