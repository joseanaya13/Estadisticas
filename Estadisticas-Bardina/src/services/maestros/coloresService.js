// services/maestros/coloresService.js
import { apiClient, apiUtils } from '../core/apiClient.js';

/**
 * Servicio de Colores - Gestiona el maestro de colores
 */
export class ColoresService {
  constructor() {
    this.endpoint = '/col';
    this.dataKey = 'col';
    this._cache = new Map();
    this._cacheExpiry = 30 * 60 * 1000; // 30 minutos - datos maestros estables
    
    // Mapa de colores hex por defecto para visualización
    this.coloresHex = this._initColoresHex();
  }

  /**
   * Inicializar mapa de colores hex por defecto
   */
  _initColoresHex() {
    return {
      // Colores básicos
      'blanco': '#FFFFFF', 'white': '#FFFFFF', 'bla': '#FFFFFF',
      'negro': '#000000', 'black': '#000000', 'neg': '#000000',
      'rojo': '#FF0000', 'red': '#FF0000', 'roj': '#FF0000',
      'azul': '#0000FF', 'blue': '#0000FF', 'azu': '#0000FF',
      'verde': '#00AA00', 'green': '#00AA00', 'ver': '#00AA00',
      'amarillo': '#FFFF00', 'yellow': '#FFFF00', 'ama': '#FFFF00',
      'rosa': '#FFC0CB', 'pink': '#FFC0CB', 'ros': '#FFC0CB',
      'gris': '#808080', 'gray': '#808080', 'gri': '#808080',
      'marrón': '#8B4513', 'brown': '#8B4513', 'mar': '#8B4513',
      'naranja': '#FFA500', 'orange': '#FFA500', 'nar': '#FFA500',
      'morado': '#800080', 'purple': '#800080', 'mor': '#800080',
      'beige': '#F5F5DC', 'bei': '#F5F5DC',
      'plateado': '#C0C0C0', 'silver': '#C0C0C0', 'pla': '#C0C0C0',
      'dorado': '#FFD700', 'gold': '#FFD700', 'dor': '#FFD700',
      'multicolor': '#FF6B6B', 'multi': '#FF6B6B', 'mul': '#FF6B6B',
      'transparente': '#F0F0F0', 'clear': '#F0F0F0', 'tra': '#F0F0F0',
      'marino': '#000080', 'navy': '#000080', 'marina': '#000080',
      'oliva': '#808000', 'olive': '#808000', 'vol': '#808000',
      'burdeos': '#800020', 'burgundy': '#800020', 'bur': '#800020',
      'crema': '#FFFDD0', 'cream': '#FFFDD0', 'cre': '#FFFDD0'
    };
  }

