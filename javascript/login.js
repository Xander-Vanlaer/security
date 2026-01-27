document.getElementById("loginForm").addEventListener("submit", async function (event) { 
    event.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const p_username = document.getElementById("invalid_user");
    const p_password = document.getElementById("invalid_pass");
    p_username.textContent = "";
    p_password.textContent = "";
    
    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            console.info("Logged in successfully");
            getDashboard();
        } else {
            const error = await response.json();
            console.error("Login failed:", error.detail);
            p_password.textContent = "Invalid: " + error.detail;
        }
    } catch (error) {
        console.error("Error:", error);
        p_username.textContent = "Error connecting to server";
    }
});

function getDashboard() {
    window.location.replace("dashboard.html");
}