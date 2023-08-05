const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { generateRoomCode } = require('./utils');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname + '/public'));

let guessedLetters = [];
const maxAttempts = 6;
let incorrectAttempts = 0;
const wordsForSoup = [
  'Avengers', 'Matrix', 'StarWars', 'JurassicPark', 'Inception', 'Titanic', 'Avatar', 'Interstellar', 'HarryPotter', 'Spiderman',
  'LordoftheRings', 'Minecraft', 'Fortnite', 'Pokémon', 'Zelda', 'SuperMario', 'Bioshock', 'CallOfDuty', 'Halo', 'Civilization',
  'Overwatch', 'Fallout', 'AssassinCreed', 'WorldofWarcraft', 'NASA', 'Einstein', 'Newton', 'Tesla', 'Evolution', 'Genetics',
  'Atom', 'Gravity', 'BigBang', 'Universe', 'Dinosaur', 'Archaeology', 'Renaissance', 'IndustrialRevolution', 'FrenchRevolution',
  'AncientEgypt', 'WorldWarI', 'WorldWarII', 'ColdWar', 'AmericanRevolution', 'MiddleAges', 'RomanEmpire', 'AncientGreece',
  'Mesopotamia', 'Renaissance', 'DiscoveryofAmerica', 'BacktotheFuture', 'ForrestGump', 'Gladiator', 'Braveheart', 'TheShawshankRedemption',
  'PulpFiction', 'TheGodfather', 'TheDarkKnight', 'FightClub', 'TheLordoftheRings', 'Goodfellas', 'TheMatrix', 'StarWars',
  'JurassicPark', 'Inception', 'TheGreenMile', 'SchindlersList', 'Casablanca', 'TheSilenceoftheLambs', 'GoneWiththeWind',
  'TheGodfatherPartII', 'TheGodfatherPartIII', 'TheLionKing', 'Avatar', 'Interstellar', 'TheDarkKnightRises', 'TheAvengers',
  'AvengersInfinityWar', 'AvengersEndgame', 'Titanic', 'ForaFewDollarsMore', 'TheGoodtheBadandtheUgly', 'PiratesoftheCaribbean',
  'TheFellowshipoftheRing', 'TheTwoTowers', 'TheReturnoftheKing', 'HarryPotterandthePhilosophersStone', 'HarryPotterandtheChamberofSecrets',
  'HarryPotterandthePrisonerofAzkaban', 'HarryPotterandtheGobletofFire', 'HarryPotterandtheOrderofthePhoenix',
  'HarryPotterandtheHalfBloodPrince', 'HarryPotterandtheDeathlyHallows', 'SpiderMan', 'SpiderMan2', 'SpiderMan3', 'SpiderManHomecoming',
  'SpiderManFarFromHome', 'SpiderManNoWayHome', 'TheLordoftheRingsTheTwoTowers', 'TheLordoftheRingsTheReturnoftheKing',
  'TheLordoftheRingsTheFellowshipoftheRing', 'TheHobbitAnUnexpectedJourney', 'TheHobbitTheDesolationofSmaug', 'TheHobbitTheBattleoftheFiveArmies',
  'TheMinecraftMovie', 'MinecraftIntotheNether', 'Fortnite', 'PokémonDetectivePikachu', 'PokémonTheFirstMovie', 'TheLegendofZelda',
  'SuperMarioBros', 'Bioshock', 'CallOfDutyBlackOps', 'Halo', 'Civilization', 'Overwatch', 'Fallout', 'AssassinsCreed', 'WorldofWarcraft',
  'NASASpaceAdventure', 'Einstein', 'Newton', 'Tesla', 'Evolution', 'Genetics', 'Atom', 'Gravity', 'TheBigBangTheory', 'TheTheoryofEverything',
  'TheUniverse', 'JurassicPark', 'JurassicWorld', 'JurassicWorldFallenKingdom', 'JurassicWorldDominion', 'Dinosaur', 'JurassicParkTheLostWorld',
  'JurassicParkIII'
];


