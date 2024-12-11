const express = require("express");
const cors = require("cors");
require('dotenv').config();
const postsRouter = require("./routes/posts");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/posts", postsRouter);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
