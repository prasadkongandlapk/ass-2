const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "twitterClone.db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let db = null;

const ids = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running...");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
ids();

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const selectQuery = `select * from user where username='${username}'`;

  const dbUser = await db.get(selectQuery);

  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUser = `insert into user(username, password,name,gender) values('${username}','${hashedPassword}','${name}','${gender}') 
        `;
      const dbResponse = db.run(createUser);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const selectQuery = `select * from user where username='${username}'`;

  const dbUser = await db.get(selectQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const compare = await bcrypt.compare(password, dbUser.password);
    if (compare === true) {
      const payLoad = { username: username };
      const jwtToken = await jwt.sign(password, "abcd");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

const authToken = (request, response, next) => {
  let jwtToken;

  const authHeader = request.headers["authorization"];

  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }

  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    const verify = jwt.verify(jwtToken, "abcd", async (error, payLoad) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};
//1

app.get("/user/tweets/feed/", authToken, async (request, response) => {
  const selectQuery = `
    select user.username, tweet.tweet ,tweet.date_time as dateTime
     from 
        follower 
     inner join 
  user
     on 
     follower.following_user_id=user.user_id
    inner join 
    tweet 
    on 
    follower.following_user_id=tweet.user_id
     order by 
     tweet.date_time desc

     limit 4
    `;

  const dbResponse = await db.all(selectQuery);
  response.send(dbResponse);
});

//2
app.get("/user/following/", async (request, response) => {
  const selectQuery = `
    select 
    name
     from 
        follower inner join user on 
         follower.following_user_id=user.user_id
         group by name

    `;

  const dbResponse = await db.all(selectQuery);
  response.send(dbResponse);
});
//3
app.get("/user/followers/", async (request, response) => {
  const selectQuery = `
    select 
    name
     from 
     user
     inner join 
     follower
     on 
    user.user_id = follower.follower_user_id
    group by user.name
    `;

  const dbResponse = await db.all(selectQuery);
  response.send(dbResponse);
});

app.get("/tweets/:tweetId/", authToken, async (request, response) => {
  const { tweetId } = request.params;
  const selectQuery = `
    select tweet,likes,replies ,date_time as dateTime
     from 
     follower
     inner join tweet 
     on 
     follower.following_user_id=tweet.user_id
    inner join user 
    on 
    follower.following_user_id=user.user_id

    inner join user 
    on 
    follower.following_user_id=user.user_id
    inner join user 
    on 
    follower.following_user_id=user.user_id

    group by following_user_id

    `;

  const dbResponse = await db.all(selectQuery);
  response.send(dbResponse);
});

module.exports = app;
