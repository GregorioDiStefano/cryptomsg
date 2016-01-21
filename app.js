var express = require('express');
var app = express();
var model = require("./model");
var controller = require("./controllers/crypto")
var bodyParser = require('body-parser')
var favicon = require('serve-favicon')

app.set('view engine', 'jade')
app.set('views', './views')
app.use('/static', express.static("static"));
app.use(bodyParser.json(({limit: '10mb'})))
app.use(favicon('static/favicon.ico'));

app.get('/', function (req, res) {
    res.render('index')
});

app.post('/post', function (req, res) {
    model.set_key(model.gen_keys(), JSON.stringify(req.body), function(v) {
        res.send({"id" : v});
    })
});

app.get('/get/:id', function (req, res) {
    var id = req.params.id;
    controller.get_encrypted(id, function(v) {
        res.send(v)
    })
});

app.get('/:id', function (req, res) {
    var id = req.params.id;

    model.get_key(id, function(cb) {
        if(cb instanceof Error)
            res.status(404).send("Invalid key")
        else {
            one_time_read = JSON.parse(cb)["one_time_read"]
            res.render('decrypt', {"one_time_read": one_time_read})
        }
    })
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server listening at http://%s:%s', host, port);
});
