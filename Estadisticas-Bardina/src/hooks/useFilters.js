// src/hooks/useFilters.js
import { useCallback } from 'react';
import useAppStore from '../stores/useAppStore';

/**
 * Hook para manejar filtros de la aplicación
 */
export const useFilters = () => {
  const { 
    filters, 
    updateFilters, 
    resetFilters, 
    hasActiveFilters, 
    getActiveFiltersInfo,
    getFilteredVentas 
  } = useAppStore();

  // Actualizar filtro individual
  const updateFilter = useCallback((filterKey, value) => {
    updateFilters({ [filterKey]: value });
  }, [updateFilters]);

  // Actualizar múltiples filtros
  const updateMultipleFilters = useCallback((newFilters) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  // Resetear filtros con confirmación
  const resetFiltersWithConfirm = useCallback(() => {
    if (hasActiveFilters()) {
      if (window.confirm('¿Estás seguro de que quieres limpiar todos los filtros?')) {
        resetFilters();
        return true;
      }
      return false;
    }
    return true;
  }, [hasActiveFilters, resetFilters]);

  // Obtener datos filtrados
  const getFilteredData = useCallback(() => {
    return getFilteredVentas();
  }, [getFilteredVentas]);

  return {
    filters,
    updateFilter,
    updateMultipleFilters,
    resetFilters,
    resetFiltersWithConfirm,
    hasActiveFilters: hasActiveFilters(),
    activeFiltersInfo: getActiveFiltersInfo(),
    getFilteredData
  };
};





