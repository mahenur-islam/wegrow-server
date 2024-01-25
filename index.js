const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

// Middleware
const allowedOrigins = ['https://wegrow-client.vercel.app', 'https://wegrow-auth-client.web.app'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Check if the request origin is in the allowedOrigins array
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.neajhbt.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const userCollection = client.db("wegrow").collection("users");
    const productCollection = client.db("wegrow").collection("products");
    const customRequestCollection = client.db("wegrow").collection("customRequest")

    // users related APIs
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      const teamMemberCount = users.length;
      res.json({ users, teamMemberCount });
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      try {
        const { assetName, price, type, availability, imageUrl, userEmail, addedAt, quantity } = req.body;

        // Insert the product into the product collection
        const result = await productCollection.insertOne({
          assetName,
          price,
          type,
          quantity,
          availability,
          imageUrl,
          userEmail,
          addedAt
        });

        res.json({
          message: "Product added successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    //get all products 
    app.get("/products", async (req, res) => {
      const products = await productCollection.find().toArray();
      res.json(products);
    });
    app.get("/products/:id", async (req, res) => {
     const id = req.params.id;
     const query = { _id: new ObjectId(id)}
     const result = await productCollection.findOne(query);
     res.send(result);
    });



    //delete a product 
    app.delete("/products/:id", async (req, res) => {
      const productId = req.params.id;

      try {
        const query = { _id: new ObjectId(productId) };
        const result = await productCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res.json({ message: "Product deleted successfully" });
        } else {
          res.status(404).json({ message: "Product not found" });
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

       // PUT route for updating a product
       app.put("/products/:id", async (req, res) => {
        const productId = req.params.id;
        const updatedProduct = req.body;
  
        try {
          const query = { _id: new ObjectId(productId) };
          const result = await productCollection.updateOne(query, {
            $set: updatedProduct,
          });
  
          if (result.matchedCount === 1) {
            res.json({ message: "Product updated successfully" });
          } else {
            res.status(404).json({ message: "Product not found" });
          }
        } catch (error) {
          console.error("Error updating product:", error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      });

    //make a custom request 
    app.post('/custom-request', async (req, res) =>{
      const newCustomRequest = req.body;
      console.log(newCustomRequest);
      const result = await customRequestCollection.insertOne(newCustomRequest);
      res.send(result);
    })
    app.get("/custom-request", async (req, res) => {
      const products = await customRequestCollection.find().toArray();
      res.json(products);
    });

     //delete a custom request 
     app.delete("/custom-request/:id", async (req, res) => {
      const customRequestId = req.params.id;

      try {
        const query = { _id: new ObjectId(customRequestId) };
        const result = await customRequestCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res.json({ message: "Request deleted successfully" });
        } else {
          res.status(404).json({ message: "Request not found" });
        }
      } catch (error) {
        console.error("Error deleting Request:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });


    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensure the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`wegrow server is running on port ${port}`);
});
