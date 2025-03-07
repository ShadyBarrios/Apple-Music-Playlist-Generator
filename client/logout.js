import { clearUserBackend, getUserBackend } from "./indexedDB.js";
import { UserBackend } from "./user.js";

async function logout() {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    try {
        showLoading()
        const user = await getUserBackend();
        if (!user) {
            console.error("User not found in IndexedDB");
            return;
        }

        const response = await fetch('/api-logout', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ token: user.backendUser.clientToken})});

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

        hideLoading();
        window.location.href = "login.html";
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

// Function to show loading overlay
function showLoading() {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
        loadingOverlay.classList.add("active");
    }
}

// Function to hide loading overlay
function hideLoading() {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
        loadingOverlay.classList.remove("active");
    }
}