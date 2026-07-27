import React, { useState } from 'react';

// Region list matching your API requirements
const REGIONS = [
  { code: 'USA', flag: '🇺🇸', name: 'United States' },
  { code: 'CAN', flag: '🇨🇦', name: 'Canada' },
  { code: 'GBR', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AUS', flag: '🇦🇺', name: 'Australia' },
  { code: 'DEU', flag: '🇩🇪', name: 'Germany' },
  { code: 'FRA', flag: '🇫🇷', name: 'France' },
  { code: 'ITA', flag: '🇮🇹', name: 'Italy' },
  { code: 'ESP', flag: '🇪🇸', name: 'Spain' },
  { code: 'JPN', flag: '🇯🇵', name: 'Japan' },
  { code: 'KOR', flag: '🇰🇷', name: 'South Korea' }
];

// Result limit options
const LIMIT_OPTIONS = [5, 10, 25, 50];

// Clean stock image for broken or missing thumbnails
const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?q=80&w=200&auto=format&fit=crop';

export default function App() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('USA');
  const [limit, setLimit] = useState('10');
  
  const [series, setSeries] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);

  // Re-added your date formatter
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    
    setSeries([]);
    setEpisodes([]);

    try {
      const apiUrl = `https://api.nexus.gracenote.com/v1/search?text=${encodeURIComponent(query)}&itemTypes=PODCASTS&limit=${limit}&preferredLanguage=en-GB&contentMarket=${region}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'GN-APIKEY': '2f8c6274c7b51e51c32324adb8424b3ed2ce8340f33129e1a3eebe71d05f71a0'
        }
      });
      
      const json = await response.json();

      let fetchedSeries = [];
      let fetchedEpisodes = [];

      if (json.data && Array.isArray(json.data)) {
        const podcastGroup = json.data.find(g => g.itemType === 'PODCASTS');
        
        if (podcastGroup && podcastGroup.results) {
          podcastGroup.results.forEach(r => {
            const item = r.item;
            
            // Extract the Series
            fetchedSeries.push({
              id: item.podcastID,
              type: 'Series',
              title: item.name,
              author: item.author || item.owner || 'Unknown',
              image: item.images?.[0]?.URL || DEFAULT_IMAGE_URL,
              // Grab the date of the first episode in the array if it exists
              date: (item.episodes && item.episodes[0]?.publicationDateUTC) ? formatDate(item.episodes[0].publicationDateUTC) : '',
              audioUrl: null
            });

            // Extract the Episodes
            if (item.episodes && Array.isArray(item.episodes)) {
              item.episodes.forEach(ep => {
                const mediaUrlObj = ep.URLs?.find(u => u.content === 'MEDIA');
                
                fetchedEpisodes.push({
                  id: ep.podcastEpisodeID || Math.random().toString(),
                  type: 'Episode',
                  title: ep.name,
                  author: item.name, 
                  image: ep.images?.[0]?.URL || item.images?.[0]?.URL || DEFAULT_IMAGE_URL,
                  // Grab the episode's specific date
                  date: ep.publicationDateUTC ? formatDate(ep.publicationDateUTC) : '',
                  audioUrl: mediaUrlObj ? mediaUrlObj.URL : null
                });
              });
            }
          });
        }
      }

      // Enforce the exact limit securely on the frontend arrays before setting state
      const strictLimit = parseInt(limit, 10);
      setSeries(fetchedSeries.slice(0, strictLimit));
      setEpisodes(fetchedEpisodes.slice(0, strictLimit));
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (result) => {
    if (!result.audioUrl) {
      alert("Sorry, no playable audio URL was found in the data for this item.");
      return;
    }
    
    setNowPlaying({
      url: result.audioUrl,
      image: result.image,
      title: result.title,
      subtitle: result.author
    });
  };

  const ResultRow = ({ result }) => (
    <div key={result.id} style={{ display: 'flex', alignItems: 'center', padding: '20px 8px', borderBottom: '1px solid #f3f4f6' }}>
      <img 
        src={result.image} 
        alt={result.title} 
        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE_URL; }}
        style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px', objectFit: 'cover', borderRadius: '12px', marginRight: '24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', backgroundColor: '#f3f4f6' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, paddingRight: '24px' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.05em', color: result.type === 'Series' ? '#8e44ad' : '#ea5b5b', textTransform: 'uppercase', marginBottom: '4px' }}>
          {result.type}
        </span>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0', lineHeight: '1.2' }}>
          {result.title}
        </h3>
        {/* Dates inserted here */}
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          {result.author} {result.date && <span> • {result.type === 'Series' ? 'Latest: ' : ''}{result.date}</span>}
        </p>
      </div>
      <div style={{ flexShrink: 0, marginLeft: '8px' }}>
        <button 
          onClick={() => handlePlay(result)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f2f2f7', color: '#8e44ad', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '3px', transition: 'background-color 0.2s', opacity: result.audioUrl ? 1 : 0.5 }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e5ea'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f2f2f7'}
          title="Play"
        >
          <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4l12 6-12 6V4z" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.5s', justifyContent: hasSearched ? 'flex-start' : 'center', paddingTop: hasSearched ? '48px' : '32px', paddingBottom: nowPlaying ? '120px' : '32px' }}>
      
      <div style={{ width: '100%', maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: '1.1' }}>hello!</h1>
          <h2 style={{ fontSize: '24px', fontWeight: 'normal', color: '#4b5563', margin: 0, lineHeight: '1.2' }}>Search for any podcast series, episode or topic below</h2>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', width: '100%', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '8px', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', borderRight: '1px solid #e5e7eb' }}>
            <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ fontSize: '14px', color: '#4b5563', border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '8px' }}>
              {REGIONS.map(r => <option key={r.code} value={r.code}>{r.flag} {r.code}</option>)}
            </select>
            <svg style={{ width: '12px', height: '12px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 16px', borderRight: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase' }}>Limit</span>
            <select value={limit} onChange={(e) => setLimit(e.target.value)} style={{ fontSize: '14px', color: '#4b5563', border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '4px', fontWeight: 'bold' }}>
              {LIMIT_OPTIONS.map(num => <option key={num} value={num}>{num}</option>)}
            </select>
            <svg style={{ width: '12px', height: '12px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>

          <input
            type="text"
            style={{ flexGrow: 1, padding: '12px 16px', outline: 'none', color: '#111827', fontSize: '16px', border: 'none', background: 'transparent', minWidth: '0' }}
            placeholder="Ask me anything about entertainment metadata..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button type="submit" style={{ backgroundColor: '#8e44ad', color: 'white', borderRadius: '9999px', padding: '12px 24px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '15px', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#732d91'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8e44ad'}>
            Search
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ marginTop: '64px', color: '#6b7280', fontWeight: '500', fontSize: '18px' }}>Fetching from Gracenote API...</div>
      )}

      {!loading && (series.length > 0 || episodes.length > 0) && (
        <div style={{ width: '100%', maxWidth: '896px', margin: '48px auto 0' }}>
          
          {episodes.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px', marginBottom: '12px' }}>
                Latest Episodes
              </h2>
              {episodes.map(result => <ResultRow key={`ep-${result.id}`} result={result} />)}
            </div>
          )}

          {series.length > 0 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px', marginBottom: '12px' }}>
                Podcasts Shows
              </h2>
              {series.map(result => <ResultRow key={`series-${result.id}`} result={result} />)}
            </div>
          )}

        </div>
      )}

      {nowPlaying && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)', zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden', marginRight: '24px' }}>
            <img src={nowPlaying.image} alt="Playing" style={{ width: '48px', height: '48px', borderRadius: '8px', marginRight: '16px', objectFit: 'cover' }} />
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', textOverflow: 'ellipsis', overflow: 'hidden' }}>{nowPlaying.title}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', textOverflow: 'ellipsis', overflow: 'hidden' }}>{nowPlaying.subtitle}</div>
            </div>
          </div>
          <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
            <audio controls autoPlay src={nowPlaying.url} style={{ width: '100%', maxWidth: '500px', height: '40px' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setNowPlaying(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}