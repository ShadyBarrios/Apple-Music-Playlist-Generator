from backend import BackendGenerator

def main():
    # Create backend generator
    backend = BackendGenerator("link")
    backend.TEMPsetVariables()
    
    for i in backend.getSongs():
        print("Song: " + i.name + ", with: ", end="")
        for j in i.genres:
            print(j + ", ", end="")
        print()
        
    print("\nGenres: ", end="")
    for i in backend.getGenres():
        print(i + ", ", end="")
    print()

# only run main when its fr
if __name__ == "__main__":
    main()