// Function to handle the login API call
async function loginUser() {
  try {
    const response = await fetch('/api/login', {  // POST to /api/login
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    console.log('Login Response:', data.message);
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

// Adding event listener to login button
document.getElementById("login").addEventListener("click", () => {
  loginUser();  // Call the loginUser function when the login button is clicked
});
