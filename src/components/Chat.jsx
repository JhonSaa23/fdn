import { useState, useEffect, useRef } from 'react';

function Chat({ socket, playerName, gameId, isConnected }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Escuchar mensajes del chat
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        player: data.playerName,
        message: data.message,
        timestamp: new Date().toLocaleTimeString(),
        isOwn: data.playerName === playerName
      }]);
    };

    const handlePlayerJoined = (data) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        player: 'Sistema',
        message: `${data.players.O || data.players.X} se ha unido al juego`,
        timestamp: new Date().toLocaleTimeString(),
        isSystem: true
      }]);
    };

    const handleGameStarted = (data) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        player: 'Sistema',
        message: data.message || '¡El juego ha comenzado!',
        timestamp: new Date().toLocaleTimeString(),
        isSystem: true
      }]);
    };

    const handleGameEnded = (data) => {
      const winnerText = data.message || (data.winner === 'draw' ? '¡Empate!' : `¡${data.winner} ha ganado!`);
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        player: 'Sistema',
        message: winnerText,
        timestamp: new Date().toLocaleTimeString(),
        isSystem: true
      }]);
    };

    const handlePlayerDisconnected = (data) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        player: 'Sistema',
        message: data.message || 'Un jugador se ha desconectado',
        timestamp: new Date().toLocaleTimeString(),
        isSystem: true
      }]);
    };

    // Suscribirse a eventos del chat
    socket.on('chatMessage', handleChatMessage);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('gameStarted', handleGameStarted);
    socket.on('gameEnded', handleGameEnded);
    socket.on('playerDisconnected', handlePlayerDisconnected);

    // Limpiar mensajes cuando se une a un nuevo juego
    if (gameId) {
      setMessages([{
        id: Date.now(),
        player: 'Sistema',
        message: `Te has unido al juego ${gameId}`,
        timestamp: new Date().toLocaleTimeString(),
        isSystem: true
      }]);
    }

    return () => {
      socket.off('chatMessage', handleChatMessage);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('gameStarted', handleGameStarted);
      socket.off('gameEnded', handleGameEnded);
      socket.off('playerDisconnected', handlePlayerDisconnected);
    };
  }, [socket, playerName, gameId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;

    socket.emit('sendChatMessage', {
      gameId,
      playerName,
      message: newMessage.trim()
    });

    setNewMessage('');
    setIsTyping(false);
  };

  return (
    <div className="bg-white shadow-md rounded-lg h-full flex flex-col">
      {/* Header del chat */}
      <div className="bg-blue-500 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-bold">Chat del Juego</h3>
          <p className="text-sm opacity-90">Jugando como: {playerName}</p>
        </div>
        <button
          onClick={() => setMessages([])}
          className="text-white hover:text-gray-200 text-sm"
          title="Limpiar chat"
        >
          🗑️
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            No hay mensajes aún. ¡Sé el primero en escribir!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.isSystem
                    ? 'bg-gray-100 text-gray-600 text-center w-full'
                    : msg.isOwn
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {!msg.isSystem && (
                  <div className="font-semibold text-xs mb-1">
                    {msg.player}
                  </div>
                )}
                <div>{msg.message}</div>
                <div className={`text-xs mt-1 ${
                  msg.isSystem ? 'text-gray-500' : msg.isOwn ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input para enviar mensajes */}
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </div>
        {isTyping && (
          <div className="text-xs text-gray-500 mt-1">
            Escribiendo...
          </div>
        )}
      </form>
    </div>
  );
}

export default Chat;
