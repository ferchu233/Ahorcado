const socket = io();

const wordDisplay = document.getElementById('word-display');
const guessesDisplay = document.getElementById('guesses');
const guessInput = document.getElementById('guess-input');
const guessButton = document.getElementById('guess-button');
const hangmanDisplay = document.getElementById('hangman-display');
const pointsDisplay = document.getElementById('points-display'); // Agregar un elemento para mostrar los puntos

let points = 0; // Contador de puntos

guessButton.addEventListener('click', () => {
  const letter = guessInput.value.trim().toLowerCase();
  if (letter) {
    socket.emit('guess', letter);
  }
  guessInput.value = '';
});

guessInput.addEventListener('input', () => {
  guessInput.value = guessInput.value.replace(/[^a-zA-Z]/g, '').toLowerCase();
});

socket.on('updateWord', (displayWord) => {
  wordDisplay.textContent = displayWord;
});

socket.on('updateGuesses', (guessedLetters) => {
  guessesDisplay.textContent = 'Letras ya intentadas: ' + guessedLetters.join(', ');
});

socket.on('updateHangman', (hangmanState) => {
  hangmanDisplay.textContent = hangmanState;
});

socket.on('updatePoints', (newPoints) => {
  points = newPoints;
  pointsDisplay.textContent = 'Puntos: ' + points;
});

const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text')

socket.on('gameWon', () => {
    messageText.textContent = '¡Ganaste! Presione una letra para jugar de nuevo.';
    messageBox.style.display = 'block';
    // Comprobamos si los elementos HTML existen antes de intentar actualizar su contenido
    if (wordDisplay && guessesDisplay && guessInput && hangmanDisplay) {
      // Mostrar la palabra completa en el elemento 'wordDisplay'
      wordDisplay.textContent = 'Palabra: ' + wordToGuess;
  
      // Limpiar los demás elementos
      guessesDisplay.textContent = 'Letras ya intentadas:';
      guessInput.value = '';
      hangmanDisplay.textContent = '';
  
      // Después de 2 segundos, reiniciar el juego
      setTimeout(() => {
        // Limpiar la palabra y el muñeco
        if (wordDisplay && guessesDisplay && guessInput && hangmanDisplay) {
          wordDisplay.textContent = '';
          guessesDisplay.textContent = '';
          hangmanDisplay.textContent = '';
        }
  
        // Solicitar una nueva ronda al servidor
        socket.emit('newRound');
      }, 2000); // Esperar 2 segundos antes de reiniciar el juego
    }
  });
  
  socket.on('gameLost', () => {
    messageText.textContent = '¡Perdiste! Presione una letra para intentarlo de nuevo.';
  messageBox.style.display = 'block';
    // Comprobamos si los elementos HTML existen antes de intentar actualizar su contenido
    if (wordDisplay && guessesDisplay && guessInput && hangmanDisplay) {
      // Mostrar la palabra completa en el elemento 'wordDisplay'
      wordDisplay.textContent = 'Palabra: ' + wordToGuess;
  
      // Limpiar los demás elementos
      guessesDisplay.textContent = 'Letras ya intentadas:';
      guessInput.value = '';
      hangmanDisplay.textContent = '';
  
      // Después de 2 segundos, reiniciar el juego
      setTimeout(() => {
        // Limpiar la palabra y el muñeco
        if (wordDisplay && guessesDisplay && guessInput && hangmanDisplay) {
          wordDisplay.textContent = '';
          guessesDisplay.textContent = '';
          hangmanDisplay.textContent = '';
        }
  
        // Solicitar una nueva ronda al servidor
        socket.emit('newRound');
      }, 2000); // Esperar 2 segundos antes de reiniciar el juego
    }
  });
  
  socket.on('newRoundWord', (newWordToGuess) => {
    // Actualizar la variable 'wordToGuess' con la nueva palabra recibida del servidor
    messageBox.style.display = 'none';
    wordToGuess = newWordToGuess;
  });

socket.on('startGame', () => {
});
