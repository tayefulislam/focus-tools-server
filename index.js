const express = require("express");
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const { async } = require("@firebase/util");

const app = express();
const port = process.env.PORT || 5000;


//middleware

app.use(cors())
app.use(express.json())

// console.log(process.env)
// database

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@focustools0.q3lyf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });

async function run() {
    try {


        await client.connect()

        const itemCollection = client.db("FocusTools").collection("items");




        //insert item api


        app.put('/additem', async (req, res) => {

            const item = req.body;
            console.log(item)
            const result = await itemCollection.insertOne(item)
            res.send(result)


        })




    }

    finally {


    }
}

run().catch(console.dir)





//check api
app.get('/api', (req, res) => {
    res.send('Server api')
})

app.get('/', (req, res) => {
    res.send('Server is running')
})


app.listen(port, () => {
    console.log('server is running ar port number', port)
})