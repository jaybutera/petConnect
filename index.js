const express  = require('express');
const mongoose = require('mongoose');
const multer   = require('multer')
const upload   = multer({ dest: 'uploads/' })
const app      = express();

/**************************
 *     MONGODB SETUP     *
**************************/
mongoose.connect('mongodb://localhost/pets', { useMongoClient: true, promiseLibrary: global.Promise });

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
   console.log("hells ya");
});

// Pet Schema
const pet = mongoose.Schema({
   url: String,
   img_url: String,
   descriptors: [String],
});


/**************************
 *     START SERVER      *
**************************/

app.post('/search', upload.single('user_pet'), (req, res, next) => {
   console.log('elo');
   console.log( req.file );

   res.send({});
});

app.listen(3000, () => {
   console.log("listening on port 3000");
});
