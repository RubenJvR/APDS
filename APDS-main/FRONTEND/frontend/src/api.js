// src/api/index.js - COMPLETE VERSION
const API_BASE_URL = 'http://localhost:3001';

// Simple fetch wrapper
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
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

// User functions
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

// Check if user is authenticated
export async function checkAuth() {
  try {
    const balance = await getBalance();
    return { authenticated: true, user: balance };
  } catch (error) {
    return { authenticated: false };
  }
}

export default {
  testConnection,
  testDB,
  signup,
  login,
  getBalance,
  getTransfers,
  transferFunds,
  addFunds,
  checkAuth
};