const API_BASE_URL = 'http://localhost:3001'; // Use HTTP port for development

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
    
    // Check if response is JSON first
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.response = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// CORRECTED API FUNCTIONS - Use the right endpoints
export const login = async (credentials) => {
  return fetchAPI('/user/login', {
    method: 'POST',
    body: credentials
  });
};

export async function signup(userData) {
  return fetchAPI('/user/signup', {
    method: 'POST',
    body: userData
  });
}

export async function getBalance() {
  return fetchAPI('/user/balance');
}

export async function getTransfers() {
  return fetchAPI('/user/transfers');
}

// FIXED: Use correct endpoint
export const transferFunds = async (toAccountNumber, amount) => {
  return fetchAPI('/user/transfer', {
    method: 'POST',
    body: {
      toAccountNumber,
      amount: parseFloat(amount)
    }
  });
};

export async function addFunds(amount) {
  return fetchAPI('/user/add-funds', {
    method: 'POST',
    body: { amount: parseFloat(amount) }
  });
}

// Admin functions
export async function getPendingTransfers() {
  return fetchAPI('/admin/pending-transfers'); 
}

// FIXED: Correct admin endpoints
export async function approveTransfer(transferId) {
  return fetchAPI('/admin/approve-transfer', {
    method: 'POST',
    body: { transferId }
  });
}

export async function rejectTransfer(transferId, reason) {
  return fetchAPI('/admin/reject-transfer', {
    method: 'POST',
    body: { transferId, reason }
  });
}

// Test functions
export async function testConnection() {
  return fetchAPI('/health');
}

export async function testDB() {
  return fetchAPI('/test-db');
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

export const getUserTransactions = async (accountNumber) => {
  return fetchAPI(`/admin/transactions/${accountNumber}`);
};

export default {
  testConnection,
  testDB,
  signup,
  login,
  getBalance,
  getTransfers,
  transferFunds,
  addFunds,
  checkAuth,
  getPendingTransfers,
  approveTransfer,
  rejectTransfer
};