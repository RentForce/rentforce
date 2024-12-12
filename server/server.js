const express = require("express");
const cors = require("cors");
require("dotenv").config();
const postsRouter = require("./routes/posts");
const userroute = require("./routes/user");

const app = express();

// Configure CORS
app.use(
  cors({
    origin: "*", // Be more specific in production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/posts", postsRouter);
app.use("/user", userroute);

const PORT = 3000; // Make sure this matches your client's port

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
