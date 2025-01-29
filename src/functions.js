
async function get_user_playlists(){
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
        let output = "10 or less of your playlists: \n";

        data.data.forEach((song, index) => {
            output = output + "\n" + (index + 1) + ". " + (song.attributes.name);
        });
        
        document.getElementById("playlists").innerText = output;
    } catch(error){
        console.error("Error fetching top songs: ", error);
    }

}