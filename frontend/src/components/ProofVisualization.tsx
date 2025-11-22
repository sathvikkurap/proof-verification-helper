import { useEffect, useMemo, useRef } from 'react';
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
  const cyRef = useRef<cytoscape.Core | null>(null);

  // ALWAYS call hooks at the top level, unconditionally.
  const elements = useMemo<cytoscape.ElementDefinition[]>(() => {
    if (!parsed) return []; // Handle missing data inside the hook

    const defs: cytoscape.ElementDefinition[] = [];
    const addNodes = (items: Array<{ name: string }>, prefix: string, type: string) => {
      items.forEach((item) => {
        defs.push({
          data: {
            id: `${prefix}-${item.name}`,
            label: item.name,
            type,
          },
        });
      });
    };

    addNodes(parsed.theorems || [], 'theorem', 'theorem');
    addNodes(parsed.lemmas || [], 'lemma', 'lemma');
    addNodes(parsed.definitions || [], 'def', 'definition');

    if (proofId) {
      defs.push({
        data: {
          id: proofId,
          label: 'Current Proof',
          type: 'proof',
        },
      });
    }

    (parsed.dependencies || []).forEach((dep, index) => {
      const targetId = (parsed.theorems || []).some((t) => t.name === dep)
        ? `theorem-${dep}`
        : (parsed.lemmas || []).some((l) => l.name === dep)
        ? `lemma-${dep}`
        : (parsed.definitions || []).some((d) => d.name === dep)
        ? `def-${dep}`
        : null;

      if (!targetId) return;

      const sourceId =
        proofId || ((parsed.theorems || []).length > 0 ? `theorem-${parsed.theorems[0].name}` : null);
      if (!sourceId) return;

      defs.push({
        data: {
          id: `edge-${index}`,
          source: sourceId,
          target: targetId,
        },
      });
    });

    return defs;
  }, [parsed, proofId]);

  const layout = useMemo(
    () => ({
      name: 'dagre',
      nodeSep: 50,
      edgeSep: 20,
      rankSep: 100,
      fit: true,
      padding: 30,
      animate: false,
    }),
    []
  );

  const style = useMemo(
    () => [
      {
        selector: 'node[type="proof"]',
        style: {
          'background-color': '#f59e0b',
          label: 'data(label)',
          color: '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          shape: 'round-rectangle',
          width: 140,
          height: 70,
          'font-size': '12px',
          'text-wrap': 'wrap',
          'text-max-width': '120px',
        },
      },
      {
        selector: 'node[type="theorem"]',
        style: {
          'background-color': '#3b82f6',
          label: 'data(label)',
          color: '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          shape: 'round-rectangle',
          width: 120,
          height: 60,
          'font-size': '11px',
          'text-wrap': 'wrap',
          'text-max-width': '100px',
        },
      },
      {
        selector: 'node[type="lemma"]',
        style: {
          'background-color': '#10b981',
          label: 'data(label)',
          color: '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          shape: 'round-rectangle',
          width: 100,
          height: 50,
          'font-size': '10px',
          'text-wrap': 'wrap',
          'text-max-width': '80px',
        },
      },
      {
        selector: 'node[type="definition"]',
        style: {
          'background-color': '#8b5cf6',
          label: 'data(label)',
          color: '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          shape: 'ellipse',
          width: 80,
          height: 40,
          'font-size': '9px',
          'text-wrap': 'wrap',
          'text-max-width': '70px',
        },
      },
      {
        selector: 'node[type="legend"]',
        style: {
          'background-color': 'data(color)',
          label: 'data(label)',
          color: '#000',
          'text-valign': 'center',
          'text-halign': 'center',
          shape: 'rectangle',
          width: 100,
          height: 25,
          'font-size': '10px',
          'font-weight': 'bold',
        },
      },
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': '#6b7280',
          'target-arrow-color': '#6b7280',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'font-size': '8px',
          label: 'depends on',
          'text-background-color': '#fff',
          'text-background-opacity': 0.8,
          'text-background-padding': '2px',
        },
      },
      {
        selector: 'edge.highlighted',
        style: {
          width: 4,
          'line-color': '#3b82f6',
          'target-arrow-color': '#3b82f6',
        },
      },
    ],
    []
  );

  // Check if we have data to show (after hooks!)
  const hasData = parsed && elements.length > 0;

  useEffect(() => {
    // If no container or no data, cleanup and return
    if (!containerRef.current || !hasData) {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      return;
    }

    // Re-initialize or update graph
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cyInstance = cytoscape({
      container: containerRef.current,
      elements,
      style,
      userZoomingEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: true,
    });

    try {
      cyInstance.layout(layout as cytoscape.LayoutOptions).run();
    } catch (e) {
      console.error('Layout failed:', e);
      cyInstance.layout({ name: 'grid', fit: true } as any).run();
    }

    cyInstance.center();
    cyInstance.fit(undefined, 30);

    if (proofId) {
      // Add click handlers for interactive exploration
      cyInstance.on('tap', 'node', (evt) => {
        const node = evt.target;
        const data = node.data();

        if (data.type === 'legend') return; // Don't handle legend clicks

        console.log('Selected node:', data);

        // Highlight dependencies when clicking on theorems/lemmas/definitions
        if (data.type === 'theorem' || data.type === 'lemma' || data.type === 'definition') {
          // Reset all edges to default style
          cyInstance.edges().style('width', 2);
          cyInstance.edges().style('line-color', '#6b7280');

          // Highlight edges connected to this node
          node.connectedEdges().style('width', 4);
          node.connectedEdges().style('line-color', '#3b82f6');
        }

        // Show detailed information about the node
        let info = `${data.type.toUpperCase()}: ${data.label}\n\n`;
        if (data.type === 'theorem') {
          info += '📚 Theorem: A fundamental mathematical statement to be proved.\n';
          info += 'Click to highlight its dependencies in the proof graph.';
        } else if (data.type === 'lemma') {
          info += '🔧 Lemma: A helper result used to prove theorems.\n';
          info += 'Lemmas break down complex proofs into manageable steps.';
        } else if (data.type === 'definition') {
          info += '🏗️ Definition: Establishes mathematical objects and their properties.\n';
          info += 'Definitions provide the foundation for theorems and lemmas.';
        } else if (data.type === 'proof') {
          info += '🎯 Current Proof: The theorem you\'re working on.\n';
          info += 'Arrows show what this proof depends on to be valid.';
        }

        alert(info);
      });

      // Add hover effects
      cyInstance.on('mouseover', 'node', (evt) => {
        const node = evt.target;
        if (node.data().type !== 'legend') {
          node.style('border-width', 3);
          node.style('border-color', '#000');
        }
      });

      cyInstance.on('mouseout', 'node', (evt) => {
        const node = evt.target;
        if (node.data().type !== 'legend') {
          node.style('border-width', 0);
        }
      });

      // Add legend in top-left corner with better positioning
      const legendNodes = [
        { data: { id: 'legend-theorem', label: 'Theorem', type: 'legend', color: '#3b82f6' }, position: { x: 100, y: 40 } },
        { data: { id: 'legend-lemma', label: 'Lemma', type: 'legend', color: '#10b981' }, position: { x: 100, y: 70 } },
        { data: { id: 'legend-definition', label: 'Definition', type: 'legend', color: '#8b5cf6' }, position: { x: 100, y: 100 } },
        { data: { id: 'legend-proof', label: 'Current Proof', type: 'legend', color: '#f59e0b' }, position: { x: 100, y: 130 } },
      ];

      cyInstance.add(legendNodes);
    }

    cyRef.current = cyInstance;

    return () => {
      // Cleanup on unmount or dependency change
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [elements, layout, style, proofId, hasData]); // Include hasData in deps

  // Conditional rendering comes LAST, after all hooks
  if (!hasData) {
    return (
      <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-500">
        No proof structure to visualize. Add theorems, lemmas, or definitions to see the dependency graph.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="border border-gray-300 rounded-lg"
      style={{ height: '500px', minHeight: '500px' }}
    />
  );
}

