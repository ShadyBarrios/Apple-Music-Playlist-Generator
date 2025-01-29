
async function get_user_top_songs(){
    const url = "https://api.music.apple.com/v1/me/library/playlists?limit=10";
    console.log("here")
    try{
        const response = await fetch(url, {
            headers:{
                "Authorization": 'Bearer ' + developerToken,
                "Music-User-Token": userToken
            }
        });

        if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

        const data = await response.json();
        console.log("Your top songs: ");

        data.data.forEach((song, index) => {
            console.log((index + 1) + ". " + song.attributes.name);
        });
    } catch(error){
        console.error("Error fetching top songs: ", error);
    }

}