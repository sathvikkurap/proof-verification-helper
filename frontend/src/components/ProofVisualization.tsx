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

    // Helper function to create nodes with dynamic sizing
    const addNodes = (items: Array<{ name: string }>, prefix: string, type: string) => {
      items.forEach((item) => {
        const label = item.name;
        const labelLength = label.length;
        // Dynamic sizing based on label length
        const baseWidth = type === 'proof' ? 140 : type === 'theorem' ? 120 : type === 'lemma' ? 100 : 80;
        const baseHeight = type === 'proof' ? 70 : type === 'theorem' ? 60 : type === 'lemma' ? 50 : 40;

        // Increase size for longer labels
        const width = Math.max(baseWidth, Math.min(labelLength * 8 + 40, 200));
        const height = Math.max(baseHeight, Math.min(labelLength * 2 + 30, 100));

        defs.push({
          data: {
            id: `${prefix}-${item.name}`,
            label: label,
            type,
            width,
            height,
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
          width: 140,
          height: 70,
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
      nodeSep: 80, // Increased from 50 to prevent horizontal overlap
      edgeSep: 40, // Increased from 20 to prevent edge overlap
      rankSep: 150, // Increased from 100 to prevent vertical overlap
      fit: true,
      padding: 50, // Increased padding for better spacing
      animate: false,
      rankDir: 'TB', // Top to bottom layout
      align: 'UL', // Align to top-left to prevent centering issues
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
          width: 'data(width)',
          height: 'data(height)',
          'font-size': '12px',
          'text-wrap': 'wrap',
          'text-max-width': 'data(width)',
          'padding': '10px',
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
          width: 'data(width)',
          height: 'data(height)',
          'font-size': '11px',
          'text-wrap': 'wrap',
          'text-max-width': 'data(width)',
          'padding': '8px',
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
          width: 'data(width)',
          height: 'data(height)',
          'font-size': '10px',
          'text-wrap': 'wrap',
          'text-max-width': 'data(width)',
          'padding': '6px',
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
          width: 'data(width)',
          height: 'data(height)',
          'font-size': '9px',
          'text-wrap': 'wrap',
          'text-max-width': 'data(width)',
          'padding': '4px',
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
          'control-point-distance': 50, // Add curvature to avoid overlap
          'control-point-weight': 0.5,
          'font-size': '8px',
          // Remove edge labels to reduce clutter
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

  // Calculate dynamic container height based on number of nodes
  const containerHeight = useMemo(() => {
    const nodeCount = elements.filter(el => el.data && el.data.type !== 'legend').length;
    const minHeight = 400;
    const calculatedHeight = Math.max(minHeight, Math.min(nodeCount * 60 + 200, 800));
    return calculatedHeight;
  }, [elements]);

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
      wheelSensitivity: 0.2, // Better zoom control
    });

    // Try dagre layout first, fallback to other layouts
    let layoutApplied = false;
    try {
      cyInstance.layout(layout as cytoscape.LayoutOptions).run();
      layoutApplied = true;
    } catch (e) {
      console.error('Dagre layout failed:', e);
      // Try breadth-first layout as fallback
      try {
        cyInstance.layout({
          name: 'breadthfirst',
          fit: true,
          padding: 50,
          spacingFactor: 2.0, // Increased spacing
          avoidOverlap: true,
        }).run();
        layoutApplied = true;
      } catch (e2) {
        console.error('Breadth-first layout failed:', e2);
        // Try concentric layout
        try {
          cyInstance.layout({
            name: 'concentric',
            fit: true,
            padding: 50,
            spacingFactor: 1.5,
            avoidOverlap: true,
          }).run();
          layoutApplied = true;
        } catch (e3) {
          console.error('Concentric layout failed:', e3);
          // Final fallback to grid
          cyInstance.layout({
            name: 'grid',
            fit: true,
            padding: 50,
            avoidOverlap: true,
          }).run();
          layoutApplied = true;
        }
      }
    }

    if (layoutApplied) {
      // Small delay to ensure layout is complete before centering
      setTimeout(() => {
        if (cyInstance && !cyInstance.destroyed()) {
          cyInstance.center();
          cyInstance.fit(undefined, 50);

          // Ensure the graph is properly sized and visible
          const extent = cyInstance.extent();
          if (extent.w > 0 && extent.h > 0) {
            // Graph has content, zoom to fit
            cyInstance.fit(undefined, 50);
          } else {
            // No content, just center
            cyInstance.center();
          }
        }
      }, 100);
    }

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

      // Add legend dynamically positioned outside the graph area
      // Wait for layout to complete before positioning legend
      setTimeout(() => {
        if (!cyInstance || cyInstance.destroyed()) return;

        const extent = cyInstance.extent();
        const legendX = extent.x1 - 150; // Position to the left of the graph
        const legendY = extent.y1 + 50; // Start near the top

        const legendNodes = [
          { data: { id: 'legend-theorem', label: 'Theorem', type: 'legend', color: '#3b82f6' }, position: { x: legendX, y: legendY } },
          { data: { id: 'legend-lemma', label: 'Lemma', type: 'legend', color: '#10b981' }, position: { x: legendX, y: legendY + 30 } },
          { data: { id: 'legend-definition', label: 'Definition', type: 'legend', color: '#8b5cf6' }, position: { x: legendX, y: legendY + 60 } },
          { data: { id: 'legend-proof', label: 'Current Proof', type: 'legend', color: '#f59e0b' }, position: { x: legendX, y: legendY + 90 } },
        ];

        // Only add legend if it won't interfere with the graph
        if (legendX > -200) { // Only show if there's space
          cyInstance.add(legendNodes);
        }
      }, 200);
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
      className="border border-gray-300 rounded-lg w-full"
      style={{
        height: `${containerHeight}px`,
        minHeight: '400px',
        maxHeight: '800px'
      }}
    />
  );
}

