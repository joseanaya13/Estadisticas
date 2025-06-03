// src/hooks/useAppData.js
import { useEffect } from 'react';
import useAppStore from '../stores/useAppStore';
import { ventasService, comprasService, contactosService, usuariosService } from '../services/api';

/**
 * Hook para cargar y manejar datos de la aplicación
 */
export const useAppData = () => {
  const {
    data,
    loading,
    errors,
    setData,
    setMultipleData,
    setLoading,
    setError,
    clearError,
    updateNameMaps,
    isDataLoaded
  } = useAppStore();

  // Función para crear mapas de nombres
  const createNameMaps = (data) => {
    const maps = {};
    
    // Mapa de contactos
    if (data.contactos?.ent_m) {
      maps.contactos = {};
      data.contactos.ent_m.forEach(item => {
        if (item.id && item.name) {
          maps.contactos[item.id] = item.name;
        }
      });
    }

    // Mapa de usuarios
    if (data.usuarios?.usr_m) {
      maps.usuarios = {};
      data.usuarios.usr_m.forEach(item => {
        if (item.id && item.name) {
          maps.usuarios[item.id] = item.name;
        }
      });
    }

    // Mapa de empresas
    if (data.empresas?.emp_m) {
      maps.empresas = {};
      data.empresas.emp_m.forEach(item => {
        if (item.id && item.name) {
          maps.empresas[item.id] = item.name;
        }
      });
    }

    // Mapa de formas de pago
    if (data.formasPago?.fpg_m) {
      maps.formasPago = {};
      data.formasPago.fpg_m.forEach(item => {
        if (item.id && item.name) {
          maps.formasPago[item.id] = item.name;
        }
      });
    }

    // Actualizar mapas en el store
    Object.entries(maps).forEach(([mapType, mapData]) => {
      updateNameMaps(mapType, mapData);
    });
  };

  // Función para cargar todos los datos
  const loadAllData = async () => {
    try {
      setLoading('global', true);
      clearError('global');

      console.log('🔄 Iniciando carga de datos...');

      // Cargar datos básicos en paralelo
      const [ventasResponse, comprasResponse, contactosResponse, usuariosResponse] = await Promise.all([
        ventasService.getFacturas().catch(err => {
          setError('ventas', err.message);
          return null;
        }),
        comprasService.getAlbaranes().catch(err => {
          setError('compras', err.message);
          return null;
        }),
        contactosService.getContactos().catch(err => {
          console.warn('Error cargando contactos:', err);
          return null;
        }),
        usuariosService.getUsuarios().catch(err => {
          console.warn('Error cargando usuarios:', err);
          return null;
        })
      ]);

      // Cargar datos maestros adicionales
      const [empresasResponse, formasPagoResponse] = await Promise.all([
        import('../services/maestros/empresasService').then(m => m.empresasService.getEmpresas()).catch(err => {
          console.warn('Error cargando empresas:', err);
          return null;
        }),
        import('../services/maestros/formasPagoService').then(m => m.formasPagoService.getFormasPago()).catch(err => {
          console.warn('Error cargando formas de pago:', err);
          return null;
        })
      ]);

      // Guardar datos en el store
      const dataUpdates = {};
      if (ventasResponse) dataUpdates.ventas = ventasResponse;
      if (comprasResponse) dataUpdates.compras = comprasResponse;
      if (contactosResponse) dataUpdates.contactos = contactosResponse;
      if (usuariosResponse) dataUpdates.usuarios = usuariosResponse;
      if (empresasResponse) dataUpdates.empresas = empresasResponse;
      if (formasPagoResponse) dataUpdates.formasPago = formasPagoResponse;

      setMultipleData(dataUpdates);

      // Crear mapas de nombres
      createNameMaps(dataUpdates);

      console.log('✅ Datos cargados exitosamente', {
        ventas: ventasResponse?.fac_t?.length || 0,
        compras: comprasResponse?.com_alb_g?.length || 0,
        contactos: contactosResponse?.ent_m?.length || 0,
        usuarios: usuariosResponse?.usr_m?.length || 0,
        empresas: empresasResponse?.emp_m?.length || 0,
        formasPago: formasPagoResponse?.fpg_m?.length || 0
      });

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError('global', error.message);
    } finally {
      setLoading('global', false);
    }
  };

  // Función para recargar datos específicos
  const reloadData = async (dataType) => {
    try {
      setLoading(dataType, true);
      clearError(dataType);

      let result = null;
      switch (dataType) {
        case 'ventas':
          result = await ventasService.getFacturas();
          break;
        case 'compras':
          result = await comprasService.getAlbaranes();
          break;
        case 'contactos':
          result = await contactosService.getContactos();
          break;
        case 'usuarios':
          result = await usuariosService.getUsuarios();
          break;
        default:
          throw new Error(`Tipo de datos desconocido: ${dataType}`);
      }

      setData(dataType, result);
      console.log(`✅ ${dataType} recargado exitosamente`);

    } catch (error) {
      console.error(`❌ Error recargando ${dataType}:`, error);
      setError(dataType, error.message);
    } finally {
      setLoading(dataType, false);
    }
  };

  // Cargar datos al montar si no están cargados
  useEffect(() => {
    if (!isDataLoaded() && !loading.global) {
      loadAllData();
    }
  }, []);

  return {
    data,
    loading,
    errors,
    loadAllData,
    reloadData,
    isDataLoaded: isDataLoaded()
  };
};

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

