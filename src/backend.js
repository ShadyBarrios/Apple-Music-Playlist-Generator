// get functions from function.js
import { get_all_user_songs } from "./functions.js"
import { Song } from "./functions.js"

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
    constructor(userLink, songs) {
        // check that we have good vars
        if (!userLink) {
            console.error("BackendGenerator constructor var's are undefined");
            return;
        }

        this.userLink = userLink;
        this.generatedPlaylists = [];
        this.genres = new Set([]);
        this.songs = songs;
    }

    static async create(userLink) {
        // get songs
        const songs = await get_all_user_songs(userLink);

        // return object
        return new BackendGenerator(userLink, songs); 
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
        console.log("testing from within");

        for (let i = 0; i < 20; i++) {
            process.stdout.write(i + ": " + this.songs[i].id + ";\t");
            for (let j = 0; j < this.songs[i].genres.length; j++) {
                process.stdout.write(this.songs[i].genres[j] + ", ");
            }
            console.log();
        }
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
(async () => {
    let userLink = "AlLe4L3iXChGjyf4RQXdJ2Kqm6Y9MqN2b/ArL1owtg4TQm/DHcymgUxCh4y42MXK6GAysfrUwHpAzScihOWCyFO86M7d4WOZjpJaOLQHN+mJoZEoSa2pk38ACwZ5BSJvqdlBHS8OL56yGR6XVtjcG1b2GLPJMKe0+PNbOucFucvS2sHYsgx6YHTI0wnPLbdAIrXWtNEV8j/VvbcfJsvA3o8JbbupUdhDNE0kAg2FCIoElPHVKQ==";
    
    let backend = BackendGenerator.create(userLink);
    (await backend).DEBUG_backendPrint();
})();
