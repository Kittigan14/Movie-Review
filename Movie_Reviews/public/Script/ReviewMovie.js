document.addEventListener("DOMContentLoaded", function () {
    const genresNames = document.querySelectorAll(".genres-name");
    const movieContainer = document.getElementById("movieContainer");

    // Include userId in the fetch URL
    const userId = req.session.user ? req.session.user.UsersID : null;

    genresNames.forEach((genreName) => {
        genreName.addEventListener("click", function () {
            const selectedGenreId = this.getAttribute("data-genre-id");

            // Include userId in the fetch URL
            fetch(`/getMoviesByGenre/${selectedGenreId}?userId=${userId}`)
                .then((response) => response.json())
                .then((movies) => {
                    const movieHTML = movies
                        .map((movie, index) => {
                            console.log("movie.MoviesID:", movie.movieId);
                            return `
                                <div class="movie-list" data-genre-id="${movie.GenresID}">
                                    <div class="movie-images" data-movie-id="${movie.movieId}">
                                        <a href="/detailMovie/${movie.movieId}">
                                            <img src="${movie.Image}" alt="">
                                        </a>
                                        <div class="title">${movie.Title}</div>
                                    </div>
                                </div>
                            `;
                        })
                        .join("");

                    movieContainer.innerHTML = `
                        <div class="movie-Genres">
                            <button class="back-button">
                                <a href="/movies"> <img src="../Icon/back-button.png" alt=""> </a>
                            </button>    
                        </div>
                        ${movieHTML}
                    `;
                })
                .catch((error) => console.error("Error fetching movies:", error));
        });
    });
});
