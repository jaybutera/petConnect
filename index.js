const express  = require('express');
const mongoose = require('mongoose');
const multer   = require('multer')
const aws      = require('aws-sdk');
const fs       = require('fs')
const zlib     = require('zlib');
const MongoClient = require('mongodb').MongoClient;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.jpeg')
  }
})
const upload   = multer({ dest: 'uploads/', storage: storage })
const app      = express();

aws.config.update({region:'us-east-1'});

/**************************
 *     MONGODB SETUP     *
**************************/
url = 'mongodb://localhost/pets'
MongoClient.connect(url, (err, db) => {
const labels = db.collection('labels.inventory');
/*
const connection = mongoose.connect('mongodb://localhost/pets', { useMongoClient: true, promiseLibrary: global.Promise }, err => {
      if (err)
         console.log(err);
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
*/


// Pet Schema
/*
const PetSchema = mongoose.Schema({
   url: String,
   img_url: String,
   descriptors: [String],
});
// Pet Model
var PetModel = connection.model('label', PetSchema);
*/

/**************************
 *         AWS           *
**************************/

const rekognition = new aws.Rekognition();
/*
const s3_pets     = new aws.S3({params: {Bucket: 'petsconnect', Key: 'myKey'}});
const s3_searchable = new aws.S3({params: {Bucket: 'searchpets'}});
const s3 = new aws.S3();
*/

var params = {
   Image: {
      S3Object: {
         Bucket: "searchpets",
         Name: ""
      }
   },
   MaxLabels: 10,
   MinConfidence: 20
};



function compareDescriptors(query, sample) {
   // Count number of matching descriptors
   var count = 0;
   for (var i = 0; i < query.length; i++)
      count += sample.includes( query[i] ) ? 1 : 0;

   return count;
}

/**************************
 *     START SERVER      *
**************************/

app.post('/search', upload.single('pet'), (req, res, next) => {
   console.log(req);

   // Pull pet database to list
   labels.find({}).toArray( (err, data) => {
      if (err)
         console.log(err);

      // Organize db list to pet objects
      var pets = data.map( x => { return {
         'descriptors' : x.descriptors,
         'url' : x.url,
         'img_url' : x.img_url
      }});

      //console.log(pets.length + " pets in the db");

      // Load uploaded image into s3
      //----------------------------
      console.log(req.file);
      //console.log(req.header);
      if (req.file === undefined) {
         res.send('No file g\n' + req.header);
         return;
      }
      const body = fs.createReadStream( './'+req.file.path );//.pipe(zlib.createGzip());
      new aws.S3.ManagedUpload({
           params: {Bucket: 'searchpets', Key: req.file.filename, Body: body}
      }).send( (err, data) => {
         if (err)
            console.log("Error uploading image to S3\n" + err);

         // Detect labels of query image
         //-----------------------------
         params.Image.S3Object.Name = req.file.filename;
         rekognition.detectLabels(params, (err, data) => {
            if (err)
               console.log("Error with rekognition API" + err);

            const query_labels = data.Labels.map( x => x.Name );
            console.log(query_labels);

            // Create list of distance metrics and sort
            //-----------------------------
            var count = 0;
            const dist_list = pets.map( x => [compareDescriptors(query_labels, x.descriptors), count++] );
            dist_list.sort( (a,b) => {
               return b[0] - a[0];
            });

            var sorted_pets = [];
            for (var i = 0; i < 25; i++)
               sorted_pets.push( pets[ dist_list[i][1] ] );

            res.send( sorted_pets );
         });
      });

      // Detect labels of query image
      //-----------------------------
      params.Image.S3Object.Name = req.file.filename;
      rekognition.detectLabels(params, (err, data) => {
         console.log(err);
         console.log(data);
      });
   });
});

app.listen(3000, () => {
   console.log("listening on port 3000");
});
});
