const dotenv = require('dotenv');
const express = require('express');
const mongodb = require('mongodb');
const {getPutBodyIsAllowed} = require('./util');
dotenv.config();
const app = express();
app.use(express.json());
const port = process.env.PORT || 3000
const uri = process.env.DATABASE_URI

app.post('/api/books', function(request, response) {
  const client = mongodb.MongoClient(uri);
  client.connect(() => {
    const db= client.db("literature");
    const collection = db.collection("books");
    const title = request.query.title;
    const author = request.query.author;
    const author_birth_year =Number(request.query.author_birth_year);
    const author_death_year =Number(request.query.author_death_year);
    const url = request.query.url;
    const book = {
      title : title,
      author:author,
      author_birth_year:author_birth_year,
      author_death_year:author_death_year,
      url: url
    }
    if(title && author && author_birth_year && author_death_year && url){
    collection.insertOne(book,(error,result) => {
      if(error){
        response.status(500).send(error);
      }
      else{
        response.send(result.ops[0])
      }
    })
    client.close();
  }
  else{
    response.send("please fill out all of the requested fields")
  }
  })
})

app.delete('/api/books/:id', function(request,response) {
  const client = new mongodb.MongoClient(uri,{useNewUrlParser:true});
  client.connect(() => {
    const db= client.db("literature");
    const collection = db.collection("books");
    let id = undefined;
    const newID = request.params.id;
    if(mongodb.ObjectID.isValid(newID)){
      id = new mongodb.ObjectID(newID);
      collection.deleteOne({_id:id},(error,result) => {
        if(error){
          response.send("Not Found this data");
          client.close();
        }
        else if((result.ops[0]._id !== (id))){
          response.send("Do not Have it");
          client.close();
        }
        else{
          response.send("Deleted");
          client.close();
        }
      })
    }
    else{
      return response.status(400).send("This ID is not valid")
    }
    })
  })


app.put('/api/books/:id', function(request, response) {
  const client = new mongodb.MongoClient(uri);
  client.connect(() => {
    const db= client.db("literature");
    const collection = db.collection("books");
    const {id} = request.params;
    const title = request.body.title;
    const year = request.body.year;
    const actors = request.body.actors;
    let newId;
    if(mongodb.ObjectID.isValid(id)){
      newId = new mongodb.ObjectID(id);
      const searchObject = {
       _id : newId
      };
      const updateObject = {
        $set: {
          title: title,
          year:year,
          actors:actors
        },
      };
      const options = { returnOriginal: false };
      if(title && year && actors && newId){
      collection.findOneAndUpdate(searchObject,updateObject,options,(error,result) => {
        if(error){
          response.send(error);
          client.close();
        }
        else{
          response.send(result.value);
          client.close();
        }
      })
     }
     else{
      response.send("Sorry something went wrong! please check your updating data");
      client.close();
     }
    }
    else{
      response.status(400).send("Sorry something went wrong!");
      client.close();
    }
  })
})

app.get('/api/books', function(request, response) {
  const client = new mongodb.MongoClient(uri)

  client.connect(function() {
    const db = client.db('literature')
    const collection = db.collection('books')

    const searchObject = {}

    if (request.query.title) {
      searchObject.title = request.query.title
    }

    if (request.query.author) {
      searchObject.author = request.query.author
    }

    collection.find(searchObject).toArray(function(error, books) {
      response.send(error || books)
      client.close()
    })
  })
})

app.get('/api/books/:id', function(request, response) {
  const client = new mongodb.MongoClient(uri)

  let id
  try {
    id = new mongodb.ObjectID(request.params.id)
  } catch (error) {
    response.sendStatus(400)
    return
  }

  client.connect(function() {
    const db = client.db('literature')
    const collection = db.collection('books')

    const searchObject = { _id: id }

    collection.findOne(searchObject, function(error, book) {
      if (!book) {
        response.sendStatus(404)
      } else {
        response.send(error || book)
      }

      client.close()
    })
  })
})

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html')
})

app.get('/books/new', function(request, response) {
  response.sendFile(__dirname + '/new-book.html')
})

app.get('/books/:id', function(request, response) {
  response.sendFile(__dirname + '/book.html')
})

app.get('/books/:id/edit', function(request, response) {
  response.sendFile(__dirname + '/edit-book.html')
})

app.get('/authors/:name', function(request, response) {
  response.sendFile(__dirname + '/author.html')
})

app.listen(port || 3000, function() {
  console.log(`Running at \`http://localhost:${port}\`...`)
})
