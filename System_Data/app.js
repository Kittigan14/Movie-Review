const express = require("express");
const session = require("express-session");
const sqlite = require("sqlite3").verbose();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(cors());

// Storage Username
app.use(
    session({
        secret: "your-secret-key",
        resave: true,
        saveUninitialized: true,
    })
);

// Connection Database
const db = new sqlite.Database("Movies_System.sqlite");

// Create Table Database
db.run(`CREATE TABLE IF NOT EXISTS Genres (
    GenresID INTEGER PRIMARY KEY AUTOINCREMENT,
    GenreName TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserName TEXT,
    Email TEXT UNIQUE,
    Password TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS Movies (
    MovieID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT,		
    Duration INTERVAL,		
    Release DATE,			
    GenresID INTEGER,
    Image IMAGE NOT NULL,
    Synopsis TEXT,
    FOREIGN KEY (GenresID) REFERENCES Genres(GenresID)
)`);

db.run(`CREATE TABLE IF NOT EXISTS Reviews (
    ReviewsID INTEGER PRIMARY KEY AUTOINCREMENT,
    Comment TEXT,			
    UserName TEXT,
    MovieID INTEGER,
    FOREIGN KEY (MovieID) REFERENCES Movies(MovieID)
)`);

// Register Route
app.post("/registerPost", (req, res) => {
    const data = req.body;
    const sqlCheck = "SELECT * FROM Users WHERE UserName = ? OR Email = ?";
    const sqlInsert = "INSERT INTO Users (UserName, Email, Password) VALUES (?, ?, ?)";

    try {
        db.get(sqlCheck, [data.username, data.email], (err, row) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Internal Server Error");
            }

            if (row) {
                return res.status(400).send("UserName or Email is already connected.");
            }

            db.run(sqlInsert, [data.username, data.email, data.password], function (err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send("Internal Server Error");
                }

                const lastInsertId = this.lastID;
                console.log(`Insert User RowID ${lastInsertId}`);
                console.log(`The corresponding UserID is ${lastInsertId}`);

            });
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Internal Server Error");
    }
});

// Login Route
app.get('/login', (req, res) => {
    res.send('This is the login page.');
});

// Check Login User Route
app.post("/loginPost", (req, res) => {
    const data = req.body;
    const sqlSearch = "SELECT * FROM Users WHERE UserName = ? AND Password = ?";

    db.get(sqlSearch, [data.UserName, data.Password], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Internal Server Error");
        }

        if (row) {
            req.session.user = {
                UserName: data.UserName
            };
            console.log(`Login successful for user: ${data.UserName}`);
            res.send("Login successfully");
        } else {
            res.status(401).send("Login failed: incorrect username or password");
        }
    });
});

// Logout Route
app.post("/logout", (req, res) => {
    req.session.destroy();
    res.send('Logout Success!');
});

// ForgetPassword Route
app.get("/forgetPassword", (req, res) => {
    res.send('This is the login page.');
});

// Update Password Route
app.post('/editPassword', (req, res) => {
    const {
        email,
        newPassword,
        confirmPassword
    } = req.body;

    db.get("SELECT * FROM Users WHERE Email = ?", [email], (err, user) => {
        if (err) {
            console.error(err.message);
            res.status(500).send("Internal Server Error");
            return;
        }

        if (!user) {
            res.status(404).send("User not found");
            return;
        }

        if (newPassword !== confirmPassword) {
            res.status(400).send("Passwords do not match");
            return;
        }

        db.run("UPDATE Users SET Password = ? WHERE Email = ?", [newPassword, email], (err) => {
            if (err) {
                console.error(err.message);
                res.status(500).send("Internal Server Error");
                return;
            }
            res.send('Password updated successfully.');
        });
    });
});

// Movie Route
app.get('/movies', (req, res) => {
    try {
        db.all("SELECT GenresID, GenreName FROM Genres", (errGenres, genres) => {
            if (errGenres) {
                console.error(errGenres.message);
                res.status(500).send("Internal Server Error");
                return;
            }

            db.all("SELECT * FROM Movies", (errMovies, movies) => {
                if (errMovies) {
                    console.error(errMovies.message);
                    res.status(500).send("Internal Server Error");
                    return;
                }

                res.send({
                    userName: req.session.UserName,
                    movies: movies,
                    genres: genres
                });
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});

app.get("/getMoviesByGenre/:GenresID", async (req, res) => {
    try {
        const genreId = req.params.GenresID;

        const sql = `
            SELECT Movies.*, Genres.GenreName AS GenresTitle
            FROM Movies
            LEFT JOIN Genres ON Movies.GenresID = Genres.GenresID
            WHERE Movies.GenresID = ?;
        `;
        const movies = await new Promise((resolve, reject) => {
            db.all(sql, [genreId], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });

        res.json(movies);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Detail Movie
app.get("/detailMovie/:MovieID", (req, res) => {
    try {
        const movieId = req.params.MovieID;

        if (isNaN(movieId)) {
            res.status(400).send("Invalid movie ID");
            return;
        }

        const sql = `
            SELECT Movies.*, Genres.GenreName AS GenresTitle
            FROM Movies
            LEFT JOIN Genres ON Movies.GenresID = Genres.GenresID
            WHERE Movies.MovieID = ?
        `;

        db.get(sql, [movieId], (err, movie) => {
            if (err) {
                console.error(err.message);
                res.status(500).send("Internal Server Error");
                return;
            }

            if (!movie) {
                res.status(404).send("Movie not found");
                return;
            }

            res.send({
                userName: req.session.user ? req.session.user.UserName : "",
                movie
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Search Movie
app.get("/searchMovie", (req, res) => {
    const searchTerm = req.query.searchTerm;
    if (!searchTerm) {
        res.status(400).send("Search term is required");
        return;
    }
    const sql = `
        SELECT Movies.*, Genres.GenreName AS GenresTitle
        FROM Movies
        LEFT JOIN Genres ON Movies.GenresID = Genres.GenresID
        WHERE Movies.Title LIKE ?;
    `;
    const searchPattern = `%${searchTerm}%`;
    db.all(sql, [searchPattern], (err, movies) => {
        if (err) {
            console.error(err.message);
            res.status(500).send("Internal Server Error");
            return;
        }
        res.send({
            userName: req.session.user ? req.session.user.UserName : "",
            movies: movies,
        });
    });
});

// Reviews Movie Route
app.post('/reviewsPost', (req, res) => {
    try {
        const comment = req.body.comment;
        const movieId = req.body.movieId;
        const userName = req.body.userName;

        const sql = `
            INSERT INTO Reviews (Comment, UserName, MovieID)
            VALUES (?, ?, ?)
        `;
        db.run(sql, [comment, userName, movieId]);

        console.log("Review posted successfully");
        res.send("Review posted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

app.get('/reviews', (req, res) => {
    res.send("Displaying reviews");
});

// Run Servers PORT 3000
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});