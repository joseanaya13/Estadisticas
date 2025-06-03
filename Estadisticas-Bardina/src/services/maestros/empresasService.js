// services/empresasService.js - Servicio específico para gestión de empresas y divisiones
import { apiClient, apiUtils } from '../core/apiClient.js';

/**
 * Servicio de empresas - Gestiona todas las operaciones relacionadas con empresas y divisiones
 */
export class EmpresasService {
  constructor() {
    this.endpoint = '/emp_m';
    this.dataKey = 'emp_m';
    this._cache = new Map();
    this._cacheExpiry = 30 * 60 * 1000; // 30 minutos (las empresas cambian menos frecuentemente)
  }
  
  /**
   * Obtiene todas las empresas
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getEmpresas(useCache = true) {
    try {
      const cacheKey = 'empresas_all';
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando empresas desde caché');
          return cached.data;
        }
      }
      
      console.log('Obteniendo empresas desde la API');
      const data = await apiClient.get(this.endpoint);
      
      // Guardar en caché
      if (useCache) {
        this._cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.getEmpresas');
    }
  }
  
  /**
   * Obtiene una empresa por ID
   * @param {string|number} id - ID de la empresa
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getEmpresa(id, useCache = true) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const cacheKey = `empresa_${id}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log(`Usando empresa ${id} desde caché`);
          return cached.data;
        }
      }
      
      const data = await apiClient.get(`${this.endpoint}/${id}`);
      
      // Guardar en caché
      if (useCache) {
        this._cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.getEmpresa');
    }
  }
  
  /**
   * Crea una nueva empresa
   * @param {Object} empresaData - Datos de la empresa
   * @returns {Promise} Promesa con los datos creados
   */
  async createEmpresa(empresaData) {
    try {
      apiUtils.validateRequiredParams(empresaData, ['name']);
      
      const result = await apiClient.post(this.endpoint, empresaData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.createEmpresa');
    }
  }
  
  /**
   * Actualiza una empresa existente
   * @param {string|number} id - ID de la empresa
   * @param {Object} empresaData - Datos actualizados
   * @returns {Promise} Promesa con los datos actualizados
   */
  async updateEmpresa(id, empresaData) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.put(`${this.endpoint}/${id}`, empresaData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.updateEmpresa');
    }
  }
  
