document.getElementById('showFormButton').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'block';
});

document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

document.getElementById('requestForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const messageDiv = document.getElementById('message');
    const email = localStorage.getItem('email');
    const name = document.getElementById('name').value.trim();
    const contactInformation = document.getElementById('contact').value.trim();
    const requestType = document.getElementById('requestType').value.trim().toLowerCase();
    const description = document.getElementById('description').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const location = document.getElementById('location').value.trim();

    const requestData = { name, contactInformation, requestType, description, quantity, location, email };
    console.log("Request Data:", requestData);

    try {
        const response = await fetch('/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.innerText = `Request submitted successfully! You requested ${quantity} ${requestType}.`;
            messageDiv.classList.add('success');
            messageDiv.classList.remove('error');
            document.getElementById('modal').style.display = 'none';
        } else {
            messageDiv.innerText = `Error: ${result.message}`;
            messageDiv.classList.add('error');
            messageDiv.classList.remove('success');
        }
    } catch (error) {
        messageDiv.innerText = `Error: ${error.message}`;
        messageDiv.classList.add('error');
        messageDiv.classList.remove('success');
    }

    document.getElementById('requestForm').reset();
    setTimeout(() => {
        messageDiv.innerText = '';
        messageDiv.classList.remove('success', 'error');
    }, 5000);
});