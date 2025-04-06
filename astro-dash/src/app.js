import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [moonPhaseFilter, setMoonPhaseFilter] = useState('All');
  const [tempRange, setTempRange] = useState([0, 100]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data using useEffect and async/await
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Generate 10 dates starting from 2025-03-26 to 2025-04-04 (recent dates within API limits)
        const dates = Array.from({ length: 10 }, (_, i) => {
          const date = new Date('2025-03-26');
          date.setDate(date.getDate() + i);
          return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        });

        const apiKey = '8498a98276294a8cbaf63544250604'; // Replace with your WeatherAPI key
        const city = 'New York';
        const promises = dates.map(async (date) => {
          const response = await fetch(
            `http://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${city}&dt=${date}`
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch data for ${date}: ${response.statusText}`);
          }
          const result = await response.json();
          return {
            date: date,
            temperature: result.forecast.forecastday[0].day.avgtemp_f,
            moonRise: result.forecast.forecastday[0].astro.moonrise,
            moonSet: result.forecast.forecastday[0].astro.moonset,
            moonPhase: result.forecast.forecastday[0].astro.moon_phase,
          };
        });

        const fetchedData = await Promise.all(promises);
        setData(fetchedData);
        setFilteredData(fetchedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    const filtered = data
      .filter((item) =>
        item.date.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((item) =>
        moonPhaseFilter === 'All' ? true : item.moonPhase === moonPhaseFilter
      )
      .filter((item) =>
        item.temperature >= tempRange[0] && item.temperature <= tempRange[1]
      );
    setFilteredData(filtered);
  }, [searchQuery, moonPhaseFilter, tempRange, data]);

  // Calculate summary statistics
  const lowestTemp = data.length
    ? Math.min(...data.map((item) => item.temperature))
    : null;
  const earliestMoonRise = data.length
    ? data.reduce((earliest, item) => {
        if (!earliest || item.moonRise < earliest) return item.moonRise;
        return earliest;
      }, null)
    : null;
  const mostCommonMoonPhase = data.length
    ? (() => {
        const phaseCount = {};
        data.forEach((item) => {
          phaseCount[item.moonPhase] = (phaseCount[item.moonPhase] || 0) + 1;
        });
        return Object.keys(phaseCount).reduce((a, b) =>
          phaseCount[a] > phaseCount[b] ? a : b
        );
      })()
    : null;

  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle moon phase filter
  const handleMoonPhaseFilter = (e) => {
    setMoonPhaseFilter(e.target.value);
  };

  // Handle temperature range filter
  const handleTempRange = (e, index) => {
    const newRange = [...tempRange];
    newRange[index] = parseInt(e.target.value);
    setTempRange(newRange);
  };

  // Get unique moon phases for the dropdown
  const moonPhases = ['All', ...new Set(data.map((item) => item.moonPhase))];

  // Map moon phases to emojis (as a placeholder for icons)
  const getMoonPhaseEmoji = (phase) => {
    switch (phase?.toLowerCase()) {
      case 'new moon':
        return '🌑';
      case 'waxing crescent':
        return '🌒';
      case 'first quarter':
        return '🌓';
      case 'waxing gibbous':
        return '🌔';
      case 'full moon':
        return '🌕';
      case 'waning gibbous':
        return '🌖';
      case 'last quarter':
        return '🌗';
      case 'waning crescent':
        return '🌘';
      default:
        return '🌙';
    }
  };

  return (
    <div className="App">
      <h1>AstroDash</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">Error: {error}</p>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="summary-stats">
            <div className="stat">
              <h3>Low Temp</h3>
              <p>{lowestTemp !== null ? `${lowestTemp}°F` : 'N/A'}</p>
            </div>
            <div className="stat">
              <h3>Earliest Moon Rise</h3>
              <p>{earliestMoonRise || 'N/A'}</p>
            </div>
            <div className="stat">
              <h3>Most Common Moon Phase</h3>
              <p>{mostCommonMoonPhase || 'N/A'}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="controls">
            <div className="filter">
              <input
                type="text"
                placeholder="Enter Date (YYYY-MM-DD)"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="filter">
              <label>Moon Phase: </label>
              <select value={moonPhaseFilter} onChange={handleMoonPhaseFilter}>
                {moonPhases.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter">
              <label>
                Temperature Range: {tempRange[0]}°F - {tempRange[1]}°F
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={tempRange[0]}
                onChange={(e) => handleTempRange(e, 0)}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={tempRange[1]}
                onChange={(e) => handleTempRange(e, 1)}
              />
            </div>
          </div>

          {/* Data Table */}
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Temperature (°F)</th>
                <th>Moon Rise</th>
                <th>Moon Set</th>
                <th>Moon Phase</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.date}>
                    <td>{item.date}</td>
                    <td>{item.temperature}</td>
                    <td>{item.moonRise}</td>
                    <td>{item.moonSet}</td>
                    <td>
                      {getMoonPhaseEmoji(item.moonPhase)} {item.moonPhase}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No data matches your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
