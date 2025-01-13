SOURCES := ./src/main.cpp

make : $(SOURCES)
	g++ -g -Wall -o a.exe $(SOURCES)