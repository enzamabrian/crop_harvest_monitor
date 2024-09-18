// Function to handle the progress bar and fading out the messages
function handleMessage(id) {
    const messageElement = document.getElementById(id);
    
    // Check if the message element exists
    if (!messageElement) return;

    // Start fading out after 5 seconds
    setTimeout(() => {
        messageElement.style.transition = 'opacity 1s';
        messageElement.style.opacity = '0';

        // After fading out, hide the element
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 100); // Match this delay with the transition time
    }, 5000); // 5-second delay before fading out
}

// Call the function to handle messages after the page loads
window.onload = () => {
    // Handle error message if it exists
    if (document.getElementById('error-message')) {
        handleMessage('error-message');
    }

    // Handle success message if it exists
    if (document.getElementById('success-message')) {
        handleMessage('success-message');
    }
};






document.getElementById('logoutBtn').addEventListener('click', function() {
    window.location.href = '/logout'; // Redirect to logout route
});



document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const barsIcon = document.getElementById("barsIcon");
    const closeBtn = document.getElementById("closeBtn");

    barsIcon.addEventListener("click", function () {
        sidebar.classList.add("open");
    });

    closeBtn.addEventListener("click", function () {
        sidebar.classList.remove("open");
    });
});
