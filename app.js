const path = require('path');

const express = require('express');
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session);

const db = require('./data/database');
const demoRoutes = require('./routes/demo');

const app = express();

const sessionStore = new mongoDbStore({
  uri: 'mongodb://127.0.0.1:27017/auth-demo',
  collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'super-secret-key-ngl',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { // We configure the cookie, in this particular example we set a maximum time until deletion
    maxAge: 60 * 1000 // A thousand miliseconds times 60 AKA 1 minute
  }
}));

app.use(demoRoutes);

app.use(function(error, req, res, next) {
  res.render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000);
});
