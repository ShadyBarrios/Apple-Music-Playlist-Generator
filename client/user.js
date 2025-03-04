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
        this.songs = Array.from(songs);
        this.genre_dictionary = genre_dictionary;
        this.subgenre_dictionary = subgenre_dictionary;
        this.clientToken = clientToken;
        console.log("CLIENT: " + this.clientToken);
    }

    static fromJSON(json){
        return new UserBackend(json.songs, json.genre_dictionary, json.subgenre_dictionary, json.clientToken);
    }

    createPlaylist(playListName, filters) {
        // check that we have good vars
        if (!playListName || !filters) {
            console.error("createPlaylist var's are undefined");
            return;
        }

        let possibleSongs = new Set();
        let description = "";

        // loop through songs
        for (let i of this.songs) {
            let isIncluded = false;
            
            // loop through filters and see if a song is in one
            for (let j of i.subgenres) {
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

        // create description
        for (let i = 0; i < filters.length; i++) {
            if (i == filters.length-1) {
                description += filters[i];
                break;
            }
            description += filters[i] + ", ";
        }
        
        // final check and return
        let playlistArr = [];
        if (possibleArray.length <= 100) { playlistArr = possibleArray; } // less than 100, just return the randomized list
        else { playlistArr = possibleArray.slice(0, 100); } // more than 100 get a slice

        let playlist = new Playlist(playlistArr, playListName, description, filters);
        this.generatedPlaylists.push(playlist);

        return playlist;
    }

    getPlaylistIndex(index) {
        // return playlist of an index
        if (index < 0 || index > this.generatedPlaylists.length - 1) { 
            console.log("NO PLAYLIST AT THIS INDEX!");
            return []; 
        }

        let playlist = this.generatedPlaylists[index]
        
        console.log("Name: " + playlist.name + ", desc: " + playlist.description);
        let cnt = 0;
        for (let i of playlist.songs) {
            process.stdout.write(i.id + ", ");
            cnt++;
            if (cnt == 10) {
                console.log(";");
                cnt = 0;
            }
        }
        console.log();

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

export { Playlist, UserBackend };

// main
// (async () => {
//     let userLink = "";

//     let testClient = await backend.createUser(userLink);
//     testClient.createPlaylist("Dub Test Playlist", ["Dub"]);

//     await backend.pushApplePlaylist(testClient.getPlaylistIndex(0), testClient.clientToken);
    
// })();