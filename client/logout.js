import { clearUserBackend } from "./indexedDB.js";
import { UserBackend } from "./user.js";

async function logout() {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    try {
        console.log("Logging out...");

        // Call backend logout API to clear session
        const response = await fetch('/api-logout', { method: 'POST' });

        if (!response.ok) {
            console.error("Failed to log out from server");
        } else {
            console.log("Logged out from server");
        }

        // Clear IndexedDB
        await clearUserBackend();
        console.log("Cleared IndexedDB");

        // Log out of Apple MusicKit
        if (window.MusicKit && MusicKit.getInstance()) {
            await MusicKit.getInstance().unauthorize();
            console.log("Logged out from Apple Music");
        }

        // Redirect to login page
        //window.location.href = "login.html";
    } catch (error) {
        console.error("Error during logout:", error);
    }
}

// Attach event listener to the logout button
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout");

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    } else {
        console.error("Logout button not found");
    }
});
