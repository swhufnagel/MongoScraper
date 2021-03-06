var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var favicon = require("serve-favicon");
var path = require("path");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main"
    })
);
app.set("view engine", "handlebars");
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoArticle";

mongoose.connect(MONGODB_URI);

app.get("/", function (req, res) {
    db.Article.find({})
        .then(function (data) {
            res.render("index", { articles: data })
        })
        .catch(function (err) {
            res.render("index")
        })
});

app.get("/scrape", function (req, res) {
    var imgs = [];
    // First, we grab the body of the html with axios
    axios.get("https://www.sbnation.com/nfl-news").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        $(".c-dynamic-image").each(function (j, element) {

            imgs.push($(this).attr("src"));
        })
        // Now, we grab every h2 within an article tag, and do the following:
        $(".c-entry-box--compact__body h2").each(function (i, element) {
            // Save an empty result object
            var result = {};
            // console.log('imgs ', imgs);
            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");
            result.img = imgs[i];
            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    // console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        });

        // Send a message to the client
        res.send("scrape complete");
    });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({ saved: false })
        // { runValidators: true, context: 'query' }
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});
app.get("/articles/saved", function (req, res) {
    db.Article.find({ saved: true })
        .then(function (saved) {
            res.json(saved);

        })
        .catch(function (err) {
            res.json(err);

        })
})
// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .then(function (dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    console.log("note ", req.body);
    db.Note.create(req.body)
        .then(function (dbNote) {
            console.log("dbNote: ", dbNote);
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.get("/saved", function (req, res) {
    db.Article.find({ saved: true }).then(function (articles) {

        res.render("saved")
    })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.put("/articles/saved/clear", function (req, res) {
    db.Article.deleteMany({ saved: true }, function (data) {
        console.log("deleting ", data);
    });

})
app.put("/articles/clear", function (req, res) {
    db.Article.deleteMany({ saved: false }, function (data) {
        console.log("deleting ", data);
    });

})

app.put("/articles/:id", function (req, res) {
    console.log("Updating article")
    db.Article.findByIdAndUpdate({ _id: req.body._id }, { saved: req.body.saved })
        .then(function (data) {
            console.log(data)
            res.render("index")
        })
        .catch(function (err) {
            console.log(err)
            res.json(err)
        })
})
app.put("/article/:id", function (req, res) {
    console.log("Deleting article")
    db.Article.findByIdAndDelete(req.body._id, { saved: req.body.saved })
        .then(function (data) {
            console.log(data)
            res.render("index")
        })
        .catch(function (err) {
            console.log(err)
            res.json(err)
        })
})
// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
