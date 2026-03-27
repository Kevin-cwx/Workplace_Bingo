import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';
import { RefreshCw, Play, PlusCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const EMOJIS = Array.from(new Set([
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢', '🫣', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '🫤', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '🥹', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝', '👍', '👎', '✊', '👊', '🤜', '🤛', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁', '👅', '👄', '🫦', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵', '👮', '🕵', '💂', '🥷', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🏃', '💃', '🕺', '🕴', '👯', '🧘',
  '🐵', '🦍', '🦧', '🐶', '🐕', '🦮', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🫎', '🫏', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿', '🦫', '🦔', '🦇', '🐻', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊', '🦅', '🦆', '🦢', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🪸', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞', '🦗', '🪳', '🕷', '🕸', '🦂', '🦟', '🪰', '🪱', '🦠', '💐', '🌸', '💮', '🏵', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘', '🍀', '🍁', '🍂', '🍃', '🍄', '🌰', '🦀', '🦞', '🦐', '🦑', '🌍', '🌎', '🌏', '🌐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '☀️', '🌝', '🌞', '⭐', '🌟', '🌠', '☁️', '⛅', '⛈', '🌤', '🌥', '🌦', '🌧', '🌨', '🌩', '🌪', '🌫', '🌬', '🌀', '🌈', '🌂', '☔', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊',
  '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🫒', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🫑', '🥔', '🍠', '🥐', '🥨', '🥯', '🍞', '🥖', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🌮', '🌯', '🫔', '🧆', '🥗', '🥘', '🫕', '🥣', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍬', '🍭', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '☕', '🍵', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🥤', '🧋', '🧃', '🧊',
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '🏋️', '🤺', '🤼', '🤸', '⛹️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🎫', '🎟', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴', '🏍', '🛺', '🚅', '🚄', '🚆', '🚢', '🛥', '🚤', '⛴', '🛳', '🚁', '🛸', '🚀', '🛰', '💺', '🛶', '⚓', '🪝', '⛽', '🚧', '🛑', '🎡', '🎢', '🎠', '🏗', '🧳', '⌛', '⏳', '⌚', '⏰', '⏱', '⏲', '🕯', '💡', '🔦', '🏮', '🪔', '🧱', '🪙', '💰', '💴', '💵', '💶', '💷', '💸', '💳', '💎', '⚖', '🦯', '🔧', '🔨', '⚒', '🛠', '⛏', '🔩', '⚙', '🧱', '⛓', '🧰', '🧲', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🧼', '🪥', '🪒', '🌡', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪠', '🔑', '🗝', '🚪', '🛋', '🛏', '🛌', '🖼', '🛍', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🧿', '🏮', '🧸', '🧧', '✉', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '📊', '📈', '📉', '🗒', '🗓', '📅', '📆', '🗑', '📇', '🗃', '🗳', '🗄', '📋', '📁', '📂', '🗂', '🗞', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🔗', '📎', '🖇', '📐', '📏', '📌', '📍', '✂', '🖊', '🖋', '✒', '🖌', '🖍', '📝', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'
]));

export default function Home() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [gameId, setGameId] = useState('');

  const handleGenerate = () => {
    const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    
    // Canvas approach to get the average color of the emoji
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(randomEmoji, 8, 8);
    
    const data = ctx.getImageData(0, 0, 16, 16).data;
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 20) { // If pixel is mostly opaque
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        count++;
      }
    }
    
    const avgR = count > 0 ? rSum / count : 128;
    const avgG = count > 0 ? gSum / count : 128;
    const avgB = count > 0 ? bSum / count : 128;

    let contrastingColor = '';
    let attempts = 0;
    while (attempts < 50) {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      
      const distance = Math.sqrt(
        Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2)
      );
      
      // Ensure color is far away enough so it doesn't blend in
      if (distance > 150) { 
        contrastingColor = `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
        break;
      }
      attempts++;
    }
    
    if (!contrastingColor) {
      contrastingColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    }

    setUser({ ...user, emoji: randomEmoji, color: contrastingColor });
  };

  const joinGame = () => {
    if (!user.name) {
      return Swal.fire({ icon: 'warning', title: 'Missing Username', text: 'Please enter username', background: 'var(--alert-bg)', color: 'white' });
    }
    if (!gameId) {
      return Swal.fire({ icon: 'warning', title: 'Missing Game ID', text: 'Please enter a Game ID', background: 'var(--alert-bg)', color: 'white' });
    }
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="glass-panel" style={{ maxWidth: 450, margin: 'auto', textAlign: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
      
      <h2 className="title-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Setup Profile</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>Personalize your gaming avatar</p>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div 
          className="avatar-preview" 
          style={{ 
            background: user.color || 'var(--primary)', 
            color: 'white', 
            width: '64px', 
            height: '64px',
            margin: 0,
            fontSize: '2rem'
          }}
        >
          {user.emoji}
        </div>
        
        <div style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
          <select 
            className="input-field" 
            style={{ flex: 1, padding: '0 0.2rem', textAlign: 'center', height: '42px', minWidth: '50px', fontSize: '1.2rem' }}
            value={user.emoji} 
            onChange={e => setUser({...user, emoji: e.target.value})}
            title="Choose Emoji"
          >
            {EMOJIS.map(em => (
              <option key={em} value={em}>{em}</option>
            ))}
          </select>
          <input 
            type="color" 
            style={{ width: '42px', height: '42px', flexShrink: 0 }}
            value={user.color} 
            onChange={e => setUser({...user, color: e.target.value})}
            title="Background Color"
          />
          <button className="btn btn-secondary" onClick={handleGenerate} title="Randomize" style={{ padding: '0 0.8rem', height: '42px' }}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          className="input-field input-xl" 
          placeholder="Enter username..." 
          value={user.name}
          onChange={e => setUser({...user, name: e.target.value})}
        />
      </div>

      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', margin: '1.5rem 0', flexShrink: 0 }} />
      
      <button className="btn" style={{ width: '100%', padding: '0.8rem', fontSize: '1.1rem', marginBottom: '1rem', boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)' }} onClick={() => {
        if (!user.name) {
          return Swal.fire({ icon: 'warning', title: 'Missing Username', text: 'Please enter username', background: 'var(--alert-bg)', color: 'white' });
        }
        navigate('/create');
      }}>
        <PlusCircle size={20} /> New Game
      </button>

      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <input 
          type="text" 
          className="input-field input-xl" 
          placeholder="Paste Game ID to join..." 
          value={gameId}
          onChange={e => {
            const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
            setGameId(val);
          }}
          maxLength={4}
          style={{ flex: 1 }}
        />
        <button className="btn btn-secondary" style={{ padding: '0 1.5rem' }} onClick={joinGame}><Play size={18} /> Join</button>
      </div>
    </div>
  );
}
