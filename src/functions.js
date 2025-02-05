/*
///////////////////////////////////////////
// GLOBAL VARIABLES AND HELPER FUNCTIONS //
///////////////////////////////////////////
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

const developerToken = "eyJhbGciOiJFUzI1NiIsImtpZCI6Iks3N003Q0Q3VVciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiIyUTJLTUo1Mjk1IiwiaWF0IjoxNzM4MTU1MDUxLCJleHAiOjE3NTM5MzIwNTF9.wUBzRPzu2MJ0QYgLUm8XpOXgnpcySWqoSZzLkmUGHKVIoKy77vJfUpzmgE-bp-m8FVDAHj8O2bzjqxmB8qdLxw";
const userToken = "AlLe4L3iXChGjyf4RQXdJ2Kqm6Y9MqN2b/ArL1owtg4TQm/DHcymgUxCh4y42MXK6GAysfrUwHpAzScihOWCyFO86M7d4WOZjpJaOLQHN+mJoZEoSa2pk38ACwZ5BSJvqdlBHS8OL56yGR6XVtjcG1b2GLPJMKe0+PNbOucFucvS2sHYsgx6YHTI0wnPLbdAIrXWtNEV8j/VvbcfJsvA3o8JbbupUdhDNE0kAg2FCIoElPHVKQ==";

/**
 * [name] = id if exists
 */
let genreDictionary = {};

/**
 * [name] = 1 if exists
 */
let subgenreDictionary = {};

/**
 * Adds genres to the genre dictionary if not already included (dictionary[name] = id)
 * @param {Genres[]} genres - array of genre objects
 */
async function add_to_genre_dictionary(genres){
    genres.forEach(genre => {
        genreDictionary[genre.attributes.name] = genre.id;
    })
}

/**
 * Adds subgenres to the subgenre dictionary if not already included (dictionary[name] = 1 if exists)
 * @param {string[]} subgenres - array of subgenre names
 */
async function add_to_subgenre_dictionary(subgenres){
    subgenres.forEach(subgenre => {
        subgenreDictionary[subgenre] = 1;
    })
}

/**
 * Partitioner splits songIDs into chunks of 300 for Apple API requests
 * @param {string[]} songIDs 
 * @returns {string[][]} array of songID partitions
 */
async function songIDs_partitioner(songIDs){
    const songIDsPartitions = [];
    while (songIDs.length) {
        songIDsPartitions.push(songIDs.splice(0, 300)); 
    }
    return songIDsPartitions;
}

/**
 * Bloat-reducing helper function for fetch requests
 * @returns headers for fetch requests
 */
function get_headers(){
    return {
        "Authorization": 'Bearer ' + developerToken,
        "Music-User-Token": userToken
    }
}
/** 
 * Lighweight class only containing vital Song information
 * */
