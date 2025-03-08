const availableResources = [
    { type: 'Medical Supplies', quantity: 50 },
    { type: 'Food Assistance', quantity: 100 },
    { type: 'Shelter', quantity: 20 },
];

function displayResources() {
    const resourceCards = document.querySelectorAll('.resource-card');
    resourceCards.forEach(card => {
        const resourceType = card.getAttribute('data-type');
        const resource = availableResources.find(res => res.type.toLowerCase() === resourceType.toLowerCase());
        if (resource) {
            card.querySelector('p').innerText = `${resource.quantity} available`;
        }
    });
}

document.getElementById('showFormButton').addEventListener('click', function() {
    const formContainer = document.getElementById('requestFormContainer');
    formContainer.classList.add('slide-down'); // Add the "visible" class to trigger the transition
    this.style.display = 'none'; // Hide the button
});


document.getElementById('requestForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const contact = document.getElementById('contact').value;
    const requestType = document.getElementById('requestType').value;
    const description = document.getElementById('description').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const location = document.getElementById('location').value;


    const resource = availableResources.find(res => res.type.toLowerCase() === requestType.toLowerCase());

    
    if (resource && resource.quantity >= quantity) {
       
        resource.quantity -= quantity;

        document.getElementById('message').innerText = `Request submitted successfully! You requested ${quantity} ${requestType}.`;

        document.getElementById('requestForm').reset();

        displayResources();
    } else {
        
        document.getElementById('message').innerText = `Error: Not enough ${requestType} available.`;
    }
});


document.getElementById('redirectButton').addEventListener('click', function() {
    const formContainer = document.getElementById('requestFormContainer');
    formContainer.style.display = 'block'; 
    formContainer.classList.add('slide-down');
    this.style.display = 'none'; 
});

displayResources();