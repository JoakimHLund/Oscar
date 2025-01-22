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
            `;

            nomineeCard.addEventListener("click", () => {
                selectNominee(nomineeCard, category.Title, nominee);
            });

            nomineesGrid.appendChild(nomineeCard);
        });

        categorySection.appendChild(nomineesGrid);
        categoriesContainer.appendChild(categorySection);
    });

    document.getElementById("submit-button").addEventListener("click", () => {
        alert("Your choices have been submitted!");
        console.log(userChoices);
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
    document.getElementById("selection-indicator").textContent = `Selected: ${selectedCount}/${totalCategories}`;
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
