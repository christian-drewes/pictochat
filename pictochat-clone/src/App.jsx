import React, { useRef, useState, useEffect } from 'react';

export default function Pictochat() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [socket, setSocket] = useState(null);

// --- WebSocket Connection ---
  useEffect(() => {
    // Replace this with the IP you got from 'ipconfig getifaddr en0'
    const ws = new WebSocket('ws://192.168.64.1:9999'); 

    ws.onopen = () => console.log('Connected to WS Server');
    
    ws.onmessage = (event) => {
      const incomingMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, incomingMessage]);
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, []);

  // Set default canvas brush settings on load
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    // Prevent default scrolling when touching the canvas
    if (e.touches) e.preventDefault(); 
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.touches) e.preventDefault();
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const setTool = (toolType) => {
    const ctx = canvasRef.current.getContext('2d');
    if (toolType === 'eraser') {
      ctx.strokeStyle = '#ffffff'; // Match canvas background
      ctx.lineWidth = 15;
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
    }
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!textInput && !canvas) return; 
    
    const imageUrl = canvas.toDataURL();
    const messagePayload = { text: textInput, image: imageUrl };

    // Update local screen immediately
    setMessages((prev) => [...prev, messagePayload]);

    // Broadcast to the Node server
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(messagePayload));
    }

    setTextInput('');
    clearCanvas();
  };

  // --- Retro Dual-Screen Styles ---
  const styles = {
    consoleBody: {
      backgroundColor: '#d8d8d8', // Classic silver/grey
      padding: '24px',
      borderRadius: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      width: '320px',
      boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5), 0 15px 25px rgba(0,0,0,0.4)',
      margin: '40px auto',
      fontFamily: '"Courier New", Courier, monospace',
    },
    screenBezel: {
      backgroundColor: '#1a1a1a',
      padding: '12px',
      borderRadius: '12px',
      boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.8)',
    },
    screenContent: {
      width: '256px',
      height: '192px', // Classic aspect ratio
      backgroundColor: '#f0f4f0', // Slight LCD green/grey tint
      border: '2px solid #000',
      overflowY: 'auto',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    },
    canvasArea: {
      flex: 1,
      cursor: 'crosshair',
      touchAction: 'none', // Critical for mobile drawing
      backgroundColor: '#ffffff'
    },
    messageList: {
      padding: '8px',
      fontSize: '13px',
      color: '#333',
    },
    messageItem: {
      borderBottom: '1px dotted #999',
      paddingBottom: '8px',
      marginBottom: '8px',
    },
    controlPanel: {
      backgroundColor: '#e6e6e6',
      borderTop: '2px solid #000',
      padding: '6px',
    },
    buttonRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
    },
    button: {
      padding: '4px 8px',
      fontSize: '12px',
      fontFamily: 'inherit',
      cursor: 'pointer',
      backgroundColor: '#fff',
      border: '1px solid #999',
      borderRadius: '4px',
    },
    inputRow: {
      display: 'flex',
      gap: '4px',
    },
    textInput: {
      flex: 1,
      padding: '4px',
      fontFamily: 'inherit',
      fontSize: '12px',
      border: '1px solid #999',
    }
  };

  return (
    <div style={styles.consoleBody}>
      
      {/* --- TOP SCREEN (Chat History) --- */}
      <div style={styles.screenBezel}>
        <div style={styles.screenContent}>
          <div style={styles.messageList}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '60px', color: '#888' }}>
                Welcome to Picto-Clone!<br/>Draw or type below.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} style={styles.messageItem}>
                <img src={msg.image} alt="user drawing" style={{ width: '100%', display: 'block' }} />
                {msg.text && <div style={{ marginTop: '4px', fontWeight: 'bold' }}>{msg.text}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- BOTTOM SCREEN (Canvas & Controls) --- */}
      <div style={styles.screenBezel}>
        <div style={styles.screenContent}>
          
          {/* Drawing Canvas */}
          <canvas
            ref={canvasRef}
            width={256}
            height={130} // Subtracting height for the control panel
            style={styles.canvasArea}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {/* Tools & Text Input */}
          <div style={styles.controlPanel}>
            <div style={styles.buttonRow}>
              <button style={styles.button} onClick={() => setTool('pen')}>✏️ Pen</button>
              <button style={styles.button} onClick={() => setTool('eraser')}>🧽 Erase</button>
              <button style={styles.button} onClick={clearCanvas}>❌ Clear</button>
            </div>
            <div style={styles.inputRow}>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Message..."
                style={styles.textInput}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button style={{...styles.button, fontWeight: 'bold'}} onClick={handleSend}>Send</button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}