  /**
   * Elimina una empresa
   * @param {string|number} id - ID de la empresa
   * @returns {Promise} Promesa con el resultado
   */
  async deleteEmpresa(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.delete(`${this.endpoint}/${id}`);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.deleteEmpresa');
    }
  }
  
  /**
   * Obtiene solo las empresas principales (no divisiones)
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @returns {Promise<Array>} Lista de empresas principales
   */
  async getEmpresasPrincipales(empresasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!empresasList) {
        const response = await this.getEmpresas();
        empresasList = response[this.dataKey] || [];
      }
      
      return empresasList.filter(empresa => empresa.es_emp === true);
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.getEmpresasPrincipales');
    }
  }
  
  /**
   * Obtiene solo las divisiones/tiendas (no empresas principales)
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @returns {Promise<Array>} Lista de divisiones
   */
  async getDivisiones(empresasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!empresasList) {
        const response = await this.getEmpresas();
        empresasList = response[this.dataKey] || [];
      }
      
      return empresasList.filter(empresa => !empresa.es_emp || empresa.es_emp === false);
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.getDivisiones');
    }
  }
  
  /**
   * Obtiene la estructura jerárquica de empresas y divisiones
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @returns {Promise<Object>} Estructura jerárquica
   */
  async getEstructuraJerarquica(empresasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!empresasList) {
        const response = await this.getEmpresas();
        empresasList = response[this.dataKey] || [];
      }
      
      const empresasPrincipales = await this.getEmpresasPrincipales(empresasList);
      const divisiones = await this.getDivisiones(empresasList);
      
      // Crear estructura jerárquica
      const estructura = empresasPrincipales.map(empresa => ({
        ...empresa,
        tipo: 'empresa',
        divisiones: divisiones.filter(division => 
          division.parent_id === empresa.id || 
          division.empresa_id === empresa.id
        ).map(division => ({
          ...division,
          tipo: 'division'
        }))
      }));
      
      // Divisiones sin empresa padre
      const divisionesSinPadre = divisiones.filter(division => 
        !division.parent_id && !division.empresa_id
      ).map(division => ({
        ...division,
        tipo: 'division',
        divisiones: []
      }));
      
      return {
        estructura: [...estructura, ...divisionesSinPadre],
        resumen: {
          totalEmpresas: empresasPrincipales.length,
          totalDivisiones: divisiones.length,
          totalElementos: empresasList.length
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.getEstructuraJerarquica');
    }
  }
  
  /**
   * Obtiene el nombre de una empresa por su ID
   * @param {string|number} id - ID de la empresa
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @returns {Promise<string>} Nombre de la empresa
   */
  async getNombreEmpresa(id, empresasList = null) {
    try {
      if (!id) return 'Sin empresa';
      
      // Si no se proporciona la lista, obtenerla
      if (!empresasList) {
        const response = await this.getEmpresas();
        empresasList = response[this.dataKey] || [];
      }
      
      const empresa = empresasList.find(e => e.id == id);
      return empresa ? empresa.name : `Empresa ${id}`;
    } catch (error) {
      console.error('Error al obtener nombre de empresa:', error);
      return `Empresa ${id}`;
    }
  }
  
  /**
   * Busca empresas por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @returns {Promise<Array>} Array de empresas que coinciden
   */
  async buscarPorNombre(nombre, empresasList = null) {
    try {
      if (!nombre) return [];
      
      // Si no se proporciona la lista, obtenerla
      if (!empresasList) {
        const response = await this.getEmpresas();
        empresasList = response[this.dataKey] || [];
      }
      
      const nombreLower = nombre.toLowerCase();
      return empresasList.filter(empresa => 
        empresa.name && empresa.name.toLowerCase().includes(nombreLower)
      );
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.buscarPorNombre');
    }
  }
  
  /**
   * Busca empresas por múltiples criterios
   * @param {Object} criterios - Criterios de búsqueda
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @returns {Promise<Array>} Array de empresas que coinciden
   */
  async buscarPorCriterios(criterios = {}, empresasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!empresasList) {
        const response = await this.getEmpresas();
        empresasList = response[this.dataKey] || [];
      }
      
      return empresasList.filter(empresa => {
        // Búsqueda por nombre
        if (criterios.nombre) {
          const nombreLower = criterios.nombre.toLowerCase();
          if (!empresa.name || !empresa.name.toLowerCase().includes(nombreLower)) {
            return false;
          }
        }
        
        // Búsqueda por tipo (empresa principal o división)
        if (criterios.tipo) {
          const esEmpresaPrincipal = empresa.es_emp === true;
          if (criterios.tipo === 'empresa' && !esEmpresaPrincipal) {
            return false;
          }
          if (criterios.tipo === 'division' && esEmpresaPrincipal) {
            return false;
          }
        }
        
        // Búsqueda por ciudad
        if (criterios.ciudad) {
          const ciudadLower = criterios.ciudad.toLowerCase();
          if (!empresa.city || !empresa.city.toLowerCase().includes(ciudadLower)) {
            return false;
          }
        }
        
        // Búsqueda por estado activo
        if (criterios.activa !== undefined) {
          if (empresa.is_active !== criterios.activa) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.buscarPorCriterios');
    }
  }
  
  /**
   * Crea un mapa ID -> Objeto para búsquedas rápidas
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @returns {Promise<Object>} Mapa de empresas
   */
  async crearMapaCompleto(empresasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!empresasList) {
        const response = await this.getEmpresas();
        empresasList = response[this.dataKey] || [];
      }
      
      return apiUtils.createLookupMap(empresasList, 'id');
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.crearMapaCompleto');
    }
  }
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @returns {Promise<Object>} Mapa de ID a nombre
   */
  async crearMapaNombres(empresasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!empresasList) {
        const response = await this.getEmpresas();
        empresasList = response[this.dataKey] || [];
      }
      
      return apiUtils.createNameMap(empresasList, 'id', 'name');
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.crearMapaNombres');
    }
  }
  
  /**
   * Obtiene estadísticas de empresas y divisiones
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @returns {Promise<Object>} Estadísticas
   */
  async getEstadisticas(empresasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!empresasList) {
        const response = await this.getEmpresas();
        empresasList = response[this.dataKey] || [];
      }
      
      const stats = {
        total: empresasList.length,
        empresasPrincipales: 0,
        divisiones: 0,
        activas: 0,
        inactivas: 0,
        conDireccion: 0,
        conTelefono: 0,
        conEmail: 0,
        porCiudad: {}
      };
      
      empresasList.forEach(empresa => {
        // Tipo
        if (empresa.es_emp === true) {
          stats.empresasPrincipales++;
        } else {
          stats.divisiones++;
        }
        
        // Estado
        if (empresa.is_active) {
          stats.activas++;
        } else {
          stats.inactivas++;
        }
        
        // Información de contacto
        if (empresa.address) stats.conDireccion++;
        if (empresa.phone) stats.conTelefono++;
        if (empresa.email) stats.conEmail++;
        
        // Distribución por ciudad
        if (empresa.city) {
          stats.porCiudad[empresa.city] = (stats.porCiudad[empresa.city] || 0) + 1;
        }
      });
      
      const topCiudades = Object.entries(stats.porCiudad)
        .map(([ciudad, cantidad]) => ({ ciudad, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);
      
      return {
        ...stats,
        topCiudades,
        porcentajes: {
          empresasPrincipales: stats.total > 0 ? (stats.empresasPrincipales / stats.total) * 100 : 0,
          divisiones: stats.total > 0 ? (stats.divisiones / stats.total) * 100 : 0,
          activas: stats.total > 0 ? (stats.activas / stats.total) * 100 : 0,
          conDireccion: stats.total > 0 ? (stats.conDireccion / stats.total) * 100 : 0,
          conTelefono: stats.total > 0 ? (stats.conTelefono / stats.total) * 100 : 0,
          conEmail: stats.total > 0 ? (stats.conEmail / stats.total) * 100 : 0
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.getEstadisticas');
    }
  }
  
  /**
   * Obtiene opciones formateadas para selectores
   * @param {Array} empresasList - Lista de empresas (opcional)
   * @param {boolean} incluirEmpresas - Si incluir empresas principales (por defecto true)
   * @param {boolean} incluirDivisiones - Si incluir divisiones (por defecto true)
   * @returns {Promise<Array>} Opciones formateadas
   */
  async getOpcionesSelect(empresasList = null, incluirEmpresas = true, incluirDivisiones = true) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!empresasList) {
        const response = await this.getEmpresas();
        empresasList = response[this.dataKey] || [];
      }
      
      const opciones = [{ value: 'todas', label: 'Todas las tiendas' }];
      
      if (incluirEmpresas) {
        const empresasPrincipales = await this.getEmpresasPrincipales(empresasList);
        empresasPrincipales
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(empresa => {
            opciones.push({
              value: `emp_${empresa.id}`,
              label: `🏢 ${empresa.name}`,
              tipo: 'empresa',
              empresa: empresa
            });
          });
      }
      
      if (incluirDivisiones) {
        const divisiones = await this.getDivisiones(empresasList);
        divisiones
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(division => {
            opciones.push({
              value: `div_${division.id}`,
              label: `🏪 ${division.name}`,
              tipo: 'division',
              empresa: division
            });
          });
      }
      
      return opciones;
    } catch (error) {
      throw apiUtils.handleError(error, 'EmpresasService.getOpcionesSelect');
    }
  }
  
  /**
   * Valida si una empresa existe
   * @param {string|number} id - ID de la empresa
   * @returns {Promise<boolean>} True si existe, false si no
   */
  async existeEmpresa(id) {
    try {
      await this.getEmpresa(id);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Limpia la caché de empresas
   */
  clearCache() {
    this._clearCache();
  }
  
  /**
   * Obtiene estadísticas de la caché
   * @returns {Object} Estadísticas de caché
   */
  getCacheStats() {
    return {
      size: this._cache.size,
      keys: Array.from(this._cache.keys()),
      expiryTime: this._cacheExpiry / 1000 + ' segundos'
    };
  }
  
  /**
   * Limpia la caché interna
   * @private
   */
  _clearCache() {
    this._cache.clear();
    console.log('Caché de empresas limpiada');
  }
}

// Crear instancia singleton
export const empresasService = new EmpresasService();

// Exportación por defecto
export default empresasService;
