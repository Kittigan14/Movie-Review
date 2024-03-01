const express = require("express");
var bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const axios = require("axios");
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5500;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public", "views"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.use(
    session({
        secret: "your-secret-key",
        resave: true,
        saveUninitialized: true,
    })
);

const base_url = "http://localhost:3000";

// Home Routes
app.get("/", (req, res) => {
    const userName = req.session.user ? req.session.user.UserName : "";
    res.render('index', {
        userName
    });
});

// Register Routes
app.get('/register', async (req, res) => {
    res.render('Register.ejs');
});

app.post("/registerPost", async (req, res) => {
    const data = req.body;
    try {
        await axios.post(base_url + '/registerPost', data);
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});

app.get('/login', (req, res) => {
    res.render('Login.ejs');
});

app.post("/loginPost", async (req, res) => {
    const data = {
        UserName: req.body.username,
        Password: req.body.password
    };

    try {
        const response = await axios.post(base_url + '/loginPost', data);
        console.log(response.data);

        if (response.data === 'Login successfully') {
            req.session.user = {
                UserName: data.UserName
            };
            res.redirect('/');
        } else {
            window.alert('Login failed: incorrect username or password');
            res.redirect('/login');
        }
    } catch (err) {
        if (err.response && err.response.status === 401) {
            const alertScript = "<script>alert('Login failed username or email.'); window.location='/login';</script>";
            res.send(alertScript);
        } else {
            console.error(err);
            res.status(500).send('Error');
        }
    }
});

app.get("/forgetPassword", (req, res) => {
    res.render('forgetPassword');
});

// app.post('/editPassword', (req, res) => {
//     const data = { Password: req.body.Password };
// })

app.get('/logout', async (req, res) => {
    try {
        await axios.post(base_url + '/logout');
        req.session.destroy();
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});

app.get("/contact", (req, res) => {
    const userName = req.session.user ? req.session.user.UserName : "";
    res.render('Contact', {
        userName
    });
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:5500`);
})