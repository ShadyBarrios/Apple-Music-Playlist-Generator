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
    def __init__(self, filters):
        self.songs = []
        self.name = "playlist"
        self.description = "description"
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
        
        tempSongs = [Song("song1", "songLink", True, 50, ["Rock", "Indie"]),
                     Song("song2", "songLink", False, 20, ["Rock", "Alternative"]),
                     Song("song3", "songLink", False, 20, ["Rap", "Alternative"])]
        
        for i in tempSongs:
            self.songs.add(i)
        
        for i in self.songs:
            for j in i.genres:
                self.genres.add(j)

    def getSongs(self):
        return self.songs

    def getGenres(self):
        return self.genres
        


        

