import React, { useState, useEffect } from 'react';

// Live production API URL from Render
const API_BASE_URL = 'https://audio-streaming-platform-rtft.onrender.com';

function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [query, setQuery] = useState('lofi');
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);

  // Auth State
  const [user, setUser] = useState(localStorage.getItem('username') || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // 1. Auth Handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      
      if (!res.ok) return alert(data.error || 'Authentication failed');

      if (authMode === 'login') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setToken(data.token);
        setUser(data.username);
        alert(`Welcome back, ${data.username}!`);
      } else {
        alert('Account created! Please log in.');
        setAuthMode('login');
      }
      setUsernameInput('');
      setPasswordInput('');
    } catch (err) {
      alert('Authentication network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUser(null);
    setFavorites([]);
  };

  // 2. Search iTunes API
  const searchSongs = async (e) => {
    e?.preventDefault();
    if (!query) return;
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=8`);
      const data = await res.json();
      setSongs(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  // 3. Fetch Favorites for logged-in user
  const fetchFavorites = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'favorites' && token) {
      fetchFavorites();
    }
  }, [activeTab, token]);

  // 4. Save Favorite (Protected)
  const saveToFavorites = async (song) => {
    if (!token) return alert('Please login to save songs to your account!');
    try {
      const res = await fetch(`${API_BASE_URL}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trackId: song.trackId,
          trackName: song.trackName,
          artistName: song.artistName,
          previewUrl: song.previewUrl,
          artworkUrl: song.artworkUrl100
        })
      });
      if (res.ok) alert(`Saved "${song.trackName}" to your account!`);
      else alert('Could not save track.');
    } catch (err) {
      alert('Error saving track');
    }
  };

  // 5. Delete Favorite (Protected)
  const deleteFavorite = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/favorites/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setFavorites(favorites.filter(f => f._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      {/* Header & Auth bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <h2>🎵 Audio Streaming App</h2>
        {user ? (
          <div>
            <span>Welcome, <b>{user}</b>! </span>
            <button onClick={handleLogout} style={{ padding: '6px 12px', cursor: 'pointer' }}>Logout</button>
          </div>
        ) : (
          <span style={{ fontSize: '14px', color: '#666' }}>Not logged in</span>
        )}
      </div>

      {/* Auth Form (if not logged in) */}
      {!token && (
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>{authMode === 'login' ? 'Login to your Account' : 'Register New Account'}</h3>
          <form onSubmit={handleAuth} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Username" 
              value={usernameInput} 
              onChange={e => setUsernameInput(e.target.value)} 
              required 
              style={{ padding: '8px' }}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)} 
              required 
              style={{ padding: '8px' }}
            />
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>
              {authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <span 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
              style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {authMode === 'login' ? 'Register here' : 'Login here'}
            </span>
          </p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('search')} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: activeTab === 'search' ? '#007bff' : '#f0f0f0', color: activeTab === 'search' ? '#fff' : '#333', border: 'none', borderRadius: '4px' }}>
          🔍 Search & Discover
        </button>
        <button onClick={() => setActiveTab('favorites')} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: activeTab === 'favorites' ? '#007bff' : '#f0f0f0', color: activeTab === 'favorites' ? '#fff' : '#333', border: 'none', borderRadius: '4px' }}>
          ❤️ Saved Favorites ({favorites.length})
        </button>
      </div>

      {/* TAB 1: Search View */}
      {activeTab === 'search' && (
        <>
          <form onSubmit={searchSongs} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search artist or song..." style={{ flex: 1, padding: '10px' }} />
            <button type="submit" style={{ padding: '10px 20px' }}>Search</button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
            {songs.map((song) => (
              <div key={song.trackId} style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <img src={song.artworkUrl100} alt={song.trackName} style={{ width: '100%', borderRadius: '6px' }} />
                <h4 style={{ margin: '10px 0 4px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.trackName}</h4>
                <p style={{ margin: '0 0 10px', color: '#666', fontSize: '12px' }}>{song.artistName}</p>
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <button onClick={() => setCurrentSong(song)}>▶ Play</button>
                  <button onClick={() => saveToFavorites(song)} style={{ backgroundColor: '#e0f7fa', border: '1px solid #00838f' }}>❤️ Save</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TAB 2: Favorites View */}
      {activeTab === 'favorites' && (
        <div>
          <h3>Your Saved Songs</h3>
          {!token ? (
            <p style={{ color: '#d9534f' }}>Please log in above to view your saved favorites.</p>
          ) : favorites.length === 0 ? (
            <p style={{ color: '#666' }}>No saved tracks yet on this user account.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
              {favorites.map((fav) => (
                <div key={fav._id} style={{ border: '1px solid #00838f', padding: '12px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9fbfb' }}>
                  <img src={fav.artworkUrl} alt={fav.trackName} style={{ width: '100%', borderRadius: '6px' }} />
                  <h4 style={{ margin: '10px 0 4px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fav.trackName}</h4>
                  <p style={{ margin: '0 0 10px', color: '#666', fontSize: '12px' }}>{fav.artistName}</p>
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                    <button onClick={() => setCurrentSong(fav)}>▶ Play</button>
                    <button onClick={() => deleteFavorite(fav._id)} style={{ backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #c62828' }}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Player Bar */}
      {currentSong && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', color: '#fff', padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>{currentSong.trackName}</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>{currentSong.artistName}</div>
          </div>
          <audio controls src={currentSong.previewUrl} autoPlay style={{ flex: 1, maxWidth: '400px', margin: '0 20px' }} />
        </div>
      )}
    </div>
  );
}

export default App;