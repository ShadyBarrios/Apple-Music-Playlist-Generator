import { UserBackend } from "./user.js";

// indexedDB.js
export function storeUserBackend(userBackend) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("userDatabase", 1);
        
        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("userBackend")) {
                db.createObjectStore("userBackend", { keyPath: "id" });
            }
        };
        
        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction("userBackend", "readwrite");
            const store = transaction.objectStore("userBackend");
            userBackend.id = 1; // Ensure an ID exists
            
            store.put(userBackend);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        };
        
        request.onerror = function () {
            reject(request.error);
        };
    });
}

export function getUserBackend() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("userDatabase", 1);
        
        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction("userBackend", "readonly");
            const store = transaction.objectStore("userBackend");
            let getRequest = store.get(1);
    
            getRequest.onsuccess = function () {
                getRequest.result.backendUser = UserBackend.fromJSON(getRequest.result.backendUser);
                resolve(getRequest.result || null);
            };
            getRequest.onerror = function () {
                reject(getRequest.error);
            };
        };
        
        request.onerror = function () {
            reject(request.error);
        };
    });
}