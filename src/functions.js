// Pull tokens from .env
import fetch from 'node-fetch';

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

/**
 * Songs object from Apple API
 * @typedef {Object} Songs
 * @property {string} id - Song ID
 * @property {Object} attributes - Song attributes
 * @property {string} attributes.name - Song name
 * @property {string} attributes.artistName - Song artist name
 * @property {string[]} attributes.genreNames - Song genre names
 * @property {number} attributes.durationInMillis - Song duration in milliseconds
 * @property {Object} relationships - Song relationships
 * @property {Object} relationships.genres - Song genre data
 * @property {Genres[]} relationships.genres.data - Song genre data
 * @property {Object[]} attributes.previews - Array of preview objects (each with a URL)
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
 * Request body object for creating library playlist
 * @typedef {Object} PlaylistCreationRequest
 * @property {Object} attributes - Playlist attributes
 * @property {string} attributes.description
 * @property {string} attributes.name
 * @property {Object} relationships - Playlist relationships
 * @property {Object[]} relationships.tracks.data - Playlist tracks data
 * @property {string} relationships.tracks.data.id - Song catalog ID
 * @property {string} relationships.tracks.data.type - Song type 
 */

/**
 * Fetch Request Headers
 * @typedef {Object} Headers
 * @property {string} Authorization - Developer token
 * @property {string} MusicUserToken - User Token
 * @property {string} [ContentType] - Optional Content Type
 */

/**
 * Fetch Request description
 * @typedef {Object} Request
 * @property {string} [method] - optional, usually "POST"
 * @property {Headers} headers - request headers
 * @property {string} [body] - request body
 */

/**
 * Lightweight playlist for uploading
 * @typedef {Object} LitePlaylist
 * @property {string} name - Playlist name
 * @property {string} description - Playlist description
 * @property {string[]} songs - array of song catalog IDs
 */

/** 
 * Lightweight class only containing vital Song information
 * */
export class Song {
    /**
     * @param {string} id - Catalog ID
     * @param {string} name - Song name
     * @param {string} artist - Artist name
     * @param {Genres[]} genres - array of genre objects
     * @param {string[]} subgenres - array of subgenre names
     * @param {string} previewUrl - URL for the song preview snippet
     * @param {string} artworkUrl - URL for the song artwork
     * @param {number} durationInMillis - Song duration in milliseconds
     */
    constructor(id, name, artist, genres, subgenres, previewUrl, artworkUrl, durationInMillis) {
        // check that we have good vars; previewUrl can be empty strings if not available
        if (!id || !name || !artist || !genres || !subgenres) {
            console.error("Song constructor var's are undefined");
            return;
        }

        this.id = id;
        this.name = name;
        this.artist = artist;
        this.genres = genres;
        this.subgenres = subgenres;
        this.previewUrl = previewUrl;
        this.artworkUrl = artworkUrl;
        this.durationInMillis = durationInMillis;
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

    get_songs() {
        return this.songs;
    }

    get_genre_dictionary(){
        return this.genre_dictionary;
    }

    get_subgenre_dictionary(){
        return this.subgenre_dictionary;
    }
}

/**
 * Dictionary interface
 * */
class Dictionary{
    /**
     * PROTECTED
     */
    _dictionary;

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
     * Create a GenreDictionary object
     */
    static create(genres){
        let dictionary = new this();
        dictionary.add(genres);
        return dictionary;
    }

    /**
     * Accessor function to get copy of the dictionary
     * @returns {Record<string, number>} dictionary
     */
    get(){
        let copy = Object.entries(this._dictionary);
        return copy;
    }

    /**
     * IMPLEMENTED BY CHILDREN | Adds genres to the dictionary if not already included
     */
    add(genres){
        throw new Error("add(genres) MUST BE IMPLEMENTED BY CHILDREN")
    }
}

/**
 * Genre Dictionary | [name] = id
 * @extends Dictionary
 */
export class GenreDictionary extends Dictionary{
    /**
     * Adds genres to the dictionary if not already included (dictionary[name] = id)
     * @param {Genres[]} genres - array of Genres objects
     */
    add(genres){
        if(genres.length === 0) return;

        genres.filter(genre => genre.attributes.name != "Music").forEach(genre => this._dictionary[genre.attributes.name] = genre.id);
    }

