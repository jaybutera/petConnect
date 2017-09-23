const express  = require('express');
const mongoose = require('mongoose');
const multer   = require('multer')
const upload   = multer({ dest: 'uploads/' })
const aws      = require('aws-sdk');
const fs       = require('fs')
const zlib     = require('zlib');

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
 *         AWS           *
**************************/

const rekognition = new aws.Rekognition();
const s3_pets     = new aws.S3({params: {Bucket: 'petsconnect', Key: 'myKey'}});
const s3_searchable = new aws.S3({params: {Bucket: 'searchpets'}});
const s3 = new aws.S3();

var params = {
   Image: {
      S3Object: {
         Bucket: "petsconnet",
         Name: ""
      }
   },
   MaxLabels: 10,
   MinConfidence: 20
};



function compareDescriptors(query, sample) {
   // Count number of matching descriptors
   var count = 0;
   for (var i = 0; i < query.length(); i++)
      count += sample.includes( query[i] ) ? 1 : 0;

   return count;
}

/**************************
 *     START SERVER      *
**************************/

app.post('/search', upload.single('pet'), (req, res, next) => {

   // Pull pet database to list
   //var pets = db.inventory.find({});
   //console.log(pets.length() + " pets in the db");

   // Load uploaded image into s3
   const body = fs.createReadStream( './'+req.file.path ).pipe(zlib.createGzip());
   var upload = new aws.S3.ManagedUpload({
        params: {Bucket: 'searchpets', Key: req.file.filename, Body: body}
   }).send( (err, data) => {
      if (err)
         console.log(err);
      //console.log(data);
   });

   /*
   params.Name = req.
   rekognition.detectLabels(params, (err, data) => {
   });
   */

   res.send({});
});

app.listen(3000, () => {
   console.log("listening on port 3000");
});
