# Song, the most basic of objects
class Song:
    def __init__(self, name, spotifyLink, isLiked, recentPlayCount, genres):
        self.name = name
        self.spotifyLink = spotifyLink
        self.isLiked = isLiked 
        self.recentPlayCount = recentPlayCount
        self.genres = genres
    
    def isLiked(self):
        return self.isLiked
    
    def getGenres(self):
        return self.genres

# Playlist, a collection of songs
class Playlist:
    def __init__(self, songs, name, description, filters):
        self.songs = songs
        self.name = name
        self.description = description
        self.filters = filters 
    
    def getSongs(self):
        return self.songs

# BackendGenerator, generates playlists, has all information on user
class BackendGenerator:
    def __init__(self, spotifyLink):
        self.spotifyLink = spotifyLink
        self.generatedPaylists = [] # Playlist objects
        self.genres = set() # strings
        self.songs = set() # Song objects

        # do user parsing here to get songs and genres and append them to arrays
        # when creating a new song, include song information in constructor call

        # temp parse code (maybe some for loops in the future?):
        while(False):
            # get song
            genres = [] #get genres
            song = Song("link", True, 0, genres)
            
            # append to lists
            for i in genres:
                self.genres.add(i)
            
            self.songs.add(song)

    def TEMPsetVariables(self):
        print("TODO: MAKE REAL PARSING INSTEAD OF TEMP VARIABLES")
        self.spotifyLink = "link"
        
        tempSongs = [Song("Rock_Indie", "songLink", True, 50, ["Rock", "Indie"]),
                     Song("Rock_Alt", "songLink", False, 20, ["Rock", "Alternative"]),
                     Song("Rap_Alt", "songLink", False, 20, ["Rap", "Alternative"])]
        
        for i in tempSongs:
            self.songs.add(i)
            for j in i.genres:
                self.genres.add(j)

    def createPlaylist(self, playListName, filters):
        possibleSongs = set()

        # filter through the songs
        print("TODO: before we can rlly make this good we need a clear list of filters that the spotify API can give us. Currently, filters are basically just genres to include")
        for i in self.songs:
            isIncluded = False 
            for j in i.genres:
                if j in filters:
                    isIncluded = True 
                    break
            
            if isIncluded:
                possibleSongs.add(i)
        
        if len(possibleSongs) == 0:
            print("WARNING: No songs fit filters for: " + playListName)
            return 
        
        playlist = Playlist(possibleSongs, playListName, "desc", filters)
        self.generatedPaylists.append(playlist)

    def getSongs(self):
        return self.songs

    def getGenres(self):
        return self.genres
        


        

