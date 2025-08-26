import { diffChars } from 'diff';

export default function Diff({ string1, string2 }) {
  const differences = diffChars(string1, string2);

  return (
    <div className="diff-container">
      {differences.map((part, index) => {
        const style = {
          backgroundColor: part.added ? 'lightgreen' : part.removed ? 'lightcoral' : 'transparent',
          textDecoration: part.removed ? 'line-through' : 'none',
        };
        return (
          <span key={index} style={style}>
            {part.value}
          </span>
        );
      })}
    </div>
  );
}