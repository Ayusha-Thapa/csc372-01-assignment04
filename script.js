/*
Name: Ayusha Thapa
Course: CSC 372-01
Assignment: Assignment 4 - TV Show Search
*/

// Find the page elements
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const searchButton = document.querySelector("button[type='submit']");
const gallery = document.querySelector("#show-gallery");
const message = document.querySelector("#message");

// Search when the form is submitted
searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!searchButton.disabled) {
        searchShows(searchInput.value);
    }
});

// Fetch JSON after checking the response status
async function fetchData(url) {
    const response = await fetch(url);

    if (response.status === 429) {
        throw new Error("Too many requests. Please wait before trying again.");
    }

    if (!response.ok) {
        throw new Error("Unable to load data. Please try again later.");
    }

    return await response.json();
}

// Add text to a show card
function addParagraph(card, text) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    card.append(paragraph);
}

// Remove HTML tags and keep the summary short
function cleanSummary(summary) {
    if (!summary) {
        return "Summary not available.";
    }

    let text = "";
    let insideTag = false;

    for (let i = 0; i < summary.length; i++) {
        if (summary[i] === "<") {
            insideTag = true;
        } else if (summary[i] === ">") {
            insideTag = false;
            text += " ";
        } else if (!insideTag) {
            text += summary[i];
        }
    }

    text = text.trim();

    if (text === "") {
        return "Summary not available.";
    }

    if (text.length > 250) {
        return text.slice(0, 247).trim() + "...";
    }

    return text;
}

// Create a card and load its cast with a second request
async function createShowCard(show) {
    const card = document.createElement("article");
    card.className = "show-card";

    const title = document.createElement("h3");
    title.textContent = show.name || "Title not available";
    card.append(title);

    // Display a poster when one is available
    if (show.image && show.image.medium) {
        const poster = document.createElement("img");
        poster.alt = "Poster for " + (show.name || "this show");

        poster.addEventListener("error", function () {
            const fallback = document.createElement("p");
            fallback.textContent = "Poster not available.";
            poster.replaceWith(fallback);
        });

        poster.src = show.image.medium;
        card.append(poster);
    } else {
        addParagraph(card, "Poster not available.");
    }

    addParagraph(card, cleanSummary(show.summary));
    addParagraph(card, "Premiered: " + (show.premiered || "Not available"));

    let updated = "Not available";

    if (typeof show.updated === "number") {
        updated = new Date(show.updated * 1000).toLocaleString();
    }

    addParagraph(card, "Record updated: " + updated);

    let genres = "Not available";

    if (show.genres && show.genres.length > 0) {
        genres = show.genres.join(", ");
    }

    addParagraph(card, "Genres: " + genres);

    let rating = "Not available";

    if (show.rating && show.rating.average != null) {
        rating = show.rating.average + "/10";
    }

    addParagraph(card, "Average rating: " + rating);

    const castParagraph = document.createElement("p");
    castParagraph.textContent = "Main cast: Loading...";
    card.append(castParagraph);

    const link = document.createElement("a");
    link.href = "https://www.tvmaze.com/shows/" + show.id;
    link.textContent = "View show on TVmaze";
    card.append(link);

    gallery.append(card);

    try {
        const cast = await fetchData(
            "https://api.tvmaze.com/shows/" + show.id + "/cast"
        );
        const names = [];

        for (let i = 0; i < cast.length && names.length < 4; i++) {
            if (cast[i].person && cast[i].person.name) {
                names.push(cast[i].person.name);
            }
        }

        if (names.length > 0) {
            castParagraph.textContent = "Main cast: " + names.join(", ");
        } else {
            castParagraph.textContent = "Main cast: Not available.";
        }
    } catch (error) {
        castParagraph.textContent = "Main cast: Not available. " + error.message;
    }
}

// Search for up to ten shows and replace the gallery
async function searchShows(searchText) {
    searchText = searchText.trim();
    gallery.replaceChildren();

    if (searchText === "") {
        message.textContent = "Please enter a show title or keyword.";
        return;
    }

    searchButton.disabled = true;
    message.textContent = "Loading...";

    try {
        const results = await fetchData(
            "https://api.tvmaze.com/search/shows?q="
            + encodeURIComponent(searchText)
        );
        const matches = results.slice(0, 10);

        if (matches.length === 0) {
            message.textContent = "No shows found. Try another search.";
            return;
        }

        for (const match of matches) {
            await createShowCard(match.show);
        }

        message.textContent = "Showing " + matches.length + " shows.";
    } catch (error) {
        gallery.replaceChildren();
        message.textContent = "Search failed. " + error.message;
    } finally {
        searchButton.disabled = false;
    }
}

// Display a default search when the page opens
searchInput.value = "The Vampire Diaries";
searchShows(searchInput.value);