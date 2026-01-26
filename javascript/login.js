document.getElementById("loginForm").addEventListener("submit", function (event) { 
    event.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const p_username = document.getElementById("invalid_user");
    const p_password = document.getElementById("invalid_pass");
    p_username.textContent = "";
    p_password.textContent = "";
    
    console.log("Username: ", username);
    console.log("Password: ", password);
    
    const list_users = ["Yan", "Toon", "Yannick", "Xander"];
    const list_passwords = ["231204yv", "test123!", "abc123!", "password"];
    
    console.log(list_users.includes(username));
    if (list_users.includes(username)) {
        if (password == list_passwords[list_users.indexOf(username)]) {
            console.info("Logged in");
            getDashboard();
        }
        else {
            console.error("Password: ", password, "not founded");
            p_password.textContent = "Invalid: Wrong password was given";
        }
    }
    else {
        console.error("Username: ", username, "not founded");
        p_username.textContent = "Invalid: Wrong username or user doesn't exist";
        
    }
});

function getDashboard() {
    window.location.replace("dashboard.html");
}