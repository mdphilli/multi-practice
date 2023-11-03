  const firebaseConfig = {
    apiKey: "AIzaSyC_Xw_OulIheZ8Quz-Bt539w6NbjxtG8Sc",
    authDomain: "room-104-math-practice.firebaseapp.com",
    databaseURL: "https://room-104-math-practice-default-rtdb.firebaseio.com",
    projectId: "room-104-math-practice",
    storageBucket: "room-104-math-practice.appspot.com",
    messagingSenderId: "190214688719",
    appId: "1:190214688719:web:0ef02788692afd686c4cba",
    measurementId: "G-L0LXXEVMGK"
  };

firebase.initializeApp(firebaseConfig);

const database = firebase.database();

let correctCount = 0;
let questionsAnswered = 0;
let highScores = [];
let correctAnswer;
let maxNum = 10;
let totalPoints = 0;
let problemInterval;
let consecutiveCorrect = 0;
let correctStreak = 0 // To count the number of consecutive correct answers
let multiplier = 1;
let isProcessing = false; // Flag to handle multiple clicks
let gameIsActive = false;  // Flag to track game state

// Define the constants outside the DOMContentLoaded event listener
let modal; // Using let because we're going to assign them later
let closeButton;
let submitButton;
let playerNameInput;

document.addEventListener("DOMContentLoaded", function() {
    modal = document.getElementById("highscoreModal");
    closeButton = document.getElementById("modalCloseButton");
    submitButton = document.getElementById("modalSubmitButton");
    playerNameInput = document.getElementById("playerNameInput");

    if (closeButton) {
        closeButton.addEventListener("click", function() {
            modal.style.display = "none";
        });
    }

    if (submitButton) {
        submitButton.addEventListener("click", function() {
            const playerName = playerNameInput.value;
            if (playerName !== "") {
                const formattedName = playerName.substring(0, 3).toUpperCase();
                database.ref('highScores').push({ name: formattedName, points: totalPoints });
                modal.style.display = "none";
            }
        });
    }
});


const GAME_STATE = {
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};
let currentState = GAME_STATE.GAME_OVER;  // By default, the game is over when the script loads

const correctFeedbackMessages = [
    "Great job!", "Well done!",
    "Nicely done!",
    "Keep it up!",
    "You're on fire!",
    "Outstanding!",
    "Impressive work!",
    "Superb!",
    "Fantastic!",
    "This is the way.",
    "Brilliant move!",
    "Excellent!",
    "You're nailing it!",
    "On point!",
    "Perfect answer!",
    "Amazing effort!",
    "You're crushing it!",
    "A+ effort!",
    "That's correct!",
    "Right on target!",
    "Top-notch!",
    "You're a star!",
    "Smashing success!",
    "Spot on!",
    "You're acing this!",
    "Absolutely right!",
    "You did it again!",
    "Nailed it!",
    "You're unstoppable!",
    "You've got this!",
    "Pure genius!",
    "Stellar job!",
    "You shine bright!",
    "Remarkable!",
    "Exceptional!",
    "You're making waves!",
    "You're a natural!",
    "Spectacular!",
    "You're soaring high!"
];


displayHighScores();


function handleKeyInput(event) {
    console.log("Key pressed:", event.key);

    if (event.key === "Space" || event.code === "Space") {
        event.preventDefault();  // Prevent the default behavior (scrolling down)
        
        if (currentState !== GAME_STATE.PLAYING) {
            console.log("Starting a new game...");  // Let's add another console log
            startGame();  // Assuming startGame is the function to start a new game
            return;  // Exit out of the function early
        }
    }

    switch (currentState) {
        case GAME_STATE.PLAYING:
                        console.log("In playing state");

            handlePlayingState(event);
            break;
        case GAME_STATE.PAUSED:
            handlePausedState(event);
            break;
        case GAME_STATE.GAME_OVER:
            handleGameOverState(event);
            break;
        // ... handle other states if needed
        default:
            console.error('Unknown game state:', currentState);
            break;
    }
}

// INSERT THE KEYDOWN EVENT LISTENER HERE
document.addEventListener('keydown', handleKeyInput);

function startGame() {
    currentState = GAME_STATE.PLAYING;
    document.getElementById("startButton").style.display = "none";
    document.getElementById("gameArea").style.display = "block";
    enableChoiceButtons();  // <-- I'm assuming this line enables the choice buttons
    generateProblem();
    multiplier = 1;
    document.getElementById("multiplierDisplay").textContent = `Multiplier: x${multiplier}`;
    document.getElementById("multiplierDisplay").style.display = "block";
}