const lowerCaseWords = wordsForSoup.map(word => word.toLowerCase());
let wordToGuess = getRandomWord();

function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * lowerCaseWords.length);
  return lowerCaseWords[randomIndex];
}

const rooms = new Map();

function joinRoom(roomCode, socket) {
  const room = rooms.get(roomCode);

  if (!room) {
    console.log('Room does not exist.');
    socket.emit('error', 'Invalid room code.');
    return;
  }

  if(room.players.length === 2){

    socket.emit('startGame');

  }

  if(room.players.length >= 3){

    

  }

  if (room.players.length >= 2) {
    console.log('Room is full.');
    socket.emit('error', 'Room is full. Cannot join.');
    return;
  }

  if (room.players.includes(socket.id)) {
    console.log('You are already in this room.');
    socket.emit('error', 'You are already in this room.');
    return;
  }

  room.players.push(socket.id);
  socket.join(roomCode);

  if (room.players.length === 2) {
    io.to(roomCode).emit('startGame');
    
    console.log('Joined room successfully.');
  }
}

function createRoom(socket) {
  const roomCode = generateRoomCode();
  rooms.set(roomCode, { players: [], scores: {} });
  socket.join(roomCode);
  socket.emit('roomCode', roomCode);
}

function resetGame() {
  wordToGuess = getRandomWord();
  guessedLetters = [];
  incorrectAttempts = 0;
  io.emit('newRoundWord', wordToGuess);
  io.emit('updateGuesses', guessedLetters);
  io.emit('updateHangman', getHangmanState());
}

// Única función 'io.on('connection')' que contiene todas las acciones para una conexión
io.on('connection', (socket) => {
  console.log('A player connected.');

  socket.on('createRoom', () => createRoom(socket));
  socket.on('joinRoom', (roomCode) => joinRoom(roomCode, socket));

  socket.on('disconnect', () => {
    console.log('A player disconnected.');
    rooms.forEach((room, roomCode) => {
      const index = room.players.indexOf(socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
      }
    });
  });

  

  socket.emit('updateWord', getDisplayWord());

  socket.on('guess', (guess) => {
    if (guess.length === 1) {
      const letter = guess.toLowerCase();
      if (!guessedLetters.includes(letter)) {
        guessedLetters.push(letter);
        io.emit('updateGuesses', guessedLetters);

        // Replace spaces with "/"
        wordToGuess = wordToGuess.replace(/\s/g, '/');

        const displayWord = getDisplayWord();
        io.emit('updateWord', displayWord);

        if (displayWord.indexOf('_') === -1) {
          io.emit('gameWon');
        } else if (!wordToGuess.includes(letter)) {
          incorrectAttempts++;
          io.emit('updateHangman', getHangmanState());

          if (incorrectAttempts === maxAttempts) {
            io.emit('gameLost');
          }
        }
      }
    }
  });

  socket.on('newRound', () => {
    resetGame();
  });

  socket.on('updatePoints', (newPoints) => {
    io.emit('updatePoints', newPoints);
  });

  socket.emit('newRoundWord', wordToGuess);
  
});

function getHangmanState() {
    // Retorna la representación visual del muñeco según el número de intentos fallidos
    switch (incorrectAttempts) {
      case 1:
        return ' O\n';
      case 2:
        return ' O\n |\n';
      case 3:
        return ' O\n/|\n';
      case 4:
        return ' O\n/|\\\n';
      case 5:
        return ' O\n/|\\\n/\n';
      case 6:
        return ' O\n/|\\\n/ \\';
      default:
        return ' \n\n'; // Si no hay intentos fallidos, se muestra el espacio vacío
    }
  }
  

  function getDisplayWord() {
    return wordToGuess
      .split('')
      .map((letter) => (guessedLetters.includes(letter) ? letter : '_'))
      .join(' ');
  }
  
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });
  
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
