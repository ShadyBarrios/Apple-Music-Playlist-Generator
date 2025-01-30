let genreDictionary = {}

function get_headers(){
    return {
        "Authorization": 'Bearer ' + developerToken,
        "Music-User-Token": userToken
    }
}

async function add_to_genre_dictionary(genres){
    console.log(genres);
    genres.forEach(genre => {
        genreDictionary[genre.attributes.name] = genre.id;
    })
}

async function display_user_playlists(){
    let playlists = await get_user_playlists();
    let output = "10 or less of your playlists: \n";
    playlists.data.forEach((playlist, index) => {
        output = output + "\n" + (index + 1) + ". " + (playlist.attributes.name);
    });
    console.log(output);
    document.getElementById("playlists").innerText = output;
}

async function display_user_recently_played(){
    let songs = await get_user_recently_played();
    let output = "10 of your most recently played songs: \n";
    songs.data.forEach((song, index) => {
        output = output + "\n" + (index + 1) + ". " + (song.attributes.name) + " by " + (song.attributes.artistName) + " | Genres: " + (song.attributes.genreNames);
    });
    console.log(output);
    document.getElementById("recently_played").innerText = output;
}

async function display_genre_dictionary(){
    let output = "Genres in your recently played songs: \n";
    for(const genre in genreDictionary){
        output = output + "\n" + genre + " | " + genreDictionary[genre];
    }
    console.log(output);
    document.getElementById("genre_dictionary").innerText = output;
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
            let genres = await get_genres(data.data[i].id);
            add_to_genre_dictionary(genres);
        }
        return data;
    } catch(error){
        console.error("Error fetching top songs: ", error);
    }
}

async function get_genres(song_id){
    let url = "https://api.music.apple.com/v1/catalog/us/songs/" + song_id + "?include=genres";
    console.log("Retrieving genres for song with id: " + song_id);
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

async function get_genre_id(){
        // let genre = document.getElementById("input_genre").value;
        // console.log("Genre chosen: " + genre);
        // const url = "https://api.music.apple.com/v1/catalog/us/search?term=pop&types=genres";
        // try{
        //     console.log("here1")
        //     const response = await fetch(url, {
        //         headers:{
        //             "Authorization": 'Bearer ' + developerToken,
        //             "Music-User-Token": userToken
        //         }
        //     });
        //     console.log("here2")
        //     if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);
        //     console.log("here")
        //     const data = await response.json();
        //     data.data.forEach(genre => {
        //         console.log("Genre name: " + genre.attributes.name);
        //         console.log("Genre ID: " + genre.id);
        //     });data
        // }catch(error){
        //     console.error("Error fetching genre id: ", error);
        // }
}