function handlePlayingState(event) {
    if (event.key === "Enter" && !gameIsActive) {
        startGame();
        return;
    }

    if (!gameIsActive) {  // If the game isn't active, return early and don't process the key press
        return;
    }
    
    if (isProcessing) { // Don't process if we're already handling a choice
        return;
    }

    if (event.key === "Escape") {
        newGame();
        return;
    }

    const choiceButtons = document.getElementById("choices").querySelectorAll("button");
    const index = ['1', '2', '3', '4', '5'].indexOf(event.key);

    if (index > -1 && index < choiceButtons.length) {
        handleChoice(choiceButtons[index]);
    }

    function handlePlayingState(event) {
    // ... rest of the code ...

    const choiceButtons = document.getElementById("choices").querySelectorAll("button");
    const index = ['1', '2', '3', '4', '5'].indexOf(event.key);

    if (index > -1 && index < choiceButtons.length) {
        handleChoice(choiceButtons[index]);
    }
}
}

function disableChoiceButtons() {
    const choiceButtons = document.getElementById("choices").querySelectorAll("button");
    choiceButtons.forEach(button => {
        button.disabled = true;
    });
}

function enableChoiceButtons() {
    const choiceButtons = document.getElementById("choices").querySelectorAll("button");
    choiceButtons.forEach(button => {
        button.disabled = false;
    });
}

function generateProblem() {
    // Reset flashcard colors to default
    document.getElementById("num1Box").style.backgroundColor = "#F4E1D2";
    document.getElementById("num2Box").style.backgroundColor = "#F4E1D2";

    // Generate random numbers for the problem
    let num1 = Math.floor(Math.random() * maxNum + 1);
    let num2 = Math.floor(Math.random() * maxNum + 1);
    correctAnswer = num1 * num2;

    // Display the numbers on the flashcards
    document.getElementById("num1Box").innerText = num1;
    document.getElementById("num2Box").innerText = num2;

    // Generate answer choices
    let choices = [correctAnswer];
    while (choices.length < 5) {
        let randomAnswer = Math.floor(Math.random() * (maxNum * maxNum) + 1);
        if (!choices.includes(randomAnswer)) {
            choices.push(randomAnswer);
        }
    }

    // Shuffle the choices
    choices.sort(() => Math.random() - 0.5);

    // Get the existing choice buttons from the DOM
    let choiceButtons = document.querySelectorAll("#choices button");

    // Update the text content of the existing buttons
    for (let i = 0; i < choiceButtons.length; i++) {
        choiceButtons[i].textContent = choices[i];
    }

    // Disable the choice buttons
    disableChoiceButtons();

    // After a short delay, enable the choice buttons and start the countdown
    setTimeout(() => {
        enableChoiceButtons();

        // Start the stopwatch for the problem
        let problemPoints = 1000;
        document.getElementById("stopwatch").textContent = problemPoints;
        clearInterval(problemInterval); // Clear any existing interval first
        problemInterval = setInterval(() => {
            problemPoints -= 1;
            document.getElementById("stopwatch").textContent = problemPoints;
            if (problemPoints <= 0) {
                clearInterval(problemInterval);
            }
        }, 5);
    }, 500); // 500ms delay
}

function playAudio(type) {
    let audioElement;
    if (type === "correct") {
        audioElement = document.getElementById("correctSound");
    } else if (type === "incorrect") {
        audioElement = document.getElementById("incorrectSound");
    }
    if (audioElement) {
        audioElement.currentTime = 0; // Reset audio to the start
        audioElement.play();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Event listeners, DOM manipulations, and initializations can go here.

    // Display the high scores when the page first loads.
    displayHighScores();

    // Add event listener to the start button.
    document.getElementById("startButton").addEventListener('click', startGame);

    // Add event listener to the new game button if present in your HTML.
    const newGameButton = document.getElementById("newGameButton");
    if (newGameButton) {
        newGameButton.addEventListener('click', newGame);
    }

});

document.getElementById('choices').addEventListener('click', function(event) {
    const target = event.target;

    // Check if the clicked element is a button
    if (target.tagName.toLowerCase() === 'button') {
        handleChoice(target);
    }
});

