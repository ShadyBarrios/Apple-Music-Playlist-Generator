// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
      const request = indexedDB.open('userDatabase', 1);
      
      request.onerror = (event) => reject(event);
      request.onsuccess = (event) => resolve(event.target.result);
      
      request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('userBackend')) {
              db.createObjectStore('userBackend', { keyPath: 'id' });
          }
      };
  });
}

// Function to store userBackend object in IndexedDB
function storeUserBackend(userBackend) {
  return openDB().then(db => {
      const transaction = db.transaction('userBackend', 'readwrite');
      const store = transaction.objectStore('userBackend');
      store.put(userBackend); // Use `put` to update or insert
      return new Promise((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = (event) => reject(event);
      });
  });
}

// Function to retrieve userBackend object from IndexedDB
function getUserBackend() {
  return openDB().then(db => {
      return new Promise((resolve, reject) => {
          const transaction = db.transaction('userBackend', 'readonly');
          const store = transaction.objectStore('userBackend');
          const request = store.get(1); // assuming the `id` is `1`
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = (event) => reject(event);
      });
  });
}

// Export functions for use in other parts of your code
export { storeUserBackend, getUserBackend };