class Song {
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

/*
////////////////////////////////////////////////
// FUNCTIONS THAT COMMUNICATE WITH INDEX.HTML //
////////////////////////////////////////////////
*/
/**
 * Displays user's playlists in the playlists <p>
 */
async function display_user_playlists(){
    let playlists = await get_user_playlists();
    let output = "100 or less of your playlists: \n";
    playlists.forEach((playlist, index) => {
        output += "\n" + (index + 1) + ". " + (playlist.attributes.name) + " | ID: " + (playlist.id);
    });
    document.getElementById("playlists").innerText = output;
}

/**
 * Displays user's recently played songs in the recently_played <p>
 */
async function display_user_recently_played(){
    let songs = await get_user_recently_played();
    let output = "10 of your most recently played songs: \n";
    songs.forEach((song, index) => {
        output += "\n" + (index + 1) + ". " + (song.attributes.name) + " by " + (song.attributes.artistName) + (" |-|-| Genres + Subgenres: ") + (song.attributes.genreNames);
    });
    document.getElementById("recently_played").innerText = output;
}

/**
 * Displays user's genre dictionary in the genre_dictionary <p>
 */
async function display_genre_dictionary(){
    let output = "Genres in your recently played songs: \n";
    for(const genre in genreDictionary){
        output += "\n" + genre + " | " + genreDictionary[genre];
    }
    document.getElementById("genre_dictionary").innerText = output;
}

/**
 * Displays user's subgenre dictionary in the subgenre_dictionary <p>
 */
async function display_subgenre_dictionary(){
    let output = "Subgenres in your recently played songs: \n";
    for(const subgenre in subgenreDictionary){
        output += "\n" + subgenre;
    }
    document.getElementById("subgenre_dictionary").innerText = output;
}

/**
 * Displays user's genre ID in the genre_id <p>
 */
async function display_genre_id(){
    const genre_name = document.getElementById("input_genre_name").value;
    const id = await get_genre_id(genre_name);
    let output = "ID for genre: " + genre_name + " = " + id;
    document.getElementById("genre_id").innerText = output;
}

/**
 * Displays user's genre-based song recommendation in the genre_recommendation <p>
 */
async function display_genre_song_recommendation(){
    const genre = document.getElementById("input_genre").value;
    const song = await get_genre_song_recommendation(genre);
    if(song == undefined){
        document.getElementById("genre_recommendation").innerText = "None found";
    }
    song_name = song.attributes.name;
    song_artist = song.attributes.artistName;
    song_genres = song.attributes.genreNames;
    output = "Recommended " + genre + " song: " + song_name + " by " + song_artist + " | Genres: " + song_genres;
    document.getElementById("genre_recommendation").innerText = output;
}

/**
 * Displays user's song count in a playlist given playlist id
 */
async function display_playlist_song_count(){
    const playlist_id = document.getElementById("input_playlist_id").value;
    const songs = await get_all_user_playlist_song_IDs(playlist_id);
    document.getElementById("playlist_songs_count").innerText = "Song count: " + songs.length;
}

/**
 * Displays user's songs in a playlist given playlist id
 */
async function display_playlist_songs(){
    const playlist_id = document.getElementById("input_playlist_id_2").value;
    const songIDs = await get_all_user_playlist_song_IDs(playlist_id);
    const songs = await get_user_songs(songIDs);
    let output = "";

    for(let i = 0; i < songs.length; i++){
        output += (i + 1) + ". Catalog ID: " + songs[i].id + " | Genres: " + songs[i].genres + " | Subgenres: " + songs[i].subgenres + "\n";
    }

    document.getElementById("playlist_songs_IDs").innerText = output;
}

/**
 * Displays user's song count from all playlists
 */
async function display_all_playlists_song_count(){
    const songs = await get_all_user_playlists_song_IDs();
    document.getElementById("all_playlists_songs_count").innerText = "Song count: " + songs.length;
}

/**
 * Displays user's library song count
 */
async function display_library_song_count(){
    const songs = await get_all_user_library_song_IDs();
    document.getElementById("library_songs_count").innerText = "Song count: " + songs.length;
}


/**
 * Displays user's song count in (library + playlists), no duplicates
 */
async function display_all_songs_count(){
    const songs = await get_all_user_song_IDs();
    document.getElementById("all_songs_count").innerText = "Song count: " + songs.length;
}

/**
 * Displays user's songs in (library + playlists), no duplicates
 */
async function display_all_songs(){
    const songIDs = await get_all_user_song_IDs();
    const songs = await get_user_songs(songIDs);
    let output = "";

    for(let i = 0; i < songs.length; i++){
        output += (i + 1) + ". Catalog ID: " + songs[i].id + " | Genres: " + songs[i].genres + " | Subgenres: " + songs[i].subgenres + "\n";
    }

    document.getElementById("all_songs").innerText = output;
}

/*
///////////////////////////////////////////////////////////////
// RETRIEVAL FUNCTIONS THAT COMMUNICATE WITH APPLE MUSIC API //
///////////////////////////////////////////////////////////////
*/

/**
 * Returns array of user's playlists - maximum size is 100 playlists
 * @returns {Promise<LibraryPlaylists[]>} array of LibraryPlaylists objects
 */
async function get_user_playlists(){
    const url = "https://api.music.apple.com/v1/me/library/playlists?limit=100";
    console.log("Retrieving playlists...")
    try{
        const response = await fetch(url, {
            headers:{
                "Authorization": 'Bearer ' + developerToken,
                "Music-User-Token": userToken
            }
        });

        if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

        const data = await response.json();
        
        return data.data;
    } catch(error){
        console.error("Error fetching playlists: ", error);
    }
}

/**
 * Returns array of user's 10 most recently played songs.
 * Updates Genre and Subgenre dictionaries.
 * @returns {Promise<Songs>} array of Songs objects
 */ 
async function get_user_recently_played(){
    const url = "https://api.music.apple.com/v1/me/recent/played/tracks?limit=10";
    console.log("Retrieving recently played songs...")
    try{
        const response = await fetch(url, {
            headers: get_headers()
        });

        if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

        const data = await response.json();
        for(let i = 0; i < data.data.length; i++){
            let genres = await get_genres(data.data[i].id);
            add_to_genre_dictionary(genres);
            add_to_subgenre_dictionary(data.data[i].attributes.genreNames);
        }

        return data.data;
    } catch(error){
        console.error("Error fetching top songs: ", error);
    }
}

/**
 * Returns array of genres for a song
 * @param {string} song_id - Catalog ID of song
 * @returns {Promise<Genres>} array of Genres objects
 */
async function get_genres(song_id){
    let url = "https://api.music.apple.com/v1/catalog/us/songs/" + song_id + "?include=genres";
    console.log("Retrieving genres for: " + song_id);
    try{
        const response = await fetch(url, {
            headers: get_headers()
        });

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
async function get_subgenres(song_id){
    let url = "https://api.music.apple.com/v1/catalog/us/songs/" + song_id;
    console.log("Retrieving subgenres for: " + song_id);
    try{
        const response = await fetch(url, {
            headers: get_headers()
        });

        if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

        const data = await response.json();
        return data.data[0].attributes.genreNames;
    }
    catch(error){
        console.error("Error fetching subgenres: ", error);
    }
}

/**
 * Returns genre ID from genreDictionary given genre name
 * @param {string} genre_name - looked up in genreDictionary
 * @returns {Promise<string>} genre ID
 */
async function get_genre_id(genre_name){
    const id = genreDictionary[genre_name];
    console.log("Searching dictionary for ID of " + genre_name);
    if(id == undefined){
        console.error(genre_name + " is not in genre dictionary.")
        return -1;
    }
    return id;
}

/**
 * Returns a random song recommendation given a genre name from Apple Music charts
 * @param {string} genre_name - looked up in genreDictionary
 * @returns {Promise<Songs>} Apple API Songs object
 */
async function get_genre_song_recommendation(genre_name){
    const id = genreDictionary[genre_name];
    let url = "https://api.music.apple.com/v1/catalog/us/charts?genre=" + id + "&types=songs&limit=25";
    console.log("Retrieving recommendations from " + genre_name);
    
    try{
        if(id == undefined) throw new Error("Genre input is not valid.");

        const response = await fetch(url, {
            headers: get_headers()
        });

        if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

        const data = await response.json();
        const songs = data.results.songs[0].data;
        if(songs.length == 0){
            console.error("No results");
        }
        const song = songs[Math.floor(Math.random() * songs.length)];
        return song;
    }catch(error){
        console.error("Error fetching genres: ", error);
    }
}

/**
 * Returns array containing all songs found in user's library and playlists.
 * @returns {Promise<Song[]>} array of Song objects
 */
async function get_all_user_songs(){
    const songIDs = await get_all_user_song_IDs();
    const songs = await get_user_songs(songIDs);
    return songs;
}

/**
 * Returns array containing all songs given song catalog ID array
 * @param {string[]} songIDs - array of song catalog IDs
 * @returns {Promise<Song[]>} array of Song objects
 */
 async function get_user_songs(songIDs){
    let url = "https://api.music.apple.com/v1/catalog/us/songs?include=genres&ids=";
    const partitions = await songIDs_partitioner(songIDs);
    let songs = [];
    console.log("Retrieving user songs...");
    try{
        for(let i = 0; i < partitions.length; i++){
            const ids = partitions[i].join(",");

            const response = await fetch(url + ids, {
                headers: get_headers()
            });

            if(!response.ok){
                if (response.status === 504) {
                    console.error("Gateway Timeout (504) - Retrying...");
                    // Retry after a delay (see below)
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    i--;
                    continue; // Retry
                }else {
                    throw new Error("HTTP Error! Status: " + response.status);
                }
            }

            const data = await response.json();

            for(let i = 0; i < data.data.length; i++){
                await add_to_genre_dictionary(data.data[i].relationships.genres.data);
                await add_to_subgenre_dictionary(data.data[i].attributes.genreNames);
                songs.push(new Song(data.data[i].id, data.data[i].relationships.genres.data.map(genre => genre.id), data.data[i].attributes.genreNames));
            }
        }
        return [...new Set(songs)];
    }catch(error){
        console.error("Error fetching songs: ", error);
    }
 }

/** 
 * Returns array containing all songs IDs found in user's library and playlists.
 * @returns {Promise<string[]>} array of song catalog IDs
 */
async function get_all_user_song_IDs(){
    // get all songs from the library section
    const librarySongIDs = await get_all_user_library_song_IDs();
    const playlistSongIDs = await get_all_user_playlists_song_IDs();

    // union array with no duplicates
    const allSongIDs = await [...new Set([...librarySongIDs, ...playlistSongIDs])];
    
    return allSongIDs;
}

/**
 * Returns array of all song catalog IDs in user's library
 * @returns {Promise<string[]>} array of song catalog IDs
 */
async function get_all_user_library_song_IDs(){
    const url = "https://api.music.apple.com/v1/me/library/songs?limit=100";
    console.log("Retrieving user library songs' IDs...");
    accumulatedSongIDs = [];
    try{
        await get_user_library_song_IDs(url, accumulatedSongIDs);
        return [...new Set(accumulatedSongIDs)];
    }catch(error){
        console.error("Error fetching user library songs' IDs: ", error);
        return [];
    }
}

/**
 * Returns array of song catalog IDs in user's library page
 * @param {string} url - Apple API URL (used for pagination)
 * @param {string[]} accumulatedSongIDs - array of song catalog IDs
 * @returns {Promise<string[]>} accumulatedSongIDs
 */
async function get_user_library_song_IDs(url, accumulatedSongIDs){
    try{
        while(true){
            const response = await fetch(url, {
                headers: get_headers()
            });

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

            /** @type {LibrarySongs[]} */ 
            data.data.forEach(song=>accumulatedSongIDs.push(song.attributes.playParams?.catalogId));

            if(data.next){
                url = "https://api.music.apple.com" + data.next + "&limit=100";
                continue;
            }
            else{
                return [...new Set(accumulatedSongIDs)];
            }
        }
    }catch(error){
        console.error("Error fetching user library songs' IDs: ", error);
        return [];
    }
}

/**
 * Returns all song catalog ID's from all user's playlists
 * @param {string} playlist_id - LibraryPlaylists ID
 * @returns {string[]} array of song catalog IDs
 */
async function get_all_user_playlists_song_IDs(){
    const playlistIDs = await get_all_user_playlist_IDs();
    let playlistSongIDs = [];
    for(let i = 0; i < playlistIDs.length; i++){
        playlistSongIDs.push(await get_all_user_playlist_song_IDs(playlistIDs[i]));
    }
    return [...new Set(playlistSongIDs.flat())];
}


/**
 * Returns array of all playlist IDs in user's library
 * @returns {Promise<string[]>} array of LibraryPlaylists IDs
 */
async function get_all_user_playlist_IDs(){
    let url = "https://api.music.apple.com/v1/me/library/playlists?limit=100";
    console.log("Retrieving user library playlist IDs...");
    accumulatedPlaylistIDs = [];
    try{
        await get_user_playlist_IDs(url, accumulatedPlaylistIDs);
        return accumulatedPlaylistIDs;
    }catch(error){
        console.error("Error fetching user library playlist IDs: ", error);
        return [];
    }
}

/**
 * Returns array of all playlist IDs in user's library page
 * @param {string} url - Apple API URL (used for pagination)
 * @param {string[]} accumulatedPlaylistIDs - array of LibraryPlaylists IDs
 * @returns {Promise<string[]>} aaccumulatedPlaylistIDs
 */
async function get_user_playlist_IDs(url, accumulatedPlaylistIDs){
    try{
        while(true){
            const response = await fetch(url, {
                headers: get_headers()
            });

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
            data.data.forEach(playlist=>accumulatedPlaylistIDs.push(playlist.id));
        
            if(data.next){
                url = "https://api.music.apple.com" + data.next + "&limit=100";
                continue;
            }
            else{
                return [...new Set(accumulatedPlaylistIDs)];
            }
        }
    }catch(error){
        console.error("Error fetching user library playlist IDs: ", error);
        return [];
    }
}

/**
 * Returns all song catalog ID's in a user's playlist
 * @param {string} playlist_id - LibraryPlaylists ID
 * @returns {string[]} array of song catalog IDs
 */
async function get_all_user_playlist_song_IDs(playlist_id){
    const url = "https://api.music.apple.com/v1/me/library/playlists/" + playlist_id + "/tracks?limit=100&offset=";
    let offset = 0;
    accumulatedSongIDs = [];
    console.log("Retrieving user playlist songs' IDs...");

    try{
        await get_user_playlist_song_IDs(url, offset, accumulatedSongIDs);
        return [...new Set(accumulatedSongIDs)];
    }catch(error){
        console.error("Error fetching user playlist songs' IDs: ", error);
        return [];
    }
}

/**
 * Return at most 100 song catalog IDs from a library playlist, based on offset
 * @param {string} url - Apple API URL
 * @param {number} offset - Apple API offset
 * @param {string[]} accumulatedSongIDs - array of song catalog IDs
 * @returns {Promise<string[]>} accumulatedSongIDs
 */
async function get_user_playlist_song_IDs(url, offset, accumulatedSongIDs){
    try{
        while(true){
            const response = await fetch(url + offset, {
                headers: get_headers()
            });

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
            
            /** @type {LibrarySongs[]} */ 
            data.data.forEach(song=>accumulatedSongIDs.push(song.attributes.playParams?.catalogId));
            
            if(data.next){
                offset += 100;
                continue;
            }
            else{
                return [...new Set(accumulatedSongIDs)];
            }
        }
    }catch(error){  
        console.error("Error fetching user playlist songs' IDs: ", error);
        return [];
    }
}