function handleChoice(button) {
    // If we're already processing a choice, return early
    if (isProcessing) {
        return;
    }
    isProcessing = true; // Set the flag to true since we're about to process a choice

    // Clear the interval to stop the timer once an answer is chosen
    clearInterval(problemInterval);
    
    const userChoice = parseInt(button.textContent, 10);
    // const currentPoints = parseInt(document.getElementById("stopwatch").textContent, 10); // Capture the current points - Comment or remove this line

    if (userChoice === correctAnswer) {
        // totalPoints += currentPoints; // Add the current points to the total - Comment or remove this line
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer();
    }
}

function handleCorrectAnswer() {
    document.getElementById("feedback").textContent = "";
    const randomFeedbackIndex = Math.floor(Math.random() * correctFeedbackMessages.length);
    document.getElementById("feedback").textContent = correctFeedbackMessages[randomFeedbackIndex];
    
    playAudio("correct");
    questionsAnswered++;
    updateProgressBar();
    consecutiveCorrect++;
    correctCount++;

    // Removed the line that was incrementing the multiplier by 0.1

    const basePoints = parseInt(document.getElementById("stopwatch").textContent, 10);
totalPoints += Math.round(basePoints * multiplier); // Multiply the base points by the current multiplier and round the result

    flashFlashcards("correctFlash");

    // Resetting flashcard colors after 500ms
    setTimeout(() => {
        document.getElementById("num1Box").style.backgroundColor = "#F4E1D2";  // Reset to default color
        document.getElementById("num2Box").style.backgroundColor = "#F4E1D2";  // Reset to default color
    }, 500);

    correctStreak++;

    // If the correct streak is 5, increment the multiplier by 0.2
    if (correctStreak === 5) {
        multiplier += 0.2;
        correctStreak = 0; // Reset the streak count
    }

    // Display the updated multiplier
    document.getElementById("multiplierDisplay").textContent = `Multiplier: x${multiplier.toFixed(1)}`;

    if (questionsAnswered >= 30) {
        gameOver();
    } else {
        generateProblem();
    }

    isProcessing = false;  // Set flag back to false after processing
}

function handleIncorrectAnswer() {
    let incorrectSound = document.getElementById("incorrectSound");
    incorrectSound.currentTime = 0; // To ensure the audio can be replayed immediately
    incorrectSound.play();
    consecutiveCorrect = 0;
    document.getElementById("feedback").textContent = "Incorrect, try another!";
    questionsAnswered++;
    updateProgressBar();
    flashFlashcards("incorrectFlash");
        correctStreak = 0;
        // Reset the multiplier
    multiplier = 1;
        document.getElementById("multiplierDisplay").textContent = `Multiplier: x${multiplier}`;

    
    if (questionsAnswered >= 30) {
        gameOver();
    } else {
        generateProblem();
    }

    isProcessing = false;  // Set flag back to false after processing
}

function flashFlashcards(animationName) {
    const flashCards = document.querySelectorAll(".flashCard");
    flashCards.forEach(card => {
        card.style.animationName = animationName;
        card.style.animationDuration = "0.5s";
        card.style.animationIterationCount = "1";
    });

    setTimeout(() => {
        flashCards.forEach(card => {
            card.style.animationName = "";
        });
    }, 500); // Clear the animation after it has run
}

function updateProgressBar() {
    const totalQuestions = 30;
    const percentageCompleted = (questionsAnswered / totalQuestions) * 100;
    document.getElementById("progressBar").style.width = `${percentageCompleted}%`;
}

function isTopTenTime(time) {
    if (highScores.length < 10) {
        return true;
    }
    return time > Math.min(...highScores.map(score => score.points));
}

function handleKeyDown(event) {
    if (!gameIsActive) {  
        if (event.key === "Enter") {
            startGame();
            return; // Early return after starting the game.
        } else {
            return; // If the game isn't active and it's not the Enter key, return early.
        }
    }

    // Capture keys 1-5 for answer choices.
    const answerKeys = ["1", "2", "3", "4", "5"];
    if (answerKeys.includes(event.key)) {
        // Assuming you have a way to select the corresponding answer choice.
        // For simplicity, we'll use a function `selectAnswer` which you might need to implement.
        selectAnswer(event.key);
    }

    if (event.key === "Escape") {
        newGame();
    }
}

