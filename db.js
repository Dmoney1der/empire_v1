const mongoose = require('mongoose');
const { Schema } = mongoose;
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://dev:devmongo@customer.wrqefee.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);
// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });


//mongoose.connect('mongodb://localhost:3000/db', { useNewUrlParser: true, useUnifiedTopology: true });

// Define customer schema
const customerSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    enrolled: { type: Boolean, default: false },
    course_type: { type: String }
});


// Export the customer model
module.exports = Customer;

const passportLocalMongoose = require('passport-local-mongoose');
var User = new Schema({
    username: {
        type: String
    },
    password: {
        type: String
    }
})
User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User)