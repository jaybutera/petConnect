const express  = require('express');
const mongoose = require('mongoose');
const app      = express();

/**************************
 *     MONGODB SETUP     *
**************************/
mongoose.connect('mongodb://localhost/test', { useMongoClient: true, promiseLibrary: global.Promise });

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
   console.log("hells ya");
});

// Pet Schema
const pet = mongoose.Schema({
   url: String,
   img: { data: Buffer, contentType: String },
   descriptor: [],
});

/**************************
 *     START SERVER      *
**************************/

app.listen(3000, () => {
   console.log("listening on port 3000");
});
