developerToken = "eyJhbGciOiJFUzI1NiIsImtpZCI6Iks3N003Q0Q3VVciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiIyUTJLTUo1Mjk1IiwiaWF0IjoxNzM4MTU1MDUxLCJleHAiOjE3NTM5MzIwNTF9.wUBzRPzu2MJ0QYgLUm8XpOXgnpcySWqoSZzLkmUGHKVIoKy77vJfUpzmgE-bp-m8FVDAHj8O2bzjqxmB8qdLxw"
userToken = "AlLe4L3iXChGjyf4RQXdJ2Kqm6Y9MqN2b/ArL1owtg4TQm/DHcymgUxCh4y42MXK6GAysfrUwHpAzScihOWCyFO86M7d4WOZjpJaOLQHN+mJoZEoSa2pk38ACwZ5BSJvqdlBHS8OL56yGR6XVtjcG1b2GLPJMKe0+PNbOucFucvS2sHYsgx6YHTI0wnPLbdAIrXWtNEV8j/VvbcfJsvA3o8JbbupUdhDNE0kAg2FCIoElPHVKQ=="
let genreDictionary = {}

function get_headers(){
    return {
        "Authorization": 'Bearer ' + developerToken,
        "Music-User-Token": userToken
    }
}

async function add_to_genre_dictionary(genres){
    genres.forEach(genre => {
        genreDictionary[genre.attributes.name] = genre.id;
    })
}

async function display_user_playlists(){
    let playlists = await get_user_playlists();
    let output = "10 or less of your playlists: \n";
    playlists.data.forEach((playlist, index) => {
        output += "\n" + (index + 1) + ". " + (playlist.attributes.name);
    });
    document.getElementById("playlists").innerText = output;
}

async function display_user_recently_played(){
    let songs = await get_user_recently_played();
    let output = "10 of your most recently played songs: \n";
    songs.data.forEach((song, index) => {
        output += "\n" + (index + 1) + ". " + (song.attributes.name) + " by " + (song.attributes.artistName) + " | Genres: " + (song.attributes.genreNames);
    });
    document.getElementById("recently_played").innerText = output;
}

async function display_genre_dictionary(){
    let output = "Genres in your recently played songs: \n";
    for(const genre in genreDictionary){
        output += "\n" + genre + " | " + genreDictionary[genre];
    }
    document.getElementById("genre_dictionary").innerText = output;
}

async function display_genre_id(){
    const genre_name = document.getElementById("input_genre_name").value;
    const id = await get_genre_id(genre_name);
    let output = "ID for genre: " + genre_name + " = " + id;
    document.getElementById("genre_id").innerText = output;
}

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

async function get_user_playlists(){
    const url = "https://api.music.apple.com/v1/me/library/playlists?limit=10";
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
        
        return data;
    } catch(error){
        console.error("Error fetching playlists: ", error);
    }
}

async function get_user_recently_played(){
    const url = "https://api.music.apple.com/v1/me/recent/played/tracks?limit=10";
    console.log("Retrieving recently played songs...")
    try{
        const response = await fetch(url, {
            headers:{
                "Authorization": 'Bearer ' + developerToken,
                "Music-User-Token": userToken
            }
        });

        if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

        const data = await response.json();
        for(let i = 0; i < data.data.length; i++){
            let genres = await get_genres(data.data[i].id, data.data[i].attributes.name);
            add_to_genre_dictionary(genres);
        }
        return data;
    } catch(error){
        console.error("Error fetching top songs: ", error);
    }
}

async function get_genres(song_id, song_name){
    let url = "https://api.music.apple.com/v1/catalog/us/songs/" + song_id + "?include=genres";
    console.log("Retrieving genres for: " + song_name);
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

async function get_genre_id(genre_name){
    const id = genreDictionary[genre_name];
    console.log("Searching dictionary for ID of " + genre_name);
    if(id == undefined){
        console.error(genre_name + " is not in genre dictionary.")
        return -1;
    }
    return id;
}

async function get_genre_song_recommendation(genre_name){
    const id = genreDictionary[genre_name];
    if(id == undefined){
        console.error("Genre input is not valid.")
        return undefined;
    }
    
    let url = "https://api.music.apple.com/v1/catalog/us/charts?genre=" + id + "&types=songs&limit=25";
    console.log("Retrieving recommendations from " + genre_name);
    try{
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