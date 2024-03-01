const express = require("express");
const session = require("express-session");
const sqlite = require("sqlite3").verbose();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(
    session({
        secret: "your-secret-key",
        resave: true,
        saveUninitialized: true,
    })
);

// Connection Database
const db = new sqlite.Database("Movie_System.sqlite");

db.run(`CREATE TABLE IF NOT EXISTS Genres (
    GenresID INTEGER PRIMARY KEY AUTOINCREMENT,
    GenreName TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS Users (
    UsersID INTEGER PRIMARY KEY AUTOINCREMENT,
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
    UsersID INTEGER,
    MovieID INTEGER,
    FOREIGN KEY (UsersID) REFERENCES Users(UsersID),
    FOREIGN KEY (MovieID) REFERENCES Movies(MovieID)
)`);

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
                console.log(`A row has been inserted with rowid ${lastInsertId}`);
                console.log(`The corresponding userid is ${lastInsertId}`);

                res.redirect("/login?username=" + data.username);
            });
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Internal Server Error");
    }
});

app.get('/login', (req, res) => {
    res.send('This is the login page.');
});

app.post("/loginPost", (req, res) => {
    const data = req.body;
    const sqlSearch = "SELECT * FROM Users WHERE UserName = ? AND Password = ?";

    db.get(sqlSearch, [data.UserName, data.Password], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Internal Server Error");
        }

        if (row) {
            // Store user data in session
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

app.post("/logout", (req, res) => {
    req.session.destroy();
    res.send('Logout Success!');
});

app.get("/forgetPassword", (req, res) => {
    res.send('This is the login page.');
});

app.post('/editPassword', (req, res) => {
    const {
        email,
        newPassword,
        confirmPassword
    } = req.body;

    // Check if email already exists
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

        // Update Password for Table Users Where email
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

// Run Servers PORT 3000
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});