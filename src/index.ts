import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import router from './router';
import authCheck from './middleware/authCheck';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const db = process.env.MONGO_URI as string;

app.use(bodyParser.json());
app.use(cookieParser());

app.get('/alive', (_req, res) => {
  res.send('I am alive');
});

app.use(router);
app.use(authCheck);

console.log('Connecting to DB ...');
mongoose
  .connect(db)
  .then(() => {
    console.log('DB Connected!');
    app.listen(port, function () {
      console.log('Started application on port %d', port);
    });
  })
  .catch((err) => console.log('DB connection error:', err));
