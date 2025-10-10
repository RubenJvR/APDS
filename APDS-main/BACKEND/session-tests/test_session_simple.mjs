
import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

const BASE = "https://localhost:3000"; 
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // dev only: allow self-signed certs

async function run() {
  try {
    // Victim logs in
    const victimJar = new CookieJar();
    const victim = wrapper(axios.create({
      baseURL: BASE,
      jar: victimJar,
      withCredentials: true,
      headers: { "User-Agent": "VictimBrowser/1.0" }
    }));

    console.log("→ Victim: logging in...");
    const loginResp = await victim.post("/user/login", {
      name: "alice",
      accountNumber: "1111",  
      password: "2b$10$lSthbQiDHi8QSWGA6H8OVuIF0lrw13Mu/A96v.tAmwDi193ZFXpem"
    });
    console.log("Victim login status:", loginResp.status, "-", loginResp.data?.message || "");

    // Extract session cookie
    const cookies = await victimJar.getCookies(BASE);
    const sessionCookie = cookies.find(c => /session|sid|connect\.sid/i.test(c.key));
    if (!sessionCookie) {
      console.error("ERROR: No session cookie found. Check your login route and cookie name.");
      return;
    }
    console.log("Captured cookie:", sessionCookie.cookieString());

    // Attacker sets the same cookie but uses different UA
    const attackerJar = new CookieJar();
    await attackerJar.setCookie(sessionCookie.cookieString(), BASE);

    const attacker = wrapper(axios.create({
      baseURL: BASE,
      jar: attackerJar,
      withCredentials: true,
      headers: { "User-Agent": "AttackerBot/9.9" } // different UA -> should trigger detection
    }));

    console.log("→ Attacker: attempting access to protected route...");
    
    const resp = await attacker.get("/post");
    console.log("❌ ATTACKER ALLOWED (bad):", resp.status, resp.data);
  } catch (err) {
    // expected path when protection works: server returns 401/403, err.response exists
    if (err.response) {
      console.log("✅ Attack blocked as expected.");
      console.log("Server response:", err.response.status, "-", err.response.data);
    } else {
      console.error("Test error:", err.message);
    }
  }
}

run();
