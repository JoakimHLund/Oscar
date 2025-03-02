const firebaseConfig = {
    apiKey: "AIzaSyCvlg9kqWYWjkgKksSWplpxMMRdq385fhE",
    authDomain: "oscars-64ae7.firebaseapp.com",
    projectId: "oscars-64ae7",
    storageBucket: "oscars-64ae7.firebasestorage.app",
    messagingSenderId: "198277828229",
    appId: "1:198277828229:web:a90e3436be32486df423ec"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = parseInt(urlParams.get("id"), 10); // Get category ID from URL

    if (!categoryId || categoryId < 1 || categoryId > 23) {
        document.getElementById("category-container").innerHTML = "<p>Invalid category ID.</p>";
        return;
    }

    try {
        const [nomineeData, userData] = await Promise.all([
            fetch("nominees.json").then(res => res.json()),
            fetchUserPicks()
        ]);
        displayCategory(nomineeData, categoryId, userData);
    } catch (error) {
        console.error("Error loading data:", error);
    }
});

async function fetchUserPicks() {
    const usersSnapshot = await db.collection("users").get();
    const userPicks = {};

    usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.nominations) {
            userData.nominations.forEach(nomination => {
                if (!userPicks[nomination.category]) {
                    userPicks[nomination.category] = {};
                }
                if (!userPicks[nomination.category][nomination.title]) {
                    userPicks[nomination.category][nomination.title] = [];
                }
                userPicks[nomination.category][nomination.title].push(userData.name);
            });
        }
    });

    return userPicks;
}

function displayCategory(data, categoryId, userPicks) {
    const categoryContainer = document.getElementById("category-container");
    const category = data.categories[categoryId - 1]; // Adjust for zero-based index

    if (!category) {
        categoryContainer.innerHTML = "<p>Category not found.</p>";
        return;
    }

    categoryContainer.innerHTML = `<h2>${category.Title}</h2>`;

    const nomineesGrid = document.createElement("div");
    nomineesGrid.className = "nominees-grid";

    category.Nominees.forEach(nominee => {
        const nomineeWrapper = document.createElement("div");
        nomineeWrapper.className = "nominee-wrapper";

        // Get users who picked this nominee
        const userList = userPicks[category.Title] && userPicks[category.Title][nominee.title]
            ? userPicks[category.Title][nominee.title]
            : [];

        // Calculate potential points (starts at 15, -1 for each extra pick, min 5, but 0 if no picks)
        const numPicks = userList.length;
        const potentialPoints = numPicks > 0 ? Math.max(15 - (numPicks - 1), 5) : 0;

        // Create nominee card
        const nomineeCard = document.createElement("div");
        nomineeCard.className = "nominee-card";
        nomineeCard.innerHTML = `
            <img src="${nominee.imgsrc || '/img/default.png'}" alt="${nominee.title}">
            <p>${nominee.title}</p>
            ${nominee.movie ? `<p class="movie-title">(${nominee.movie})</p>` : ""}
            ${nominee.link ? `<a href="${nominee.link}" target="_blank" class="read-more">Read more</a>` : ""}
        `;
        nomineeCard.addEventListener("click", () => selectWinner(nomineeCard, categoryId, category.Title, nominee.title, potentialPoints));

        // Create user pick list with potential points
        const userPickList = document.createElement("div");
        userPickList.className = "user-pick-list";
        userPickList.innerHTML = `
            <strong>Potential Points: ${potentialPoints}</strong>
            <br>
            <strong>Picked by:</strong>
            <ul id="users-${encodeURIComponent(nominee.title)}">
                ${userList.length > 0
                    ? userList.map(user => `<li>${user}</li>`).join("")
                    : "<li>No picks</li>"}
            </ul>
        `;

        nomineeWrapper.appendChild(nomineeCard);
        nomineeWrapper.appendChild(userPickList);
        nomineesGrid.appendChild(nomineeWrapper);
    });

    categoryContainer.appendChild(nomineesGrid);
}

function selectWinner(selectedCard, categoryId, category, winner, score) {
    // Gray out other nominees
    const nomineeCards = document.querySelectorAll(".nominee-card");
    nomineeCards.forEach(card => {
        card.classList.add("grayed-out");
    });

    // Highlight selected nominee
    selectedCard.classList.remove("grayed-out");
    selectedCard.classList.add("selected-winner");

    // Store the winner in Firestore
    db.collection("winners").doc(categoryId.toString()).set({ // Use the category ID as the document ID
        id: categoryId,  // Store ID as a number
        category: category,
        winner: winner,
        score: score
    })
    .then(() => {
        console.log("Winner successfully saved!");
    })
    .catch(error => {
        console.error("Error saving winner: ", error);
    });
}
