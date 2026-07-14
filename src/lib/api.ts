import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const studioApi = {
  getProjects: async () => {
    const response = await axios.get(`${API_BASE_URL}/projects`);
    return response.data.projects;
  },
  
  getNodes: async () => {
    const response = await axios.get(`${API_BASE_URL}/nodes`);
    return response.data.nodes;
  },

  getModels: async () => {
    const response = await axios.get(`${API_BASE_URL}/models`);
    return response.data.models;
  },
  
  runDag: async (projectName: string, nodes: any[], edges: any[]) => {
    const dagDefinition = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type || (n.data && n.data.type),
        config: n.config || (n.data && n.data.config) || {}
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target
      }))
    };

    const response = await axios.post(`${API_BASE_URL}/run-dag`, {
      project_name: projectName,
      dag_definition: dagDefinition,
      initial_state: {}
    });
    
    return response.data;
  }
};