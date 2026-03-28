import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { UserContext } from '../UserContext';
import Swal from 'sweetalert2';
import { Share2, Users, AlertCircle, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

const AnimatedStatus = ({ isFirst, isLoser, score, active }) => {
  return (
    <AnimatePresence>
      {active && isFirst && score > 0 && (
        <motion.span 
          key="crown"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: [0, -15, 15, -10, 10, 0] }} 
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: 'inline-block', marginLeft: '6px' }}
        >
          👑
        </motion.span>
      )}
      {active && isLoser && (
        <motion.span 
          key="crying"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1, x: [0, -4, 4, -4, 4, 0] }} 
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: 'inline-block', marginLeft: '6px' }}
        >
          😭
        </motion.span>
      )}
    </AnimatePresence>
  );
};

export default function Game() {
  const { gameId } = useParams();
  const { user, stats, setStats, pastPlayers, setPastPlayers } = useContext(UserContext);
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [gameJoined, setGameJoined] = useState(false);
  const [localChecks, setLocalChecks] = useState(new Set());
  const [statsRecorded, setStatsRecorded] = useState(false);

  useEffect(() => {
    if (!user.name) {
      navigate('/');
      return;
    }

    if (!socket.connected) socket.connect();

    socket.emit('joinGame', { gameId, player: user });

    socket.on('gameJoined', (data) => {
      setGameJoined(true);
    });

    socket.on('gameState', (state) => {
      setGameState(state);
    });

    socket.on('clickFailed', ({ message }) => {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
        background: 'var(--alert-bg)',
        color: 'var(--text-main)',
        confirmButtonColor: 'var(--danger)',
        timer: 2000
      });
    });

    socket.on('error', (msg) => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        timer: 3000
      }).then(() => {
        navigate('/');
      });
    });

    socket.on('disputeStarted', ({ cellId, cellText, initiatorName, ownerName }) => {
      Swal.fire({
        title: 'Dispute Called!',
        text: `${initiatorName} is disputing ${ownerName}'s claim on "${cellText}". Do you agree to unclaim it?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Unclaim!',
        cancelButtonText: 'No, Keep it!',
        background: 'var(--alert-bg)',
        color: 'var(--text-main)',
        timer: 14000
      }).then((result) => {
        const vote = result.isConfirmed;
        socket.emit('voteDispute', { gameId, cellId, vote });
      });
    });

    socket.on('disputeResult', ({ success, cellText }) => {
      if (success) {
        Swal.fire({ title: 'Dispute Accepted', text: `"${cellText}" has been unclaimed.`, icon: 'success', toast: true, position: 'top', timer: 3000, background: 'var(--alert-bg)', color: 'var(--text-main)' });
      } else {
        Swal.fire({ title: 'Dispute Rejected', text: `The claim on "${cellText}" remains.`, icon: 'info', toast: true, position: 'top', timer: 3000, background: 'var(--alert-bg)', color: 'var(--text-main)' });
      }
    });

    return () => {
      socket.off('gameJoined');
      socket.off('gameState');
      socket.off('clickFailed');
      socket.off('error');
      socket.off('disputeStarted');
      socket.off('disputeResult');
    };
  }, [gameId, user, navigate]);

  const handleCellClick = (cellId, cellOwner) => {
    if (!gameState) return;

    if (gameState.mode === 'fast-click') {
      if (cellOwner) {
        if (cellOwner === socket.id) return; // Ignore if I own it

        Swal.fire({
          icon: 'warning',
          title: 'Too slow!',
          text: 'Another person already clicked it!',
          background: 'var(--alert-bg)',
          color: 'var(--text-main)',
          confirmButtonColor: 'var(--danger)'
        });
        return;
      }
      socket.emit('clickCell', { gameId, cellId });
    } else {
      // Casual Mode: Check locally
      const newChecks = new Set(localChecks);
      if (newChecks.has(cellId)) {
        newChecks.delete(cellId);
      } else {
        newChecks.add(cellId);
      }
      setLocalChecks(newChecks);
    }
  };

  const handleRightClick = (e, cellId, owner) => {
    e.preventDefault();
    if (!gameState || gameState.mode !== 'fast-click') return;
    if (!owner) return;

    Swal.fire({
      title: 'Dispute Claim?',
      text: "Challenge this cell to unclaim it for everyone. The whole room will vote.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--danger)',
      confirmButtonText: 'Initiate Dispute',
      background: 'var(--alert-bg)',
      color: 'var(--text-main)'
    }).then(res => {
      if (res.isConfirmed) {
        socket.emit('initiateDispute', { gameId, cellId });
        socket.emit('voteDispute', { gameId, cellId, vote: true });
      }
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/game/${gameId}`);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Game link copied to clipboard.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      background: 'var(--alert-bg)',
      color: 'var(--text-main)'
    });
  };

  const playersArr = gameState ? Object.values(gameState.players || {}) : [];

  // Calculate display board and grid size
  const displayBoard = (gameState) ? (
    gameState.mode === 'fast-click'
    ? gameState.sharedBoard
    : gameState.cells.map((text, id) => ({ id, text, owner: null }))
  ) : [];

  const gridSize = Math.ceil(Math.sqrt(displayBoard.length));

  let claimedCount = 0;
  if (gameState) {
    if (gameState.mode === 'fast-click') {
      claimedCount = gameState.sharedBoard.filter(c => c.owner).length;
    } else {
      claimedCount = localChecks.size;
    }
  }

  const isHalfFilled = displayBoard.length > 0 && claimedCount >= (displayBoard.length / 2);
  const isGameOver = displayBoard.length > 0 && claimedCount === displayBoard.length;
  const winner = isGameOver ? playersArr.sort((a, b) => b.score - a.score)[0] : null;

  useEffect(() => {
    if (isGameOver && winner && gameState && !statsRecorded) {
      try {
        setStatsRecorded(true);
        
        // Update Stats via Context
        const isWinner = winner.socketId === socket.id;
        setStats(prev => ({
          ...prev,
          played: prev.played + 1,
          won: isWinner ? prev.won + 1 : prev.won
        }));

        // Update Past Players via Context
        setPastPlayers(prev => {
          let updated = [...prev];
          playersArr.forEach(p => {
            if (p.socketId !== socket.id && !updated.some(op => op.name === p.name)) {
              updated.push({ name: p.name, emoji: p.emoji });
            }
          });
          return updated;
        });
      } catch (e) {}
    }
  }, [isGameOver, winner, gameState, playersArr, statsRecorded, setStats, setPastPlayers]);

  if (!gameState) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2 className="title-gradient">Connecting to #{gameId}...</h2>
        <div style={{ marginTop: '2rem' }}>
          <div className="avatar-preview" style={{ background: user.color }}>{user.emoji}</div>
          <p>{user.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ maxWidth: 1200, width: '100%', height: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <div>
          <h2 className="title-gradient" style={{ margin: 0 }}>Room: {gameId}</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>
            Mode: {gameState.mode === 'fast-click' ? 'Fast Click' : 'Casual'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => {
            Swal.fire({
              title: 'Exit Game?',
              text: "Are you sure you want to leave this session?",
              icon: 'question',
              showCancelButton: true,
              background: 'var(--alert-bg)',
              color: 'var(--text-main)'
            }).then(res => {
              if (res.isConfirmed) {
                socket.disconnect();
                navigate('/');
              }
            });
          }}>
            Exit
          </button>
          <button className="btn" onClick={copyLink}>
            <Share2 size={18} /> Share Invite
          </button>
        </div>
      </div>

      <div className="game-layout" style={{ maxWidth: '1200px', width: '100%', flex: 1, margin: '0 auto', flexWrap: 'nowrap', overflow: 'hidden' }}>
        {/* Main Board */}
        <div className="bingo-board-container">
          <div className="bingo-board" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))` }}>
            {displayBoard.map((item, index) => {
              const { id, text, owner } = item;
              let isClaimed = false;
              let ownerPlayer = null;

              if (gameState.mode === 'fast-click') {
                isClaimed = Boolean(owner);
                ownerPlayer = isClaimed ? Object.values(gameState.players).find(p => p.socketId === owner) : null;
              } else {
                isClaimed = localChecks.has(id);
                ownerPlayer = isClaimed ? user : null;
              }

              const borderStyle = isClaimed && ownerPlayer ? `2px solid ${ownerPlayer.color}` : '2px solid var(--glass-border)';
              const bgStyle = isClaimed && ownerPlayer ? `${ownerPlayer.color}22` : 'var(--glass-bg)';

              return (
                <div
                  key={index}
                  className={`bingo-cell ${isClaimed ? 'claimed' : ''}`}
                  onClick={() => handleCellClick(id, owner)}
                  onContextMenu={(e) => handleRightClick(e, id, owner)}
                  style={{ border: borderStyle, background: bgStyle }}
                >
                  <span className="cell-content">{text}</span>
                  {isClaimed && ownerPlayer && (
                    <div style={{ position: 'absolute', bottom: '2px', right: '2px', fontSize: '0.8rem', zIndex: 10 }}>
                      {ownerPlayer.emoji}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar / Leaderboard */}
        <div className="sidebar-layout">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'currentcolor' }}>
            <Trophy size={20} /> Leaderboard
          </h3>
          <div className="player-list" style={{ flexDirection: 'column' }}>
            <AnimatePresence>
              {playersArr.sort((a, b) => b.score - a.score).map((p, idx) => {
                const isLoser = idx === playersArr.length - 1 && playersArr.length > 1;
                return (
                  <motion.div
                    key={p.socketId}
                    layout // This enables the reordering animation
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="player-card"
                    style={{ width: '100%', border: `1px solid ${p.color}`, position: 'relative' }}
                  >
                    <div className="mini-avatar" style={{ background: p.color }}>{p.emoji}</div>
                    <div style={{ flex: 1, fontWeight: idx === 0 ? 'bold' : 'normal' }}>
                      {p.name}
                      <AnimatedStatus isFirst={idx === 0} isLoser={isLoser} score={p.score} active={isHalfFilled} />
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{p.score}</div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, marginTop: '1.5rem', border: '1px solid var(--glass-border)', padding: '0.5rem 1rem', borderRadius: '12px', overflow: 'hidden' }}>
            <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              <AlertCircle size={16} /> Activity Log
            </h4>
            <div style={{ overflowY: 'auto', fontSize: '0.8rem', color: '#cbd5e1', flex: 1, paddingRight: '0.5rem' }}>
              {gameState.events && gameState.events.slice().reverse().map((ev, i) => (
                <div key={i} style={{ marginBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', lineHeight: 1.3 }}>
                  {ev}
                </div>
              ))}
              {(!gameState.events || gameState.events.length === 0) && "Waiting for actions..."}
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Screen */}
      <AnimatePresence>
        {isGameOver && winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="dialog-overlay"
            style={{ zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <Confetti width={window.innerWidth} height={window.innerHeight} recycle={true} style={{ pointerEvents: 'none', position: 'fixed', top: 0, left: 0, zIndex: 10000 }} />
            <motion.div 
              initial={{ scale: 0.5, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              style={{
                background: 'var(--glass-bg)',
                padding: '4rem 2rem',
                borderRadius: '24px',
                border: `2px solid ${winner.color}`,
                textAlign: 'center',
                boxShadow: `0 20px 50px ${winner.color}44`,
                color: 'var(--text-main)',
                maxWidth: '90%',
                width: '500px'
              }}
            >
              <motion.div 
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                style={{ 
                  fontSize: '6rem', 
                  marginBottom: '1rem', 
                  background: winner.color, 
                  width: '140px', 
                  height: '140px', 
                  borderRadius: '50%', 
                  margin: '0 auto 2rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: `0 10px 30px ${winner.color}88`
                }}
              >
                {winner.emoji}
              </motion.div>
              <h1 className="title-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1.1 }}>Game Over!</h1>
              <h2 style={{ fontSize: '1.5rem', color: '#cbd5e1' }}>
                <strong style={{ color: 'var(--text-main)', fontSize: '2rem' }}>{winner.name}</strong> wins with {winner.score} points!
              </h2>
              
              <div style={{ marginTop: '3rem', position: 'relative', zIndex: 10001 }}>
                <button className="btn" onClick={() => navigate('/create')} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
                  New Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
