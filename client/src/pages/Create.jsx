import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';
import { socket } from '../socket';
import { Settings, Save, Zap, Users, Plus, X } from 'lucide-react';
import Swal from 'sweetalert2';

const SUGGESTIONS = [
  "Bob sneezes", "Steve arrives late", "Someone forgets to mute",
  "Loud typing", "Dog barking in background", "\"Can you hear me?\"",
  "Awkward silence", "Someone is eating", "Child walks into room",
  "Screen sharing fails", "\"Next slide please\"", "Connection drops",
  "Someone says 'Synergy'", "Cat walks on keyboard", "Echo/Feedback noise",
  "Someone wearing pajamas", "Coffee spill", "Someone is frozen",
  "\"You're on mute!\"", "Typing while unmuted", "Emergency siren outside",
  "\"Let's take this offline\"", "Someone leaves early", "Air quotes used",
  "\"Can you see my screen?\""
];

const PREMADES = [
  { id: 'office_25', name: 'Office Life (5x5)', cells: [...SUGGESTIONS] },
  { id: 'office_9', name: 'Office Short (3x3)', cells: SUGGESTIONS.slice(0, 9) },
  { id: 'dev_16', name: 'Developer (4x4)', cells: [
    "Build fails", "Merge conflict", "Typo in PR", "Coffee break", 
    "It works on my machine", "Forgot to branch", "Pipeline red", "Deploying on Friday",
    "Missing dependency", "Stack Overflow copy", "Cache issue", "CSS is broken",
    "Lint error", "Restarting IDE", "Database locked", "Zoom crashed"
  ]},
  { id: 'weekend_9', name: 'Weekend (3x3)', cells: [
    "Slept in", "Brunch", "Laundry", "Movie night", "Grocery shopping", "Video games", "Nap", "Cleaning", "Baking"
  ]},
  { id: 'holiday_16', name: 'Holiday Party (4x4)', cells: [
    "Ugly sweater", "Festive music", "Spiked eggnog", "Secret Santa",
    "Someone mentions resolutions", "Tech issue with music", "Awkward toast", "Too much food",
    "Pet on camera", "Flashing lights", "Winter background", "Family member joins",
    "Muted singing", "Takes a screenshot", "Drink spills", "Party ends early"
  ]},
  { id: 'blank_9', name: 'Blank (3x3)', cells: Array(9).fill('') }
];

