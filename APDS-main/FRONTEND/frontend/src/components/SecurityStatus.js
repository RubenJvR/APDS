import React from "react";

export default function SecurityStatus() {
    const secure = window.location.protocol === "https:";

    return (
        <div style={{ 
            padding: "6px 10px", 
            fontSize: 14, 
            textAlign: "right"}}>
            {secure ? (
                <span style={{ color: "green" }}> Secure HTTPS Connection Enabled</span>
            ) : (
                <span style={{ color: "red" }}> Not Secure - Please use HTTPS for better security</span>
            )}
        </div>
    );
}
