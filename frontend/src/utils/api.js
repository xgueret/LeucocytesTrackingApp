/**
 * Fonction utilitaire pour effectuer des requêtes HTTP avec authentification JWT
 * Ajoute automatiquement le header Authorization avec le token depuis localStorage
 * Gère la déconnexion automatique en cas de token invalide (401)
 */

/**
 * Effectue une requête fetch avec authentification
 * @param {string} url - URL de la requête (relative ou absolue)
 * @param {RequestInit} options - Options fetch standard
 * @returns {Promise<Response>} - Promesse de la réponse fetch
 */
export async function fetchWithAuth(url, options = {}) {
  // Récupérer le token depuis localStorage
  const token = localStorage.getItem('access_token');

  // Créer les headers avec le token d'authentification
  const headers = {
    ...options.headers,
  };

  // Ajouter le header Authorization si un token existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Effectuer la requête avec les headers enrichis
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Si la réponse est 401 (Non autorisé), notifier le contexte d'authentification
  // qui se chargera de déconnecter proprement sans recharger la page.
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return response;
}

/**
 * Wrapper pour GET avec authentification
 * @param {string} url - URL de la requête
 * @returns {Promise<any>} - Données JSON parsées
 */
export async function fetchGet(url) {
  const response = await fetchWithAuth(url);
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Wrapper pour POST avec authentification
 * @param {string} url - URL de la requête
 * @param {any} data - Données à envoyer
 * @returns {Promise<any>} - Données JSON parsées
 */
export async function fetchPost(url, data) {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Erreur HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Wrapper pour PUT avec authentification
 * @param {string} url - URL de la requête
 * @param {any} data - Données à envoyer
 * @returns {Promise<any>} - Données JSON parsées
 */
export async function fetchPut(url, data) {
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Erreur HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Wrapper pour DELETE avec authentification
 * @param {string} url - URL de la requête
 * @returns {Promise<void>}
 */
export async function fetchDelete(url) {
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Erreur HTTP ${response.status}`);
  }

  // DELETE retourne 204 No Content, donc pas de JSON à parser
  if (response.status === 204) {
    return;
  }

  return response.json();
}

export default fetchWithAuth;
