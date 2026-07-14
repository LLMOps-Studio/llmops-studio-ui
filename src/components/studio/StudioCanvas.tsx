import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { studioApi } from '../../lib/api';

let id = 0;
const getId = () => `node_${id++}`;

// --- 1. CONFIGURATION SCHEMAS ---
type ConfigFieldType = 'text' | 'textarea' | 'select' | 'node-ref' | 'model-multi-select';

interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  options?: string[];
}

const NODE_CONFIG_SCHEMAS: Record<string, ConfigField[]> = {
  prompt_comparison: [
    { key: 'prompt_version', label: 'Prompt Version', type: 'select', options: ['v1', 'v2'] },
  ],
  rag_benchmark: [
    { key: 'experiment_name', label: 'Experiment Name', type: 'text' },
    { key: 'raw_text', label: 'Raw Text (Knowledge Base)', type: 'textarea' },
    { key: 'test_queries', label: 'Test Queries (Newline separated)', type: 'textarea' },
    { key: 'chunk_sizes', label: 'Chunk Sizes (Comma separated, e.g., 150,300)', type: 'text' },
    { key: 'chunk_overlaps', label: 'Chunk Overlaps (Comma separated, e.g., 15,30)', type: 'text' },
    { key: 'models', label: 'Models', type: 'model-multi-select' },
  ],
  schema_validation: [
    { key: 'data_key', label: 'Upstream Data Key (Optional)', type: 'text' },
    { key: 'raw_text', label: 'Raw Text (Fallback)', type: 'textarea' },
  ],
  llm_judge_scorer: [
    { key: 'context_node_id', label: 'Context Source (Node ID)', type: 'node-ref' },
    { key: 'response_node_id', label: 'Response Source (Node ID)', type: 'node-ref' },
    { key: 'query', label: 'Evaluation Query', type: 'text' },
  ],
  code_review: [
    { key: 'data_key', label: 'Upstream Data Key (Optional, for chained nodes)', type: 'text' },
    { key: 'code_snippet', label: 'Code Snippet (Fallback)', type: 'textarea' },
  ],
  conversational_memory: [
    { key: 'session_id', label: 'Session ID', type: 'text' },
    { key: 'message', label: 'Agent Prompt / Message', type: 'textarea' },
  ],
};

// --- 2. CUSTOM NODE COMPONENT ---
const StudioNode = ({ data, selected }: { data: any, selected: boolean }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-white dark:bg-gray-800 border-2 transition-transform duration-200
      ${selected ? 'border-blue-500 scale-105 shadow-blue-500/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
      
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-white dark:border-gray-800" />
      
      <div className="flex items-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg border border-blue-100 dark:border-blue-800">
          🧩
        </div>
        <div className="ml-3">
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {data.label}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {data.type}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white dark:border-gray-800" />
    </div>
  );
};

const nodeTypes = {
  studioNode: StudioNode,
};

