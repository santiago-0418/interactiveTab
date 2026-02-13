import { useState } from "react";
import "./App.css";

const STRINGS = 6;
const FRETS = 12;
const STRING_HEIGHT = 30;
const PADDING = 20;
const FRET_WIDTH = 60;

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const TUNINGS = {
  "Standard (EADGBE)": ["E", "A", "D", "G", "B", "E"],
  "Drop D (DADGBE)": ["D", "A", "D", "G", "B", "E"],
};

const SCALES = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  "Major Pentatonic": [0, 2, 4, 7, 9],
  "Minor Pentatonic": [0, 3, 5, 7, 10],
};

function getNoteName(tuning, stringIndex, fret) {
  const openNote = tuning[stringIndex];
  const openIndex = NOTES.indexOf(openNote);
  return NOTES[(openIndex + fret) % 12];
}

function detectChords(noteNames) {
  const unique = [...new Set(noteNames)];
  const noteIndexes = unique.map(n => NOTES.indexOf(n));
  const chords = [];

  for (let root = 0; root < 12; root++) {
    const major = [root, (root + 4) % 12, (root + 7) % 12];
    const minor = [root, (root + 3) % 12, (root + 7) % 12];

    if (major.every(n => noteIndexes.includes(n))) {
      chords.push(NOTES[root] + " major");
    }
    if (minor.every(n => noteIndexes.includes(n))) {
      chords.push(NOTES[root] + " minor");
    }
  }

  return chords;
}

function getScaleNotes(key, scale) {
  const root = NOTES.indexOf(key);
  return SCALES[scale].map(interval => NOTES[(root + interval) % 12]);
}

// Suggest third notes to complete a major or minor triad within ±2 frets
function getSuggestedThirds(selectedNotes, tuning) {
  if (selectedNotes.length !== 2) return [];
  const [note1, note2] = selectedNotes;

  const idx1 = NOTES.indexOf(note1.note);
  const idx2 = NOTES.indexOf(note2.note);

  const suggestions = [];

  const diff = (idx2 - idx1 + 12) % 12;

  // Major triad: intervals = 0,4,7
  if (diff === 4 || diff === 3) {
    const rootIdx = diff === 4 ? idx1 : idx2;
    const thirdIdx = diff === 4 ? (rootIdx + 7) % 12 : (rootIdx + 7) % 12;
    suggestions.push({ type: diff === 4 ? "Major" : "Minor", note: NOTES[thirdIdx] });
  }

  // Simple approach: add both major/minor possibilities
  for (let t of ["Major", "Minor"]) {
    suggestions.push({ type: t, note: t === "Major" ? NOTES[(idx1 + 7) % 12] : NOTES[(idx1 + 3) % 12] });
  }

  return suggestions;
}