function selectAnswer(key) {
    const choiceIndex = parseInt(key, 10) - 1;  // Convert the key (string) to an integer and adjust for 0-based indexing.
    const choices = document.querySelectorAll('#choices button');  // Assuming choices are buttons inside an element with id "choices".
    
    if (choiceIndex >= 0 && choiceIndex < choices.length) {
        // Simulate a click on the chosen button.
        choices[choiceIndex].click();
    }
}

function handlePlayingState(event) {
    switch (event.key) {
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
            selectAnswer(event.key); // Assuming this function was provided before
            break;
        // ... handle other keys if needed
        default:
            break;
    }
}

function gameOver() {
    currentState = GAME_STATE.GAME_OVER;
    clearInterval(problemInterval);

    document.getElementById("num1Box").style.display = "none";
    document.getElementById("multiplier").style.display = "none";
    document.getElementById("num2Box").style.display = "none";
    document.getElementById("choices").style.display = "none";
    document.getElementById("stopwatch").textContent = "";
    document.getElementById("celebration").style.display = "block";
    document.getElementById("feedback").textContent = `You answered ${correctCount} out of 30 correctly and scored ${totalPoints} points!`;
    document.getElementById("multiplierDisplay").style.display = "none";

    displayHighScores().then(() => {
        if (isTopTenTime(totalPoints)) {
            modal.style.display = "block";  // Show the modal if it's a top 10 score
        }
    });

    document.getElementById("newGameButton").style.display = "block";
    document.removeEventListener("keydown", handleKeyDown);
}

function handleGameOverState(event) {
    // Define what should happen when a key is pressed in the GAME_OVER state.
    // For now, it's an empty function. Add logic here if needed later.
}

function displayHighScores() {
    const highScoresList = document.getElementById("highScores");

    // Return a new promise
    return new Promise((resolve, reject) => {
        // Set up a continuous listener on the high scores without the limitToLast restriction
        database.ref('highScores').orderByChild('points').on('value', snapshot => {
            highScoresList.innerHTML = "";

            const scores = [];
            snapshot.forEach(childSnapshot => {
                scores.push(childSnapshot.val());
            });

            // Filter the scores to get the highest score for each player
            const uniqueScores = scores.reduce((acc, currentScore) => {
                const existingScore = acc.find(score => score.name === currentScore.name);
                if (!existingScore) {
                    acc.push(currentScore);
                } else if (existingScore.points < currentScore.points) {
                    existingScore.points = currentScore.points;
                }
                return acc;
            }, []);

            // Sort the unique scores in descending order by points
            uniqueScores.sort((a, b) => b.points - a.points);

            // Update the highScores array
            highScores = uniqueScores;

            // Display only the top 10 unique scores
            for (let i = 0; i < Math.min(10, uniqueScores.length); i++) {
                const listItem = document.createElement("li");
                const shortName = uniqueScores[i].name.substring(0, 3).toUpperCase();
                listItem.textContent = `${i + 1}) ${shortName} . . . . ${uniqueScores[i].points} pts`;
                highScoresList.appendChild(listItem);
            }

            // Resolve the promise after high scores are updated
            resolve();
        }).catch(error => {
            // Reject the promise if there's an error
            console.error("Error fetching high scores:", error);
            reject(error);
        });
    });
}



function clearHighScores() {
    const password = prompt("Enter the password to clear high scores:");
    const secretPassword = "wildcats123";  // Change this to your desired password

    if (password === secretPassword) {
        // Remove high scores from Firebase
        database.ref('highScores').remove()
            .then(() => {
                alert("High scores cleared!");
                displayHighScores();
            })
            .catch(error => {
                console.error("Error removing high scores: ", error);
            });
    } else {
        alert("Ha!  Good try.  Only Mr. Phillips can do this.");
    }
}

function newGame() {
    // 1. Resetting all game-related variables to their initial states
    correctCount = 0;
    questionsAnswered = 0;
    totalPoints = 0;
    consecutiveCorrect = 0;
    gameIsActive = true;
    
    // 2. Hide and show appropriate elements
    document.getElementById("num1Box").style.display = "";
    document.getElementById("multiplier").style.display = "";
    document.getElementById("num2Box").style.display = "";
    document.getElementById("choices").style.display = "";
    document.getElementById("celebration").style.display = "none";
    document.getElementById("newGameButton").style.display = "none";
    document.getElementById("feedback").textContent = "";
    document.addEventListener("keydown", handleKeyDown);
    
    // 3. Begin a new game
    startGame();
}