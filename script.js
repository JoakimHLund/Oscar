fetch('nominees.json')
    .then(response => response.json())
    .then(data => startNomineeSelection(data));

let currentCategoryIndex = 0;
let userChoices = {};

function startNomineeSelection(data) {
    const categories = data.categories;
    const nextButton = document.getElementById("next-button");
    const submitButton = document.getElementById("submit-button");

    function displayCategory() {
        const category = categories[currentCategoryIndex];
        document.getElementById("category-title").textContent = `Category: ${category.Title}`;
        const nomineesGrid = document.getElementById("nominees-grid");
        nomineesGrid.innerHTML = "";

        category.Nominees.forEach(nominee => {
            const nomineeCard = document.createElement("div");
            nomineeCard.className = "nominee-card";
            nomineeCard.innerHTML = `
                <img src="${nominee.imgsrc || '/img/default.png'}" alt="${nominee.title}">
                <p>${nominee.title}</p>
            `;
            nomineeCard.addEventListener("click", () => selectNominee(nomineeCard, category.Title, nominee.title));
            nomineesGrid.appendChild(nomineeCard);
        });
    }

    function selectNominee(cardElement, category, nominee) {
        // Deselect any previously selected card
        document.querySelectorAll('.nominee-card').forEach(card => card.classList.remove('selected'));
        
        // Highlight the selected card
        cardElement.classList.add('selected');

        // Store the user's choice
        userChoices[category] = nominee;

        // Show the next button
        nextButton.style.display = "block";
    }

    nextButton.addEventListener("click", () => {
        currentCategoryIndex++;
        nextButton.style.display = "none";
        if (currentCategoryIndex < categories.length) {
            displayCategory();
        } else {
            document.getElementById("category-title").textContent = "All categories completed!";
            document.getElementById("nominees-grid").innerHTML = `
                <p>Your choices:</p>
                <pre>${JSON.stringify(userChoices, null, 2)}</pre>
            `;
            submitButton.style.display = "block";
            nextButton.style.display = "none";
        }
    });

    submitButton.addEventListener("click", () => {
        alert("Your choices have been submitted!");
        console.log(userChoices);
    });

    displayCategory();
}