function Fretboard({ selected, onToggle, tuning, scaleNotes, showScale, hoverSuggestion }) {
  const width = FRETS * FRET_WIDTH;
  const height = (STRINGS - 1) * STRING_HEIGHT + 2 * PADDING;
  const FRET_MARKERS = [3, 5, 7, 9, 12]; // common markers
  const FRETBOARD_LEFT = 60; // left edge of fretboard rectangle
  const OPEN_X = FRETBOARD_LEFT - 30; // open notes outside

  return (
    <svg width={width + FRETBOARD_LEFT + 40} height={height} style={{ border: "1px solid black" }}>
      
      {/* Frets */}
      {Array.from({ length: FRETS + 1 }).map((_, f) => (
        <line
          key={f}
          x1={f * FRET_WIDTH + FRETBOARD_LEFT}
          y1={PADDING}
          x2={f * FRET_WIDTH + FRETBOARD_LEFT}
          y2={height - PADDING}
          stroke="black"
          strokeWidth={f === 0 ? 4 : 1} // nut is thicker
        />
      ))}

      {/* Strings */}
      {Array.from({ length: STRINGS }).map((_, s) => {
        const flipped = STRINGS - 1 - s;
        return (
          <line
            key={s}
            x1={FRETBOARD_LEFT}
            y1={PADDING + flipped * STRING_HEIGHT}
            x2={width + FRETBOARD_LEFT}
            y2={PADDING + flipped * STRING_HEIGHT}
            stroke="black"
          />
        );
      })}

      {/* Open strings (outside fretboard) */}
      {/* Open strings (0th fret) */}
      {Array.from({ length: STRINGS }).map((_, s) => {
        const flipped = STRINGS - 1 - s;
        const cy = PADDING + flipped * STRING_HEIGHT;
        const note = getNoteName(tuning, s, 0);
        const highlight = hoverSuggestion && hoverSuggestion.note === note;
        const isSelected = selected[s][0];

        return (
          <circle
            key={`open-${s}`}
            cx={OPEN_X}
            cy={cy}
            r={10}
            fill={isSelected ? "orange" : highlight ? "rgba(255,0,0,0.5)" : "lightblue"}
            stroke="black"
            onClick={() => onToggle(s, 0)}
            style={{ cursor: "pointer" }}
          />
        );
      })}


      {/* Frets 1..FRETS */}
      {Array.from({ length: STRINGS }).map((_, s) =>
        Array.from({ length: FRETS }, (_, f) => {
          const flipped = STRINGS - 1 - s;
          const cx = f * FRET_WIDTH + FRET_WIDTH / 2 + FRETBOARD_LEFT;
          const cy = PADDING + flipped * STRING_HEIGHT;
          const fretNumber = f + 1; // 1..FRETS
          const note = getNoteName(tuning, s, fretNumber);
          const isSelected = selected[s][fretNumber];

          let fillColor = "lightblue";
          if (isSelected) fillColor = "orange";
          else if (hoverSuggestion && hoverSuggestion.note === note) fillColor = "rgba(255,0,0,0.5)";
          else if (showScale && scaleNotes.includes(note)) fillColor = "rgba(0,200,0,0.3)";

          return (
            <circle
              key={`${s}-${fretNumber}`}
              cx={cx}
              cy={cy}
              r={10}
              fill={fillColor}
              stroke="black"
              onClick={() => onToggle(s, fretNumber)}
              style={{ cursor: "pointer" }}
            />
          );
        })
      )}


      {/* Fret markers */}
      {FRET_MARKERS.map(f => (
        <circle
          key={`marker-${f}`}
          cx={f * FRET_WIDTH + FRETBOARD_LEFT}
          cy={height / 2}
          r={5}
          fill="black"
        />
      ))}
    </svg>
  );
}


