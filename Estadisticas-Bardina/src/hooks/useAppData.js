// src/hooks/useAppData.js
import { useEffect } from 'react';
import useAppStore from '../stores/useAppStore';
import { ventasService, comprasService, contactosService, usuariosService } from '../services';

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

