const express = require("express");

const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  let sessionInputData = req.session.inputData;
  if(!sessionInputData) {
    sessionInputData = {
      hasError: false,
      message: '',
      email: '',
      confirmedEmail: '',
      password: ''
    };
  };

  // We delete the session's input data so that the wrong user/password does not persist
  req.session.inputData = null;

  res.render("signup", {inputData: sessionInputData});
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredConfirmEmail = userData["confirm-email"]; // Using this notation enables using dashes for the name of the field
  const enteredPassword = userData.password;

  if (
    !enteredEmail ||
    !enteredConfirmEmail ||
    !enteredPassword ||
    enteredPassword.trim() < 6 ||
    enteredEmail !== enteredConfirmEmail ||
    !enteredEmail.includes("@")
  ) {
    req.session.inputData = {
      hasError: true,
      message: 'Invalid input - please check your data',
      email: enteredEmail,
      confirmedEmail: enteredConfirmEmail,
      password: enteredPassword
    };

    req.session.save(function() {
      res.redirect('/signup');
    });
    return;
  }

  const existingUser = await db.getDb().collection('users').findOne({email: enteredEmail});
  if(existingUser) {
    console.log('User exists already');
    return res.redirect('/signup');
  }

  const hashedPassword = await bcrypt.hash(enteredPassword, 12);

  const user = {
    email: enteredEmail,
    password: hashedPassword,
  };

  await db.getDb().collection("users").insertOne(user);

  res.redirect("/login");
});

router.post("/login", async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredPassword = userData.password;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail });

  if (!existingUser) {
    return res.redirect("/login");
  }

  const passwordsAreEqual = await bcrypt.compare(
    enteredPassword,
    existingUser.password
  );

  if (!passwordsAreEqual) {
    return res.redirect("/login");
  }

  req.session.user = {id: existingUser._id, email: existingUser.email};
  // Save function forces user session data into the database, then executes the code within.
  // Useful since the user won't be able to access '/admin' if it's not authenticated.
  req.session.save(function() {
    res.redirect("/admin");
  });

});

router.get("/admin", function (req, res) {
  // We have to check the user's "ticket"
  if(!req.session.user) {
    return res.status(401).render('401');
  }
  res.render("admin");
});

router.post("/logout", function (req, res) {
  req.session.user = null;
  res.redirect('/');
});

module.exports = router;
