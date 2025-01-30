// Song, the most basic of objects
class Song {
    constructor(name, spotifyLink, isLiked, recentPlayCount, genres) {
        // check that we have good vars (note that isLiked is bool, so we use typeof)
        if (!name || !spotifyLink || !(typeof isLiked) || !recentPlayCount || !genres) {
            console.error("Song constructor var's are undefined");
            return;
        }

        this.name = name;
        this.spotifyLink = spotifyLink;
        this.isLiked = isLiked;
        this.recentPlayCount = recentPlayCount;
        this.genres = genres;
      }
}

// Playlist, a collection of songs
class Playlist {
    constructor(songs, name, description, filters) {
        // check that we have good vars
        if (!songs || !name || !description || !filters) {
            console.error("Playlist constructor var's are undefined");
            return;
        }

        this.songs = songs;
        this.name = name;
        this.description = description;
        this.filters = filters ;
    }
}

// BackendGenerator, generates playlists, has all information on user
class BackendGenerator {
    constructor(spotifyLink) {
        // check that we have good vars
        if (!spotifyLink) {
            console.error("BackendGenerator constructor var's are undefined");
            return;
        }

        this.spotifyLink = spotifyLink;
        this.generatedPlaylists = [];
        this.genres = new Set([]);
        this.songs = new Set([]);

        // do user parsing here to get songs and genres and append them to arrays
        // when creating a new song, include song information in constructor call
    }
    
    TEMPsetVariables() {
        console.log("TODO: MAKE REAL PARSING INSTEAD OF TEMP VARIABLES");
        this.spotifyLink = "link";
        
        let tempSongs = [new Song("Rock_Indie", "songLink", true, 50, ["Rock", "Indie"]),
                     new Song("Rock_Alt", "songLink", false, 20, ["Rock", "Alternative"]),
                     new Song("Rap_Alt", "songLink", false, 20, ["Rap", "Alternative"])];
        
        for (let i = 0; i < tempSongs.length; i++) {
            this.songs.add(tempSongs[i]);

            for (let j = 0; j < tempSongs[i].genres.length; j++) {
                this.genres.add(tempSongs[i].genres[j]);
            }
        } 
    }

    createPlaylist(playListName, filters) {
        // check that we have good vars
        if (!playListName || !filters) {
            console.error("createPlaylist var's are undefined");
            return;
        }

        let possibleSongs = new Set();
        
        // loop through songs
        for (let i of this.songs) {
            let isIncluded = false;
            
            // loop through filters and see if a song is in one
            for (let j of i.genres) {
                if (filters.includes(j)) {
                    isIncluded = true;
                    break;
                }
            }

            
            // if its included then add to possible songs
            if (isIncluded) {
                possibleSongs.add(i);
            }
        }

        if (possibleSongs.size == 0) {
            console.log("WARNING: No songs fit filters for: " + playListName);
            return;
        }

        let playlist = new Playlist(possibleSongs, playListName, "desc", filters);
        this.generatedPlaylists.push(playlist);
    }

    DEBUG_backendPrint() {
        // genres
        process.stdout.write("\nGenres: ");
        for (let i of this.genres) {
            process.stdout.write(i + ", ");
        }
        console.log();

        // songs
        for (let i of this.songs) {
            process.stdout.write("Song: " + i.name + ", with: ");

            for (let j of i.genres) {
                process.stdout.write(j + ", ");
            }
            console.log();
        }
        console.log();
    }

    DEBUG_playlistPrint() {
        for (let playlist of this.generatedPlaylists) {
            console.log("Playlist: " + playlist.name);
            console.log("\tDescription:\t" + playlist.description);

            process.stdout.write("\tFilters:\t");
            for (let j of playlist.filters) {
                process.stdout.write(j + ", ");
            }
            console.log();
                
            process.stdout.write("\tSongs:\t\t");
            for (let j of playlist.songs) {
                if (!j) {
                    console.error("Undefined value found in playlist.songs");
                    continue; // Skip this iteration
                }
                process.stdout.write(j.name + ", ")
            }
            console.log();
        }
    }
}

// main
(function() {
    // Your code here
    backend = new BackendGenerator("link");
    backend.TEMPsetVariables();

    backend.DEBUG_backendPrint();

    // // make a playlist
    let testFilters1 = ["Rock"];
    let testFilters2 = ["Alternative"];
    let testFilters3 = ["FakeGenre"];
    
    backend.createPlaylist("rock playlist", testFilters1);
    backend.createPlaylist("alt playlist", testFilters2);
    backend.createPlaylist("fake playlist", testFilters3);

    backend.DEBUG_playlistPrint();

  })();