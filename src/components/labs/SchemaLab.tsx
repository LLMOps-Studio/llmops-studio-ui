import React, { useState } from 'react';
import axios from 'axios';
import { Play, Database, FileJson, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { SCHEMA_LAB_URL } from '../../lib/config';

type FieldType = 'string' | 'integer' | 'number' | 'boolean' | 'array';

interface SchemaField {
  id: string;
  name: string;
  type: FieldType;
  description: string;
  required: boolean;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'string', label: 'Text' },
  { value: 'integer', label: 'Whole number' },
  { value: 'number', label: 'Decimal number' },
  { value: 'boolean', label: 'True/false' },
  { value: 'array', label: 'List of text' },
];

const DEFAULT_CV_TEXT =
  "John Doe\nSenior Software Engineer\n5 years of experience building Python backends and React frontends.\nSkills: Python, TypeScript, Docker, Kubernetes.";

let nextFieldId = 1;
const newField = (): SchemaField => ({
  id: `field-${nextFieldId++}`,
  name: '',
  type: 'string',
  description: '',
  required: true,
});

export const SchemaLab: React.FC = () => {
  const [rawText, setRawText] = useState<string>(DEFAULT_CV_TEXT);
  const [useCustomSchema, setUseCustomSchema] = useState(false);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([newField()]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = (id: string, patch: Partial<SchemaField>) => {
    setSchemaFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id: string) => {
    setSchemaFields((prev) => (prev.length > 1 ? prev.filter((f) => f.id !== id) : prev));
  };

  const schemaIsValid =
    !useCustomSchema ||
    (schemaFields.length > 0 &&
      schemaFields.every((f) => f.name.trim().length > 0) &&
      new Set(schemaFields.map((f) => f.name.trim())).size === schemaFields.length);

  const handleExtract = async () => {
    if (!rawText.trim() || !schemaIsValid) return;

    setIsExtracting(true);
    setError(null);
    setResults(null);

    try {
      const payload: Record<string, unknown> = { raw_text: rawText };
      if (useCustomSchema) {
        payload.schema_fields = schemaFields.map((f) => ({
          name: f.name.trim(),
          type: f.type,
          description: f.description,
          required: f.required,
        }));
      }
      // Direct call to the standalone Schema API
      const response = await axios.post(`${SCHEMA_LAB_URL}/extract`, payload);
      setResults(response.data.extracted_data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="h-full w-full p-6 bg-gray-50 dark:bg-gray-950 overflow-y-auto font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="text-blue-500" />
          Schema Lab
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Standalone laboratory for testing LLM structured data extraction and Pydantic validation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Panel */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Input: Raw Unstructured Text</h3>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useCustomSchema}
                onChange={(e) => setUseCustomSchema(e.target.checked)}
                className="rounded"
              />
              Custom schema
            </label>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            placeholder="Paste raw text here (e.g., CV content, invoice text)..."
          />

          {useCustomSchema && (
            <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Schema fields
                </h4>
                <button
                  onClick={() => setSchemaFields((prev) => [...prev, newField()])}
                  className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Plus size={14} /> Add field
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {schemaFields.map((field) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-[1fr_auto] gap-2 items-start bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        placeholder="field_name"
                        className="col-span-2 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                        className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 px-1">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="rounded"
                        />
                        Required
                      </label>
                      <input
                        type="text"
                        value={field.description}
                        onChange={(e) => updateField(field.id, { description: e.target.value })}
                        placeholder="Description (guides the model)"
                        className="col-span-2 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={() => removeField(field.id)}
                      disabled={schemaFields.length === 1}
                      className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove field"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {!schemaIsValid && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Every field needs a unique, non-empty name.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleExtract}
            disabled={isExtracting || !rawText || !schemaIsValid}
            className={`mt-4 w-full py-3 rounded-lg font-bold text-white shadow-md transition-all flex justify-center items-center gap-2
              ${(isExtracting || !rawText || !schemaIsValid) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
          >
            {isExtracting ? (
              <span className="animate-pulse flex items-center gap-2"><Play size={16} /> Extracting...</span>
            ) : (
              <span className="flex items-center gap-2"><Play size={16} /> Enforce Schema</span>
            )}
          </button>
        </div>

        {/* Right Column: Output Panel */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-[500px]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <FileJson className="text-green-500" /> Validated JSON Output
          </h3>

          {error && (
            <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!results && !error && !isExtracting && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <FileJson size={48} className="mb-4 opacity-30" />
              <p className="text-sm">Awaiting execution. Results will strictly follow the Pydantic schema.</p>
            </div>
          )}

          {isExtracting && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-blue-500 animate-pulse font-medium">Parsing and validating schema...</div>
              <p className="text-xs text-amber-600 dark:text-amber-500 text-center max-w-xs">
                First run may take longer while the local model warms up.
                Please do not refresh the page.
              </p>
            </div>
          )}

          {results && !isExtracting && (
            <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto">
              <pre className="text-sm text-green-600 dark:text-green-400 font-mono">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};