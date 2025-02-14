// Pull tokens from .env
import {Mutex} from 'async-mutex';

/*
/////////////////////
// IMPORTANT TYPES //
/////////////////////
*/

/**
 * Genres object from Apple API
 * @typedef {Object} Genres
 * @property {string} id - Genre ID
 * @property {Object} attributes - Genre attributes
 * @property {string} attributes.name - Genre name
 */

/**f
 * Songs object from Apple API
 * @typedef {Object} Songs
 * @property {string} id - Song ID
 * @property {Object} attributes - Song attributes
 * @property {string} attributes.name - Song name
 * @property {string} attributes.artistName - Song artist name
 * @property {string[]} attributes.genreNames - Song genre names
 * @property {Object} relationships - Song relationships
 * @property {Object} relationships.genres - Song genre data
 * @property {Genres[]} relationships.genres.data - Song genre data
 */

/**
 * LibraryPlaylists object from Apple API
 * @typedef {Object} LibraryPlaylists
 * @property {string} id - Playlist ID
 * @property {Object} attributes - Playlist attributes
 * @property {string} attributes.name - Playlist name
 */

/**
 * LibrarySongs object from Apple API
 * @typedef {Object} LibrarySongs
 * @property {Object} attributes - Song attributes
 * @property {Object} attributes.playParams - Song play parameters
 * @property {string} attributes.playParams.catalogId - Song catalog ID
 */

/** 
 * Lighweight class only containing vital Song information
 * */
export class Song {
    /**
     * @param {string} id - Catalog ID
     * @param {string[]} genres - array of genre IDs
     * @param {string[]} subgenres - array of subgenres names
     */
    constructor(id, genres, subgenres) {
        // check that we have good vars (note that isLiked is bool, so we use typeof)
        if (!id || !genres || !subgenres) {
            console.error("Song constructor var's are undefined");
            return;
        }

        this.id = id;
        this.genres = genres;
        this.subgenres = subgenres;
      }
}

/**
 * Lightweight class encapsulating user data
 */
export class UserData{
    /**
     * @param {Song[]} songs - array of Song objects
     * @param {GenreDictionary} genre_dictionary - GenreDictionary object
     * @param {SubgenreDictionary} subgenre_dictionary - SubgenreDictionary object
     */
    constructor(songs, genre_dictionary, subgenre_dictionary) {
        // check that we have good vars
        if (!songs || !genre_dictionary || !subgenre_dictionary) {
            console.error("UserData constructor var's are undefined");
            return;
        }

        this.songs = songs;
        this.genre_dictionary = genre_dictionary;
        this.subgenre_dictionary = subgenre_dictionary;
    }
}

/**
 * Dictionary interface
 * */
class Dictionary{
    /**
     * PROTECTED | [name] = id if exists
     */
    _dictionary;

    mutex_dictionary = new Mutex();

    /**
     * Constructor to init dictionary
     */
    constructor(){
        if(new.target === Dictionary){
            throw new TypeError("Cannot construct Dictionary instances directly");
        }

        this._dictionary = {};
    }

    /**
     * Asychronously create a GenreDictionary object
     */
    static async create(genres){
        let dictionary = new Dictionary();
        await dictionary.add(genres);
        return dictionary;
    }

    /**
     * Accessor function to get copy of the dictionary
     * @returns {Promise<Record<string, number>>} dictionary
     */
    async get(){
        let copy = {};
        await mutex_dictionary.runExclusive(async () => copy = {...this._dictionary});
        return copy;
    }

    /**
     * IMPLEMENTED BY CHILDREN | Adds genres to the dictionary if not already included
     */
    async add(genres){
        throw new Error("add(genres) MUST BE IMPLEMENTED BY CHILDREN")
    }
}

/**
 * Genre Dictionary
 */
