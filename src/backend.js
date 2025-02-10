// get functions from function.js
import { ParallelDataFetchers, SongDataFetchers, GlobalFunctions} from "./functions.js"

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

    getSongs() { return this.songs; }
}

// BackendGenerator, generates playlists, has all information on user
class BackendGenerator {
    constructor(songs) {
        // check that we have good vars
        if (!songs) {
            console.error("BackendGenerator constructor var's are undefined");
            return;
        }

        this.generatedPlaylists = [];
        this.genres = new Set([]);
        this.songs = songs;
    }

    static async create(userToken) {
        if(!userToken){
            console.error("User token is undefined");
            return;
        }

        GlobalFunctions.update_user_token(userToken);

        // get song IDs
        const songs = await SongDataFetchers.get_all_user_songs();

        // return object
        return new BackendGenerator(songs); 
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
        for (let i = 0; i < 20; i++) {
            process.stdout.write(i + ": " + this.songs[i].id + ";\t");
            for (let j = 0; j < this.songs[i].genres.length; j++) {
                process.stdout.write(this.songs[i].genres[j] + ", ");
            }
            console.log();
        }
    }

    static async DEBUG_SongIDsFetchTest(){
        console.time("Total PARALLEL song fetch time");

        console.time("PARALLEL song ID fetch time");
        let output = await SongDataFetchers.get_all_user_song_IDs();
        console.timeEnd("PARALLEL song ID fetch time");
    
        console.time("PARALLEL song from ID fetch time");
        let output2 = await SongDataFetchers.get_user_songs(output);
        console.timeEnd("PARALLEL song from ID fetch time");
    
        console.timeEnd("Total PARALLEL song fetch time");

        console.log("Songs Fetch Output size: " + output2.length);

        console.log("Genre Dictionary length: " + Object.keys(GlobalFunctions.get_genre_dictionary()).length);
        console.log("Subgenre Dictionary length: " + Object.keys(GlobalFunctions.get_subgenre_dictionary()).length);
    }

    static async DEBUG_ThreadCalculator(){
        for(let i = 0; i < 6000; i += 100){
            console.log("Threads for list size " + i + ": " + ParallelDataFetchers.thread_count_calculator(i, 5));
        }
    }
}

// main
(async () => {
    let userLink = "AlLe4L3iXChGjyf4RQXdJ2Kqm6Y9MqN2b/ArL1owtg4TQm/DHcymgUxCh4y42MXK6GAysfrUwHpAzScihOWCyFO86M7d4WOZjpJaOLQHN+mJoZEoSa2pk38ACwZ5BSJvqdlBHS8OL56yGR6XVtjcG1b2GLPJMKe0+PNbOucFucvS2sHYsgx6YHTI0wnPLbdAIrXWtNEV8j/VvbcfJsvA3o8JbbupUdhDNE0kAg2FCIoElPHVKQ==";
    
    let backend = await BackendGenerator.create(userLink);
    console.log(backend.songs.length);
})();
