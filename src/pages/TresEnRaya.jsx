import { useState, useEffect, useRef } from 'react';
import { useNotification } from '../TresEnRayaApp';
import { createSocketConnection, SOCKET_CONFIG } from '../services/socketConfig';
import Chat from '../components/Chat';

function TresEnRaya() {
  // Estados para el juego
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState({ X: '', O: '' });
  const [gameId, setGameId] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, finished
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const { showNotification } = useNotification();
  const socketRef = useRef();

  // Conectar al WebSocket cuando el componente se monta
  useEffect(() => {
    // Solo conectar una vez al montar el componente
    const socket = createSocketConnection();

    // Manejar eventos de conexión
    socket.on('connect', () => {
      setIsConnected(true);
      showNotification('success', '¡Conectado al servidor!');
      console.log('Conectado al servidor WebSocket');
    });

    socket.on('connect_error', (error) => {
      setIsConnected(false);
      console.error('Error de conexión WebSocket:', error);
      showNotification('danger', `Error de conexión: ${error.message}`);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      showNotification('danger', `Desconectado del servidor: ${reason}`);
      console.log('Desconectado del servidor WebSocket:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
      showNotification('success', `Reconectado al servidor después de ${attemptNumber} intentos`);
      console.log('Reconectado al servidor WebSocket');
    });

    socket.on('reconnect_error', (error) => {
      console.error('Error al reconectar:', error);
    });

    socket.on('reconnect_failed', () => {
      showNotification('danger', 'No se pudo reconectar al servidor después de múltiples intentos');
      console.error('Falló la reconexión después de múltiples intentos');
    });

    // Eventos del juego
    socket.on('gameCreated', (data) => {
      setGameId(data.gameId);
      setPlayerSymbol('X');
      setGameStatus('waiting');
      setPlayers(prev => ({ ...prev, X: playerName }));
      showNotification('info', `Juego creado. ID: ${data.gameId}. Esperando oponente...`);
    });

    socket.on('playerJoined', (data) => {
      setPlayers(data.players);
      if (data.players.X && data.players.O) {
        setGameStatus('playing');
        showNotification('success', '¡El juego ha comenzado!');
      }
    });

    socket.on('gameState', (data) => {
      setBoard(data.board);
      setIsXNext(data.isXNext);
      setWinner(data.winner);
      if (data.winner) {
        setGameStatus('finished');
        setPlayers(currentPlayers => {
          showNotification('info', `¡Juego terminado! Ganador: ${data.winner === 'draw' ? 'Empate' : currentPlayers[data.winner]}`);
          return currentPlayers;
        });
      }
    });

    socket.on('error', (data) => {
      showNotification('danger', data.message);
    });

    // Guardar referencia del socket
    socketRef.current = socket;

    // Cleanup al desmontar
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // Sin dependencias para evitar re-renders

  // Función para reconectar manualmente
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    // Crear nueva conexión
    const socket = createSocketConnection();
    socketRef.current = socket;
    
    // Reconfigurar eventos
    socket.on('connect', () => {
      setIsConnected(true);
      showNotification('success', '¡Reconectado al servidor!');
    });
    
    socket.on('connect_error', (error) => {
      setIsConnected(false);
      showNotification('danger', `Error de reconexión: ${error.message}`);
    });
  };

  // Función para crear un nuevo juego
  const createGame = () => {
    if (!playerName.trim()) {
      showNotification('warning', 'Por favor ingresa tu nombre');
      return;
    }
    
    if (socketRef.current) {
      socketRef.current.emit('createGame', { playerName });
    }
  };

  // Función para unirse a un juego
  const joinGame = () => {
    if (!playerName.trim()) {
      showNotification('warning', 'Por favor ingresa tu nombre');
      return;
    }
    
    if (!gameId) {
      showNotification('warning', 'Por favor ingresa el ID del juego');
      return;
    }
    
    if (socketRef.current) {
      socketRef.current.emit('joinGame', { gameId, playerName });
      setPlayerSymbol('O');
    }
  };

  // Función para realizar un movimiento
  const handleClick = (index) => {
    // Verificar si es el turno del jugador actual
    if (
      gameStatus !== 'playing' || 
      board[index] || 
      winner || 
      (isXNext && playerSymbol !== 'X') || 
      (!isXNext && playerSymbol !== 'O')
    ) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('makeMove', {
        gameId,
        index,
        symbol: playerSymbol
      });
    }
  };

  // Función para reiniciar el juego
  const resetGame = () => {
    if (gameStatus === 'finished' && socketRef.current) {
      socketRef.current.emit('resetGame', { gameId });
    }
  };

  // Renderizar casilla del tablero
  const renderSquare = (index) => {
    return (
      <button
        className={`w-20 h-20 border border-gray-400 text-4xl font-bold flex items-center justify-center
          ${board[index] === 'X' ? 'text-blue-600' : 'text-red-600'}
          ${gameStatus === 'playing' && !board[index] && ((isXNext && playerSymbol === 'X') || (!isXNext && playerSymbol === 'O')) ? 'hover:bg-gray-200' : ''}
          ${board[index] ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={() => handleClick(index)}
        disabled={gameStatus !== 'playing' || board[index] || winner}
      >
        {board[index]}
      </button>
    );
  };

  // Renderizar estado del juego
  const renderStatus = () => {
    if (winner) {
      if (winner === 'draw') {
        return <div className="text-xl font-bold mb-4">¡Empate!</div>;
      }
      return <div className="text-xl font-bold mb-4">Ganador: {players[winner]} ({winner})</div>;
    } else if (gameStatus === 'playing') {
      return <div className="text-xl mb-4">Turno de: {isXNext ? players.X : players.O} ({isXNext ? 'X' : 'O'})</div>;
    } else if (gameStatus === 'waiting') {
      return <div className="text-xl mb-4">Esperando oponente...</div>;
    }
    return <div className="text-xl mb-4">Inicia un juego o únete a uno existente</div>;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Panel izquierdo - Juego */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Tres en Raya</h1>
        
        {/* Estado de conexión */}
        <div className="mb-4 flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </div>
          {!isConnected && (
            <button
              onClick={reconnect}
              className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
            >
              Reconectar
            </button>
          )}
        </div>
        
        {/* Formulario de registro */}
        {!playerSymbol && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Unirse al juego</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Tu nombre:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Ingresa tu nombre"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={createGame}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex-1"
              >
                Crear juego
              </button>
              
              <div className="flex flex-1 gap-2">
                <input
                  type="text"
                  value={gameId || ''}
                  onChange={(e) => setGameId(e.target.value)}
                  className="shadow appearance-none border rounded flex-1 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="ID del juego"
                />
                <button
                  onClick={joinGame}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Unirse
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Información del juego */}
        {playerSymbol && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Información del juego</h2>
            <p><strong>ID del juego:</strong> {gameId}</p>
            <p><strong>Tu símbolo:</strong> {playerSymbol}</p>
            <div className="mt-2">
              <p><strong>Jugador X:</strong> {players.X || 'Esperando...'}</p>
              <p><strong>Jugador O:</strong> {players.O || 'Esperando...'}</p>
            </div>
          </div>
        )}
        
        {/* Estado del juego */}
        {renderStatus()}
        
        {/* Tablero de juego */}
        {(gameStatus === 'playing' || gameStatus === 'finished') && (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-1">
              {renderSquare(0)}
              {renderSquare(1)}
              {renderSquare(2)}
              {renderSquare(3)}
              {renderSquare(4)}
              {renderSquare(5)}
              {renderSquare(6)}
              {renderSquare(7)}
              {renderSquare(8)}
            </div>
          </div>
        )}
        
        {/* Botón para reiniciar */}
        {gameStatus === 'finished' && (
          <button
            onClick={resetGame}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Jugar de nuevo
          </button>
        )}
      </div>

      {/* Panel derecho - Chat */}
      <div className="w-80 bg-gray-50 border-l border-gray-200">
        {playerSymbol ? (
          <Chat 
            socket={socketRef.current}
            playerName={playerName}
            gameId={gameId}
            isConnected={isConnected}
          />
        ) : (
          <div className="bg-white shadow-md rounded-lg h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-lg font-semibold mb-2">Chat del Juego</p>
              <p className="text-sm">Únete a un juego para comenzar a chatear</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TresEnRaya;