export class GenreDictionary extends Dictionary{
    /**
     * Adds genres to the dictionary if not already included (dictionary[name] = id)
     * @param {Genres[]} genres - array of Genres objects
     */
    async add(genres){
        if(genres.length === 0) return;

        await mutex_dictionary.runExclusive(async () => {
            genres.map(genre => genre != "Music").forEach(genre => this.get()[genre.attributes.name] = genre.id);
        });
    }

    /**
     * Returns genre ID from the dictionary given a genre name
     * @param {string} genre_name - looked up in genreDictionary
     * @returns {Promise<string>} genre ID
     */
    static async get_id(genre_name){
        let id = undefined;

        await mutex_dictionary.runExclusive(async () => id = this._dictionary[genre_name]);

        return id;
    }
}

/**
 * Subgenre Dictionary
 */
export class SubgenreDictionary extends Dictionary{
    /**
     * Adds subgenres to the dictionary if not already included (dictionary[name] = 1 if exists)
     * @param {string[]} subgenres - array of subgenre names
     */
    async add(subgenres){
        if(subgenres.length === 0) return;

        await mutex_dictionary.runExclusive(async () => {
            subgenres.map(subgenre => subgenre != "Music").subgenres.forEach(subgenre => this._dictionary[subgenre] = 1)
        });
    }

    /**
     * Returns true if subgenre exists in the dictionary
     * @param {string} subgenre_name - looked up in subgenreDictionary
     * @returns {Promise<boolean>} true if subgenre exists
     */
    async exists(subgenre_name){
        let exists = false;

        await mutex_dictionary.runExclusive(async () => exists = this._dictionary[subgenre_name] != undefined);

        return exists;
    }

    /**
     * Removes keys from SubgenreDictionary if present in GenreDictionary
     * @param {string[]} genres - GenreDictionary keys
     */
    async clean(genres){
        await mutex_dictionary.runExclusive(async () => {
            let subgenres = Object.keys(this._dictionary);
            let duplicateKeys = genres.filter(genre => subgenres.includes(genre));
            
            for(let i = 0; i < duplicateKeys.length; i++){
                delete this._dictionary[duplicateKeys[i]];
            }
        });
    }

    /**
     * Gets subgenres with main genre included in the name
     * @param {string} genre_name - genre name
     * @returns {Promise<string[]>} array of subgenre names with genre_name included (ex: "Rock" -> "Rock & Roll")
     */
    async get_subgenres_of(genre_name){
        let subgenres = [];
        mutex_dictionary.runExclusive(async () => {
            subgenres = this._dictionary.filter(subgenre => subgenre.includes(genre_name));
        });
        return subgenres;
    }
}

/*
///////////////////////////////////////////
// GLOBAL VARIABLES AND HELPER FUNCTIONS //
///////////////////////////////////////////
*/

/**
 * Apple Music API Interact Interface
 */
class InteractAPI{
    /**
     * Bloat reducer; used to fetch data from Apple API
     * @param {string} url 
     * @param {string} userToken
     * @param {string} developerToken
     * @returns fetch response
     */
    static async fetchData(url, userToken, developerToken){
        return await fetch(url, {
            headers: {
                "Authorization": 'Bearer ' + developerToken,
                "Music-User-Token": userToken
            }
        });
    }
}

/*
///////////////////////////////////////////////////////////////
// RETRIEVAL FUNCTIONS THAT COMMUNICATE WITH APPLE MUSIC API //
///////////////////////////////////////////////////////////////
*/

export class DataFetchers{
    /**
     * This class is not meant to be instantiated
     */
    constructor() {
        throw new Error("This class cannot be instantiated.");
    }

    /**
     * Gets all users' songs, genres and subgenres
     * @param {string} userToken - Apple Music User Token
     * @returns {Promise<UserData>} Songs, Genres, Subgenres
     */
    static async get_all_user_data(){
        let songs = [new Song("1", ["1"], ["Rock"])]; // placeholder
        let genres = [... new Set(songs.map(song => song.genres).flat())];
        let genre_dictionary = new GenreDictionary();
        let subgenre_dictionary = "";

        return new UserData(songs, genre_dictionary, subgenre_dictionary);
    }
}
/**
 * Functions to fetch users' song data
 */
