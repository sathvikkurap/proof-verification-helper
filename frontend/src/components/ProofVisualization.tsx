import { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { ParsedProof } from '../store/proofStore';

cytoscape.use(dagre);

interface ProofVisualizationProps {
  parsed: ParsedProof;
  proofId?: string;
}

export default function ProofVisualization({ parsed, proofId }: ProofVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const elements: cytoscape.ElementDefinition[] = [];

  // Add nodes for theorems
  parsed.theorems.forEach((theorem) => {
    elements.push({
      data: {
        id: `theorem-${theorem.name}`,
        label: theorem.name,
        type: 'theorem',
      },
    });
  });

  // Add nodes for lemmas
  parsed.lemmas.forEach((lemma) => {
    elements.push({
      data: {
        id: `lemma-${lemma.name}`,
        label: lemma.name,
        type: 'lemma',
      },
    });
  });

  // Add nodes for definitions
  parsed.definitions.forEach((def) => {
    elements.push({
      data: {
        id: `def-${def.name}`,
        label: def.name,
        type: 'definition',
      },
    });
  });

  // Add main proof node if proofId provided
  if (proofId) {
    elements.push({
      data: {
        id: proofId,
        label: 'Current Proof',
        type: 'proof',
      },
    });
  }

  // Add edges for dependencies
  parsed.dependencies.forEach((dep, index) => {
    // Try to find the target node
    const targetId = parsed.theorems.find((t) => t.name === dep)
      ? `theorem-${dep}`
      : parsed.lemmas.find((l) => l.name === dep)
      ? `lemma-${dep}`
      : parsed.definitions.find((d) => d.name === dep)
      ? `def-${dep}`
      : null;

    if (targetId) {
      const sourceId = proofId || (parsed.theorems.length > 0 ? `theorem-${parsed.theorems[0].name}` : null);
      if (sourceId) {
        elements.push({
          data: {
            id: `edge-${index}`,
            source: sourceId,
            target: targetId,
          },
        });
      }
    }
  });

  const layout = {
    name: 'dagre',
    nodeSep: 50,
    edgeSep: 20,
    rankSep: 100,
  };

  const style = [
    {
      selector: 'node[type="proof"]',
      style: {
        'background-color': '#f59e0b',
        'label': 'data(label)',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'shape': 'round-rectangle',
        'width': 140,
        'height': 70,
      },
    },
    {
      selector: 'node[type="theorem"]',
      style: {
        'background-color': '#3b82f6',
        'label': 'data(label)',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'shape': 'round-rectangle',
        'width': 120,
        'height': 60,
      },
    },
    {
      selector: 'node[type="lemma"]',
      style: {
        'background-color': '#10b981',
        'label': 'data(label)',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'shape': 'round-rectangle',
        'width': 100,
        'height': 50,
      },
    },
    {
      selector: 'node[type="definition"]',
      style: {
        'background-color': '#8b5cf6',
        'label': 'data(label)',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'shape': 'ellipse',
        'width': 80,
        'height': 40,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
      },
    },
  ];

  if (elements.length === 0) {
    return (
      <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-500">
        No proof structure to visualize. Add theorems, lemmas, or definitions to see the dependency graph.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="border border-gray-300 rounded-lg" style={{ height: '500px' }}>
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        layout={layout}
        stylesheet={style}
        cy={(cy) => {
          cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            console.log('Selected node:', node.data());
          });
        }}
      />
    </div>
  );
}

