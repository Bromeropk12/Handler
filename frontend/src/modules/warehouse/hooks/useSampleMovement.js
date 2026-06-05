import { useState, useCallback } from 'react';
import { warehouseAPI } from '../../../services/api';

export const useSampleMovement = (onSuccess) => {
  // modes: 'idle' | 'moving' | 'confirming' | 'target-picker'
  const [mode, setMode] = useState('idle');
  
  // map of sampleId -> { targetShelfId, targetShelfName, x, y, z, sampleData }
  const [assignments, setAssignments] = useState(new Map());
  
  // the shelf currently being viewed for assigning targets
  const [activeTargetShelf, setActiveTargetShelf] = useState(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionErrors, setExecutionErrors] = useState([]);

  const startMove = useCallback((samples, currentShelf) => {
    const initialAssignments = new Map();
    samples.forEach(s => {
      initialAssignments.set(s.id, {
        sampleData: s,
        targetShelfId: null,
        targetShelfName: null,
        x: null,
        y: null,
        z: null
      });
    });
    setAssignments(initialAssignments);
    setActiveTargetShelf(currentShelf);
    setMode('moving');
    setExecutionErrors([]);
  }, []);

  const changeTargetShelf = useCallback((shelf) => {
    setActiveTargetShelf(shelf);
    setMode('moving');
  }, []);

  const openTargetPicker = useCallback(() => {
    setMode('target-picker');
  }, []);

  const assignTarget = useCallback((sampleId, pos, targetShelf) => {
    setAssignments(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(sampleId);
      if (existing) {
        newMap.set(sampleId, {
          ...existing,
          targetShelfId: targetShelf.id,
          targetShelfName: targetShelf.name,
          x: pos.x,
          y: pos.y,
          z: pos.z
        });
      }
      return newMap;
    });
  }, []);

  const unassignTarget = useCallback((sampleId) => {
    setAssignments(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(sampleId);
      if (existing) {
        newMap.set(sampleId, {
          ...existing,
          targetShelfId: null,
          targetShelfName: null,
          x: null,
          y: null,
          z: null
        });
      }
      return newMap;
    });
  }, []);

  const reviewMove = useCallback(() => {
    setMode('confirming');
  }, []);

  const confirmMove = useCallback(async (currentShelfId) => {
    setIsExecuting(true);
    setExecutionErrors([]);
    const errors = [];
    
    const moves = Array.from(assignments.values()).filter(a => a.targetShelfId !== null && a.x !== null);
    
    for (const move of moves) {
      try {
        await warehouseAPI.moveSample(currentShelfId, {
          sample_id: move.sampleData.id,
          new_position_x: move.x,
          new_position_y: move.y,
          new_position_z: move.z,
          target_shelf_id: move.targetShelfId
        });
      } catch (err) {
        errors.push({
          sampleName: move.sampleData.name || move.sampleData.global_sample_name,
          error: err.response?.data?.message || err.message || 'Error desconocido'
        });
      }
    }
    
    setIsExecuting(false);
    
    if (errors.length > 0) {
      setExecutionErrors(errors);
    } else {
      setMode('idle');
      setAssignments(new Map());
      if (onSuccess) onSuccess();
    }
  }, [assignments, onSuccess]);

  const cancelMove = useCallback(() => {
    setMode('idle');
    setAssignments(new Map());
    setActiveTargetShelf(null);
    setExecutionErrors([]);
  }, []);

  const nextUnassignedSampleId = Array.from(assignments.values()).find(a => a.targetShelfId === null)?.sampleData.id;
  const isFullyAssigned = Array.from(assignments.values()).every(a => a.targetShelfId !== null);
  const assignedCount = Array.from(assignments.values()).filter(a => a.targetShelfId !== null).length;

  return {
    mode,
    assignments: Array.from(assignments.values()),
    activeTargetShelf,
    isExecuting,
    executionErrors,
    nextUnassignedSampleId,
    isFullyAssigned,
    assignedCount,
    totalToAssign: assignments.size,
    
    startMove,
    changeTargetShelf,
    openTargetPicker,
    assignTarget,
    unassignTarget,
    reviewMove,
    confirmMove,
    cancelMove
  };
};
