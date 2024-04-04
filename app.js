import express from "express";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.js";
import postRouter from "./routes/post.js";
import { config } from "dotenv";
import cors from "cors";
import { dbConnection } from "./data/dbConnection.js";

config({
    path: "./data/config.env"
});



// // database COnnectivity 
dbConnection();



// middleware
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(cors({
    origin: process.env.CROS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"]
}));

// App APIs

app.use("/api/v1/user", userRouter);
app.use("/api/v1/post", postRouter);



// App HOme Page
app.get("/", (req, res) => {
    res.send("working");
});


// Server 
app.listen(process.env.SERVER, () => {
    console.log("Server woriking ");
});