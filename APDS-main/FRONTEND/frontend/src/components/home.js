import { useEffect, useState } from "react";
import { testConnection, getBalance } from "../api";

export default function Home() {
  const [status, setStatus] = useState("Checking server connection...");
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    async function checkServer() {
      try {
        await testConnection();
        setStatus("✅ Server is connected and running!");
        
        // Try to get balance if logged in
        try {
          const balanceData = await getBalance();
          setBalance(balanceData);
        } catch (error) {
          // Not logged in - this is normal
          console.log("User not logged in");
        }
      } catch (error) {
        setStatus("❌ Cannot connect to server: " + error.message);
      }
    }
    checkServer();
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Welcome to MyBank</h2>
      
      <p style={{ 
        color: status.includes("✅") ? "#28a745" : "#dc3545",
        textAlign: "center",
        fontSize: "1.1em",
        fontWeight: "bold"
      }}>
        {status}
      </p>

      {balance && (
        <div style={{
          border: "2px solid #d4af37",
          borderRadius: "8px",
          padding: "20px",
          marginTop: "20px",
          backgroundColor: "#f8f9fa"
        }}>
          <h3 style={{ 
            color: "#d4af37", 
            marginBottom: "15px",
            textAlign: "center"
          }}>
            Your Account
          </h3>
          <p style={{ 
            fontSize: "1.2em",
            textAlign: "center",
            margin: 0
          }}>
            <strong style={{ color: "#333" }}>Current Balance:</strong> 
            <span style={{ 
              color: "#28a745", 
              fontWeight: "bold",
              marginLeft: "8px"
            }}>
              R {balance.balance?.toFixed(2) || '0.00'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}