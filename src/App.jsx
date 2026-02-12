import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const STRINGS = 6;
const FRETS = 12;
const FRET_WIDTH = 60;
const STRING_HEIGHT = 30;

function Fretboard({ onNoteClick }) {
  const width = FRETS * FRET_WIDTH;
  const height = (STRINGS - 1) * STRING_HEIGHT;

  return (
    <svg width={width} height={height} style={{ border: "1px solid black" }}>
      {/* Frets */}
      {Array.from({ length: FRETS + 1 }).map((_, f) => (
        <line
          key={f}
          x1={f * FRET_WIDTH}
          y1={0}
          x2={f * FRET_WIDTH}
          y2={height}
          stroke="black"
        />
      ))}

      {/* Strings */}
      {Array.from({ length: STRINGS }).map((_, s) => (
        <line
          key={s}
          x1={0}
          y1={s * STRING_HEIGHT}
          x2={width}
          y2={s * STRING_HEIGHT}
          stroke="black"
        />
      ))}

      {/* Clickable notes */}
      {Array.from({ length: STRINGS }).map((_, s) =>
        Array.from({ length: FRETS }).map((_, f) => {
          const cx = f * FRET_WIDTH + FRET_WIDTH / 2;
          const cy = s * STRING_HEIGHT;

          return (
            <circle
              key={`${s}-${f}`}
              cx={cx}
              cy={cy}
              r={10}
              fill="lightblue"
              onClick={() => onNoteClick(s, f)}
              style={{ cursor: "pointer" }}
            />
          );
        })
      )}
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState([]);

  function handleNoteClick(string, fret) {
    console.log("Clicked:", string, fret);
    setTab([...tab, { string, fret }]);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Guitar Tab Tool</h1>

      <Fretboard onNoteClick={handleNoteClick} />

      <h2>Tab:</h2>
      <pre>
        {tab.map((n, i) => `String ${n.string + 1}, Fret ${n.fret}\n`)}
      </pre>
    </div>
  );
}
