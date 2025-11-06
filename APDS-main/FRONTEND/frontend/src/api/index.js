const API_BASE_URL = 'https://localhost:3002';

// Request tracking to prevent duplicates
const pendingRequests = new Map();

function getRequestKey(endpoint, body) {
  return `${endpoint}-${JSON.stringify(body)}`;
}

// Enhanced fetch wrapper - FIXED error handling
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const requestKey = getRequestKey(endpoint, options.body);
  
  // Prevent duplicate requests
  if (pendingRequests.has(requestKey)) {
    throw new Error('Request already in progress');
  }
  
  pendingRequests.set(requestKey, true);
  
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    console.log(`🔄 API Call: ${config.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    
    const data = await response.json().catch(() => ({}));
    
    
    if (!response.ok) {
      // Return a proper error object that the component can handle
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    
    console.log(`✅ API Success: ${url}`, data);
    return data;
    
  } catch (error) {
    console.error(`❌ API Error: ${url}`, error.message);
    
    
    throw error;
    
  } finally {
    pendingRequests.delete(requestKey);
  }
}

// Test functions
export async function testConnection() {
  return fetchAPI('/health');
}

export async function testDB() {
  return fetchAPI('/test-db');
}

// Auth functions
export async function signup(userData) {
  return fetchAPI('/user/signup', {
    method: 'POST',
    body: userData
  });
}

export async function login(credentials) {
  return fetchAPI('/user/login', {
    method: 'POST',
    body: credentials
  });
}

export async function logout() {
  return fetchAPI('/user/logout', {
    method: 'POST'
  });
}

// Protected routes - require authentication
export async function getBalance() {
  return fetchAPI('/user/balance');
}

export async function getTransfers() {
  return fetchAPI('/user/transfers');
}

export async function transferFunds(toAccountNumber, amount) {
  return fetchAPI('/user/transfer', {
    method: 'POST',
    body: { toAccountNumber, amount: parseFloat(amount) }
  });
}

export async function addFunds(amount) {
  return fetchAPI('/user/add-funds', {
    method: 'POST',
    body: { amount: parseFloat(amount) }
  });
}

// Check if user is logged in
export async function checkAuth() {
  try {
    await getBalance();
    return true;
  } catch (error) {
    return false;
  }
}