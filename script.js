let correctCount = 0;
let questionsAnswered = 0;
let highScores = JSON.parse(localStorage.getItem("highScores") || "[]");
let correctAnswer;
let maxNum = 10;
let totalPoints = 0;
let problemInterval;
let consecutiveCorrect = 0;
let isProcessing = false; // Flag to handle multiple clicks
let streakFeedback = "";

const correctFeedbackMessages = [
    "Great job!",
    "Well done!",
    "Nicely done!",
    "Keep it up!",
    "You're on fire!"
];


displayHighScores();

function startGame() {
    document.getElementById("startButton").style.display = "none";
    document.getElementById("gameArea").style.display = "block";
    generateProblem();
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
    let choicesContainer = document.getElementById("choices");
    choicesContainer.innerHTML = '';
    for (let choice of choices) {
        let btn = document.createElement("button");
        btn.innerText = choice;
        btn.onclick = function() {
            handleChoice(btn);
        };
        choicesContainer.appendChild(btn);
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

    // Update streak feedback
    let streakFeedbackElement = document.getElementById("streakFeedback");
    if (consecutiveCorrect === 10 || consecutiveCorrect === 20 || consecutiveCorrect === 30) {
        streakFeedbackElement.textContent = `${consecutiveCorrect} in a row! 🎉`;
    } else {
        streakFeedbackElement.textContent = "";
    }
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

function handleChoice(button) {
    // If we're already processing a choice, return early
    if (isProcessing) {
        return;
    }
    isProcessing = true; // Set the flag to true since we're about to process a choice

    // Clear the interval to stop the timer once an answer is chosen
    clearInterval(problemInterval);
    
    const userChoice = parseInt(button.textContent, 10);
    const currentPoints = parseInt(document.getElementById("stopwatch").textContent, 10); // Capture the current points

    if (userChoice === correctAnswer) {
        totalPoints += currentPoints; // Add the current points to the total
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
    correctCount++;
    questionsAnswered++;
    updateProgressBar();
    consecutiveCorrect++;

    if (consecutiveCorrect === 10) {
        totalPoints += 1000;
        streakFeedback = "10 in a row! 1000 BONUS POINTS!";
    } else if (consecutiveCorrect === 20) {
        totalPoints += 2000;
        streakFeedback = "20 in a row! 2000 MORE BONUS POINTS!";
    } else if (consecutiveCorrect === 30) {
        totalPoints += 3000;
        streakFeedback = "All Correct! 3000 MORE BONUS POINTS!";
        gameOver();
        return;
    }

    flashFlashcards("correctFlash");

    // Resetting flashcard colors after 500ms
    setTimeout(() => {
        document.getElementById("num1Box").style.backgroundColor = "#F4E1D2";  // Reset to default color
        document.getElementById("num2Box").style.backgroundColor = "#F4E1D2";  // Reset to default color
    }, 500);

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

function isTopFiveTime(time) {
    if (highScores.length < 5) {
        return true;
    }
    return time > Math.min(...highScores.map(score => score.points));
}

function gameOver() {
    clearInterval(problemInterval);

    document.getElementById("num1Box").style.display = "none";
    document.getElementById("multiplier").style.display = "none";
    document.getElementById("num2Box").style.display = "none";
    document.getElementById("choices").style.display = "none";
    document.getElementById("stopwatch").textContent = "";

    document.getElementById("celebration").style.display = "block";

    document.getElementById("feedback").textContent = `You answered ${correctCount} out of 30 correctly and scored ${totalPoints} points!`;

    if (isTopFiveTime(totalPoints)) {
        const playerName = prompt("Congratulations! You made it to the top 5. Enter your name for the leaderboard:", "Player");
        if (playerName !== null && playerName !== "") {
            highScores.push({ name: playerName, points: totalPoints });
            highScores.sort((a, b) => b.points - a.points);
            if (highScores.length > 5) {
                highScores.length = 5;
            }
            localStorage.setItem("highScores", JSON.stringify(highScores));
        }
    }

    displayHighScores();
    document.getElementById("newGameButton").style.display = "block";
}

function displayHighScores() {
    const highScoresList = document.getElementById("highScores");
    highScoresList.innerHTML = "";
    for (let i = 0; i < highScores.length; i++) {
        const score = highScores[i];
        const listItem = document.createElement("li");
        listItem.textContent = `${score.name}: ${score.points} points`;
        highScoresList.appendChild(listItem);
    }
}

function clearHighScores() {
    localStorage.removeItem("highScores");
    highScores = [];
    displayHighScores();
}

function newGame() {
    document.getElementById("newGameButton").style.display = "none";
    document.getElementById("feedback").textContent = "";
    document.getElementById("num1Box").style.display = "inline-block";
    document.getElementById("multiplier").style.display = "inline-block";
    document.getElementById("num2Box").style.display = "inline-block";
    document.getElementById("choices").style.display = "block";
    document.getElementById("celebration").style.display = "none";

    const choiceButtons = document.getElementById("choices").querySelectorAll("button");
    choiceButtons.forEach(button => {
        button.style.display = "inline-block";
    });

    consecutiveCorrect = 0;
    correctCount = 0;
    questionsAnswered = 0;
    totalPoints = 0;
    document.getElementById("stopwatch").textContent = "5000";
    document.getElementById("progressBar").style.width = "0%";

    startGame();
}
