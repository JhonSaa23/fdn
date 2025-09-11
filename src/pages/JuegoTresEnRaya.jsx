import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const JuegoTresEnRaya = () => {
  // Estados del juego
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('menu'); // menu, joining, waiting, playing, finished
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [room, setRoom] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [mySymbol, setMySymbol] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  
  // Estados del chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatError, setChatError] = useState('');
  
  // Estados de error
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Referencias
  const chatContainerRef = useRef(null);

  // Conectar socket al montar el componente
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL;

    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    });
    setSocket(newSocket);

    // Eventos del socket
    newSocket.on('connect', () => {



    });

    newSocket.on('disconnect', (reason) => {

      setError(`Conexión perdida: ${reason}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔥 Error de conexión socket.io:', error);
      setError(`Error de conexión: ${error.message}`);
    });

    newSocket.on('roomUpdate', (data) => {

      setRoom(data.room);
      setBoard(data.room.board);
      setCurrentPlayer(data.room.currentPlayer);
      setWinner(data.room.winner);
      
      // Determinar símbolo del jugador usando el estado actual de playerName
      const player = data.room.players.find(p => p.name === playerName);
      
      if (player) {

        setMySymbol(player.symbol);
      } else {

      }
      
      if (data.room.status === 'waiting') {
        setGameState('waiting');
      } else if (data.room.status === 'playing') {
        setGameState('playing');
      } else if (data.room.status === 'finished') {
        setGameState('finished');
      }
      
      setIsConnecting(false);
    });

    newSocket.on('gameUpdate', (data) => {

      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setWinner(data.winner);
      
      if (data.status === 'finished') {
        setGameState('finished');
      } else if (data.status === 'playing') {
        setGameState('playing');
      }
    });

    newSocket.on('newMessage', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    newSocket.on('roomError', (data) => {
      setError(data.message);
      setIsConnecting(false);
    });

    newSocket.on('gameError', (data) => {
      setError(data.message);
    });

    newSocket.on('chatError', (data) => {
      setChatError(data.message);
    });

    return () => {
      newSocket.close();
    };
  }, [playerName]); // Agregar playerName como dependencia

  // Auto-scroll del chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Actualizar símbolo cuando cambie playerName (si ya estamos en una sala)
  useEffect(() => {
    if (playerName && room) {
      const player = room.players.find(p => p.name === playerName);
      if (player) {

        setMySymbol(player.symbol);
      }
    }
  }, [playerName, room]);

  // Actualizar isMyTurn cuando cambien las variables relevantes
  useEffect(() => {
    const newIsMyTurn = mySymbol && gameState === 'playing' && currentPlayer === mySymbol;
    setIsMyTurn(newIsMyTurn);
  }, [mySymbol, currentPlayer, gameState]);

  // Funciones del juego
  const createRoom = () => {
    if (!playerName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    
    setIsConnecting(true);
    setError('');
    socket.emit('joinRoom', { playerName: playerName.trim() });
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    
    if (!roomId.trim()) {
      setError('Por favor ingresa el ID de la sala');
      return;
    }

    if (!/^\d{5}$/.test(roomId.trim())) {
      setError('El ID de la sala debe ser de 5 dígitos');
      return;
    }
    
    setIsConnecting(true);
    setError('');
    socket.emit('joinRoom', { roomId: roomId.trim(), playerName: playerName.trim() });
  };

  const makeMove = (position) => {
    if (!isMyTurn || board[position] !== null || gameState !== 'playing') {
      return;
    }
    

    socket.emit('makeMove', { position });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    socket.emit('sendMessage', { message: newMessage.trim() });
    setNewMessage('');
    setChatError('');
  };

  const restartGame = () => {

    socket.emit('restartGame');
  };

  const backToMenu = () => {
    setGameState('menu');
    setRoom(null);
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setMySymbol(null);
    setIsMyTurn(false);
    setChatMessages([]);
    setRoomId('');
    setError('');
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  };

  // Renderizar celda del tablero
  const renderCell = (position) => {
    const value = board[position];
    const isWinningCell = false; // Podrías implementar resaltar celdas ganadoras
    const canClick = isMyTurn && !value && gameState === 'playing';
    
    return (
      <button
        key={position}
        className={`w-20 h-20 border-2 border-gray-300 text-3xl font-bold rounded-lg transition-all hover:bg-gray-100 ${
          canClick
            ? 'cursor-pointer hover:border-blue-500' 
            : 'cursor-not-allowed'
        } ${
          value === 'X' ? 'text-blue-600' : 'text-red-600'
        } ${
          isWinningCell ? 'bg-green-200' : ''
        }`}
        onClick={() => makeMove(position)}
        disabled={!canClick}
        title={`Posición ${position} - Clickable: ${canClick}`}
      >
        {value}
      </button>
    );
  };

  // Renderizar pantalla de menú
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🎮</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tres en Raya</h2>
            <p className="text-gray-600">Juega en tiempo real con un amigo</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu nombre
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ingresa tu nombre"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={createRoom}
                disabled={isConnecting || !playerName.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isConnecting ? 'Conectando...' : 'Crear Nueva Sala'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o</span>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="ID de sala (5 dígitos)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3"
                  maxLength={5}
                />
                <button
                  onClick={joinRoom}
                  disabled={isConnecting || !playerName.trim() || !roomId.trim()}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {isConnecting ? 'Conectando...' : 'Unirse a Sala'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Renderizar pantalla de espera
  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Esperando jugador...</h2>
            <p className="text-gray-600 mb-4">Comparte este ID con un amigo:</p>
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <span className="text-3xl font-mono font-bold text-blue-600">{room?.id}</span>
            </div>
            <p className="text-sm text-gray-500">El juego comenzará cuando se una otro jugador</p>
          </div>
          
          <button
            onClick={backToMenu}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  // Renderizar pantalla del juego
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Tres en Raya</h1>
            <div className="text-sm text-gray-600">
              Sala: <span className="font-mono font-bold text-blue-600">{room?.id}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {room?.players.map((player, index) => (
              <div key={index} className={`p-3 rounded-lg ${player.name === playerName ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{player.name}</span>
                  <span className={`text-2xl font-bold ${player.symbol === 'X' ? 'text-blue-600' : 'text-red-600'}`}>
                    {player.symbol}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tablero de juego */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {/* Estado del juego */}
              <div className="text-center mb-6">
                {gameState === 'playing' && (
                  <div className="space-y-2">
                    <p className="text-lg">
                      Turno de: <span className={`font-bold ${currentPlayer === 'X' ? 'text-blue-600' : 'text-red-600'}`}>
                        {room?.players.find(p => p.symbol === currentPlayer)?.name || currentPlayer}
                      </span>
                    </p>
                    {isMyTurn && (
                      <p className="text-green-600 font-medium">¡Es tu turno!</p>
                    )}
                  </div>
                )}
                
                {gameState === 'finished' && (
                  <div className="space-y-4">
                    {winner === 'tie' ? (
                      <p className="text-2xl font-bold text-yellow-600">¡Empate!</p>
                    ) : (
                      <p className="text-2xl font-bold text-green-600">
                        ¡{room?.players.find(p => p.symbol === winner)?.name} gana!
                      </p>
                    )}
                    <button
                      onClick={restartGame}
                      className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Jugar de Nuevo
                    </button>
                  </div>
                )}
              </div>

              {/* Tablero */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6">
                {Array(9).fill(null).map((_, index) => renderCell(index))}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={backToMenu}
                  className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Volver al Menú
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 h-96 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Chat</h3>
              
              {/* Mensajes */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-64"
              >
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`text-sm ${msg.isSystem ? 'text-gray-500 italic' : ''}`}>
                    <span className="font-medium">{msg.playerName}:</span>{' '}
                    <span>{msg.message}</span>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <div className="text-gray-400 text-sm italic text-center">
                    No hay mensajes aún
                  </div>
                )}
              </div>

              {/* Input de mensaje */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    maxLength={200}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    📤
                  </button>
                </div>
                
                {chatError && (
                  <div className="text-red-600 text-xs">{chatError}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JuegoTresEnRaya;
