from backend import BackendGenerator

def DEBUG_backendPrint(backend):
    print("\nGenres: ", end="")
    for i in backend.getGenres():
        print(i + ", ", end="")
    print()

    for i in backend.getSongs():
        print("Song: " + i.name + ", with: ", end="")
        for j in i.genres:
            print(j + ", ", end="")
        print()

    print()

def DEBUG_playlistPrint(playlist):
    print("Playlist: " + playlist.name)
    print("\tDescription:" + playlist.description)

    print("\tFilters: ", end="")
    for i in playlist.filters:
        print(i + ", ", end="")
    
    print("\tSongs: ", end="")
    for i in playlist.songs:
        print(i.name + ", ", end="")
    
    print("\n")

def main():
    # Create backend generator
    backend = BackendGenerator("link")
    backend.TEMPsetVariables()

    DEBUG_backendPrint(backend)

    # make a playlist
    testFilters1 = ["Rock"]
    testFilters2 = ["Alternative"]
    testFilters3 = ["FakeGenre"]

    backend.createPlaylist("rock playlist", testFilters1)
    backend.createPlaylist("alt playlist", testFilters2)
    backend.createPlaylist("fake playlist", testFilters3)
    print()
    for i in backend.generatedPaylists:
        DEBUG_playlistPrint(i)

# only run main when its fr
if __name__ == "__main__":
    main()