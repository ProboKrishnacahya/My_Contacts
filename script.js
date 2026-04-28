// Initialize data from local storage
let contacts = JSON.parse(localStorage.getItem('contacts')) || [];

// Cache the DOM elements to prevent repeated querying
const contactList = document.getElementById('contactList');
const contactCount = document.getElementById('contactCount');
const modal = document.getElementById('modal');
const createContactButton = document.getElementById('createContactButton');
const closeModal = document.getElementById('closeModal');
const contactForm = document.getElementById('contactForm');
const contactIdInput = document.getElementById('contactId');
const modalTitle = document.getElementById('modalTitle');

// Prevent XSS attacks by escaping HTML characters from user input
const escapeHTML = (str) => {
    // Return empty string if str is null or undefined to prevent errors when calling replace on non-string values
    if (!str) return '';
    // Replace special characters with their corresponding HTML entities to prevent them from being interpreted as HTML tags or attributes
    return str.replace(/[&<>'"]/g, (tag) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
};

// Backward compatibility for existing data: add unique ID if missing
contacts = contacts.map(c => c.id ? c : { ...c, id: Date.now().toString() + Math.random().toString(36).slice(2) });

// Save contacts to local storage
const saveContacts = () => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
};

// Render contacts to the UI. This will be called every time the create, update, and/or delete a contact is executed
const renderContacts = () => {
    // Update the contact count based on the saved pairs in local storage
    contactCount.textContent = contacts.length === 0
        ? "Belum ada kontak tersimpan"
        : `${contacts.length} kontak tersimpan`;

    // Loop through the contacts and create a card for each with sanitized input
    contactList.innerHTML = contacts.map((contact) => `
        <div class="flex flex-col justify-between gap-4 p-4 rounded-2xl border border-neutral-300 bg-white">
            <h3>${escapeHTML(contact.name)}</h3>
            <div class="flex flex-col gap-1">
                <a href="tel:${escapeHTML(contact.phone)}" class="flex items-center gap-2">
                    <i class="fa-solid fa-phone"></i>
                    ${escapeHTML(contact.phone)}
                </a>
                <a href="mailto:${escapeHTML(contact.email)}"class="flex items-center gap-2">
                    <i class="fa-solid fa-envelope"></i>
                    ${escapeHTML(contact.email) || '-'}
                </a>
            </div>
            <div class="flex flex-col md:flex-row justify-center gap-3">
                <button data-action="update" data-id="${contact.id}" class="w-full flex justify-center items-center gap-2 p-2 rounded-lg bg-amber-500 text-white">
                    <i class="fa-solid fa-pen"></i>Ubah
                </button>
                <button data-action="delete" data-id="${contact.id}" class="w-full flex justify-center items-center gap-2 p-2 rounded-lg border border-red-500 text-red-500">
                    <i class="fa-solid fa-trash"></i>Hapus
                </button>
            </div>
        </div>
    `).join('');
};

// Show modal for creating or editing a contact
const showModal = (edit = false, id = null) => {
    modal.classList.remove('hidden');

    // If edit is true, allow to change the form with renewed data
    if (edit) {
        const contact = contacts.find(c => c.id === id);
        if (!contact) return;

        contactIdInput.value = contact.id;

        // Populate form inputs
        document.getElementById('name').value = contact.name;
        document.getElementById('phone').value = contact.phone;
        document.getElementById('email').value = contact.email || '';

        modalTitle.textContent = "Ubah Kontak";
    } else {
        contactForm.reset();
        contactIdInput.value = '';
        modalTitle.textContent = "Tambah Kontak";
    }
};

// Hide modal
const hideModal = () => modal.classList.add('hidden');

// Update contact will be called when the update button is clicked
const updateContact = (id) => showModal(true, id);

// Delete contact will be called when the delete button is clicked
const deleteContact = (id) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    // Confirm before deleting the contact. If the user clicks "OK", remove the contact from the array and update local storage
    if (confirm(`Hapus kontak ${contact.name}?`)) {
        contacts = contacts.filter(c => c.id !== id);
        saveContacts();
        renderContacts();
    }
};

// Event delegation for dynamically created buttons inside contact list
contactList.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const { action, id } = button.dataset;

    if (action === 'update') updateContact(id);
    if (action === 'delete') deleteContact(id);
});

// Helper for validating input data
const validateInput = (name, phone, email) => {
    if (name.length < 3) return "Nama harus memiliki minimal 3 karakter.";
    if (/\d/.test(name)) return "Nama tidak boleh mengandung angka.";

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) return "Nomor telepon tidak valid (hanya angka, 10-15 digit).";

    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Format email tidak valid.";
    }

    return null; // Return null if all valid
};

// Event listeners for form submission and button clicks. When the form is submitted, prevent the default action and save the contact
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Modern approach using FormData API
    const formData = new FormData(e.target);
    const name = formData.get('name').trim();
    const phone = formData.get('phone').trim();
    const email = formData.get('email').trim();

    // Validate inputs
    const errorError = validateInput(name, phone, email);
    if (errorError) {
        alert(errorError);
        return; // Stop execution if validation fails
    }

    const id = contactIdInput.value;

    // If id is not empty, it means this updating an existing contact. Otherwise, create a new contact
    if (id !== '') {
        contacts = contacts.map(c => c.id === id ? { ...c, name, phone, email } : c);
    } else {
        const newContact = {
            id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(),
            name,
            phone,
            email
        };
        contacts.push(newContact);
    }

    saveContacts();
    renderContacts();
    hideModal();
});

// Event listeners for the create contact button and close modal button
createContactButton.addEventListener('click', () => showModal());
closeModal.addEventListener('click', hideModal);

// Close the modal when pressing the Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && !modal.classList.contains('hidden')) {
        hideModal();
    }
});

// Initial render
renderContacts();