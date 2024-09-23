const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const submitBtn = document.getElementById('submit-btn');

// Password strength conditions
const lowercaseCondition = document.getElementById('lowercase');
const uppercaseCondition = document.getElementById('uppercase');
const numberCondition = document.getElementById('number');
const specialCondition = document.getElementById('special');
const lengthCondition = document.getElementById('length');

passwordInput.addEventListener('input', validatePassword);
confirmPasswordInput.addEventListener('input', validatePassword);

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});

toggleConfirmPassword.addEventListener('click', function () {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});

function validatePassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Password validation checks
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const hasLength = password.length >= 6;

    // Update the conditions list with checkmarks
    updateCondition(lowercaseCondition, hasLowercase);
    updateCondition(uppercaseCondition, hasUppercase);
    updateCondition(numberCondition, hasNumber);
    updateCondition(specialCondition, hasSpecial);
    updateCondition(lengthCondition, hasLength);

    // Check if all conditions are met and passwords match
    const allConditionsMet = hasLowercase && hasUppercase && hasNumber && hasSpecial && hasLength;
    const passwordsMatch = password === confirmPassword;

    // Enable/disable submit button
    submitBtn.disabled = !(allConditionsMet && passwordsMatch);
}

function updateCondition(element, isValid) {
    const icon = element.querySelector('i');
    if (isValid) {
        icon.classList.remove('fa-times-circle');
        icon.classList.add('fa-check-circle');
        element.classList.add('valid');
        element.classList.remove('invalid');
    } else {
        icon.classList.remove('fa-check-circle');
        icon.classList.add('fa-times-circle');
        element.classList.remove('valid');
        element.classList.add('invalid');
    }
}
