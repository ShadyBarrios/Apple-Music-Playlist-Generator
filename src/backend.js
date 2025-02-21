// get functions from function.js
// import { generatePrime } from "crypto";
import { ParallelDataFetchers, SongDataFetchers, Song, GenreDictionary, SubgenreDictionary} from "./functions.js"
// import { genre_dictionary, subgenre_dictionary } from "./functions.js";

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
    getName() { return this.name; }
    getDescription() { return this.description; }
}

// UserBackend, generates playlists, has all information on user
class UserBackend {
    /**
     * Constructor
     * @param {Set<Song>} songs 
     * @param {GenreDictionary} genre_dictionary
     * @param {SubgenreDictionary} subgenre_dictionary 
     * @returns {UserBackend} backend object
     */

    constructor(songs, genre_dictionary, subgenre_dictionary, clientToken) {
        // check that we have good vars
        if (!songs) {
            console.error("UserBackend constructor var's are undefined");
            return;
        }

        this.generatedPlaylists = [];
        this.genre_dictionary = genre_dictionary;
        this.subgenre_dictionary = subgenre_dictionary;
        this.songs = songs;
        this.clientToken = clientToken;
        console.log("OBJECT: " + this.clientToken);
    }

    static async create(appleToken, clientToken) {
        if(!appleToken){
            console.error("User token is undefined");
            return;
        }

        // get song IDs
        // const songs = await SongDataFetchers.get_all_user_songs(appleToken);
        // const genre_dictionary = GenreDictionary.get();
        // const subgenre_dictionary = SubgenreDictionary.get();

        const songs = new Set([]);
        const genre_dictionary = new Set([]);
        const subgenre_dictionary = new Set([]);

        console.log("PARSING FROM APPLE");
        await new Promise(resolve => setTimeout(() => {
            console.log("\t5 seconds have passed!");
            resolve();
        }, 0));

        // return object
        return new UserBackend(songs, genre_dictionary, subgenre_dictionary, clientToken); 
    }

    createPlaylist(playListName, filters) {
        // TEMP SONGS
        this.songs.add(new Song("R", ["Rock"], []));
        this.songs.add(new Song("P", ["Pop"], []));
        this.songs.add(new Song("I", ["Indie"], []));
        this.songs.add(new Song("RPI", ["Rock", "Pop", "Indie"], []));
        for (let i = 1; i < 500; i++) {
            this.songs.add(new Song("R" + String(i), ["Rock"], []));
        }

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

        // check if we have a size of 0
        if (possibleSongs.size == 0) {
            console.log("WARNING: No songs fit filters for: " + playListName);
            return [];
        }

        // turn set into an array and perform Fisher-Yates shuffle
        const possibleArray = [...possibleSongs];

        for (let i = possibleArray.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1)); // Get a random index
            [possibleArray[i], possibleArray[randomIndex]] = [possibleArray[randomIndex], possibleArray[i]]; // Swap elements
        }
        
        // final check and return
        let playlistArr = [];
        if (possibleArray.length <= 100) { playlistArr = possibleArray; } // less than 100, just return the randomized list
        else { playlistArr = possibleArray.slice(0, 100); } // more than 100 get a slice

        let playlist = new Playlist(playlistArr, playListName, "desc", filters);
        this.generatedPlaylists.push(playlist);

        let cnt = 0;
        for (let i of playlist.songs) {
            process.stdout.write(i.id + ", ");
            cnt++;
            if (cnt == 10) {
                console.log();
                cnt = 0;
            }
        }

        return playlist;
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

        console.log("Genre Dictionary length: " + Object.keys(GenreDictionary.get()).length);
        console.log("Subgenre Dictionary length: " + Object.keys(SubgenreDictionary.get()).length);
    }

    static async DEBUG_ThreadCalculator(){
        for(let i = 0; i < 6000; i += 100){
            console.log("Threads for list size " + i + ": " + ParallelDataFetchers.thread_count_calculator(i, 5));
        }
    }
}

class Backend {
    constructor() {
        this.clientUsers = [];
        this.appleTokens = [];
    }

    async createUser(appleToken) {
        // this will be the current index of the usersArray
        let clientToken = this.clientUsers.length;
        
        console.log("before");

        // make new client and push arrays
        let newClient = await UserBackend.create(appleToken, this.clientUsers.length);
        this.clientUsers.push(newClient);
        this.appleTokens.push(appleToken); 

        console.log("after");

        // return token
        return clientToken;
    }

    async pushApplePlaylist(playlist) {
        // will get a playlist from client side and then create it in user library
        console.log("SENDING PLAYLIST TO APPLE");
        await new Promise(resolve => setTimeout(() => {
            console.log("\t5 seconds have passed!");
            resolve();
        }, 5000));
    }
}

export { Playlist, UserBackend };

// main
(async () => {
    let userLink = "AlLe4L3iXChGjyf4RQXdJ2Kqm6Y9MqN2b/ArL1owtg4TQm/DHcymgUxCh4y42MXK6GAysfrUwHpAzScihOWCyFO86M7d4WOZjpJaOLQHN+mJoZEoSa2pk38ACwZ5BSJvqdlBHS8OL56yGR6XVtjcG1b2GLPJMKe0+PNbOucFucvS2sHYsgx6YHTI0wnPLbdAIrXWtNEV8j/VvbcfJsvA3o8JbbupUdhDNE0kAg2FCIoElPHVKQ==";

    // Test ASYNC stuff
    
    // let backend = new Backend();

    // console.log("BEFORE 1: ");
    // const clientNum = await backend.createUser(userLink);
    // console.log("AFTER 1: " + clientNum + "\n\n");

    // console.log("BEFORE 2: ");
    // const clientNum1 = await backend.createUser(userLink);
    // console.log("AFTER 2: " + clientNum1 + "\n\n");

    // console.log("Making Playlist");
    // await backend.pushApplePlaylist(clientNum1.generatedPlaylists)
    // console.log("AFTER PLAYLIST\n\n");

    // console.log("BEFORE 3: ");
    // const clientNum2 = await backend.createUser(userLink);
    // console.log("AFTER 3: " + clientNum2 + "\n\n");

    // make a playlist (client side) test
    // let user = await UserBackend.create(userLink, 0);
    // user.createPlaylist("playlist1", ["Rock", "Pop"])


})();