// src/hooks/useExport.js
import { useState, useCallback } from 'react';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';
import useAppStore from '../stores/useAppStore';

/**
 * Hook para manejar exportación de datos
 */
export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { ui } = useAppStore();

  const exportData = useCallback(async (data, filename, options = {}) => {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    const {
      format = ui.exportFormat,
      prepareDataFn = null,
      includeTimestamp = true
    } = options;

    try {
      setIsExporting(true);

      // Preparar datos si hay función específica
      const exportData = prepareDataFn ? prepareDataFn(data) : data;

      // Generar nombre de archivo
      const timestamp = includeTimestamp ? 
        `_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}` : '';
      const fullFilename = `${filename}${timestamp}`;

      // Exportar según formato
      if (format === 'excel') {
        await exportToExcel(exportData, fullFilename);
      } else if (format === 'csv') {
        await exportToCSV(exportData, fullFilename);
      } else {
        throw new Error(`Formato no soportado: ${format}`);
      }

      console.log(`✅ Datos exportados exitosamente a ${format.toUpperCase()}`);
      return true;

    } catch (error) {
      console.error('Error en exportación:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [ui.exportFormat]);

  return {
    isExporting,
    exportData
  };
};

// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// src/hooks/useNotifications.js
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import useAppStore from '../stores/useAppStore';

/**
 * Hook para manejar notificaciones
 */
export const useNotifications = () => {
  const { ui } = useAppStore();

  const showNotification = useCallback((message, type = 'success', options = {}) => {
    if (!ui.notifications) return;

    const defaultOptions = {
      duration: 4000,
      position: 'top-right',
      ...options
    };

    switch (type) {
      case 'success':
        toast.success(message, defaultOptions);
        break;
      case 'error':
        toast.error(message, defaultOptions);
        break;
      case 'warning':
        toast.error(message, { ...defaultOptions, icon: '⚠️' });
        break;
      case 'info':
        toast(message, { ...defaultOptions, icon: 'ℹ️' });
        break;
      default:
        toast(message, defaultOptions);
    }
  }, [ui.notifications]);

  const showLoadingNotification = useCallback((message) => {
    return toast.loading(message);
  }, []);

  const dismissNotification = useCallback((toastId) => {
    toast.dismiss(toastId);
  }, []);

  return {
    showNotification,
    showLoadingNotification,
    dismissNotification
  };
};

// src/hooks/index.js - Barrel export
export { useAppData } from './useAppData';
export { useFilters } from './useFilters';
export { useExport } from './useExport';
export { useDebounce } from './useDebounce';
export { useNotifications } from './useNotifications';