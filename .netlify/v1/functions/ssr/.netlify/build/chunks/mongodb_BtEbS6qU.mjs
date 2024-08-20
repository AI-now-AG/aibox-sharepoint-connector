import { MongoClient } from 'mongodb';

const options = {};
const mongo = new MongoClient("mongodb+srv://aibox-all:t5LSjDapa7ABiJ3M@aibox-serverless.xt61kgs.mongodb.net/?retryWrites=true&w=majority&appName=aibox-serverless", options);
const db = mongo.db("aibox");

export { db as d };
