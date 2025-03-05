import { clearUserBackend } from "./indexedDB.js";
import { UserBackend } from "./user.js";

async function logout() {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    try {
        console.log("Logging out...");
        
        const response = await fetch('/api-logout', { method: 'POST' });

        if (!response.ok) {
            console.error("Failed to log out from server");
        } else {
            console.log("Logged out from server");
        }

        await clearUserBackend();
        console.log("Cleared IndexedDB");

        if (window.MusicKit && MusicKit.getInstance()) {
            await MusicKit.getInstance().unauthorize();
            console.log("Logged out from Apple Music");
        }

        //window.location.href = "login.html";
    } catch (error) {
        console.error("Error during logout:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout");

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    } else {
        console.error("Logout button not found");
    }
});