    /**
     * Returns genre ID from the dictionary given a genre name
     * @param {string} genre_name - looked up in genreDictionary
     * @returns {string} genre ID
     */
    get_id(genre_name){
        let id = undefined;
        id = this._dictionary[genre_name];
        return id;
    }
}

/**
 * Subgenre Dictionary | [name] = frequency count
 * @extends Dictionary
 */
export class SubgenreDictionary extends Dictionary{
    /**
     * Adds subgenres to the dictionary if not already included (dictionary[name] = 1 if exists)
     * @param {string[]} subgenres - array of subgenre names
     */
    add(subgenres){
        if(subgenres.length === 0) return;

        subgenres.filter(subgenre => subgenre != "Music").forEach(subgenre => {
            if(this._dictionary[subgenre] == undefined) this._dictionary[subgenre] = 1;
            else this._dictionary[subgenre]++;
        });
    }

    /**
     * Returns true if subgenre exists in the dictionary
     * @param {string} subgenre_name - looked up in subgenreDictionary
     * @returns {boolean} true if subgenre exists
     */
    exists(subgenre_name){
        let exists = false;
        exists = this._dictionary[subgenre_name] != undefined;
        return exists;
    }

    /**
     * Removes keys from SubgenreDictionary if present in GenreDictionary
     * @param {string[]} genres - GenreDictionary keys
     */
    clean(genres){
        let subgenres = Object.keys(this._dictionary);
        let duplicateKeys = genres.filter(genre => subgenres.includes(genre));
            
        for(let i = 0; i < duplicateKeys.length; i++){
            delete this._dictionary[duplicateKeys[i]];
        }
    }

    /**
     * Deletes genres that do not meet a frequency threshold
     * @param {number} threshold - minimum frequency count
     */
    hide_below(threshold){
        let subgenres = Object.keys(this._dictionary);
        subgenres.forEach(subgenre => {
            if(this._dictionary[subgenre] < threshold) delete this._dictionary[subgenre];
        });
    }

    /**
     * Unhides all hidden entries
     */
    unhide_all(){
        let subgenres = Object.keys(this._dictionary);
        subgenres.forEach(subgenre => {
            if(this._dictionary[subgenre] < 0) this._dictionary[subgenre] *= -1;
        });
    }

