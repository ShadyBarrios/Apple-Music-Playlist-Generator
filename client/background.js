function addNotes(){
    const background = document.getElementById('animated-background');
    const musicNotes = ['♪', '♫', '♬', '♩', '♭', '♮', '♯'];
    const colors = ['rgba(252, 60, 68, 0.3)', 'rgba(252, 60, 68, 0.2)', 'rgba(252, 60, 68, 0.25)'];
    
    // Create floating music notes
    for (let i = 0; i < 20; i++) {
      const note = document.createElement('div');
      note.className = 'floating-note';
      note.textContent = musicNotes[Math.floor(Math.random() * musicNotes.length)];
      note.style.left = `${Math.random() * 100}%`;
      note.style.color = colors[Math.floor(Math.random() * colors.length)];
      note.style.animationDuration = `${15 + Math.random() * 20}s`;
      // note.style.animationDelay = `${Math.random() * 10}s`;
      background.appendChild(note);
    }
}