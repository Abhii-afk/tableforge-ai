"use client";

import React, { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Database, Key, Check } from 'lucide-react';

// Custom Node for Database Tables
function TableNode({ data }: { data: any }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl min-w-[250px] overflow-hidden group">
      {/* Node Header */}
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-zinc-100">{data.label}</h3>
        </div>
        <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700">
          Table
        </span>
      </div>
      
      {/* Node Body / Columns */}
      <div className="flex flex-col">
        {data.columns.map((col: any, idx: number) => (
          <div key={idx} className="relative flex items-center justify-between px-4 py-2 border-b border-white/5 last:border-0 hover:bg-zinc-900/50 transition-colors">
            {/* Input Handle for relations (Left side) */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${data.label}-${col.name}-in`}
              className="!w-2 !h-2 !bg-zinc-500 !border-0"
              style={{ left: -4, top: '50%' }}
            />
            
            <div className="flex items-center gap-2">
              {col.isPk ? (
                <Key className="w-3.5 h-3.5 text-amber-500" />
              ) : col.isFk ? (
                <Key className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <div className="w-3.5 h-3.5" />
              )}
              <span className="text-sm text-zinc-300 font-medium">{col.name}</span>
            </div>
            
            <span className="text-xs text-zinc-500 font-mono">{col.type}</span>

            {/* Output Handle for relations (Right side) */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${data.label}-${col.name}-out`}
              className="!w-2 !h-2 !bg-zinc-500 !border-0"
              style={{ right: -4, top: '50%' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const nodeTypes = {
  tableCard: TableNode,
};

// Initial Mock Data Structure
const initialNodes = [
  {
    id: 'users',
    type: 'tableCard',
    position: { x: 50, y: 100 },
    data: {
      label: 'users',
      columns: [
        { name: 'id', type: 'uuid', isPk: true },
        { name: 'email', type: 'varchar' },
        { name: 'created_at', type: 'timestamp' },
      ],
    },
  },
  {
    id: 'orders',
    type: 'tableCard',
    position: { x: 450, y: 50 },
    data: {
      label: 'orders',
      columns: [
        { name: 'id', type: 'uuid', isPk: true },
        { name: 'user_id', type: 'uuid', isFk: true },
        { name: 'amount', type: 'numeric' },
        { name: 'status', type: 'varchar' },
      ],
    },
  },
  {
    id: 'payments',
    type: 'tableCard',
    position: { x: 850, y: 150 },
    data: {
      label: 'payments',
      columns: [
        { name: 'id', type: 'uuid', isPk: true },
        { name: 'order_id', type: 'uuid', isFk: true },
        { name: 'method', type: 'varchar' },
      ],
    },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: 'users',
    target: 'orders',
    sourceHandle: 'users-id-out',
    targetHandle: 'orders-user_id-in',
    animated: true,
    style: { stroke: '#60a5fa', strokeWidth: 2 },
  },
  {
    id: 'e2-3',
    source: 'orders',
    target: 'payments',
    sourceHandle: 'orders-id-out',
    targetHandle: 'payments-order_id-in',
    animated: true,
    style: { stroke: '#a78bfa', strokeWidth: 2 },
  },
];

export function RelationshipVisualizer() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-full min-h-[600px] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950/50 backdrop-blur-xl relative">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 shadow-md backdrop-blur">
        <Check className="w-4 h-4 text-emerald-400" />
        <span className="text-xs text-zinc-300 font-medium">Auto-layout Active</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-zinc-950/30"
      >
        <Controls className="bg-zinc-900 border-zinc-800 fill-zinc-400 shadow-xl" />
        <MiniMap 
          nodeColor="#27272a" 
          maskColor="rgba(0,0,0,0.4)" 
          className="bg-zinc-900 border-zinc-800 rounded-lg shadow-xl" 
        />
        <Background color="#3f3f46" gap={20} />
      </ReactFlow>
    </div>
  );
}
