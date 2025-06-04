// src/hooks/useAppData.js - Versión mejorada para manejar datos inconsistentes
import { useEffect, useState } from 'react';
import useAppStore from '../stores/useAppStore';
import { ventasService, comprasService, contactosService, usuariosService } from '../services';
import { APP_CONFIG } from '../config/app.config';

/**
 * Hook mejorado para cargar y manejar datos de la aplicación
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

  // Estado local para control de reintentos
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Función para validar datos recibidos
  const validateData = (data, expectedKey) => {
    if (!data) {
      console.warn(`❌ Datos vacíos para ${expectedKey}`);
      return false;
    }

    if (typeof data !== 'object') {
      console.warn(`❌ Datos no son objeto para ${expectedKey}:`, typeof data);
      return false;
    }

    if (!data[expectedKey]) {
      console.warn(`❌ Clave ${expectedKey} no encontrada en datos:`, Object.keys(data));
      return false;
    }

    if (!Array.isArray(data[expectedKey])) {
      console.warn(`❌ ${expectedKey} no es array:`, typeof data[expectedKey]);
      return false;
    }

    if (APP_CONFIG.features.debugging) {
      console.log(`✅ Datos válidos para ${expectedKey}:`, {
        count: data.count || 0,
        arrayLength: data[expectedKey].length,
        firstItem: data[expectedKey][0]
      });
    }

    return true;
  };

  // Función para crear mapas de nombres con validación
  const createNameMaps = (dataUpdates) => {
    const maps = {};
    
    try {
      // Mapa de contactos
      if (dataUpdates.contactos?.ent_m && Array.isArray(dataUpdates.contactos.ent_m)) {
        maps.contactos = {};
        dataUpdates.contactos.ent_m.forEach(item => {
          if (item && item.id !== undefined && item.name) {
            maps.contactos[item.id] = item.name;
          }
        });
        console.log(`📋 Mapa contactos creado: ${Object.keys(maps.contactos).length} entradas`);
      }

      // Mapa de usuarios
      if (dataUpdates.usuarios?.usr_m && Array.isArray(dataUpdates.usuarios.usr_m)) {
        maps.usuarios = {};
        dataUpdates.usuarios.usr_m.forEach(item => {
          if (item && item.id !== undefined && item.name) {
            maps.usuarios[item.id] = item.name;
          }
        });
        console.log(`👥 Mapa usuarios creado: ${Object.keys(maps.usuarios).length} entradas`);
      }

      // Mapa de empresas
      if (dataUpdates.empresas?.emp_m && Array.isArray(dataUpdates.empresas.emp_m)) {
        maps.empresas = {};
        dataUpdates.empresas.emp_m.forEach(item => {
          if (item && item.id !== undefined && item.name) {
            maps.empresas[item.id] = item.name;
          }
        });
        console.log(`🏢 Mapa empresas creado: ${Object.keys(maps.empresas).length} entradas`);
      }

      // Mapa de formas de pago
      if (dataUpdates.formasPago?.fpg_m && Array.isArray(dataUpdates.formasPago.fpg_m)) {
        maps.formasPago = {};
        dataUpdates.formasPago.fpg_m.forEach(item => {
          if (item && item.id !== undefined && item.name) {
            maps.formasPago[item.id] = item.name;
          }
        });
        console.log(`💳 Mapa formas de pago creado: ${Object.keys(maps.formasPago).length} entradas`);
      }

      // Actualizar mapas en el store
      Object.entries(maps).forEach(([mapType, mapData]) => {
        if (Object.keys(mapData).length > 0) {
          updateNameMaps(mapType, mapData);
        }
      });

    } catch (error) {
      console.error('❌ Error creando mapas de nombres:', error);
    }
  };

  // Función para cargar un servicio con reintentos
  const loadWithRetry = async (serviceFn, serviceName, maxRetries = 3) => {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (APP_CONFIG.features.debugging) {
          console.log(`🔄 Cargando ${serviceName} (intento ${attempt}/${maxRetries})`);
        }
        
        const result = await serviceFn();
        
        if (APP_CONFIG.features.debugging) {
          console.log(`✅ ${serviceName} cargado exitosamente`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Error en ${serviceName} (intento ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt < maxRetries) {
          // Esperar antes del siguiente intento (backoff exponencial)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    console.error(`❌ ${serviceName} falló después de ${maxRetries} intentos:`, lastError);
    return null;
  };

  // Función principal para cargar todos los datos
  const loadAllData = async (forceReload = false) => {
    try {
      setLoading('global', true);
      clearError('global');
      
      if (APP_CONFIG.features.debugging) {
        console.log('🔄 Iniciando carga de datos...', { forceReload, retryCount });
      }

      // Cargar datos principales con reintentos
      const [ventasResponse, comprasResponse] = await Promise.all([
        loadWithRetry(
          () => ventasService.getFacturas(),
          'Ventas',
          3
        ),
        loadWithRetry(
          () => comprasService.getAlbaranes(),
          'Compras',
          3
        )
      ]);

      // Cargar datos maestros (menos críticos, pueden fallar)
      const [contactosResponse, usuariosResponse, empresasResponse, formasPagoResponse] = await Promise.all([
        loadWithRetry(
          () => contactosService.getContactos(),
          'Contactos',
          2
        ).catch(err => {
          console.warn('⚠️ Contactos no disponibles:', err.message);
          return null;
        }),
        loadWithRetry(
          () => usuariosService.getUsuarios(),
          'Usuarios',
          2
        ).catch(err => {
          console.warn('⚠️ Usuarios no disponibles:', err.message);
          return null;
        }),
        loadWithRetry(
          () => import('../services/maestros/empresasService').then(m => m.empresasService.getEmpresas()),
          'Empresas',
          2
        ).catch(err => {
          console.warn('⚠️ Empresas no disponibles:', err.message);
          return null;
        }),
        loadWithRetry(
          () => import('../services/maestros/formasPagoService').then(m => m.formasPagoService.getFormasPago()),
          'Formas de Pago',
          2
        ).catch(err => {
          console.warn('⚠️ Formas de pago no disponibles:', err.message);
          return null;
        })
      ]);

      // Validar datos críticos
      const dataUpdates = {};
      let hasVentas = false;
      let hasCompras = false;

      if (ventasResponse && validateData(ventasResponse, 'fac_t')) {
        dataUpdates.ventas = ventasResponse;
        hasVentas = true;
      } else {
        setError('ventas', 'No se pudieron cargar los datos de ventas');
      }

      if (comprasResponse && validateData(comprasResponse, 'com_alb_g')) {
        dataUpdates.compras = comprasResponse;
        hasCompras = true;
      } else {
        setError('compras', 'No se pudieron cargar los datos de compras');
      }

      // Agregar datos maestros si están disponibles
      if (contactosResponse && validateData(contactosResponse, 'ent_m')) {
        dataUpdates.contactos = contactosResponse;
      }

      if (usuariosResponse && validateData(usuariosResponse, 'usr_m')) {
        dataUpdates.usuarios = usuariosResponse;
      }

      if (empresasResponse && validateData(empresasResponse, 'emp_m')) {
        dataUpdates.empresas = empresasResponse;
      }

      if (formasPagoResponse && validateData(formasPagoResponse, 'fpg_m')) {
        dataUpdates.formasPago = formasPagoResponse;
      }

      // Verificar que tenemos al menos ventas o compras
      if (!hasVentas && !hasCompras) {
        throw new Error('No se pudieron cargar los datos principales (ventas y compras)');
      }

      // Guardar datos en el store
      setMultipleData(dataUpdates);

      // Crear mapas de nombres
      createNameMaps(dataUpdates);

      // Reset retry count on success
      setRetryCount(0);

      console.log('✅ Carga de datos completada:', {
        ventas: dataUpdates.ventas?.fac_t?.length || 0,
        compras: dataUpdates.compras?.com_alb_g?.length || 0,
        contactos: dataUpdates.contactos?.ent_m?.length || 0,
        usuarios: dataUpdates.usuarios?.usr_m?.length || 0,
        empresas: dataUpdates.empresas?.emp_m?.length || 0,
        formasPago: dataUpdates.formasPago?.fpg_m?.length || 0
      });

      setIsInitialized(true);

    } catch (error) {
      console.error('❌ Error crítico cargando datos:', error);
      setError('global', error.message);
      
      // Incrementar contador de reintentos
      setRetryCount(prev => prev + 1);
      
      // Si no hemos superado el máximo de reintentos, intentar de nuevo
      if (retryCount < 3) {
        console.log(`🔄 Reintentando carga completa (${retryCount + 1}/3) en 5 segundos...`);
        setTimeout(() => {
          loadAllData(true);
        }, 5000);
      }
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
      let serviceName = '';

      switch (dataType) {
        case 'ventas':
          serviceName = 'Ventas';
          result = await loadWithRetry(
            () => ventasService.getFacturas(),
            serviceName,
            3
          );
          break;
        case 'compras':
          serviceName = 'Compras';
          result = await loadWithRetry(
            () => comprasService.getAlbaranes(),
            serviceName,
            3
          );
          break;
        case 'contactos':
          serviceName = 'Contactos';
          result = await loadWithRetry(
            () => contactosService.getContactos(),
            serviceName,
            2
          );
          break;
        case 'usuarios':
          serviceName = 'Usuarios';
          result = await loadWithRetry(
            () => usuariosService.getUsuarios(),
            serviceName,
            2
          );
          break;
        default:
          throw new Error(`Tipo de datos desconocido: ${dataType}`);
      }

      if (result) {
        // Validar los datos antes de guardar
        const expectedKey = {
          'ventas': 'fac_t',
          'compras': 'com_alb_g',
          'contactos': 'ent_m',
          'usuarios': 'usr_m'
        }[dataType];

        if (validateData(result, expectedKey)) {
          setData(dataType, result);
          console.log(`✅ ${serviceName} recargado exitosamente`);
          
          // Actualizar mapas si es necesario
          const dataUpdate = { [dataType]: result };
          createNameMaps(dataUpdate);
        } else {
          throw new Error(`Datos de ${serviceName} no válidos`);
        }
      } else {
        throw new Error(`No se pudieron cargar datos de ${serviceName}`);
      }

    } catch (error) {
      console.error(`❌ Error recargando ${dataType}:`, error);
      setError(dataType, error.message);
    } finally {
      setLoading(dataType, false);
    }
  };

  // Función para verificar si los datos están obsoletos
  const checkDataFreshness = () => {
    if (!data.lastUpdate) return true;
    
    const lastUpdate = new Date(data.lastUpdate);
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);
    
    // Considerar datos obsoletos después de 30 minutos
    return diffMinutes > 30;
  };

  // Función para obtener estadísticas de carga
  const getLoadingStats = () => {
    return {
      isLoaded: isDataLoaded(),
      isInitialized,
      retryCount,
      hasErrors: Object.values(errors).some(Boolean),
      lastUpdate: data.lastUpdate,
      dataFreshness: checkDataFreshness() ? 'stale' : 'fresh',
      loadedServices: {
        ventas: !!data.ventas,
        compras: !!data.compras,
        contactos: !!data.contactos,
        usuarios: !!data.usuarios,
        empresas: !!data.empresas,
        formasPago: !!data.formasPago
      }
    };
  };

  // Efecto principal para cargar datos al montar
  useEffect(() => {
    if (!isInitialized && !loading.global && retryCount < 3) {
      if (APP_CONFIG.features.debugging) {
        console.log('🚀 Inicializando carga de datos...');
      }
      loadAllData();
    }
  }, [isInitialized, loading.global, retryCount]);

  // Efecto para recargar datos obsoletos
  useEffect(() => {
    if (isInitialized && checkDataFreshness() && !loading.global) {
      if (APP_CONFIG.features.debugging) {
        console.log('🔄 Datos obsoletos detectados, recargando...');
      }
      loadAllData(true);
    }
  }, [isInitialized]);

  return {
    data,
    loading,
    errors,
    loadAllData,
    reloadData,
    isDataLoaded: isDataLoaded(),
    isInitialized,
    retryCount,
    stats: getLoadingStats(),
    checkDataFreshness
  };
};