export default function App() {
  const [AISuggestions, setAISuggestions] = useState(null);
  const [tuningName, setTuningName] = useState("Standard (EADGBE)");
  const tuning = TUNINGS[tuningName];

  //sets the default state to have open strings ringing
  const [selected, setSelected] = useState(
  Array.from({ length: STRINGS }, () =>
    Array.from({ length: FRETS + 1 }, (_, f) => f === 0) // only fret 0 is true
  )
);


  const [keyRoot, setKeyRoot] = useState("C");
  const [scaleType, setScaleType] = useState("Major");
  const [showScale, setShowScale] = useState(true);
  const [hoverSuggestion, setHoverSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);


  const scaleNotes = getScaleNotes(keyRoot, scaleType);

  function toggleNote(string, fret) {
  setSelected(prev => {
    const copy = prev.map(row => [...row]);
    // If the clicked fret is already selected, deselect it
    if (copy[string][fret]) {
      copy[string][fret] = false;
    } else {
      // Deselect all other frets on this string
      for (let f = 0; f <= FRETS; f++) {
        copy[string][f] = false;
      }
      // Select the clicked fret
      copy[string][fret] = true;
    }
    return copy;
  });
}




  function clearAll() {
    setSelected(Array.from({ length: STRINGS }, () => Array.from({ length: FRETS }, () => false)));
  }

  // Collect selected notes
  const selectedNotes = [];
for (let s = 0; s < STRINGS; s++) {
  for (let f = 0; f <= FRETS; f++) {
    if (selected[s][f]) {
      selectedNotes.push({ string: s, fret: f, note: getNoteName(tuning, s, f) });
    }
  }
}


  async function getAISuggestions() {
  setLoading(true); // start loading
  try {
    const response = await fetch("https://tab-app-backend.vercel.app/api/suggest", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        key: keyRoot,
        scale: scaleType,
        selectedNotes: selectedNotes
      })
    });
    const data = await response.json();
    setAISuggestions(data.suggestions);
  } catch (err) {
    console.error("Error fetching AI suggestions:", err);
    setAISuggestions("Error fetching suggestions");
  } finally {
    setLoading(false); // stop loading
  }
}


  const detectedChords = detectChords(selectedNotes.map(n => n.note));

  const suggestions = selectedNotes.length === 2 ? getSuggestedThirds(selectedNotes, tuning) : [];

  function applySuggestion(note) {
    // Find a free position in ±2 frets from the two existing notes
    for (let s = 0; s < STRINGS; s++) {
      for (let f = 0; f <= FRETS; f++) {
        if (!selected[s][f > 0 ? f - 1 : 0] && getNoteName(tuning, s, f) === note) {
          toggleNote(s, f);
          return;
        }
      }
    }
  }

  return (
    <div style={{ padding: "20px", display: "flex", gap: "40px" }}>
      <div>
        <h1>Chord Builder</h1>

        <label>
          Tuning:&nbsp;
          <select value={tuningName} onChange={e => setTuningName(e.target.value)}>
            {Object.keys(TUNINGS).map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <br /><br />

        <label>
          Key:&nbsp;
          <select value={keyRoot} onChange={e => setKeyRoot(e.target.value)}>
            {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        &nbsp;&nbsp;

        <label>
          Scale:&nbsp;
          <select value={scaleType} onChange={e => setScaleType(e.target.value)}>
            {Object.keys(SCALES).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        &nbsp;&nbsp;
        <label>
          <input type="checkbox" checked={showScale} onChange={e => setShowScale(e.target.checked)} />
          Show scale overlay
        </label>

        <br /><br />

        <Fretboard
          selected={selected}
          onToggle={toggleNote}
          tuning={tuning}
          scaleNotes={scaleNotes}
          showScale={showScale}
          hoverSuggestion={hoverSuggestion}
        />

        <br />
        <button onClick={clearAll}>Clear</button>
      </div>

      <div>
        <h2>Notes played:</h2>
        {selectedNotes.length === 0 ? <p>(none)</p> :
          <ul>{selectedNotes.map((n, i) => <li key={i}>{n.note} (fret {n.fret})</li>)}</ul>
        }

        <h2>Possible chords:</h2>
        {detectedChords.length === 0 ? <p>(no simple triad found)</p> :
          <ul>{detectedChords.map((c, i) => <li key={i}>{c}</li>)}</ul>
        }

        {suggestions.length > 0 && (
          <>
            <h2>Suggested 3rd notes:</h2>
            <ul>
              {suggestions.map((s, i) => (
                <li key={i}
                  style={{ cursor: "pointer", color: "blue" }}
                  onMouseEnter={() => setHoverSuggestion(s)}
                  onMouseLeave={() => setHoverSuggestion(null)}
                  onClick={() => applySuggestion(s.note)}
                >
                  {s.note} ({s.type})
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    <div>
  <h2>AI Learning Suggestions</h2>
  <button 
    onClick={getAISuggestions} 
    disabled={loading} 
    style={{ cursor: loading ? "not-allowed" : "pointer" }}
  >
    {loading ? "Thinking..." : "Get Suggestions"}
    {loading && <span className="spinner"></span>}
  </button>

  {/* Render suggestions only if array exists and has items */}
  {AISuggestions && AISuggestions.length > 0 && !loading && (
    <div style={{ marginTop: "10px" }}>
      {AISuggestions.map((s, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "10px",
            background: "#f9f9f9",
            color: "black" // optional: fix dark mode later
          }}
        >
          <h3 style={{ margin: "0 0 5px 0" }}>{s.title}</h3>
          <p style={{ margin: "0 0 5px 0", fontStyle: "italic" }}>Source: {s.source}</p>
          {s.link && (
            <a href={s.link} target="_blank" rel="noopener noreferrer">
              {s.link}
            </a>
          )}
          <p style={{ margin: "5px 0 0 0" }}>{s.description}</p>
        </div>
      ))}
    </div>
  )}
</div>



    </div>
  );
}
