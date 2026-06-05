import { useState, useCallback, useMemo } from 'react';

export const useSampleSelection = () => {
  const [selectedSamples, setSelectedSamples] = useState(new Map());

  const toggleSample = useCallback((sample) => {
    setSelectedSamples(prev => {
      const newMap = new Map(prev);
      if (newMap.has(sample.id)) {
        newMap.delete(sample.id);
      } else {
        newMap.set(sample.id, sample);
      }
      return newMap;
    });
  }, []);

  const selectAll = useCallback((samples) => {
    const newMap = new Map();
    samples.forEach(s => newMap.set(s.id, s));
    setSelectedSamples(newMap);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSamples(new Map());
  }, []);

  const isSelected = useCallback((sampleId) => {
    return selectedSamples.has(sampleId);
  }, [selectedSamples]);

  const selectedList = useMemo(() => Array.from(selectedSamples.values()), [selectedSamples]);

  return {
    selectedSamples: selectedList,
    count: selectedSamples.size,
    toggleSample,
    selectAll,
    clearSelection,
    isSelected
  };
};
