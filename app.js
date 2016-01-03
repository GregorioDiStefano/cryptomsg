var express = require('express');
var app = express();
var model = require("./model");
var bodyParser = require('body-parser')

app.set('view engine', 'jade')
app.set('views', './views')
app.use('/static', express.static("static"));
app.use(bodyParser.json(({limit: '50mb'})))

app.get('/', function (req, res) {
    res.render('index', { title: 'Hey', message: 'Hello there!'});
});

app.post('/post', function (req, res) {
    model.set_key(model.gen_keys(), JSON.stringify(req.body), function(v) {
        res.send("Data:"+ v);
    })
});

app.get('/:id', function (req, res) {
    var id = req.params.id;

    model.get_key(id, function(v) {
        res.send(v)
        model.del_key(id, function() {
            console.log("Deleted: ", id)
        })
    })
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
