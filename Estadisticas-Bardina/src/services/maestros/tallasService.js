// services/maestros/tallasService.js
import { apiClient, apiUtils } from '../core/apiClient.js';

/**
 * Servicio de Tallas - Gestiona el maestro de tallas
 */
export class TallasService {
  constructor() {
    this.endpoint = '/tll';
    this.dataKey = 'tll';
    this._cache = new Map();
    this._cacheExpiry = 30 * 60 * 1000; // 30 minutos - datos maestros estables
  }

  /**
   * Obtiene todas las tallas
   * @param {Object} params - Parámetros de filtrado
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos de tallas
   */
  async getTallas(params = {}, useCache = true) {
    try {
      const cacheKey = `tallas_${JSON.stringify(params)}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando tallas desde caché');
          return cached.data;
        }
      }

      const queryString = apiClient.buildQueryParams(params);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log('Obteniendo tallas desde la API');
      const data = await apiClient.getAllPaginated(endpoint, this.dataKey);
      
      // Guardar en caché
      if (useCache) {
        this._cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;

    } catch (error) {
      throw apiUtils.handleError(error, 'TallasService.getTallas');
    }
  }

  /**
   * Obtiene tallas activas (no eliminadas) ordenadas
   * @param {boolean} useCache - Si usar caché
   * @returns {Promise} Tallas activas ordenadas
   */
  async getTallasActivas(useCache = true) {
    try {
      const response = await this.getTallas({}, useCache);
      const tallas = response[this.dataKey] || [];
      
      // Filtrar tallas activas (eli = false) y ordenar por ord
      const tallasActivas = tallas
        .filter(talla => !talla.eli && talla.name && talla.abr)
        .sort((a, b) => (a.ord || 0) - (b.ord || 0));

      console.log(`Tallas activas encontradas: ${tallasActivas.length}`);
      return tallasActivas;

    } catch (error) {
      throw apiUtils.handleError(error, 'TallasService.getTallasActivas');
    }
  }

  /**
   * Convierte array de tallas a mapa por ID
   * @param {Array} tallas - Array de tallas
   * @returns {Object} Mapa de tallas por ID
   */
  tallasToMap(tallas) {
    const mapa = {};
    tallas.forEach(talla => {
      mapa[talla.id] = {
        id: talla.id,
        name: talla.name,
        abr: talla.abr,
        ord: talla.ord || 0,
        pos: talla.pos || 0,
        mar: talla.mar || false
      };
    });
    return mapa;
  }

  /**
   * Obtiene estadísticas de tallas
   * @param {Array} tallasList - Lista de tallas (opcional)
   * @returns {Promise} Estadísticas de tallas
   */
  async getEstadisticasTallas(tallasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!tallasList) {
        tallasList = await this.getTallasActivas();
      }

      const stats = {
        total: tallasList.length,
        conMarca: 0,
        sinMarca: 0,
        porSerie: {},
        rangoOrdenes: { min: Infinity, max: -Infinity },
        tallasComunes: [],
        tallasEspeciales: []
      };

      tallasList.forEach(talla => {
        // Contar marcadas
        if (talla.mar) {
          stats.conMarca++;
        } else {
          stats.sinMarca++;
        }

        // Agrupar por serie (si existe pri_ser)
        if (talla.pri_ser && talla.pri_ser !== '') {
          if (!stats.porSerie[talla.pri_ser]) {
            stats.porSerie[talla.pri_ser] = 0;
          }
          stats.porSerie[talla.pri_ser]++;
        }

        // Rango de órdenes
        if (talla.ord !== undefined && talla.ord !== null) {
          stats.rangoOrdenes.min = Math.min(stats.rangoOrdenes.min, talla.ord);
          stats.rangoOrdenes.max = Math.max(stats.rangoOrdenes.max, talla.ord);
        }

        // Clasificar tallas comunes vs especiales
        const tallasComunes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'U'];
        if (tallasComunes.includes(talla.abr)) {
          stats.tallasComunes.push(talla);
        } else {
          stats.tallasEspeciales.push(talla);
        }
      });

      // Ajustar rangos si no hay datos
      if (stats.rangoOrdenes.min === Infinity) {
        stats.rangoOrdenes.min = 0;
        stats.rangoOrdenes.max = 0;
      }

      return stats;

    } catch (error) {
      throw apiUtils.handleError(error, 'TallasService.getEstadisticasTallas');
    }
  }

  /**
   * Busca tallas por texto
   * @param {string} texto - Texto a buscar
   * @param {Array} tallasList - Lista de tallas (opcional)
   * @returns {Promise} Tallas que coinciden
   */
  async buscarTallas(texto, tallasList = null) {
    try {
      if (!texto || texto.trim() === '') {
        return [];
      }

      // Si no se proporciona la lista, obtenerla
      if (!tallasList) {
        tallasList = await this.getTallasActivas();
      }

      const textoBusqueda = texto.toLowerCase().trim();
      
      return tallasList.filter(talla => 
        talla.name.toLowerCase().includes(textoBusqueda) ||
        talla.abr.toLowerCase().includes(textoBusqueda) ||
        (talla.obs && talla.obs.toLowerCase().includes(textoBusqueda))
      );

    } catch (error) {
      throw apiUtils.handleError(error, 'TallasService.buscarTallas');
    }
  }

  /**
   * Obtiene talla por ID
   * @param {number} id - ID de la talla
   * @returns {Promise} Talla encontrada
   */
  async getTallaPorId(id) {
    try {
      const tallas = await this.getTallasActivas();
      return tallas.find(talla => talla.id === id) || null;
    } catch (error) {
      throw apiUtils.handleError(error, 'TallasService.getTallaPorId');
    }
  }

  /**
   * Valida estructura de talla
   * @param {Object} talla - Objeto talla a validar
   * @returns {Object} Resultado de validación
   */
  validarTalla(talla) {
    const errores = [];
    
    if (!talla) {
      errores.push('Talla no definida');
      return { valida: false, errores };
    }

    if (!talla.id || typeof talla.id !== 'number') {
      errores.push('ID de talla inválido');
    }

    if (!talla.name || typeof talla.name !== 'string' || talla.name.trim() === '') {
      errores.push('Nombre de talla requerido');
    }

    if (!talla.abr || typeof talla.abr !== 'string' || talla.abr.trim() === '') {
      errores.push('Abreviatura de talla requerida');
    }

    if (talla.abr && talla.abr.length > 10) {
      errores.push('Abreviatura demasiado larga (máximo 10 caracteres)');
    }

    if (talla.ord !== undefined && talla.ord !== null && typeof talla.ord !== 'number') {
      errores.push('Orden debe ser numérico');
    }

    return {
      valida: errores.length === 0,
      errores
    };
  }

  /**
   * Limpiar caché
   */
  limpiarCache() {
    this._cache.clear();
    console.log('Caché de TallasService limpiado');
  }

  /**
   * Obtener información del caché
   */
  getInfoCache() {
    return {
      size: this._cache.size,
      expiry: this._cacheExpiry,
      keys: Array.from(this._cache.keys())
    };
  }
}

// Instancia singleton
export const tallasService = new TallasService();