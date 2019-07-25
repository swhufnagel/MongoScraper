$(document).ready(function () {

    var articleContainer = $(".article-container");
    $(document).on("click", ".clear", handleArticleClear);
    $(document).on("click", ".delete", deleteSingle);

    function initPage() {
        // Run an AJAX request for any unsaved headlines
        $.get("/articles/saved").then(function (data) {
            console.log("saved ", data);
            articleContainer.empty();
            // If we have headlines, render them to the page
            if (data && data.length) {
                renderArticles(data);
            } else {
                // Otherwise render a message explaining we have no articles
                renderEmpty();
            }
        });
    }
    initPage();
    var articleCards = [];
    function renderArticles(articles) {
        // This function handles appending HTML containing our article data to the page
        // We are passed an array of JSON containing all available articles in our database
        // We pass each article JSON object to the createCard function which returns a bootstrap
        // card with our article data inside

        // var existing = articleCards.includes(articles[i].title);
        for (var i = 0; i < articles.length; i++) {
            console.log("this card ", articles[i]);
            articleCards.push(createCard(articles[i]));
        }
        // Once we have all of the HTML for the articles stored in our articleCards array,
        // append them to the articleCards container
        articleContainer.append(articleCards);
    }

    function createCard(article) {
        // This function takes in a single JSON object for an article/headline
        // It constructs a jQuery element containing all of the formatted HTML for the
        // article card
        var card = $("<div class='card'>");
        var cardImg = $("<img class='cardImg'>").attr("src", article.img);
        var cardHeader = $("<div class='card-header'>").append(
            $("<h3>").append(
                $("<a class='article-link' target='_blank' rel='noopener noreferrer'>")
                    .attr("href", article.link)
                    .text(article.title),
                $("<a class='btn btn-danger delete'>X</a>")
            )
        );
        card.append(cardImg, cardHeader);
        // We attach the article's id to the jQuery element
        // We will use this when trying to figure out which article the user wants to save
        card.data("_id", article._id);
        // We return the constructed card jQuery element
        return card;
    }

    function renderEmpty() {
        // This function renders some HTML to the page explaining we don't have any articles to view
        // Using a joined array of HTML string data because it's easier to read/change than a concatenated string
        var emptyAlert = $(
            [
                "<div class='alert alert-warning text-center'>",
                "<h4>Uh Oh. Looks like we don't have any saved articles.</h4>",
                "</div>",
                "<div class='card'>",
                "<div class='card-header text-center'>",
                "<h3>What Would You Like To Do?</h3>",
                "</div>",
                "<div class='card-body text-center'>",
                "<h4><a href='/'>Go to Home</a></h4>",
                "</div>",
                "</div>"
            ].join("")
        );
        // Appending this data to the page
        articleContainer.append(emptyAlert);
    }
    function handleArticleClear() {

        $.ajax({
            method: "PUT",
            url: "/saved/"
        }).then(function (data) {
            // If the data was saved successfully

            console.log("article clearing", data);
            // Run the initPage function again. This will reload the entire list of articles
            initPage();

        });
    }
    function deleteSingle() {
        var articleToDelete = $(this)
            .parents(".card")
            .data();

        // Remove card from page
        $(this)
            .parents(".card")
            .remove();
        console.log('deleting this article', articleToDelete);
        // Using a patch method to be semantic since this is an update to an existing record in our collection
        $.ajax({
            method: "PUT",
            url: "/article/" + articleToDelete._id,
            data: articleToDelete
        }).then(function (data) {
            // If the data was saved successfully
            if (data.deleted) {
                initPage();
            }
            // Run the initPage function again. This will reload the entire list of articles
        });
    }
});