export class SongDataFetchers{
    /**
     * This class is not meant to be instantiated
     */
    constructor() {
        throw new Error("This class cannot be instantiated.");
    }

    /**
     * Returns array of user's 10 most recently played songs.
     * Updates Genre and Subgenre dictionaries.
     * @returns {Promise<Songs[]>} array of Songs objects
     */ 
    static async get_user_recently_played(){
        const url = "https://api.music.apple.com/v1/me/recent/played/tracks?limit=10";
        console.log("Retrieving recently played songs...");

        try{
            const response = await InteractAPI.fetchData(url);

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
    
            return data.data;
        } catch(error){
            console.error("Error fetching top songs: ", error);
        }
    }

    /**
     * Returns set containing all songs found in user's library and playlists.
     * @returns {Promise<Set<Song>>} array of Song objects
     */
    static async get_all_user_songs(){
        const songIDs = await SongDataFetchers.get_all_user_song_IDs();
        const songs = await SongDataFetchers.get_user_songs(songIDs);
        return songs;
    }

    /**
     * Returns set containing all songs given song catalog ID array
     * @param {string[]} songIDs - array of song catalog IDs
     * @returns {Promise<Set<Song>>} set of Song objects
     */
    static async get_user_songs(songIDs){
        let url = "https://api.music.apple.com/v1/catalog/us/songs?include=genres&ids=";
        const partitions = GlobalFunctions.songIDs_partitioner(songIDs);
        let songs = [];
        songs = await ParallelDataFetchers.get_all_user_songs_from("Catalog", url, partitions, songIDs.length);
        return songs;
    }

    /** 
     * Returns set containing all songs IDs found in user's library and playlists.
     * @returns {Promise<Set<string>>} set of song catalog IDs
     */
    static async get_all_user_song_IDs(){
        // get all songs from the library section
        const librarySongIDs = await SongDataFetchers.get_all_user_library_song_IDs();
        const playlistSongIDs = await SongDataFetchers.get_all_user_playlist_song_IDs();

        // union array with no duplicates
        const allSongIDs = await [...new Set([...librarySongIDs, ...playlistSongIDs])];
        
        return allSongIDs;
    }

    /**
     * Returns all song catalog ID's from all user's playlists.
     * @param {string} playlist_id - LibraryPlaylists ID
     * @returns {string[]} array of song catalog IDs
     */
    static async get_all_user_playlist_song_IDs(){
        const playlistIDs = await PlaylistDataFetchers.get_all_user_playlist_IDs();
        let playlistSongIDs = [];
        
        console.log("Retrieving all song IDs from user playlists...");

        for(let i = 0; i < playlistIDs.length; i++){
            playlistSongIDs.push(await SongDataFetchers.get_user_playlist_song_IDs(playlistIDs[i]));
        }

        return [...new Set(playlistSongIDs.flat())];
    }

    /**
     * Returns set of all song catalog ID's in a user's playlist.
     * @param {string} playlist_id - LibraryPlaylists ID
     * @returns {string[]} array of song catalog IDs
     */
    static async get_user_playlist_song_IDs(playlist_id){
        const url = "https://api.music.apple.com/v1/me/library/playlists/" + playlist_id + "/tracks?limit=100&offset=";
        let result = await ParallelDataFetchers.get_all_user_song_IDs_from("User Playlist", url);
        return result;
    }

    /**
     * Returns set of all song catalog IDs in user's library.
     * @returns {Promise<string[]>} array of song catalog IDs
     */
    static async get_all_user_library_song_IDs(){
        const url = "https://api.music.apple.com/v1/me/library/songs?limit=100&offset=";

        console.log("Retrieving all song IDs from user library...");
        let result = await ParallelDataFetchers.get_all_user_song_IDs_from("User Library", url);
        return result;
    }