// --- 3. MAIN CANVAS COMPONENT ---
export const StudioCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [projects, setProjects] = useState<string[]>([]);
  const [availableNodes, setAvailableNodes] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  // Faz 3.2: models fed from GET /api/v1/models (proxies Ollama's /api/tags)
  // instead of a hardcoded list, so config fields reflect what's actually
  // pulled locally.
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Custom Toast State for Error/Success handling without external libraries
  const [toastMessage, setToastMessage] = useState<{title: string, message: string, type: 'error' | 'success'} | null>(null);

  const selectedNode = nodes.find((node) => node.selected);

  useEffect(() => {
    const initData = async () => {
      try {
        const [projData, nodeData, modelData] = await Promise.all([
          studioApi.getProjects(),
          studioApi.getNodes(),
          studioApi.getModels()
        ]);
        setProjects(projData);
        setAvailableNodes(nodeData);
        setAvailableModels(modelData);
        if (projData.length > 0) setSelectedProject(projData[0]);
      } catch (error) {
        setToastMessage({ title: 'Connection Error', message: 'Failed to load Studio metadata from backend.', type: 'error' });
      }
    };
    initData();
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const defaultConfig: Record<string, any> = {};
      const schema = NODE_CONFIG_SCHEMAS[type] || [];
      schema.forEach(field => { defaultConfig[field.key] = ''; });

      const newNode = {
        id: getId(),
        type: 'studioNode',
        position,
        data: { 
          label: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          type: type, 
          config: defaultConfig
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleConfigChange = (key: string, value: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode?.id) {
          return { ...node, data: { ...node.data, config: { ...node.data.config, [key]: value } } };
        }
        return node;
      })
    );
  };

  const handleRunDAG = async () => {
    if (!selectedProject) {
      setToastMessage({ title: 'Validation Error', message: 'Please select a project context first.', type: 'error' });
      return;
    }
    
    setIsRunning(true);
    setExecutionResult(null);
    setToastMessage(null);
    
    try {
      const transformedNodes = nodes.map(n => {
        let parsedConfig = { ...n.data.config };
        if (n.data.type === 'rag_benchmark') {
          parsedConfig = {
            experiment_name: n.data.config.experiment_name || 'default_experiment',
            params: {
              raw_text: n.data.config.raw_text,
              test_queries: n.data.config.test_queries ? n.data.config.test_queries.split('\n').filter(Boolean) : [],
              chunk_sizes: n.data.config.chunk_sizes ? n.data.config.chunk_sizes.split(',').map((s: string) => parseInt(s.trim())) : [],
              chunk_overlaps: n.data.config.chunk_overlaps ? n.data.config.chunk_overlaps.split(',').map((s: string) => parseInt(s.trim())) : [],
              models: n.data.config.models ? n.data.config.models.split(',').map((s: string) => s.trim()) : []
            }
          };
        }
        return { id: n.id, type: n.data.type, config: parsedConfig };
      });

      const result = await studioApi.runDag(selectedProject, transformedNodes, edges);
      setExecutionResult(result);
      setToastMessage({ title: 'Success', message: 'Pipeline executed and evaluated successfully.', type: 'success' });
      
      // Auto-dismiss success toast
      setTimeout(() => setToastMessage(null), 4000);
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'An unexpected error occurred.';
      setToastMessage({ title: 'Execution Failed', message: errorMsg, type: 'error' });
    } finally {
      setIsRunning(false);
    }
  };

  const renderDynamicField = (field: ConfigField, currentValue: string) => {
    const baseInputClass = "w-full p-2 mt-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors";

    if (field.type === 'select') {
      return (
        <select value={currentValue} onChange={(e) => handleConfigChange(field.key, e.target.value)} className={baseInputClass}>
          <option value="" disabled>Select an option...</option>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    if (field.type === 'node-ref') {
      const otherNodes = nodes.filter(n => n.id !== selectedNode?.id);
      return (
        <select value={currentValue} onChange={(e) => handleConfigChange(field.key, e.target.value)} className={baseInputClass}>
          <option value="">Select a source node...</option>
          {otherNodes.map(n => <option key={n.id} value={n.id}>{n.data.label} ({n.id})</option>)}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={currentValue}
          onChange={(e) => handleConfigChange(field.key, e.target.value)}
          className={`${baseInputClass} min-h-[100px] resize-y`}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
        />
      );
    }

    if (field.type === 'model-multi-select') {
      const selected = currentValue ? currentValue.split(',').map(s => s.trim()).filter(Boolean) : [];
      const toggle = (model: string) => {
        const next = selected.includes(model) ? selected.filter(m => m !== model) : [...selected, model];
        handleConfigChange(field.key, next.join(','));
      };
      if (availableModels.length === 0) {
        return <p className="text-xs text-gray-400 mt-1 italic">No models detected -- is Ollama running?</p>;
      }
      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {availableModels.map(model => (
            <label key={model} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 rounded-lg cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <input type="checkbox" checked={selected.includes(model)} onChange={() => toggle(model)} className="rounded text-blue-600 focus:ring-blue-500" />
              {model}
            </label>
          ))}
        </div>
      );
    }

    return (
      <input
        type="text"
        value={currentValue}
        onChange={(e) => handleConfigChange(field.key, e.target.value)}
        className={baseInputClass}
        placeholder={`Enter ${field.label.toLowerCase()}...`}
      />
    );
  };

  const renderConfigForm = () => {
    if (!selectedNode) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          <span className="text-4xl mb-3 opacity-50">🖱️</span>
          <p className="text-sm text-center px-4">Select a node from the canvas to configure its parameters.</p>
        </div>
      );
    }

    const { type, config, label } = selectedNode.data;
    const schema = NODE_CONFIG_SCHEMAS[type] || [];

    if (schema.length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">No configuration required for this node.</p>;
    }

    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
            ⚙️ {label} Settings
          </h4>
          <p className="text-xs text-gray-500 mt-1 font-mono">ID: {selectedNode.id}</p>
        </div>
        
        {schema.map((field) => (
          <div key={field.key} className="flex flex-col group">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">
              {field.label}
            </label>
            {renderDynamicField(field, config[field.key] || '')}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full w-full bg-gray-50 dark:bg-gray-950 font-sans relative overflow-hidden">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={`absolute top-6 right-6 z-[100] flex items-start p-4 w-80 shadow-2xl rounded-xl border-l-4 animate-in slide-in-from-top-5 fade-in duration-300 
          ${toastMessage.type === 'error' ? 'bg-white dark:bg-gray-800 border-red-500 text-red-600' : 'bg-white dark:bg-gray-800 border-green-500 text-green-600'}`}>
          <div className="flex-1">
            <h3 className="font-bold text-sm">{toastMessage.title}</h3>
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">{toastMessage.message}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            ✖
          </button>
        </div>
      )}

      {/* LEFT PANEL: Node Catalog */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col shadow-sm z-10">
        <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">🛠️ Catalog</h3>
        
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Project Context</label>
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Available Nodes</label>
          <div className="space-y-2">
            {availableNodes.map((nodeType) => (
              <div 
                key={nodeType}
                onDragStart={(e) => onDragStart(e, nodeType)}
                draggable
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 cursor-grab active:cursor-grabbing text-xs font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2 transition-all shadow-sm"
              >
                <span className="text-blue-500 text-base">🧩</span> 
                {nodeType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleRunDAG} 
          disabled={isRunning || nodes.length === 0}
          className={`mt-4 w-full py-3 px-4 rounded-xl font-bold text-white transition-all text-sm flex items-center justify-center gap-2 shadow-md
            ${(isRunning || nodes.length === 0) ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
        >
          {isRunning ? <span className="animate-pulse">⏳ Executing...</span> : <span>▶ Run Pipeline</span>}
        </button>
      </div>

      {/* CENTER PANEL: Main Canvas */}
      <div className="flex-1 flex flex-col relative">
        
        {/* GLOBAL LOADING OVERLAY */}
        {isRunning && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="flex flex-col items-center bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Executing Pipeline</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center max-w-[280px]">
                LLM evaluation and model cold-starts may take up to 2-3 minutes depending on edge hardware VRAM.<br/><br/>
                <span className="font-semibold text-amber-600 dark:text-amber-500">Please do not refresh the page.</span>
              </p>
            </div>
          </div>
        )}

        <div ref={reactFlowWrapper} className="flex-1 w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="dark:bg-gray-950"
          >
            <Controls className="dark:bg-gray-800 dark:fill-white" />
            <Background gap={16} size={1} color="#64748b" />
          </ReactFlow>
        </div>
        
        {/* EXECUTION RESULTS PANEL */}
        {executionResult && !isRunning && (
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-20 flex flex-col shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 backdrop-blur">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-2">
                ✅ Execution Results
              </h4>
              <button onClick={() => setExecutionResult(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-200 dark:bg-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                ✖
              </button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto">
              <pre className="text-xs text-green-700 dark:text-green-400 font-mono">
                {JSON.stringify(executionResult.results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Configuration Inspector */}
      <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm z-10 overflow-y-auto">
        <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">🔍 Inspector</h3>
        {renderConfigForm()}
      </div>

    </div>
  );
};