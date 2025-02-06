// get functions from function.js
// import { get_all_user_songs } from "./functions.js"

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
    constructor(userLink) {
        // check that we have good vars
        if (!userLink) {
            console.error("BackendGenerator constructor var's are undefined");
            return;
        }

        this.userLink = userLink;
        this.generatedPlaylists = [];
        this.genres = new Set([]);
        this.songs = new Set([]);

        console.log("testing songs:");
        const songs = get_all_user_songs(userLink);
        for (let i = 0; i < 10; i++) {
            console.log(songs[i].id);
        }

        // do user parsing here to get songs and genres and append them to arrays
        // when creating a new song, include song information in constructor call
    }
    
    TEMPsetVariables() {
        console.log("TODO: MAKE REAL PARSING INSTEAD OF TEMP VARIABLES");
        // this.userLink = "link";
        
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
        // // genres
        // process.stdout.write("\nGenres: ");
        // for (let i of this.genres) {
        //     process.stdout.write(i + ", ");
        // }
        // console.log();

        // // songs
        // for (let i of this.songs) {
        //     process.stdout.write("Song: " + i.name + ", with: ");

        //     for (let j of i.genres) {
        //         process.stdout.write(j + ", ");
        //     }
        //     console.log();
        // }
        // console.log();
        // for (let i = 0; i < 10; i++) {
        //     console.log("test: " + this.songs[i].id);
        // }

    }

    DEBUG_playlistPrint() {
        // for (let playlist of this.generatedPlaylists) {
        //     console.log("Playlist: " + playlist.name);
        //     console.log("\tDescription:\t" + playlist.description);

        //     process.stdout.write("\tFilters:\t");
        //     for (let j of playlist.filters) {
        //         process.stdout.write(j + ", ");
        //     }
        //     console.log();
                
        //     process.stdout.write("\tSongs:\t\t");
        //     for (let j of playlist.songs) {
        //         if (!j) {
        //             console.error("Undefined value found in playlist.songs");
        //             continue; // Skip this iteration
        //         }
        //         process.stdout.write(j.name + ", ")
        //     }
        //     console.log();
        // }
        
        


    }
}

// main
(function() {
    console.log("testBack");
    let userLink = "AlLe4L3iXChGjyf4RQXdJ2Kqm6Y9MqN2b/ArL1owtg4TQm/DHcymgUxCh4y42MXK6GAysfrUwHpAzScihOWCyFO86M7d4WOZjpJaOLQHN+mJoZEoSa2pk38ACwZ5BSJvqdlBHS8OL56yGR6XVtjcG1b2GLPJMKe0+PNbOucFucvS2sHYsgx6YHTI0wnPLbdAIrXWtNEV8j/VvbcfJsvA3o8JbbupUdhDNE0kAg2FCIoElPHVKQ==";
    let backend = new BackendGenerator(userLink);
    // backend.TEMPsetVariables();

    backend.DEBUG_backendPrint();

    // // make a playlist
    // let testFilters1 = ["Rock"];
    // let testFilters2 = ["Alternative"];
    // let testFilters3 = ["FakeGenre"];
    
    // backend.createPlaylist("rock playlist", testFilters1);
    // backend.createPlaylist("alt playlist", testFilters2);
    // backend.createPlaylist("fake playlist", testFilters3);

    // backend.DEBUG_playlistPrint();

  })();