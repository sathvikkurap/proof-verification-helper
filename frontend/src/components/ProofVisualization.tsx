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
      cyInstance.on('tap', 'node', (evt) => {
        const node = evt.target;
        console.log('Selected node:', node.data());
      });
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

