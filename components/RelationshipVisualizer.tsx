"use client";

import React, { useState, useCallback } from 'react';
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
import { Database, Key, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────
interface ColDef {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

interface TableNodeData {
  label: string;
  rowCount: number;
  columns: ColDef[];
}

export interface RelationInfo {
  id: string;
  from: string;
  fromCol: string;
  to: string;
  toCol: string;
  type: string;
  description: string;
}

// ─── Custom Node ─────────────────────────────────────────────────
function TableNode({ data, selected }: { data: TableNodeData; selected: boolean }) {
  return (
    <div
      className={cn(
        "bg-zinc-950 border rounded-xl min-w-[240px] overflow-hidden transition-all duration-200",
        selected
          ? "border-accent shadow-[0_0_20px_rgba(138,43,226,0.15)] ring-1 ring-accent/30"
          : "border-zinc-800 hover:border-zinc-700"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-zinc-100 font-mono text-sm">{data.label}</h3>
        </div>
        <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 border border-zinc-700 font-mono">
          {data.rowCount.toLocaleString()} rows
        </span>
      </div>

      {/* Columns */}
      <div className="flex flex-col">
        {data.columns.map((col, idx) => (
          <div
            key={idx}
            className="relative flex items-center justify-between px-4 py-2 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
          >
            <Handle
              type="target"
              position={Position.Left}
              id={`${data.label}-${col.name}-in`}
              className={cn(
                "!w-2.5 !h-2.5 !border-2 !rounded-full",
                col.isFk ? "!bg-blue-500 !border-blue-400" : "!bg-zinc-700 !border-zinc-600"
              )}
              style={{ left: -5 }}
            />

            <div className="flex items-center gap-2">
              {col.isPk ? (
                <Key className="w-3 h-3 text-amber-500 shrink-0" />
              ) : col.isFk ? (
                <Key className="w-3 h-3 text-blue-400 shrink-0" />
              ) : (
                <span className="w-3 h-3 inline-block shrink-0" />
              )}
              <span className="text-[13px] text-zinc-300 font-medium">{col.name}</span>
            </div>

            <span className="text-[11px] text-zinc-600 font-mono ml-4">{col.type}</span>

            <Handle
              type="source"
              position={Position.Right}
              id={`${data.label}-${col.name}-out`}
              className={cn(
                "!w-2.5 !h-2.5 !border-2 !rounded-full",
                col.isPk ? "!bg-amber-500 !border-amber-400" : "!bg-zinc-700 !border-zinc-600"
              )}
              style={{ right: -5 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const nodeTypes = { tableCard: TableNode };

// ─── Data ────────────────────────────────────────────────────────
const initialNodes = [
  {
    id: 'users',
    type: 'tableCard',
    position: { x: 50, y: 80 },
    data: {
      label: 'users',
      rowCount: 124530,
      columns: [
        { name: 'id', type: 'uuid', isPk: true },
        { name: 'email', type: 'varchar' },
        { name: 'status', type: 'varchar' },
        { name: 'created_at', type: 'timestamp' },
      ],
    },
  },
  {
    id: 'orders',
    type: 'tableCard',
    position: { x: 420, y: 0 },
    data: {
      label: 'orders',
      rowCount: 892310,
      columns: [
        { name: 'id', type: 'uuid', isPk: true },
        { name: 'user_id', type: 'uuid', isFk: true },
        { name: 'product_id', type: 'uuid', isFk: true },
        { name: 'amount', type: 'numeric' },
        { name: 'status', type: 'varchar' },
      ],
    },
  },
  {
    id: 'products',
    type: 'tableCard',
    position: { x: 420, y: 280 },
    data: {
      label: 'products',
      rowCount: 3480,
      columns: [
        { name: 'id', type: 'uuid', isPk: true },
        { name: 'name', type: 'varchar' },
        { name: 'price', type: 'numeric' },
        { name: 'category', type: 'varchar' },
      ],
    },
  },
  {
    id: 'payments',
    type: 'tableCard',
    position: { x: 820, y: 40 },
    data: {
      label: 'payments',
      rowCount: 785400,
      columns: [
        { name: 'id', type: 'uuid', isPk: true },
        { name: 'order_id', type: 'uuid', isFk: true },
        { name: 'method', type: 'varchar' },
        { name: 'processed_at', type: 'timestamp' },
      ],
    },
  },
  {
    id: 'subscriptions',
    type: 'tableCard',
    position: { x: 820, y: 300 },
    data: {
      label: 'subscriptions',
      rowCount: 41200,
      columns: [
        { name: 'id', type: 'uuid', isPk: true },
        { name: 'user_id', type: 'uuid', isFk: true },
        { name: 'plan', type: 'varchar' },
        { name: 'expires_at', type: 'timestamp' },
      ],
    },
  },
  {
    id: 'events',
    type: 'tableCard',
    position: { x: 50, y: 380 },
    data: {
      label: 'events',
      rowCount: 12450000,
      columns: [
        { name: 'id', type: 'bigint', isPk: true },
        { name: 'user_id', type: 'uuid', isFk: true },
        { name: 'event_type', type: 'varchar' },
        { name: 'payload', type: 'jsonb' },
      ],
    },
  },
];

const relations: RelationInfo[] = [
  {
    id: 'e-users-orders',
    from: 'users', fromCol: 'id',
    to: 'orders', toCol: 'user_id',
    type: 'One-to-Many',
    description: 'Each user can place multiple orders. The user_id foreign key in orders references users.id.',
  },
  {
    id: 'e-products-orders',
    from: 'products', fromCol: 'id',
    to: 'orders', toCol: 'product_id',
    type: 'One-to-Many',
    description: 'Each product can appear in many orders. The product_id foreign key references products.id.',
  },
  {
    id: 'e-orders-payments',
    from: 'orders', fromCol: 'id',
    to: 'payments', toCol: 'order_id',
    type: 'One-to-Many',
    description: 'Each order can have multiple payment attempts. The order_id foreign key in payments references orders.id.',
  },
  {
    id: 'e-users-subscriptions',
    from: 'users', fromCol: 'id',
    to: 'subscriptions', toCol: 'user_id',
    type: 'One-to-Many',
    description: 'Each user can hold multiple subscriptions across different plan tiers. The user_id references users.id.',
  },
  {
    id: 'e-users-events',
    from: 'users', fromCol: 'id',
    to: 'events', toCol: 'user_id',
    type: 'One-to-Many',
    description: 'High-volume analytics stream. Every user action generates an event row linked via user_id.',
  },
];

const initialEdges = relations.map((r) => ({
  id: r.id,
  source: r.from,
  target: r.to,
  sourceHandle: `${r.from}-${r.fromCol}-out`,
  targetHandle: `${r.to}-${r.toCol}-in`,
  animated: true,
  style: { stroke: '#6366f1', strokeWidth: 2 },
  data: r,
}));

// ─── Detail Panel ────────────────────────────────────────────────
function DetailPanel({ relation, onClose }: { relation: RelationInfo | null; onClose: () => void }) {
  if (!relation) {
    return (
      <div className="w-72 shrink-0 border-l border-zinc-800 bg-zinc-950 p-6 flex flex-col items-center justify-center text-center">
        <Layers className="w-8 h-8 text-zinc-700 mb-3" />
        <p className="text-sm text-zinc-500 font-medium">Select a connection</p>
        <p className="text-xs text-zinc-600 mt-1">Click any edge to inspect the relationship.</p>
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 border-l border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-5 overflow-y-auto">
      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2">Relationship</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-zinc-200 font-semibold">{relation.from}</span>
          <span className="text-zinc-600">→</span>
          <span className="font-mono text-zinc-200 font-semibold">{relation.to}</span>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2">Type</p>
        <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
          {relation.type}
        </span>
      </div>

      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2">Key Mapping</p>
        <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 text-xs font-mono">
          <div className="flex items-center justify-between text-zinc-300">
            <span>
              <span className="text-amber-500">{relation.from}</span>.{relation.fromCol}
            </span>
            <span className="text-zinc-600 px-2">→</span>
            <span>
              <span className="text-blue-400">{relation.to}</span>.{relation.toCol}
            </span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2">Explanation</p>
        <p className="text-sm text-zinc-400 leading-relaxed">{relation.description}</p>
      </div>

      <button
        onClick={onClose}
        className="mt-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2"
      >
        Clear selection
      </button>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────
export function RelationshipVisualizer() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedRelation, setSelectedRelation] = useState<RelationInfo | null>(null);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const rel = relations.find((r) => r.id === edge.id);
    setSelectedRelation(rel || null);

    // Highlight the clicked edge
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        animated: true,
        style: {
          stroke: e.id === edge.id ? '#8a2be2' : '#6366f1',
          strokeWidth: e.id === edge.id ? 3 : 2,
        },
      }))
    );
  }, [setEdges]);

  return (
    <div className="flex h-full w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/50">
      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-zinc-950/30"
        >
          <Controls
            className="!bg-zinc-900 !border-zinc-800 !shadow-xl [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!fill-zinc-400 [&>button:hover]:!bg-zinc-800"
          />
          <MiniMap
            nodeColor="#27272a"
            maskColor="rgba(0,0,0,0.5)"
            className="!bg-zinc-900 !border-zinc-800 !rounded-lg !shadow-xl"
          />
          <Background color="#27272a" gap={24} size={1} />
        </ReactFlow>
      </div>

      {/* Side Panel */}
      <DetailPanel
        relation={selectedRelation}
        onClose={() => {
          setSelectedRelation(null);
          setEdges((eds) =>
            eds.map((e) => ({
              ...e,
              style: { stroke: '#6366f1', strokeWidth: 2 },
            }))
          );
        }}
      />
    </div>
  );
}
