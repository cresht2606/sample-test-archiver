require('dotenv').config({ path: '../.env' });

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const session = require('express-session');

const testsRouter = require('./routes/tests');
const changelogRouter = require('./routes/changelog');
const subjectsRouter = require('./routes/subjects');
const feedbackRoutes = require("./routes/feedback");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

// Add session middleware
app.use(session({
    name: "sample-test-archiver.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax"
    }
}));

// serve the entire client folder statically
app.use(express.static(path.join(__dirname, '../client')));

// serve index.html at "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// API routes
app.use('/api/subjects', subjectsRouter);
app.use('/api/tests', testsRouter);
app.use('/api/changelog', changelogRouter);
app.use("/api/feedback", feedbackRoutes);

// 404 fallback
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../client/404.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
