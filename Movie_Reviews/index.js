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

// Save Username
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
    res.render('Register');
});

// Register Route & Insert User Database
app.post("/registerPost", async (req, res) => {
    const data = req.body;
    try {
        await axios.post(`${base_url}/registerPost`, data);
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});

// Login Ejs
app.get('/login', (req, res) => {
    res.render('Login');
});

// Login Route & Check User Database
app.post("/loginPost", async (req, res) => {
    const data = {
        UserName: req.body.username,
        Password: req.body.password
    };

    try {
        const response = await axios.post(`${base_url}/loginPost`, data);
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

// Forgetpassword ejs
app.get("/forgetPassword", (req, res) => {
    res.render('forgetPassword');
});

// Update Password Users
app.post('/editPassword', async (req, res) => {
    const {
        email,
        newPassword,
        confirmPassword
    } = req.body;

    try {
        const response = await axios.post(`${base_url}/editPassword`, {
            email,
            newPassword,
            confirmPassword
        });

        if (response.data === 'Password updated successfully.') {
            const alertScript = "<script>alert('Update Password Successfully!'); window.location='/login';</script>";
            res.send(alertScript);
        } else {
            window.alert('Edit Password failed');
            res.redirect('/forgetPassword');
        }
    } catch (err) {
        if (err.response && err.response.status === 400) {
            const alertScript = "<script>alert('Password do not match.'); window.location='/forgetPassword';</script>";
            res.send(alertScript);
        } else {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        }
    }
});

// Logout Username Session
app.get('/logout', async (req, res) => {
    try {
        await axios.post(`${base_url}/logout`);
        req.session.destroy();
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});

// Movies Route
app.get('/movies', async (req, res) => {
    try {
        const response = await axios.get(`${base_url}/movies`);
        const userName = req.session.user ? req.session.user.UserName : "";
        res.render('Movie', {
            ...response.data,
            userName
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Get Movies By GenresID
app.get('/getMoviesByGenre/:GenresID', async (req, res) => {
    try {
        const genresId = req.params.GenresID;
        const response = await axios.get(`${base_url}/getMoviesByGenre/${genresId}`);
        const data = response.data;
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Get DetailMovie By MovieID
app.get('/detailMovie/:MovieID', async (req, res) => {
    try {
        const movieId = req.params.MovieID;
        const response = await axios.get(`${base_url}/detailMovie/${movieId}`);
        const userName = req.session.user ? req.session.user.UserName : "";
        res.render('DetailMovie', {
            ...response.data,
            userName
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Search Movie
app.get("/searchMovie", async (req, res) => {
    try {
        const searchTerm = req.query.searchTerm;
        if (!searchTerm) {
            res.status(400).send("Search term is required");
            return;
        }
        const response = await axios.get(`${base_url}/searchMovie?searchTerm=${searchTerm}`);
        if (response.data.movies && response.data.movies.length === 1) {
            const movieId = response.data.movies[0].MovieID;
            res.redirect(`/detailMovie/${movieId}`);
            return;
        }
        const userName = req.session.user ? req.session.user.UserName : "";
        res.render('SearchResult', {
            movies: response.data.movies,
            userName
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Reviews Route
app.get('/reviews', async (req, res) => {
    const userName = req.session.user ? req.session.user.UserName : "";
    if (!userName) {
        res.redirect("/login");
        return;
    }
    const movieId = req.query.movieId;
    res.render("ReviewMovie", { userName: userName, movieId: movieId });
});

app.post('/reviewsPost', async (req, res) => {
    try {
        const comment = req.body.comment;
        const userName = req.session.user ? req.session.user.UserName : "" ;
        const movieId = req.body.movieId;

        await axios.post(`${base_url}/reviewsPost`, {
            comment: comment,
            userName: userName,
            movieId: movieId
        });

        res.redirect(`/detailMovie/${movieId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }    
});

// Contact Route
app.get("/contact", (req, res) => {
    const userName = req.session.user ? req.session.user.UserName : "";
    res.render('Contact', {
        userName
    });
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:5500`);
})