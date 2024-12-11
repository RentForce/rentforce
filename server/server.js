const express = require("express");
const cors = require("cors");
const app = express();
const userroute=require('./routes/user')



app.use(cors());
app.use(express.json());

const PORT = 5000;
app.use("/user" , userroute)






app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
