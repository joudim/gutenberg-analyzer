import React from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function CharacterGraph({ data }) {
  if (!data) return null;

  // Build graph data from character interaction format
  const nodes = [];
  const links = [];
  const seen = new Set();

  data.characters.forEach(char => {
    nodes.push({ id: char.name });

    char.interacts_with.forEach(other => {
      const key = [char.name, other.name].sort().join('-');
      if (!seen.has(key)) {
        links.push({ source: char.name, target: other.name, value: other.count });
        seen.add(key);
      }
    });
  });

  return (
    <div className="mt-6 border rounded p-4 bg-gray-900 text-gray-100 border-gray-700 shadow max-w-3xl mx-auto overflow-hidden">
      <h2 className="text-xl font-bold mb-4 text-center">Character Interaction Graph</h2>
      <div className="w-full max-w-full sm:max-w-3xl mx-auto" style={{ height: '500px' }}>
        <ForceGraph2D
          graphData={{ nodes, links }}
          nodeLabel="id"
          nodeAutoColorBy="id"
          backgroundColor="#1f2937"
          linkColor={() => "#999999"}
          linkWidth={link => Math.max(link.value, 1)}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx) => {
            ctx.fillStyle = "#f3f4f6"; // off-white
            ctx.font = '14px Sans-Serif';
            ctx.fillText(node.id, node.x + 6, node.y + 6);
          }}
        />
      </div>
    </div>
  );
}