  /**
   * Obtiene todos los colores
   * @param {Object} params - Parámetros de filtrado
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos de colores
   */
  async getColores(params = {}, useCache = true) {
    try {
      const cacheKey = `colores_${JSON.stringify(params)}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando colores desde caché');
          return cached.data;
        }
      }

      const queryString = apiClient.buildQueryParams(params);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log('Obteniendo colores desde la API');
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
      throw apiUtils.handleError(error, 'ColoresService.getColores');
    }
  }

  /**
   * Obtiene colores activos ordenados por nombre
   * @param {boolean} useCache - Si usar caché
   * @returns {Promise} Colores activos ordenados
   */
  async getColoresActivos(useCache = true) {
    try {
      const response = await this.getColores({}, useCache);
      const colores = response[this.dataKey] || [];
      
      // Filtrar colores con nombre válido y ordenar alfabéticamente
      const coloresActivos = colores
        .filter(color => color.name && color.name.trim() !== '')
        .sort((a, b) => {
          const nameA = a.name.toLowerCase().trim();
          const nameB = b.name.toLowerCase().trim();
          return nameA.localeCompare(nameB, 'es-ES');
        });

      console.log(`Colores activos encontrados: ${coloresActivos.length}`);
      return coloresActivos;

    } catch (error) {
      throw apiUtils.handleError(error, 'ColoresService.getColoresActivos');
    }
  }

  /**
   * Convierte array de colores a mapa por ID
   * @param {Array} colores - Array de colores
   * @returns {Object} Mapa de colores por ID
   */
  colorsToMap(colores) {
    const mapa = {};
    colores.forEach(color => {
      mapa[color.id] = {
        id: color.id,
        name: color.name,
        abr: color.abr || color.name.substring(0, 3).toUpperCase(),
        codCol: color.cod_col || '',
        col: color.col || '',
        codImp: color.cod_imp || '',
        nomFab: color.nom_fab || '',
        nom: color.nom || color.name,
        cntTyc: color.cnt_tyc || 0,
        hex: this.getColorHex(color)
      };
    });
    return mapa;
  }

  /**
   * Obtiene código hex de un color
   * @param {Object} color - Objeto color
   * @returns {string} Código hex del color
   */
  getColorHex(color) {
    if (!color) return '#CCCCCC';

    // Buscar por diferentes campos
    const searchTerms = [
      color.name?.toLowerCase(),
      color.abr?.toLowerCase(), 
      color.nom?.toLowerCase(),
      color.nom_fab?.toLowerCase(),
      color.col?.toLowerCase()
    ].filter(Boolean);

    for (const term of searchTerms) {
      if (this.coloresHex[term]) {
        return this.coloresHex[term];
      }
      
      // Buscar coincidencias parciales
      const match = Object.keys(this.coloresHex).find(key => 
        term.includes(key) || key.includes(term)
      );
      if (match) {
        return this.coloresHex[match];
      }
    }

    // Color por defecto basado en hash del nombre
    return this.generateColorFromString(color.name || 'default');
  }

  /**
   * Genera color hex a partir de string
   * @param {string} str - String base
   * @returns {string} Color hex generado
   */
  generateColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const color = Math.abs(hash).toString(16).substring(0, 6);
    return '#' + '000000'.substring(0, 6 - color.length) + color;
  }

  /**
   * Obtiene estadísticas de colores
   * @param {Array} coloresList - Lista de colores (opcional)
   * @returns {Promise} Estadísticas de colores
   */
  async getEstadisticasColores(coloresList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!coloresList) {
        coloresList = await this.getColoresActivos();
      }

      const stats = {
        total: coloresList.length,
        conAbreviatura: 0,
        sinAbreviatura: 0,
        conCodigoFabricante: 0,
        sinCodigoFabricante: 0,
        conConteoTyc: 0,
        totalTyc: 0,
        coloresMasUsados: [],
        coloresSinUso: [],
        longitudPromAbr: 0
      };

      let sumaLongitudAbr = 0;
      let contadorAbr = 0;

      coloresList.forEach(color => {
        // Contar abreviaturas
        if (color.abr && color.abr.trim() !== '') {
          stats.conAbreviatura++;
          sumaLongitudAbr += color.abr.length;
          contadorAbr++;
        } else {
          stats.sinAbreviatura++;
        }

        // Contar códigos de fabricante
        if (color.nom_fab && color.nom_fab.trim() !== '') {
          stats.conCodigoFabricante++;
        } else {
          stats.sinCodigoFabricante++;
        }

        // Contar uso en TyC
        const cntTyc = color.cnt_tyc || 0;
        if (cntTyc > 0) {
          stats.conConteoTyc++;
          stats.totalTyc += cntTyc;
          stats.coloresMasUsados.push({
            id: color.id,
            name: color.name,
            uso: cntTyc
          });
        } else {
          stats.coloresSinUso.push({
            id: color.id,
            name: color.name
          });
        }
      });

      // Calcular promedio longitud abreviatura
      stats.longitudPromAbr = contadorAbr > 0 ? sumaLongitudAbr / contadorAbr : 0;

      // Ordenar colores más usados
      stats.coloresMasUsados.sort((a, b) => b.uso - a.uso);
      stats.coloresMasUsados = stats.coloresMasUsados.slice(0, 10); // Top 10

      return stats;

    } catch (error) {
      throw apiUtils.handleError(error, 'ColoresService.getEstadisticasColores');
    }
  }

  /**
   * Busca colores por texto
   * @param {string} texto - Texto a buscar
   * @param {Array} coloresList - Lista de colores (opcional)
   * @returns {Promise} Colores que coinciden
   */
  async buscarColores(texto, coloresList = null) {
    try {
      if (!texto || texto.trim() === '') {
        return [];
      }

      // Si no se proporciona la lista, obtenerla
      if (!coloresList) {
        coloresList = await this.getColoresActivos();
      }

      const textoBusqueda = texto.toLowerCase().trim();
      
      return coloresList.filter(color => 
        color.name.toLowerCase().includes(textoBusqueda) ||
        (color.abr && color.abr.toLowerCase().includes(textoBusqueda)) ||
        (color.nom && color.nom.toLowerCase().includes(textoBusqueda)) ||
        (color.nom_fab && color.nom_fab.toLowerCase().includes(textoBusqueda))
      );

    } catch (error) {
      throw apiUtils.handleError(error, 'ColoresService.buscarColores');
    }
  }

  /**
   * Obtiene color por ID
   * @param {number} id - ID del color
   * @returns {Promise} Color encontrado
   */
  async getColorPorId(id) {
    try {
      const colores = await this.getColoresActivos();
      return colores.find(color => color.id === id) || null;
    } catch (error) {
      throw apiUtils.handleError(error, 'ColoresService.getColorPorId');
    }
  }

  /**
   * Valida estructura de color
   * @param {Object} color - Objeto color a validar
   * @returns {Object} Resultado de validación
   */
  validarColor(color) {
    const errores = [];
    
    if (!color) {
      errores.push('Color no definido');
      return { valida: false, errores };
    }

    if (!color.id || typeof color.id !== 'number') {
      errores.push('ID de color inválido');
    }

    if (!color.name || typeof color.name !== 'string' || color.name.trim() === '') {
      errores.push('Nombre de color requerido');
    }

    if (color.name && color.name.length > 50) {
      errores.push('Nombre demasiado largo (máximo 50 caracteres)');
    }

    if (color.abr && color.abr.length > 10) {
      errores.push('Abreviatura demasiado larga (máximo 10 caracteres)');
    }

    if (color.cnt_tyc !== undefined && color.cnt_tyc !== null && typeof color.cnt_tyc !== 'number') {
      errores.push('Conteo TyC debe ser numérico');
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
    console.log('Caché de ColoresService limpiado');
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
export const coloresService = new ColoresService();