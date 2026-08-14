import React, { useState, useEffect } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'favorites'
  const [query, setQuery] = useState('lofi');
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);

  // 1. Search iTunes API directly
  const searchSongs = async (e) => {
    e?.preventDefault();
    if (!query) return;
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=8`);
      const data = await res.json();
      setSongs(data.results || []);
    } catch (err) {
      console.error('iTunes API Search Error:', err);
    }
  };

  // 2. Fetch Favorites from Dockerized MongoDB backend
  const fetchFavorites = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/favorites');
      const data = await res.json();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to fetch favorites from server:', err);
    }
  };

  // Automatically load saved tracks whenever switching to the 'favorites' tab
  useEffect(() => {
    if (activeTab === 'favorites') {
      fetchFavorites();
    }
  }, [activeTab]);

  // 3. Save track reference into Dockerized MongoDB
  const saveToFavorites = async (song) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: song.trackId,
          trackName: song.trackName,
          artistName: song.artistName,
          previewUrl: song.previewUrl,
          artworkUrl: song.artworkUrl100
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Saved "${song.trackName}" to database!`);
      } else {
        alert(`Server Error: ${data.message || data.error || 'Could not save'}`);
      }
    } catch (err) {
      console.error('Full Error Details:', err);
      alert(`Network/Client Error: ${err.message}`);
    }
  };

  // 4. Delete track from Dockerized MongoDB
  const deleteFavorite = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/favorites/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFavorites(favorites.filter((fav) => fav._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete favorite:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <h2>🎵 Minimalist Audio Player</h2>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('search')} 
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer', 
            backgroundColor: activeTab === 'search' ? '#007bff' : '#f0f0f0', 
            color: activeTab === 'search' ? '#fff' : '#333', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '15px' 
          }}
        >
          🔍 Search & Discover
        </button>
        <button 
          onClick={() => setActiveTab('favorites')} 
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer', 
            backgroundColor: activeTab === 'favorites' ? '#007bff' : '#f0f0f0', 
            color: activeTab === 'favorites' ? '#fff' : '#333', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '15px' 
          }}
        >
          ❤️ Saved Favorites ({favorites.length})
        </button>
      </div>

      {/* TAB 1: Search View */}
      {activeTab === 'search' && (
        <>
          <form onSubmit={searchSongs} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search artist, track, or genre..." 
              style={{ flex: 1, padding: '10px', fontSize: '15px' }} 
            />
            <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '15px' }}>
              Search
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
            {songs.map((song) => (
              <div key={song.trackId} style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <img src={song.artworkUrl100} alt={song.trackName} style={{ width: '100%', borderRadius: '6px' }} />
                <h4 style={{ margin: '10px 0 4px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {song.trackName}
                </h4>
                <p style={{ margin: '0 0 10px', color: '#666', fontSize: '12px' }}>{song.artistName}</p>
                
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <button onClick={() => setCurrentSong(song)} style={{ padding: '6px 12px', cursor: 'pointer' }}>
                    ▶ Play
                  </button>
                  <button onClick={() => saveToFavorites(song)} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#e0f7fa', border: '1px solid #00838f' }}>
                    ❤️ Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TAB 2: Favorites View (MongoDB) */}
      {activeTab === 'favorites' && (
        <div>
          <h3>Your Saved Songs</h3>
          {favorites.length === 0 ? (
            <p style={{ color: '#666' }}>No saved tracks yet. Go to Search and click "❤️ Save" on any song!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
              {favorites.map((fav) => (
                <div key={fav._id} style={{ border: '1px solid #00838f', padding: '12px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9fbfb' }}>
                  <img src={fav.artworkUrl} alt={fav.trackName} style={{ width: '100%', borderRadius: '6px' }} />
                  <h4 style={{ margin: '10px 0 4px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fav.trackName}
                  </h4>
                  <p style={{ margin: '0 0 10px', color: '#666', fontSize: '12px' }}>{fav.artistName}</p>
                  
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                    <button onClick={() => setCurrentSong(fav)} style={{ padding: '6px 12px', cursor: 'pointer' }}>
                      ▶ Play
                    </button>
                    <button onClick={() => deleteFavorite(fav._id)} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #c62828' }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fixed Bottom Audio Player */}
      {currentSong && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', color: '#fff', padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={currentSong.artworkUrl100 || currentSong.artworkUrl} alt="" style={{ width: '45px', height: '45px', borderRadius: '4px' }} />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{currentSong.trackName}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>{currentSong.artistName}</div>
            </div>
          </div>
          <audio controls src={currentSong.previewUrl} autoPlay style={{ flex: 1, maxWidth: '400px', margin: '0 20px' }} />
        </div>
      )}
    </div>
  );
}

export default App;