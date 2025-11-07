const API_BASE_URL = 'https://localhost:3000';

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
      // For rate limiting - capture the 429 status properly
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`
      }));
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.response = errorData;
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Corrected login function - using /user/login endpoint
export const login = async (credentials) => {
  return fetchAPI('/user/login', {
    method: 'POST',
    body: credentials
  });
};

// Your other functions remain the same
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

export const transferFunds = async (toAccountNumber, amount) => {
  const response = await fetch("/api/transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ toAccountNumber, amount }),
    credentials: "include",
  });
  return await response.json();
};

export const getPendingTransfers = async () => {
  const response = await fetch("/api/admin/pending-transfers", {
    credentials: "include",
  });
  return await response.json();
};

export const approveTransfer = async (transferId) => {
  const response = await fetch("/api/admin/approve-transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transferId }),
    credentials: "include",
  });
  return await response.json();
};

export const rejectTransfer = async (transferId, reason) => {
  const response = await fetch("/api/admin/reject-transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transferId, reason }),
    credentials: "include",
  });
  return await response.json();
};

export async function addFunds(amount) {
  return fetchAPI('/user/add-funds', {
    method: 'POST',
    body: { amount: parseFloat(amount) }
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
  checkAuth
};