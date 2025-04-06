var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var admin = require("firebase-admin");
var app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Firebase Admin SDK
var serviceAccount = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://<your-database-name>.firebaseio.com"
});

var db = admin.firestore();

// Route to serve index.html
app.get("/", function(req, res){
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Route to serve login.html
app.get("/login", function(req, res){
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Route to serve signup.html
app.get("/signup", function(req, res){
    res.sendFile(path.join(__dirname, 'public/signup.html'));
});

// Handle login form submission
app.post("/login", function(req, res){
    var username = req.body.username;
    var password = req.body.password;

    // Check login details in Firestore
    db.collection("users").where("username", "==", username).get()
        .then(snapshot => {
            if (snapshot.empty) {
                res.send("Invalid username or password");
            } else {
                let userFound = false;
                snapshot.forEach(doc => {
                    if (doc.data().password === password) {
                        userFound = true;
                        res.send("Login successful");
                    }
                });
                if (!userFound) {
                    res.send("Invalid username or password");
                }
            }
        })
        .catch(err => {
            console.error("Error getting documents", err);
            res.status(500).send("Error logging in");
        });
});

// Handle signup form submission
app.post("/signup", function(req, res){
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;

    // Check if the username already exists
    db.collection("users").where("username", "==", username).get()
        .then(snapshot => {
            if (!snapshot.empty) {
                res.send("Username already exists");
            } else {
                // Save user details to Firestore
                db.collection("users").add({
                    username: username,
                    email: email,
                    password: password
                })
                .then(docRef => {
                    res.send("Signup successful");
                })
                .catch(err => {
                    console.error("Error adding document", err);
                    res.status(500).send("Error signing up");
                });
            }
        })
        .catch(err => {
            console.error("Error checking username", err);
            res.status(500).send("Error signing up");
        });
});

app.listen(3009, function(){
    console.log("Server is running on port 3009");
});