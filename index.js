const express  = require('express');
const mongoose = require('mongoose');
const multer   = require('multer')
const aws      = require('aws-sdk');
const fs       = require('fs')
const zlib     = require('zlib');

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
const connection = mongoose.connect('mongodb://localhost/pets', { useMongoClient: true, promiseLibrary: global.Promise }, err => {
      if (err)
         console.log(err);
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


// Pet Schema
const PetSchema = mongoose.Schema({
   url: String,
   img_url: String,
   descriptors: [String],
});
// Pet Model
var PetModel = connection.model('labels', PetSchema);

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
   for (var i = 0; i < query.length(); i++)
      count += sample.includes( query[i] ) ? 1 : 0;

   return count;
}

/**************************
 *     START SERVER      *
**************************/

app.post('/search', upload.single('pet'), (req, res, next) => {

   // Pull pet database to list
   var pets = PetModel.find( (err, res) => {
      console.log(res);
      console.log(res.length() + " pets in the db");

      // Load uploaded image into s3
      //----------------------------
      const body = fs.createReadStream( './'+req.file.path );//.pipe(zlib.createGzip());
      var upl = new aws.S3.ManagedUpload({
           params: {Bucket: 'searchpets', Key: req.file.filename, Body: body}
      }).send( (err, data) => {
         if (err)
            console.log(err);

         // Detect labels of query image
         //-----------------------------
         params.Image.S3Object.Name = req.file.filename;
         rekognition.detectLabels(params, (err, data) => {
            if (err)
               console.log(err);

            const query_labels = data.Labels.map( x => x.Name );
            console.log(query_labels);
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

   res.send({});
});

app.listen(3000, () => {
   console.log("listening on port 3000");
});
