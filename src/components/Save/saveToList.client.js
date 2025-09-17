// Client-side SaveToList functionality for static builds
import { getCurrentUser } from '../../lib/auth.js';
import { getLists, getListsContainingItem, saveItemToList, removeItemFromList, createList } from '../../lib/lists.js';
import { getStatusesForItems, setCompleted } from '../../lib/completed.js';

(async function() {
  // Get authentication state with comprehensive debugging
  async function getCurrentUserLocal() {
    try {
      // Use the same auth detection pattern as main auth system
      let authToken = null;
      
      console.log('=== SaveToList auth debug ===');
      if (typeof window !== "undefined" && "localStorage" in window) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          console.log(`SaveToList checking key: ${k}`);
          if (k && /^sb-.*-auth-token$/.test(k)) {
            const v = localStorage.getItem(k);
            if (v && v !== "null" && v !== "undefined") {
              authToken = v;
              console.log('SaveToList found auth token in key:', k);
              break;
            }
          }
        }
      }
      
      if (authToken) {
        try {
          // Parse the actual Supabase session data
          const sessionData = JSON.parse(authToken);
          const user = sessionData?.user || sessionData?.data?.user || sessionData?.session?.user;
          console.log('SaveToList auth check - found user:', user?.id, user?.email);
          return user || null;
        } catch (parseError) {
          console.error('SaveToList failed to parse auth token:', parseError);
        }
      }
      
      console.log('SaveToList auth check: no valid token');
      return null;
    } catch {
      return null;
    }
  }

  // Simple API functions using imported modules
  async function getListsLocal() {
    try {
      console.log('SaveToList: Attempting to load lists...');
      const lists = await getLists();
      console.log('SaveToList: Got lists:', lists);
      return lists;
    } catch (error) {
      console.error('SaveToList: Failed to get lists:', error);
      return [];
    }
  }

  async function getListsContainingItemLocal(itemType, itemId) {
    try {
      return await getListsContainingItem(itemType, itemId);
    } catch (error) {
      console.error('Failed to get lists containing item:', error);
      return [];
    }
  }

  async function saveItemToListLocal(listId, itemType, itemId) {
    console.log('Save item:', { listId, itemType, itemId });
    try {
      return await saveItemToList(listId, itemType, itemId);
    } catch (error) {
      console.error('Failed to save item:', error);
      return { success: false, error };
    }
  }

  async function removeItemFromListLocal(listId, itemType, itemId) {
    console.log('Remove item:', { listId, itemType, itemId });
    try {
      return await removeItemFromList(listId, itemType, itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
      return { success: false, error };
    }
  }

  async function createListLocal(title) {
    console.log('Create list:', title);
    try {
      return await createList(title);
    } catch (error) {
      console.error('Failed to create list:', error);
      return { success: false, error };
    }
  }

  async function getCompletedStatusLocal(itemType, itemId) {
    console.log('Get status:', { itemType, itemId });
    try {
      const statuses = await getStatusesForItems([{ item_type: itemType, item_id: itemId }]);
      const key = `${itemType}:${itemId}`;
      const status = statuses[key];
      return { is_completed: status ? status.is_completed : false };
    } catch (error) {
      console.error('Failed to get completed status:', error);
      return { is_completed: false };
    }
  }

  async function setCompletedLocal(itemType, itemId, isCompleted) {
    console.log('Set completed:', { itemType, itemId, isCompleted });
    try {
      const result = await setCompleted(itemType, itemId, isCompleted);
      return { success: !!result, data: result };
    } catch (error) {
      console.error('Failed to set completed status:', error);
      return { success: false, error };
    }
  }

  // Export functions to global scope for use by inline scripts
  window.SaveToListAPI = {
    getCurrentUser: getCurrentUserLocal,
    getLists: getListsLocal,
    getListsContainingItem: getListsContainingItemLocal,
    saveItemToList: saveItemToListLocal,
    removeItemFromList: removeItemFromListLocal,
    createList: createListLocal,
    getCompletedStatus: getCompletedStatusLocal,
    setCompleted: setCompletedLocal
  };

  console.log('SaveToList API initialized');
})();