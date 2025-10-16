// frontend/src/api.js
const BASE_URL = "https://localhost:3000/user"; // or http://localhost:3000 if using HTTP

export async function signup(userData) {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
}

export async function login(credentials) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    credentials: "include", // to include httpOnly cookie
  });
  return res.json();
}

export async function addFunds(amount) {
  const res = await fetch(`${BASE_URL}/add-funds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
    credentials: "include",
  });
  return res.json();
}

export async function transferFunds(toAccountNumber, amount) {
  const res = await fetch(`${BASE_URL}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toAccountNumber, amount }),
    credentials: "include",
  });
  return res.json();
}
