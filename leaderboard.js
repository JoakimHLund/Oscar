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

// Store previous rankings for animation effects (only after first update)
let previousRankings = {};
let firstUpdate = true;

document.addEventListener("DOMContentLoaded", () => {
    updateWinnersCount();
    loadLeaderboard(true); // First load with tracking

    document.getElementById("update-leaderboard").addEventListener("click", () => {
        updateLeaderboard();
    });

    document.getElementById("pick-next-winner").addEventListener("click", () => {
        pickNextWinner();
    });
});


// Fetch the count of winners selected
function updateWinnersCount() {
    db.collection("winners").get()
        .then(snapshot => {
            const winnersCount = snapshot.size;
            document.getElementById("winners-count").textContent = `Winners Selected: ${winnersCount}/23`;
        })
        .catch(error => console.error("Error fetching winners count:", error));
}

// Load and display leaderboard
function loadLeaderboard(trackMovement = true) {
    db.collection("users").get()
        .then(snapshot => {
            const users = [];

            snapshot.forEach(doc => {
                const userData = doc.data();
                users.push({
                    id: doc.id,
                    name: userData.name || "Unknown",
                    team: userData.team ? `(${userData.team}) ` : "",
                    correctGuesses: userData.correctGuesses || 0,
                    points: userData.points || 0
                });
            });

            // Sort first by points (desc), then by correct guesses (desc)
            users.sort((a, b) => {
                if (b.points !== a.points) {
                    return b.points - a.points; // Higher points first
                }
                return b.correctGuesses - a.correctGuesses; // More correct guesses first
            });

            const leaderboardBody = document.getElementById("leaderboard-body");
            leaderboardBody.innerHTML = ""; // Clear existing rows

            let rank = 1; // Start ranking from 1
            let previousUser = null; // Track previous user to assign same rank if needed

            const newRankings = [];

            users.forEach((user, index) => {
                let movementIcon = "";

                // Assign rank based on score and correctGuesses
                if (previousUser && user.points === previousUser.points && user.correctGuesses === previousUser.correctGuesses) {
                    user.rank = previousUser.rank; // Same rank as previous user
                } else {
                    user.rank = rank;
                }

                newRankings.push({ id: user.id, points: user.points, rank: user.rank });

                if (trackMovement && previousRankings[user.id] !== undefined) {
                    const previousRank = previousRankings[user.id];

                    if (previousRank < user.rank) {
                        movementIcon = "🔽"; // Down
                    } else if (previousRank > user.rank) {
                        movementIcon = "🔼"; // Up
                    } else {
                        movementIcon = "➖"; // No movement
                    }
                }

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${user.rank}</td>
                    <td>${user.team}${user.name}</td>
                    <td>${user.correctGuesses}</td>
                    <td>${user.points} <span class="movement-icon">${movementIcon}</span></td>
                `;

                leaderboardBody.appendChild(row);

                // Add animation class only on updates
                if (trackMovement) {
                    setTimeout(() => row.classList.add("fade-in"), index * 50);
                }

                previousUser = user; // Store for next iteration
                rank++; // Increment rank (next player starts with a new potential rank)
            });

            // Store rankings for next update comparison
            if (trackMovement) {
                previousRankings = {};
                newRankings.forEach((user) => {
                    previousRankings[user.id] = user.rank;
                });
            }
        })
        .catch(error => {
            console.error("Error fetching leaderboard:", error);
        });
}

// Update leaderboard by checking user picks against winners
async function updateLeaderboard() {
    try {
        // Fetch winners
        const winnersSnapshot = await db.collection("winners").get();
        const winners = {};
        winnersSnapshot.forEach(doc => {
            const data = doc.data();
            winners[data.category] = { winner: data.winner, score: data.score };
        });

        // Fetch users
        const usersSnapshot = await db.collection("users").get();
        const batch = db.batch();

        usersSnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            let correctGuesses = 0;
            let totalPoints = 0;

            if (userData.nominations) {
                userData.nominations.forEach(nomination => {
                    const category = nomination.category;
                    const userPick = nomination.title;

                    if (winners[category] && winners[category].winner === userPick) {
                        correctGuesses++;
                        totalPoints += winners[category].score;
                    }
                });
            }

            // Update user document
            const userRef = db.collection("users").doc(userDoc.id);
            batch.update(userRef, {
                correctGuesses: correctGuesses,
                points: totalPoints
            });
        });

        await batch.commit();
        console.log("Leaderboard updated!");

        updateWinnersCount();

        // First update -> store rankings for future tracking
        if (firstUpdate) {
            firstUpdate = false;
        }

        loadLeaderboard(true); // Track movement only after the first update
    } catch (error) {
        console.error("Error updating leaderboard:", error);
    }
}


// Fetches the next available category ID and redirects
function pickNextWinner() {
    db.collection("winners").get()
        .then(snapshot => {
            const selectedIds = new Set();

            snapshot.forEach(doc => {
                const data = doc.data();
                selectedIds.add(data.id); // Collect selected category IDs
            });

            // Find the first missing ID from 1-23
            for (let i = 1; i <= 23; i++) {
                if (!selectedIds.has(i)) {
                    window.location.href = `category.html?id=${i}`;
                    return;
                }
            }

            alert("All winners have been selected!");
        })
        .catch(error => console.error("Error fetching winners:", error));
}