    /**
     * Gets subgenres with main genre included in the name
     * @param {string} genre_name - genre name
     * @returns {string[]} array of subgenre names with genre_name included (ex: "Rock" -> "Rock & Roll")
     */
    get_subgenres_of(genre_name){
        let subgenres = Object.keys(this._dictionary).filter(subgenre => subgenre.includes(genre_name));
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
     * This class is not meant to be instantiated
     */
    constructor() {
        throw new Error("This class cannot be instantiated.");
    }

    /**
     * Bloat reducer, API call
     * @param {string} url
     * @param {Request} request
     * @returns {Promise<Response>} Response object
     */
    static async fetch_data(url, request){
        const response = await fetch(url, request);
        return response;
    }

    /**
     * Bloat reducer; used to retrieve data from Apple API
     * @param {string} developerToken
     * @param {string} userToken
     * @returns {Request} Formatted Request
     */
    static retrieve_data_request(developerToken, userToken){
        return {
            headers: {
                "Authorization": 'Bearer ' + developerToken,
                "Music-User-Token": userToken
            }
        };
    }

    /**
     * Bloat reducer; used to send data to Apple API
     * @param {string} developerToken
     * @param {string} userToken
     * @param {Object} body
     * @returns {Request} Formatted Request
     */
    static send_data_request(developerToken, userToken, body){
        return {
            method: 'POST',
            headers: {
                "Authorization": 'Bearer ' + developerToken,
                "Music-User-Token": userToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        };
    }
}

/*
///////////////////////////////////////////////////////////////
// RETRIEVAL FUNCTIONS THAT COMMUNICATE WITH APPLE MUSIC API //
///////////////////////////////////////////////////////////////
*/

/**
 * Interface to retrieve user data
 */
export class DataFetchers{
    /**
     * This class is not meant to be instantiated.
     */
    constructor() {
        throw new Error("This class cannot be instantiated.");
    }

    /**
     * Gets all users' songs, genres and subgenres
     * @param {string} developerToken - Developer Token
     * @param {string} userToken - Apple Music User Token
     * @returns {Promise<UserData>} Songs, Genres, Subgenres
     */
    static async get_all_user_data(developerToken, userToken){
        const request = InteractAPI.retrieve_data_request(developerToken, userToken);

        let songs = await SongDataFetchers.get_all_songs(request);

        let genres = Array.from(
            new Map(songs.flatMap(song => song.genres).map(genre => [genre.id, genre])).values()
        );
        let genre_dictionary = GenreDictionary.create(genres)

        let subgenre_dictionary = SubgenreDictionary.create(songs.map(song => song.subgenres).flat());
        subgenre_dictionary.clean(genres.map(genre => genre.attributes.name)); // delete subgenres that are also genres
        let threshold = songs.length * 0.05; // will remove subgenres present in less than 5% of songs, these are usually useless
        threshold = (threshold * (threshold < 15)) + (15 * (threshold >= 15)); // my attempt at branchless programming lol, maxes threshold at 15
        subgenre_dictionary.hide_below(threshold);

        return new UserData(songs, genre_dictionary, subgenre_dictionary);
    }

    /**
     * Gets n most recently played songs
     * @param {number} limit - number of songs to retrieve
     * @param {string} developerToken - Apple Music Developer Token
     * @param {string} userToken - Apple Music User Token
     * @returns {Promise<Songs[]>} array of Songs objects
     */
    static async get_user_recently_played(limit, developerToken, userToken){
        const request = InteractAPI.retrieve_data_request(developerToken, userToken);

        if(limit <= 0) return [];
        else if(limit > 100) limit = 100;

        const result = await SongDataFetchers.get_recently_played(limit, request);
        return result;
    }
}

/**
 * Interface to send user data
 */
export class DataSenders{
    /**
     * This class is not meant to be instantiated.
     */
    constructor() {
        throw new Error("This class cannot be instantiated.");
    }

    /**
     * Adds playlist (with songs) to user library
     * @param {LitePlaylist} playlist - Playlist object
     * @param {string} developerToken - Apple Music Developer Token
     * @param {string} userToken - Apple Music User Token
     * @returns {Promise<boolean>} true if successful
     */
    static async create_user_playlist(playlist, developerToken, userToken){
        const playlist_name = playlist.name;
        const description = playlist.description;
        const song_ids = playlist.songs;
        
        const body = PlaylistDataSenders.create_body(playlist_name, description, song_ids);
        const request = InteractAPI.send_data_request(developerToken, userToken, body);

        // add playlist to user library
        const result = await PlaylistDataSenders.send_playlist(request);

        return result;
    }
}

/**
 * Functions to fetch users' song data
 */
export class SongDataFetchers{
    /**
     * This class is not meant to be instantiated.
     */
    constructor() {
        throw new Error("This class cannot be instantiated.");
    }

    /**
     * Returns array of user's n most recently played songs.
     * @param {number} limit - n songs to retrieve
     * @param {Request} request - fetch request info
     * @returns {Promise<Songs[]>} array of Songs objects
     */ 
    static async get_recently_played(limit, request){
        const url = "https://api.music.apple.com/v1/me/recent/played/tracks?limit=" + limit;
        console.log("Retrieving recently played songs...");

        try{
            const response = await InteractAPI.fetch_data(url, request);

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
    
            return data.data;
        } catch(error){
            console.error("Error fetching top songs: ", error);
        }
    }

    /**
     * Returns set containing all songs found in user's library and playlists.
     * @param {Request} request - fetch request info
     * @returns {Promise<Set<Song>>} array of Song objects
     */
    static async get_all_songs(request){
        const songIDs = await SongDataFetchers.get_all_song_IDs(request);
        const songs = await SongDataFetchers.get_songs(songIDs, request);
        return songs;
    }

    /**
     * Returns set containing all songs given song catalog ID array
     * @param {string[]} songIDs - array of song catalog IDs
     * @param {Request} request - fetch request info
     * @returns {Promise<Set<Song>>} set of Song objects
     */
    static async get_songs(songIDs, request){
        let url = "https://api.music.apple.com/v1/catalog/us/songs?include=genres&ids=";
        let songs = [];
        songs = await ParallelDataFetchers.get_all_songs_from("Catalog", url, request, songIDs, songIDs.length);
        return songs;
    }

    /** 
     * Returns set containing all song IDs found in user's library and playlists.
     * @param {Request} request - fetch request info
     * @returns {Promise<Set<string>>} set of song catalog IDs
     */
    static async get_all_song_IDs(request){
        // get all songs from the library section
        const librarySongIDs = await SongDataFetchers.get_all_library_song_IDs(request);
        const playlistSongIDs = await SongDataFetchers.get_all_playlist_song_IDs(request);

        // union array with no duplicates
        const allSongIDs = [...new Set([...librarySongIDs, ...playlistSongIDs])];
        
        return allSongIDs;
    }

    /**
     * Returns all song catalog ID's from all user's playlists.
     * @param {Request} request - fetch request info
     * @returns {Promise<string[]>} array of song catalog IDs
     */
    static async get_all_playlist_song_IDs(request){
        const playlistIDs = await PlaylistDataFetchers.get_all_playlist_IDs(request);
        let playlistSongIDs = [];
        
        console.log("Retrieving all song IDs from user playlists...");

        for(let i = 0; i < playlistIDs.length; i++){
            playlistSongIDs.push(await SongDataFetchers.get_playlist_song_IDs(playlistIDs[i], request));
        }

        return [...new Set(playlistSongIDs.flat())];
    }

    /**
     * Returns set of all song catalog ID's in a user's playlist.
     * @param {string} playlist_id - LibraryPlaylists ID
     * @param {Request} request - fetch request info
     * @returns {Promise<string[]>} array of song catalog IDs
     */
    static async get_playlist_song_IDs(playlist_id, request){
        const url = "https://api.music.apple.com/v1/me/library/playlists/" + playlist_id + "/tracks?limit=100&offset=";
        let result = await ParallelDataFetchers.get_all_song_IDs_from("User Playlist", url, request);
        return result;
    }

    /**
     * Returns set of all song catalog IDs in user's library.
     * @param {Request} request - fetch request info
     * @returns {Promise<string[]>} array of song catalog IDs
     */
    static async get_all_library_song_IDs(request){
        const url = "https://api.music.apple.com/v1/me/library/songs?limit=100&offset=";
        console.log("Retrieving all song IDs from user library...");
        let result = await ParallelDataFetchers.get_all_song_IDs_from("User Library", url, request);
        return result;
    }

    /**
     * Returns array of genres for a song
     * @param {string} song_id - Catalog ID of song
     * @param {Request} request - fetch request info
     * @returns {Promise<Genres>} array of Genres objects
     */
    static async get_genres(song_id, request){
        let url = "https://api.music.apple.com/v1/catalog/us/songs/" + song_id + "?include=genres";
        console.log("Retrieving genres for: " + song_id);
        try{
            const response = await InteractAPI.fetch_data(url, request);

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
     * @param {Request} request
     * @returns {string[]} array of subgenre names
     */
    static async get_subgenres(song_id, request){
        let url = "https://api.music.apple.com/v1/catalog/us/songs/" + song_id;
        console.log("Retrieving subgenres for: " + song_id);
        try{
            const response = await InteractAPI.fetch_data(url, request);

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
     * This class is not meant to be instantiated.
     */
    constructor() {
        throw new Error("This class cannot be instantiated.");
    }

    /**
     * Returns array of user's playlists - maximum size is 100 playlists
     * @param {Request} request - fetch request info
     * @returns {Promise<LibraryPlaylists[]>} array of LibraryPlaylists objects
     */
    static async get_playlists(request){
        const url = "https://api.music.apple.com/v1/me/library/playlists?limit=100";
        console.log("Retrieving playlists...");
        try{
            const response = await InteractAPI.fetch_data(url, request);

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
            
            return data.data;
        } catch(error){
            console.error("Error fetching playlists: ", error);
        }
    }

    /**
     * Returns array of all playlist IDs in user's library
     * @param {Request} request - fetch request info
     * @returns {Promise<string[]>} array of LibraryPlaylists IDs
     */
    static async get_all_playlist_IDs(request){
        let url = "https://api.music.apple.com/v1/me/library/playlists?limit=100";
        console.log("Retrieving user library playlist IDs...");
        let accumulated_playlist_IDs = [];

        try{
            accumulated_playlist_IDs = await PlaylistDataFetchers.get_playlist_IDs(url, request, accumulated_playlist_IDs);
            return [...new Set(accumulated_playlist_IDs)];
        }catch(error){
            console.error("Error fetching user library playlist IDs: ", error);
            return [];
        }
    }

    /**
     * Returns array of all playlist IDs in user's library page
     * @param {string} url - Apple API URL (used for pagination)
     * @param {Request} request - fetch request info
     * @param {string[]} accumulated_playlist_IDs - array of playlist IDs
     * @returns {Promise<Set<string>>} accumulated_playlist_IDs 
     */
    static async get_playlist_IDs(url, request, accumulated_playlist_IDs){
        try{
            while(true){
                const response = await InteractAPI.fetch_data(url, request);

                if(!response.ok){
                    if (response.status === 504) {
                        console.error("Gateway Timeout (504) - Retrying...");
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        continue;
                    }else {
                        throw new Error("HTTP Error! Status: " + response.status);
                    }
                }

                const data = await response.json();

                data.data.forEach(playlist => accumulated_playlist_IDs.push(playlist.id));
            
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
 * Functions to send users' playlist data
 */
export class PlaylistDataSenders{
    /**
     * This class is not meant to be instantiated.
     */
    constructor() {
        throw new Error("This class cannot be instantiated.");
    }

    /**
     * Send a playlist to be added to user's library
     * @param {string} playlist_name - name of playlist
     * @param {string} description - description of playlist
     * @param {string[]} song_ids - array of song catalog IDs
     * @param {string} developerToken - Apple Music Developer Token
     * @param {string} userToken - Apple Music User Token
     * @returns {Promise<boolean>} true if successful
     */
    static async send_playlist(request){
        const url = "https://api.music.apple.com/v1/me/library/playlists";

        try{
            const response = await InteractAPI.fetch_data(url, request);

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            return true;
        }catch(error){
            console.error("Error sending playlist to user library: ", error);
        }
    }

    /**
     * Creates body for POST request to add playlist to user's library
     * @param {string} playlist_name - name of playlist
     * @param {string} description - description of playlist
     * @param {string[]} song_ids - array of song catalog IDs
     * @returns {PlaylistCreationRequest} body
     */
    static create_body(playlist_name, description, song_ids){
        return {
            attributes: {
                "name": playlist_name,
                "description": description
            },
            relationships: {
                tracks: {
                    data: song_ids.map(id => ({
                        id: id, 
                        type: "songs"
                    }))
                }
            }
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
        const thread_counts = Array.from({length: upper_limit}, (_, i) => i + 1.0);
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
        let songIDsCopy = songIDs.slice();
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
     * @param {string} url - URL used in API fetch requests
     * @param {number} offset - offset used in fetch request URLs
     * @param {Request} request - fetch request info
     * @param {number} thread_count - number of threads to be used
     * @param {number} list_size - size of list to be fetched/processed
     * @returns {Promise<string, Set<string>>} array of fetch results (fulfilled?, data)
     */
    static async parallelize_using_offset(func, collection, url, offset, request, thread_count, list_size){
        let result = [];
        if(thread_count === 1){
            result = await Promise.allSettled([func(collection, url, offset+100, request, 1, list_size, [])]);
        }
        else if(thread_count === 2){
            result = await Promise.allSettled(
                [
                    func(collection, url, offset+100, request, 2, list_size, []),
                    func(collection, url, offset+200, request, 2, list_size, [])
                ]
            )
        }
        else if(thread_count === 3){
            result = await Promise.allSettled(
                [
                    func(collection, url, offset+100, request, 3, list_size, []),
                    func(collection, url, offset+200, request, 3, list_size, []),
                    func(collection, url, offset+300, request, 3, list_size, [])
                ]
            )
        }
        else if(thread_count === 4){
            result = await Promise.allSettled(
                [
                    func(collection, url, offset+100, request, 4, list_size, []),
                    func(collection, url, offset+200, request, 4, list_size, []),
                    func(collection, url, offset+300, request, 4, list_size, []),
                    func(collection, url, offset+400, request, 4, list_size, [])
                ]
            )
        }
        else if(thread_count === 5){
            result = await Promise.allSettled(
                [  
                    func(collection, url, offset+100, request, 5, list_size, []),
                    func(collection, url, offset+200, request, 5, list_size, []),
                    func(collection, url, offset+300, request, 5, list_size, []),
                    func(collection, url, offset+400, request, 5, list_size, []),
                    func(collection, url, offset+500, request, 5, list_size, [])
                ]
            )
        }

        return result;
    }

    /**
     * Parallelizes API fetch process when URL uses partition pagination
     * @param {function} func - function to be parallelized
     * @param {string} collection - describes where resource is being pulled from
     * @param {string} url - URL used in API fetch requests
     * @param {Request} request - fetch request info
     * @param {string[][]} partitions - array of partitions used to fetch from Apple API URL
     * @param {number} thread_count - number of threads to be used
     * @returns {Promise<string, Set<string>>} array of fetch results (fulfilled?, data)
     */
    static async parallelize_using_partitions(func, collection, url, request, partitions, thread_count){
        let result = [];

        if(thread_count === 1){
            result = await Promise.allSettled([func(collection, url, request, partitions, 0, thread_count)]);
        }
        else if(thread_count === 2){
            result = await Promise.allSettled(
                [
                    func(collection, url, request, partitions, 0, thread_count),
                    func(collection, url, request, partitions, 1, thread_count)
                ]
            )
        }
        else if(thread_count === 3){
            result = await Promise.allSettled(
                [
                    func(collection, url, request, partitions, 0, thread_count),
                    func(collection, url, request, partitions, 1, thread_count),
                    func(collection, url, request, partitions, 2, thread_count)
                ]
            )
        }
        else if(thread_count === 4){
            result = await Promise.allSettled(
                [
                    func(collection, url, request, partitions, 0, thread_count),
                    func(collection, url, request, partitions, 1, thread_count),
                    func(collection, url, request, partitions, 2, thread_count),
                    func(collection, url, request, partitions, 3, thread_count)
                ]
            )
        }
        else if(thread_count === 5){
            result = await Promise.allSettled(
                [  
                    func(collection, url, request, partitions, 0, thread_count),
                    func(collection, url, request, partitions, 1, thread_count),
                    func(collection, url, request, partitions, 2, thread_count),
                    func(collection, url, request, partitions, 3, thread_count),
                    func(collection, url, request, partitions, 4, thread_count)
                ]
            )
        }

        return result;
    }

    /**
     * Returns first page of song catalog IDs from either a library playlist or user's library
     * @param {string} collection - NOT USED, describes where resource is being pulled from
     * @param {string} url - Apple API URL
     * @param {Request} request - fetch request info
     * @param {string[]} accumulated_song_ids - array of song catalog IDs
     * @returns {Promise<Set<string>, string>} [accumulated_song_ids, playlist_size]
     */
    static async get_first_page_of(collection, url, request, accumulated_song_ids){
        try{
            const response = await InteractAPI.fetch_data(url + '0', request);

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
     * @param {Request} request - fetch request info
     * @returns {Promise<Set<string>>} set of song catalog IDs
     */
    static async get_all_song_IDs_from(collection, url, request){
        let offset = 0;
        let accumulated_song_ids = [];

        try{
            const first_page = await ParallelDataFetchers.get_first_page_of(collection, url + '0', request, []);
            const playlist_size = first_page[1];

            const thread_count_max = 5;
            const thread_count = ParallelDataFetchers.#thread_count_calculator(playlist_size, thread_count_max);
            
            let result = [];
            result = await ParallelDataFetchers.parallelize_using_offset(ParallelDataFetchers.get_song_IDs_from, collection, url, offset, request, thread_count, playlist_size);
    
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
     * @param {Request} request - fetch request info
     * @param {number} thread_count - number of threads to be used
     * @param {number} list_size - number of songs to be fetched
     * @param {string[]} accumulated_song_ids - array of song catalog IDs
     * @returns {Promise<Set<string>>} set of song catalog IDs
     */
    static async get_song_IDs_from(collection, url, offset, request, thread_count, list_size, accumulated_song_ids){
        try{
            while(true){
                const response = await InteractAPI.fetch_data(url + offset, request);

                if(!response.ok){
                    if (response.status === 504) {
                        console.error("Gateway Timeout (504) - Retrying...");
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        continue;
                    }else if(response.status === 404){
                        throw new Error(response.status)
                    }
                    else {
                        throw new Error("HTTP Error! Status: " + response.status);
                    }
                }

                const data = await response.json();
                
                accumulated_song_ids.push(...data.data.map(song=>song.attributes.playParams?.catalogId).filter(id => id != undefined));
                offset += (thread_count * 100);
                
                if(offset >= list_size){
                    return [...new Set(accumulated_song_ids)];
                }

                await new Promise(res => setTimeout(res, 300));
            }
        }catch(error){ 
            if(Number(error.message) === 404){
                return [...new Set(accumulated_song_ids)];
            }

            console.error("Error fetching song IDs from " + collection + ": " + error);
            return [];
        }
    }

    /**
     * Returns set containing all songs given song catalog ID array
     * @param {string} collection - describes where resource is being pulled from
     * @param {string} url - Apple API URL
     * @param {Request} request - fetch request info
     * @param {string[]} list - array of song catalog IDs
     * @param {number} list_size - number of songs to be fetched
     * @returns {Promise<Set<Song>>} set of Song objects
     */
    static async get_all_songs_from(collection, url, request, list, list_size){
        const max_thread_count = 5;
        const thread_count = ParallelDataFetchers.#thread_count_calculator(list_size, max_thread_count);
        const partitions = ParallelDataFetchers.#song_ids_partitioner(list);
        let accumulated_songs = [];

        try{
            let result = [];
            result = await ParallelDataFetchers.parallelize_using_partitions(ParallelDataFetchers.get_songs_from, collection, url, request, partitions, thread_count);
            result.forEach(songs => accumulated_songs.push(...songs.value.flat()));
            return [... new Set(accumulated_songs)];
        }catch(error){
            console.error("Error fetching songs from " + collection + ": ", error);
            return [];
        }
    }

    /**
     * Returns set containing all songs given song catalog ID partition.
     * @param {string} collection - describes where resource is being pulled from
     * @param {string} url - Apple API URL
     * @param {Request} request - fetch request info
     * @param {string[][]} partitions - partitions used to fetch from Apple API URL
     * @param {number} start_index - Starting partition index
     * @param {number} thread_count - number of threads to be used
     * @returns {Promise<Set<Song>>} set of Song objects
     */
    static async get_songs_from(collection, url, request, partitions, start_index, thread_count){
        let songs = [];

        try{
            for(let i = start_index; i < partitions.length; i += thread_count){
                const ids = partitions[i].join(",");

                const response = await InteractAPI.fetch_data(url + ids, request);

                if(!response.ok){
                    if (response.status === 504) {
                        console.error("Gateway Timeout (504) - Retrying...");
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        i -= thread_count;
                        continue;
                    }else {
                        throw new Error("HTTP Error! Status: " + response.status);
                    }
                }

                const data = await response.json();
                
                let genres = [];
                for(let i = 0; i < data.data.length; i++){
                    genres = data.data[i].relationships.genres.data.map(genre => ({
                        id: genre.id,
                        attributes: {
                            name: genre.attributes.name
                        }
                    }));

                    // Extract preview URL from attributes.previews (if available) - Issa
                    const previewUrl = (data.data[i].attributes.previews && data.data[i].attributes.previews.length > 0)
                      ? data.data[i].attributes.previews[0].url 
                      : "";

                    // Extract artwork URL from attributes.artwork (if available) - Issa
                    let artworkUrl = "";
                    if (data.data[i].attributes.artwork) {
                        const artwork = data.data[i].attributes.artwork;
                        // Create URL with 100x100 dimensions (can be adjusted as needed)
                        artworkUrl = artwork.url.replace('{w}', '100').replace('{h}', '100');
                    }
                    
                    songs.push(new Song(
                      data.data[i].id, 
                      data.data[i].attributes.name, 
                      data.data[i].attributes.artistName, 
                      genres, 
                      data.data[i].attributes.genreNames,
                      previewUrl,
                      artworkUrl,
                      data.data[i].attributes.durationInMillis
                    ));
                }
            }

            return [...new Set(songs)];
        }catch(error){
            console.error("Error fetching songs from " + collection + ": ", error);
            return [];
        }
    }
}
