var express = require('express');
var app = express();
var path = require('path');
var MongoClient = require("mongodb").MongoClient;

var url = process.env.MONGOLAB_URI;

var regExpURL = /^https?:\/\/(\S+\.)?(\S+\.)(\S+)\S*/;
var regExpNum = /[0-9][0-9]*/;

const PORT = process.env.PORT || 3000;
console.log('Up on the port ' + PORT);

app.get('/', function (req, res) {
  res.sendFile(path.resolve('index.html'));
});

app.get('/new/*', function (req, res) {
  // Checking the URL typed
  var newURL = req.params[0];
  if (!regExpURL.test(newURL)) {
    res.status(500).json({ error: 'Unkown URL format.' });
  } else {
    MongoClient.connect(url, function (err, db) {
      var colURL = db.collection('urls');
      colURL
        .find({ original_url: { $eq: newURL } })
        .toArray(function (err, documents) {
          if (err) {
            throw err;
          } else {
            if (documents.length == 0) {
              colURL.count(function (err, nb) {
                var shURL = req.protocol + '://' + req.get('host') + "/" + nb;
                var obj = { original_url: newURL, short_url: shURL };
                colURL.insert(obj);
                delete obj._id;
                db.close();
                res.json(obj);
              });
            } else {
              res.status(500).json({ error: 'URL already shortened.' });
            }
          }
        });
    });
  }
});

app.get('/*', function (req, res) {
  var num = req.params[0];
  if (!regExpNum.test(num)) {
    res.status(500).json({ error: 'Unkown Shortened URL format.' });
  } else {
    var shURL = req.protocol + '://' + req.get('host') + "/" + num;
    MongoClient.connect(url, function (err, db) {
      db.collection('urls')
        .find({ short_url: { $eq: shURL } })
        .toArray(function (err, documents) {
          if (err) {
            throw err;
          } else {
            db.close();
            if (documents.length == 0) {
              res.status(500).json({ error: "Shortened URL don't exist." });
            } else {
              res.redirect(documents[0].original_url);
            }
          }
        })
    });
  }
});

app.listen(PORT);