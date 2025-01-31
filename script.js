const firebaseConfig = {
    apiKey: "AIzaSyCvlg9kqWYWjkgKksSWplpxMMRdq385fhE",
    authDomain: "oscars-64ae7.firebaseapp.com",
    projectId: "oscars-64ae7",
    storageBucket: "oscars-64ae7.firebasestorage.app",
    messagingSenderId: "198277828229",
    appId: "1:198277828229:web:a90e3436be32486df423ec"
  };

// Import functions from the Firebase SDK
// (These come from the <script> tags in HTML, but you still need to reference them)
const app = firebase.initializeApp(firebaseConfig); 
const db = firebase.firestore(app);
fetch('nominees.json')
    .then(response => response.json())
    .then(data => displayAllCategories(data));

let userChoices = {};
let totalCategories = 0;

function displayAllCategories(data) {
    const categoriesContainer = document.getElementById("categories-container");
    totalCategories = data.categories.length;
    updateSelectionIndicator();

    data.categories.forEach(category => {
        const categorySection = document.createElement("div");
        categorySection.className = "category-section";
        categorySection.innerHTML = `<h2>${category.Title}</h2>`;

        const nomineesGrid = document.createElement("div");
        nomineesGrid.className = "nominees-grid";

        category.Nominees.forEach(nominee => {
            const nomineeCard = document.createElement("div");
            nomineeCard.className = "nominee-card";
            nomineeCard.innerHTML = `
                <img src="${nominee.imgsrc || '/img/default.png'}" alt="${nominee.title}">
                <p>${nominee.title}</p>
                ${nominee.movie ? `<p class="movie-title">(${nominee.movie})</p>` : ""}
                ${nominee.link ? `<a href="${nominee.link}" target="_blank" class="read-more">Read more</a>` : ""}
            `;

            nomineeCard.addEventListener("click", () => {
                selectNominee(nomineeCard, category.Title, nominee);
            });

            nomineesGrid.appendChild(nomineeCard);
        });

        categorySection.appendChild(nomineesGrid);
        categoriesContainer.appendChild(categorySection);
    });

    // Access submit button and modal elements
    const submitButton = document.getElementById("submit-button");
    const modal = document.getElementById("submission-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const submissionForm = document.getElementById("submission-form");

    // When "Submit Choices" is clicked, show the modal
    submitButton.addEventListener("click", () => {
        modal.style.display = "block";
    });

    // Close the modal if the user clicks the 'X'
    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // When the form in the modal is submitted
    submissionForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent immediate page refresh
      
        const userName = document.getElementById("userName").value.trim();
        const userTeam = document.getElementById("team").value.trim();
      
        // Convert userChoices into an array of objects: [{category, title}, ...]
        const nominations = Object.entries(userChoices).map(([category, nominee]) => {
          return {
            category: category,
            title: nominee.title
          };
        });
      
        // Save to Firestore:
        db.collection("users").add({
          name: userName,
          team: userTeam,
          nominations: nominations,
          timestamp: new Date()   // Optional: store submission time
        })
        .then(() => {
          console.log("Document successfully written!");
          // After Firestore save, redirect to thank you page
          window.location.href = "thankyou.html";
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
          // Optionally show an error message to user
        });
      });
      
}

function selectNominee(cardElement, category, nominee) {
    const categorySection = cardElement.closest('.category-section');
    categorySection.querySelectorAll('.nominee-card').forEach(card => card.classList.remove('selected'));

    cardElement.classList.add('selected');
    userChoices[category] = nominee;

    updateSelectionIndicator();
    updateSelectedThumbnails();
    toggleSubmitButton();
}

function updateSelectionIndicator() {
    const selectedCount = Object.keys(userChoices).length;
    document.getElementById("selection-indicator").textContent = 
        `Selected: ${selectedCount}/${totalCategories}`;
}

function updateSelectedThumbnails() {
    const thumbnailsContainer = document.getElementById("selected-thumbnails");
    thumbnailsContainer.innerHTML = "";

    Object.values(userChoices).forEach(nominee => {
        const thumbnail = document.createElement("img");
        thumbnail.src = nominee.imgsrc || '/img/default.png';
        thumbnail.alt = nominee.title;
        thumbnailsContainer.appendChild(thumbnail);
    });
}

function toggleSubmitButton() {
    const submitButton = document.getElementById("submit-button");
    if (Object.keys(userChoices).length === totalCategories) {
        submitButton.disabled = false;
        submitButton.classList.add("enabled");
    } else {
        submitButton.disabled = true;
        submitButton.classList.remove("enabled");
    }
}