export default function Create() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [mode, setMode] = useState('fast-click'); // fast-click or casual
  const [cells, setCells] = useState(PREMADES[0].cells);
  const [focusedCell, setFocusedCell] = useState(null);
  const [selectedBoardId, setSelectedBoardId] = useState('office_25');
  const [showMore, setShowMore] = useState(false);
  const [savedBoards, setSavedBoards] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('bingoSavedBoards');
    if (saved) {
      try { setSavedBoards(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const handleCellChange = (index, val) => {
    let newCells = [...cells];
    newCells[index] = val;
    setCells(newCells);
    setSelectedBoardId('custom');
  };

  const getFilteredSuggestions = (text) => {
    if (!text) return SUGGESTIONS;
    return SUGGESTIONS.filter(s => s.toLowerCase().includes(text.toLowerCase()));
  };

  const selectBoard = (board) => {
    setCells([...board.cells]);
    setSelectedBoardId(board.id);
    setShowMore(false);
  };

  const saveCurrentBoard = async () => {
    if (cells.some(c => !c.trim())) {
      return Swal.fire({ icon: 'error', title: 'Empty Cells', text: 'Fill all cells before saving.', background: 'var(--alert-bg)' });
    }
    
    const { value: name } = await Swal.fire({
      title: 'Save Board',
      input: 'text',
      inputLabel: 'Enter a name for this board',
      inputValue: 'My Custom Board',
      showCancelButton: true,
      background: 'var(--alert-bg)',
      color: 'white',
      inputValidator: (value) => {
        if (!value) return 'You need to write something!'
      }
    });

    if (!name) return;
    
    const newBoard = { id: `saved_${Date.now()}`, name, cells: [...cells] };
    const updated = [...savedBoards, newBoard];
    setSavedBoards(updated);
    localStorage.setItem('bingoSavedBoards', JSON.stringify(updated));
    setSelectedBoardId(newBoard.id);
    Swal.fire({ icon: 'success', title: 'Saved!', toast: true, position: 'top', showConfirmButton: false, timer: 1500, background: 'var(--alert-bg)' });
  };

  const createGame = () => {
    if (cells.length < 9) {
      return Swal.fire({ icon: 'error', title: 'Too small', text: 'Minimum 9 cells required.', background: 'var(--alert-bg)' });
    }
    if (cells.some(c => !c.trim())) {
      return Swal.fire({ icon: 'error', title: 'Empty Cells', text: 'Please fill in all cells', background: 'var(--alert-bg)' });
    }
    const generateCode = () => {
      const C = 'BCDFGHJKLMNPRSTVWZ';
      const V = 'AEIOU';
      const rand = (str) => str[Math.floor(Math.random() * str.length)];
      return rand(C) + rand(V) + rand(C) + rand(V);
    };
    const gameId = generateCode();
    
    if (!socket.connected) {
      socket.connect();
    }
    
    socket.emit('createGame', { gameId, cells, mode, hostPlayer: user });
    
    socket.once('gameJoined', (data) => {
      const id = data.game ? data.game.id : gameId;
      navigate(`/game/${id}`);
    });
  };

  const gridSize = Math.ceil(Math.sqrt(cells.length));
  const changeGridSize = (size) => {
    setCells(Array(size * size).fill(''));
    setSelectedBoardId('custom');
  };

  const allBoards = [...PREMADES, ...savedBoards];
  const displayedBoards = allBoards.slice(0, 5);

  return (
    <div className="glass-panel" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <h2 className="title-gradient" style={{ margin: 0, fontSize: '2rem' }}>Game Setup</h2>
        <button className="btn" style={{ padding: '0.6rem 2rem' }} onClick={createGame}>
          <Zap size={18} /> Create Room
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Game Mode</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={`btn ${mode === 'fast-click' ? '' : 'btn-secondary'}`} 
              onClick={() => setMode('fast-click')}
              style={{ flex: 1, padding: '0.5rem' }}
            >
              <Zap size={16} /> Fast Click
            </button>
            <button 
              className={`btn ${mode === 'casual' ? '' : 'btn-secondary'}`} 
              onClick={() => setMode('casual')}
              style={{ flex: 1, padding: '0.5rem' }}
            >
              <Users size={16} /> Casual
            </button>
          </div>
        </div>
        
        <div style={{ flex: 2 }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pre-made Boards</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
             {displayedBoards.map(b => (
               <button 
                 key={b.id} 
                 className={`btn btn-secondary ${selectedBoardId === b.id ? 'selected-board' : ''}`} 
                 style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                 onClick={() => selectBoard(b)}
               >
                 {b.name}
               </button>
             ))}
             <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setShowMore(true)}>
               + More
             </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexShrink: 0 }}>
        <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.1rem' }}>Edit Cells ({cells.length})</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
           <select 
             className="input-field" 
             style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
             value={gridSize}
             onChange={e => changeGridSize(Number(e.target.value))}
           >
             <option value={3}>3x3 (9 cells)</option>
             <option value={4}>4x4 (16 cells)</option>
             <option value={5}>5x5 (25 cells)</option>
           </select>
           <button className="btn btn-secondary" style={{ padding: '0.3rem 1rem', fontSize: '0.85rem' }} onClick={saveCurrentBoard}>
             <Save size={14} /> Save
           </button>
        </div>
      </div>

      <div style={{ 
        flex: 1,
        display: 'grid', 
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, 
        gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
        gap: '8px',
        overflow: 'hidden'
      }}>
        {cells.map((cell, idx) => (
          <div key={idx} style={{ position: 'relative', width: '100%', height: '100%' }}>
               <div 
                 key={`cell-div-${idx}-${cell}`}
                 className="input-field"
                 contentEditable
                 suppressContentEditableWarning
                 onBlur={e => {
                   handleCellChange(idx, e.currentTarget.innerText);
                   setTimeout(() => setFocusedCell(null), 200);
                 }}
                 onFocus={() => setFocusedCell(idx)}
                 style={{ 
                   padding: '0.5rem', 
                   fontSize: cell.length > 25 ? '0.65rem' : cell.length > 15 ? '0.75rem' : '0.85rem', 
                   width: '100%', 
                   height: '100%', 
                   textAlign: 'center', 
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   borderRadius: '10px',
                   lineHeight: 1.1,
                   overflow: 'hidden',
                   wordWrap: 'break-word',
                   outline: 'none',
                   boxSizing: 'border-box'
                 }}
               >
                 {cell || ''}
               </div>
             {focusedCell === idx && (
               <div className="suggestions-dropdown" style={{ zIndex: 20 }}>
                 {getFilteredSuggestions(cell).slice(0, 5).map(sug => (
                   <div 
                     key={sug} 
                     className="suggestion-item" 
                     onMouseDown={() => handleCellChange(idx, sug)} // mousedown fires before blur
                     style={{ fontSize: '0.8rem', textAlign: 'left' }}
                   >
                     {sug}
                   </div>
                 ))}
               </div>
             )}
          </div>
        ))}
      </div>

      {showMore && (
        <div className="dialog-overlay" onClick={() => setShowMore(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2>All Boards</h2>
              <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setShowMore(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {allBoards.map(b => (
                <div key={b.id} className={`board-card ${selectedBoardId === b.id ? 'selected-board' : ''}`} onClick={() => selectBoard(b)}>
                  <h4>{b.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.cells.length} cells</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