    /**
     * Returns array of genres for a song
     * @param {string} song_id - Catalog ID of song
     * @returns {Promise<Genres>} array of Genres objects
     */
    static async get_genres(song_id){
        let url = "https://api.music.apple.com/v1/catalog/us/songs/" + song_id + "?include=genres";
        console.log("Retrieving genres for: " + song_id);
        try{
            const response = await GlobalFunctions.fetchData(url);

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
            return data.data[0].relationships.genres.data;
        }catch(error){
            console.error("Error fetching genres: ", error);
        }
    }

    /**
     * Returns array of subgenre names for a song
     * @param {string} song_id 
     * @returns {string[]} array of subgenre names
     */
    static async get_subgenres(song_id){
        let url = "https://api.music.apple.com/v1/catalog/us/songs/" + song_id;
        console.log("Retrieving subgenres for: " + song_id);
        try{
            const response = await GlobalFunctions.fetchData(url);

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
            return data.data[0].attributes.genreNames;
        }
        catch(error){
            console.error("Error fetching subgenres: ", error);
        }
    }
}

/**
 * Functions to fetch users' playlist data
 */
export class PlaylistDataFetchers{
    /**
     * This class is not meant to be instantiated
     */
    constructor() {
        throw new Error("This class cannot be instantiated.");
    }

    /**
     * Returns array of user's playlists - maximum size is 100 playlists
     * @returns {Promise<LibraryPlaylists[]>} array of LibraryPlaylists objects
     */
    static async get_user_playlists(){
        const url = "https://api.music.apple.com/v1/me/library/playlists?limit=100";
        console.log("Retrieving playlists...")
        try{
            const response = await fetchData(url);

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
            
            return data.data;
        } catch(error){
            console.error("Error fetching playlists: ", error);
        }
    }

    /**
     * Returns array of all playlist IDs in user's library
     * @returns {Promise<string[]>} array of LibraryPlaylists IDs
     */
    static async get_all_user_playlist_IDs(){
        let url = "https://api.music.apple.com/v1/me/library/playlists?limit=100";
        console.log("Retrieving user library playlist IDs...");
        let accumulated_playlist_IDs = [];
        try{
            accumulated_playlist_IDs = await PlaylistDataFetchers.get_user_playlist_IDs(url, accumulated_playlist_IDs);
            return accumulated_playlist_IDs;
        }catch(error){
            console.error("Error fetching user library playlist IDs: ", error);
            return [];
        }
    }

    /**
     * Returns array of all playlist IDs in user's library page
     * @param {string} url - Apple API URL (used for pagination)
     * @param {string[]} accumulated_playlist_IDs - array of playlist IDs
     * @returns {Promise<Set<string>>} accumulated_playlist_IDs 
     */
    static async get_user_playlist_IDs(url, accumulated_playlist_IDs){
        try{
            while(true){
                const response = await GlobalFunctions.fetchData(url);

                if(!response.ok){
                    if (response.status === 504) {
                        console.error("Gateway Timeout (504) - Retrying...");
                        // Retry after a delay (see below)
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                        continue; // Retry
                    }else {
                        throw new Error("HTTP Error! Status: " + response.status);
                    }
                }

                const data = await response.json();

                /** @type {LibraryPlaylists[]} */ 
                data.data.forEach(playlist=>accumulated_playlist_IDs.push(playlist.id));
            
                if(data.next){
                    url = "https://api.music.apple.com" + data.next + "&limit=100";
                    continue;
                }
                else{
                    return [...new Set(accumulated_playlist_IDs)];
                }
            }
        }catch(error){
            console.error("Error fetching user library playlist IDs: ", error);
            return [];
        }
    }
}

/**
 * Functions to fetch data in parallel
 */
export class ParallelDataFetchers{
    /**
     * Calculates the optimal number of fetch threads for a given set size
     * @param {number} set_size - number of items to be fetched
     * @param {number} upper_limit - max number of threads
     * @returns {number} optimal number of threads
     */
    static #thread_count_calculator(set_size, upper_limit){
        if(set_size <= 100){
            return 0;
        }
        
