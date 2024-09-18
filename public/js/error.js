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
