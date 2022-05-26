const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)


const app = express();
const port = process.env.PORT || 5000;


//middleware


const corsConfig = {
    origin: true,
    credentials: true
}
app.use(cors(corsConfig))
app.options('*', cors(corsConfig))

app.use(express.json())

// console.log(process.env)
// database

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@focustools0.q3lyf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




// function verifyJWT


function verifyJWT(req, res, next) {

    const authentication = req.headers.authentication;

    const token = authentication.split(' ')[1]

    // if (!token) {

    //     return res.status(401).send('Unauthorized')


    // }


    jwt.verify(token, process.env.secretKey, function (err, decoded) {

        if (err) {

            return res.status(403).send('Forbidden')
        }

        req.decoded = decoded

        console.log(decoded)

        next()

    });


}



async function run() {
    try {


        await client.connect()

        const itemCollection = client.db("FocusTools").collection("items");
        const orderCollection = client.db("FocusTools").collection("orders");
        const reviewCollection = client.db("FocusTools").collection("reviews");
        const userCollection = client.db("FocusTools").collection("users");





        // make new user and asign token

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;

            console.log(user)

            const filter = { userEmail: email };

            const options = { upsert: true };

            const updateDoc = {

                $set: user,

            };
            const result = await userCollection.updateOne(filter, updateDoc, options)

            const token = jwt.sign(user, process.env.secretKey, { expiresIn: '1d' });



            res.send({ result, token })




        })


        // get all user 


        app.get('/users', verifyJWT, async (req, res) => {
            const result = await userCollection.find().sort({ _id: -1 }).toArray();
            res.send(result)

        })


        //make admin 


        app.post('/makeAdmin/:email', verifyJWT, async (req, res) => {

            const email = req.params.email;

            const query = { userEmail: email }

            const updateDoc = {
                $set: {

                    role: 'admin'


                }
            }
            const result = await userCollection.updateOne(query, updateDoc);
            res.send(result)


        })

        // make user
        app.post('/makeUser/:email', verifyJWT, async (req, res) => {

            const email = req.params.email;

            const query = { userEmail: email }

            const updateDoc = {
                $set: {

                    role: 'user'


                }
            }
            const result = await userCollection.updateOne(query, updateDoc);
            res.send(result)


        })


        //get all item 
        app.get('/items', async (req, res) => {

            const result = await itemCollection.find().sort({ _id: -1 }).toArray()
            res.send(result)
        })



        // get singel item by id  

        app.get('/item/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;

            console.log(id)

            const query = { _id: ObjectId(id) }

            const result = await itemCollection.findOne(query)
            res.send(result)
        })

        // delete item (admin)
        app.post('/delete/item/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await itemCollection.deleteOne(query);
            res.send(result);

        })


        // get singel order by id

        app.get('/order/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;

            console.log(id)

            const query = { _id: ObjectId(id) }

            const result = await orderCollection.findOne(query)
            res.send(result)
        })

        // get all orders
        app.get('/orders', verifyJWT, async (req, res) => {
            const result = await orderCollection.find().sort({ _id: -1 }).toArray()
            res.send(result)

        })

        // get orders by id (admin)

        app.post('/order/update/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: "shipped"
                }
            }
            const result = await orderCollection.updateOne(query, updateDoc);

            res.send(result)
        })


        app.post('/order/delete/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);

            res.send(result)
        })


        //insert item api


        app.put('/additem', verifyJWT, async (req, res) => {

            const item = req.body;
            console.log(item)
            const result = await itemCollection.insertOne(item)
            res.send(result)


        })


        // place order api


        app.post('/order', verifyJWT, async (req, res) => {
            const order = req.body;

            const result = await orderCollection.insertOne(order)
            res.send(result)
        })


        app.post('/placeorder/:id', async (req, res) => {

            const id = req.params.id;
            const transactionId = req.body.transactionId
            console.log(transactionId)


            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };

            // const fillter = { itemId: id }

            const updateDoc = {
                $set: {
                    status: "paid",
                    transactionId


                },
            };


            const result = await orderCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })



        // get orders by email;

        app.get('/orders/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email }
            const result = await orderCollection.find(query).sort({ _id: -1 }).toArray()
            res.send(result)
        })


        // delete order (user)

        app.post('/order/delete/:id', verifyJWT, async (req, res) => {


            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query);
            res.send(result)



        })


        // add or update review 

        app.post('/updateReview/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const review = req.body;

            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = { $set: review };
            const result = await reviewCollection.updateOne(filter, updateDoc, options);
            res.send(result);


        })

        // get my review by email

        app.get('/myreview/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await reviewCollection.findOne(query);
            res.send(result)
        })






        // payment 

        app.post('/create-payment-intent', verifyJWT, async (req, res) => {

            const item = req.body;


            const price = item.price;
            // const amount = price * 100;
            const amount = parseInt(price) * 100;


            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card'],
            });

            res.send({ clientSecret: paymentIntent.client_secret })


        })



        //get my profile data 


        app.get('/myprofile/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const result = await userCollection.findOne({ userEmail: email })
            console.log(result)
            res.send(result)
        })

        // update profile

        app.post('/update/myprofile/:email', verifyJWT, async (req, res) => {

            const email = req.params.email;
            const userInfo = req.body;

            console.log(userInfo)

            const updateDoc = {
                $set: {
                    userName: userInfo?.userName,
                    location: userInfo?.location,
                    linkendIn: userInfo?.linkendIn,
                    education: userInfo?.education,
                },
            };

            const result = await userCollection.updateOne({ userEmail: email }, updateDoc)


            console.log(result)
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