        set_size = set_size - 100; // first 100 fetched in main thread
        const thread_counts = Array.from({length: upper_limit}, (_, i) => i + 1.0); // ex: upper_limit = 5 ==> thread_counts = [1.0, 2.0, 3.0, 4.0, 5.0]
        let result = [];

        for(let i = 0; i < thread_counts.length; i++)
            result.push([ParallelDataFetchers.#round_up(ParallelDataFetchers.#round_up(set_size/100) / thread_counts[i]), thread_counts[i]]);

        result.sort((a,b) => a[0] - b[0]);

        return result[0][1];
    }

    /**
     * Partitioner splits songIDs into chunks of 300 for Apple API requests
     * @param {string[]} songIDs 
     * @returns {string[][]} array of songID partitions
     */
    static #song_ids_partitioner(songIDs){
        let songIDsCopy = songIDs.slice(); // shallow copy
        const songIDsPartitions = [];
        while (songIDsCopy.length) {
            songIDsPartitions.push(songIDsCopy.splice(0, 300)); 
        }
        return songIDsPartitions;
    }

    /**
     * Rounds up a number to the nearest integer (does not round if already a whole number)
     * @param {number} number 
     * @returns {number} rounded number
     */
    static #round_up(number){   
        return number + ((1 - Number(number % 1 == 0)) - number % 1);
    }

    /**
     * Parallelizes API fetch process when URL uses offset pagination
     * @param {function} func - function to be parallelized
     * @param {string} collection - describes where resource is being pulled from
     * @param {number} thread_count - number of threads to be used
     * @param {number} listSize - size of list to be fetched/processed
     * @param {string} url - URL used in API fetch requesets
     * @param {number} offset - offset useed in fetch request URLs
     * @returns {Promise<string, Set<string>>} array of fetch results (fulfilled?, data)
     */
    static async parallelize_using_offset(func, collection, url, offset, thread_count, list_size){
        let result = [];
        if(thread_count === 1){
            result = await Promise.allSettled([func(collection, url, offset+100, 1, list_size, [])]);
        }
        else if(thread_count === 2){
            result = await Promise.allSettled(
                [
                    func(collection, url, offset+100, 2, list_size, []),
                    func(collection, url, offset+200, 2, list_size, [])
                ]
            )
        }
        else if(thread_count === 3){
            result = await Promise.allSettled(
                [
                    func(collection, url, offset+100, 3, list_size, []),
                    func(collection, url, offset+200, 3, list_size, []),
                    func(collection, url, offset+300, 3, list_size, [])
                ]
            )
        }
        else if(thread_count === 4){
            result = await Promise.allSettled(
                [
                    func(collection, url, offset+100, 4, list_size, []),
                    func(collection, url, offset+200, 4, list_size, []),
                    func(collection, url, offset+300, 4, list_size, []),
                    func(collection, url, offset+400, 4, list_size, [])
                ]
            )
        }
        else if(thread_count === 5){
            result = await Promise.allSettled(
                [  
                    func(collection, url, offset+100, 5, list_size, []),
                    func(collection, url, offset+200, 5, list_size, []),
                    func(collection, url, offset+300, 5, list_size, []),
                    func(collection, url, offset+400, 5, list_size, []),
                    func(collection, url, offset+500, 5, list_size, [])
                ]
            )
        }

        return result;
    }

    /**
     * Parallelizes API fetch process when URL uses partition pagination
     * @param {function} func - function to be parallelized
     * @param {string} collection - describes where resource is being pulled from
     * @param {string} url - URL used in API fetch requesets
     * @param {string[][]} partitions - array of partitions used to fetch from Apple API URL
     * @param {number} thread_count - number of threads to be used
     * @returns {Promise<string, Set<string>>} array of fetch results (fulfilled?, data)
     */
    static async parallelize_using_partitions(func, collection, url, partitions, thread_count){
        let result = [];

        if(thread_count === 1){
            result = await Promise.allSettled([func(collection, url, partitions, 0, thread_count)]);
        }
        else if(thread_count === 2){
            result = await Promise.allSettled(
                [
                    func(collection, url, partitions, 0, thread_count),
                    func(collection, url, partitions, 1, thread_count)
                ]
            )
        }
        else if(thread_count === 3){
            result = await Promise.allSettled(
                [
                    func(collection, url, partitions, 0, thread_count),
                    func(collection, url, partitions, 1, thread_count),
                    func(collection, url, partitions, 2, thread_count)
                ]
            )
        }
        else if(thread_count === 4){
            result = await Promise.allSettled(
                [
                    func(collection, url, partitions, 0, thread_count),
                    func(collection, url, partitions, 1, thread_count),
                    func(collection, url, partitions, 2, thread_count),
                    func(collection, url, partitions, 3, thread_count)
                ]
            )
        }
        else if(thread_count === 5){
            result = await Promise.allSettled(
                [  
                    func(collection, url, partitions, 0, thread_count),
                    func(collection, url, partitions, 1, thread_count),
                    func(collection, url, partitions, 2, thread_count),
                    func(collection, url, partitions, 3, thread_count),
                    func(collection, url, partitions, 4, thread_count)
                ]
            )
        }

        return result;
    }

    /**
     * Returns first page of song catalog IDs from either a library playlist or user's library
     * @param {string} collection - NOT USED, describes where resource is being pulled from
     * @param {string} url - Apple API URL
     * @param {string} accumulated_song_ids - array of song catalog IDs
     * @returns {Promise<Set<string>, string>} [accumulated_song_ids, playlist_size]
     */
    static async get_first_page_of(collection, url, accumulated_song_ids){
        try{
            const response = await InteractAPI.fetchData(url + '0');

            if(!response.ok) {
                if(response.status === 404){
                    return [[], 0];
                }

                throw new Error("HTTP Error! Status: " + response.status);
            }

            const data = await response.json();

            // add all non-undefined song IDs to the array
            accumulated_song_ids.push(...data.data.map(song=>song.attributes.playParams?.catalogId).filter(id => id != undefined));

            return [[...new Set(accumulated_song_ids)], data.meta.total];
        }catch(error){
            console.error("Error fetching first page from " + collection + ": " + error);
            return [[], 0];
        }
    }

    /**
     * Returns set of all song catalog IDs from either a library playlist or user's library
     * @param {string} collection - describes where resource is being pulled from
     * @param {string} url - Apple API URL
     * @returns {Promise<Set<string>>} set of song catalog IDs
     */
    static async get_all_user_song_IDs_from(collection, url){
        let offset = 0; // will parallelize to 5 fetches working at 100 offset differences (0,100,200,300,400)
        let accumulated_song_ids = [];

        try{
            const first_page = await ParallelDataFetchers.get_first_page_of(collection, url + '0', []);
            const playlist_size = first_page[1];

            const thread_count_max = 5;
            const thread_count = ParallelDataFetchers.thread_count_calculator(playlist_size, thread_count_max);
            
            let result = [];
            result = await ParallelDataFetchers.parallelize_using_offset(ParallelDataFetchers.get_user_song_IDs_from, collection, url, offset, thread_count, playlist_size);
    
            first_page[0].forEach(songID => accumulated_song_ids.push(songID));
            result.forEach(songIDs => accumulated_song_ids.push(...songIDs.value.flat()));
           
            return [...new Set(accumulated_song_ids)];
        }catch(error){
            console.error("Error fetching song catalog IDs from " + collection + ": ", error);
            return [];
        }
    }

    /**
     * Returns set of song catalog IDs 100-count-batches from either a library playlist or user's library
     * @param {string} collection - NOT USED, describes where resource is being pulled from
     * @param {string} url - Apple API URL (used for pagination)
     * @param {number} offset - Apple API URL offset
     * @param {string[]} accumulated_song_ids - array of song catalog IDs
     * @returns {Promise<Set<string>>} set of song catalog IDs
     */
    static async get_user_song_IDs_from(collection, url, offset, thread_count, list_size, accumulated_song_ids){
        try{
            while(true){
                const response = await GlobalFunctions.fetchData(url + offset);

                if(!response.ok){
                    if (response.status === 504) {
                        console.error("Gateway Timeout (504) - Retrying...");
                        // Retry after a delay (see below)
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
                        continue; // Retry
                    }else if(response.status === 404){
                        throw new Error(response.status)
                    }
                    else {
                        throw new Error("HTTP Error! Status: " + response.status);
                    }
                }

                const data = await response.json();
                
                /** @type {LibrarySongs[]} */ 
                accumulated_song_ids.push(...data.data.map(song=>song.attributes.playParams?.catalogId).filter(id => id != undefined));
                offset += (thread_count * 100); // max fetch size is 100, works with parallelism
                
                if(offset >= list_size){ // end of playlist reached
                    return [...new Set(accumulated_song_ids)];
                }

                await new Promise(res => setTimeout(res, 300)); // 300 ms buffer
            }
        }catch(error){ 
            if(Number(error.message) === 404){ // reached end of playlist
                return [...new Set(accumulated_song_ids)];
            }

            console.error("Error fetching song IDs from " + collection + ": " + error);
            return [];
        }
    }

    /**
     * Returns set containing all songs given song catalog ID array
     * @param {string} collection - describes where resource is being pulled from
     * @param {string[][]} partitions - array of song catalog ID partitions
     * @param {number} list_size - number of songs to be fetched
     * @returns {Promise<Set<Song>>} set of Song objects
     */
    static async get_all_user_songs_from(collection, url, partitions, list_size){
        const max_thread_count = 5;
        const thread_count = ParallelDataFetchers.thread_count_calculator(list_size, max_thread_count);
        let accumulated_songs = [];

        try{
            let result = [];
            result = await ParallelDataFetchers.parallelize_using_partitions(ParallelDataFetchers.get_user_songs_from, collection, url, partitions, thread_count);
            result.forEach(songs => accumulated_songs.push(...songs.value.flat()));
            return [... new Set(accumulated_songs)];
        }catch(error){
            console.error("Error fetching songs from " + collection + ": ", error);
            return [];
        }
    }

    /**
     * Returns set containing all songs given song catalog ID partition
     * @param {string} collection - describes where resource is being pulled from
     * @param {string} url - Apple API URL
     * @param {string[][]} partitions - partitions used to fetch from Apple API URL
     * @param {number} start_index - Starting-point-partition used in fetch request URLs
     * @param {number} thread_count - number of threads to be used
     * @returns {Promise<Set<Song>>} accumulated_songs - array of song catalog IDs
     */
    static async get_user_songs_from(collection, url, partitions, start_index, thread_count){
        let index = start_index;
        let songs = [];
        let count = 0;

        try{
            for(let i = index; i < partitions.length; i += thread_count){
                const ids = partitions[i].join(",");

                const response = await GlobalFunctions.fetchData(url + ids);

                if(!response.ok){
                    if (response.status === 504) {
                        console.error("Gateway Timeout (504) - Retrying...");
                        // Retry after a delay (see below)
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                        i -= thread_count; // Retry
                        continue; // Retry
                    }else {
                        throw new Error("HTTP Error! Status: " + response.status);
                    }
                }

                const data = await response.json();

                for(let i = 0; i < data.data.length; i++){
                    count++;
                    await GenreDictionary.add(data.data[i].relationships.genres.data);
                    await GenreDictionary.add(data.data[i].attributes.genreNames);
                    songs.push(new Song(data.data[i].id, data.data[i].relationships.genres.data.map(genre => genre.id), data.data[i].attributes.genreNames));
                }
            }

            return [...new Set(songs)];
        }catch(error){
            console.error("Error fetching songs from " + collection + ": ", error);
        }
    }
}