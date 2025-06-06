// services/maestros/temporadasService.js - Servicio específico para gestión de temporadas
import { apiClient, apiUtils } from '../core/apiClient.js';

/**
 * Servicio de temporadas - Gestiona todas las operaciones relacionadas con temporadas de productos
 */
export class TemporadasService {
  constructor() {
    this.endpoint = '/temp_m';
    this.dataKey = 'temp_m';
    this._cache = new Map();
    this._cacheExpiry = 30 * 60 * 1000; // 30 minutos - datos maestros
  }
  
  /**
   * Obtiene todas las temporadas
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getTemporadas(useCache = true) {
    try {
      const cacheKey = 'temporadas_all';
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando temporadas desde caché');
          return cached.data;
        }
      }
      
      console.log('Obteniendo temporadas desde la API');
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
      throw apiUtils.handleError(error, 'TemporadasService.getTemporadas');
    }
  }
  
  /**
   * Obtiene una temporada por ID
   * @param {string|number} id - ID de la temporada
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getTemporada(id, useCache = true) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const cacheKey = `temporada_${id}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log(`Usando temporada ${id} desde caché`);
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
      throw apiUtils.handleError(error, 'TemporadasService.getTemporada');
    }
  }
  
  /**
   * Crea una nueva temporada
   * @param {Object} temporadaData - Datos de la temporada
   * @returns {Promise} Promesa con los datos creados
   */
  async createTemporada(temporadaData) {
    try {
      apiUtils.validateRequiredParams(temporadaData, ['name']);
      
      const result = await apiClient.post(this.endpoint, temporadaData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.createTemporada');
    }
  }
  
  /**
   * Actualiza una temporada existente
   * @param {string|number} id - ID de la temporada
   * @param {Object} temporadaData - Datos actualizados
   * @returns {Promise} Promesa con los datos actualizados
   */
  async updateTemporada(id, temporadaData) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.put(`${this.endpoint}/${id}`, temporadaData);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.updateTemporada');
    }
  }
  
  /**
   * Elimina una temporada
   * @param {string|number} id - ID de la temporada
   * @returns {Promise} Promesa con el resultado
   */
  async deleteTemporada(id) {
    try {
      apiUtils.validateRequiredParams({ id }, ['id']);
      
      const result = await apiClient.delete(`${this.endpoint}/${id}`);
      
      // Limpiar caché
      this._clearCache();
      
      return result;
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.deleteTemporada');
    }
  }
  
  /**
   * Obtiene el nombre de una temporada por su ID
   * @param {string|number} id - ID de la temporada
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @returns {Promise<string>} Nombre de la temporada
   */
  async getNombreTemporada(id, temporadasList = null) {
    try {
      if (!id) return 'Sin temporada';
      
      // Si no se proporciona la lista, obtenerla
      if (!temporadasList) {
        const response = await this.getTemporadas();
        temporadasList = response[this.dataKey] || [];
      }
      
      const temporada = temporadasList.find(t => t.id == id);
      return temporada ? temporada.name : `Temporada ${id}`;
    } catch (error) {
      console.error('Error al obtener nombre de temporada:', error);
      return `Temporada ${id}`;
    }
  }
  
  /**
   * Busca temporadas por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @returns {Promise<Array>} Array de temporadas que coinciden
   */
  async buscarPorNombre(nombre, temporadasList = null) {
    try {
      if (!nombre) return [];
      
      // Si no se proporciona la lista, obtenerla
      if (!temporadasList) {
        const response = await this.getTemporadas();
        temporadasList = response[this.dataKey] || [];
      }
      
      const nombreLower = nombre.toLowerCase();
      return temporadasList.filter(temporada => 
        temporada.name && temporada.name.toLowerCase().includes(nombreLower)
      );
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.buscarPorNombre');
    }
  }
  
  /**
   * Busca temporadas por múltiples criterios
   * @param {Object} criterios - Criterios de búsqueda
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @returns {Promise<Array>} Array de temporadas que coinciden
   */
  async buscarPorCriterios(criterios = {}, temporadasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!temporadasList) {
        const response = await this.getTemporadas();
        temporadasList = response[this.dataKey] || [];
      }
      
      return temporadasList.filter(temporada => {
        // Búsqueda por nombre
        if (criterios.nombre) {
          const nombreLower = criterios.nombre.toLowerCase();
          if (!temporada.name || !temporada.name.toLowerCase().includes(nombreLower)) {
            return false;
          }
        }
        
        // Búsqueda por clave de temporada
        if (criterios.claveTemporada) {
          const claveLower = criterios.claveTemporada.toLowerCase();
          if (!temporada.clavetemporada || !temporada.clavetemporada.toLowerCase().includes(claveLower)) {
            return false;
          }
        }
        
        // Búsqueda por estado activo
        if (criterios.activa !== undefined) {
          if (temporada.act !== criterios.activa) {
            return false;
          }
        }
        
        // Búsqueda por fecha de modificación
        if (criterios.fechaModificacionDesde) {
          const fechaDesde = new Date(criterios.fechaModificacionDesde);
          const fechaTemporada = new Date(temporada.mod_tim);
          if (fechaTemporada < fechaDesde) {
            return false;
          }
        }
        
        if (criterios.fechaModificacionHasta) {
          const fechaHasta = new Date(criterios.fechaModificacionHasta);
          const fechaTemporada = new Date(temporada.mod_tim);
          if (fechaTemporada > fechaHasta) {
            return false;
          }
        }
        
        return true;
      });
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.buscarPorCriterios');
    }
  }
  
  /**
   * Crea un mapa ID -> Objeto para búsquedas rápidas
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @returns {Promise<Object>} Mapa de temporadas
   */
  async crearMapaCompleto(temporadasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!temporadasList) {
        const response = await this.getTemporadas();
        temporadasList = response[this.dataKey] || [];
      }
      
      return apiUtils.createLookupMap(temporadasList, 'id');
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.crearMapaCompleto');
    }
  }
  
  /**
   * Crea un mapa ID -> Nombre para búsquedas rápidas
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @returns {Promise<Object>} Mapa de ID a nombre
   */
  async crearMapaNombres(temporadasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!temporadasList) {
        const response = await this.getTemporadas();
        temporadasList = response[this.dataKey] || [];
      }
      
      return apiUtils.createNameMap(temporadasList, 'id', 'name');
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.crearMapaNombres');
    }
  }
  
  /**
   * Obtiene estadísticas de temporadas
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @returns {Promise<Object>} Estadísticas de temporadas
   */
  async getEstadisticas(temporadasList = null) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!temporadasList) {
        const response = await this.getTemporadas();
        temporadasList = response[this.dataKey] || [];
      }
      
      const stats = {
        total: temporadasList.length,
        activas: 0,
        inactivas: 0,
        conClave: 0,
        sinClave: 0,
        temporadasRecientes: 0,
        temporadasAntiguas: 0
      };
      
      const fechaLimite = new Date();
      fechaLimite.setMonth(fechaLimite.getMonth() - 6); // 6 meses atrás
      
      temporadasList.forEach(temporada => {
        // Estado activo/inactivo
        if (temporada.act) {
          stats.activas++;
        } else {
          stats.inactivas++;
        }
        
        // Con/sin clave
        if (temporada.clavetemporada && temporada.clavetemporada.trim()) {
          stats.conClave++;
        } else {
          stats.sinClave++;
        }
        
        // Temporadas recientes vs antiguas
        if (temporada.mod_tim) {
          const fechaModificacion = new Date(temporada.mod_tim);
          if (fechaModificacion >= fechaLimite) {
            stats.temporadasRecientes++;
          } else {
            stats.temporadasAntiguas++;
          }
        }
      });
      
      // Temporadas más utilizadas (basado en frecuencia de claves)
      const frecuenciaClaves = {};
      temporadasList.forEach(temporada => {
        if (temporada.clavetemporada) {
          const clave = temporada.clavetemporada.toUpperCase();
          frecuenciaClaves[clave] = (frecuenciaClaves[clave] || 0) + 1;
        }
      });
      
      const clavesComunes = Object.entries(frecuenciaClaves)
        .map(([clave, frecuencia]) => ({ clave, frecuencia }))
        .sort((a, b) => b.frecuencia - a.frecuencia)
        .slice(0, 10);
      
      return {
        ...stats,
        clavesComunes,
        porcentajes: {
          activas: stats.total > 0 ? (stats.activas / stats.total) * 100 : 0,
          conClave: stats.total > 0 ? (stats.conClave / stats.total) * 100 : 0,
          recientes: stats.total > 0 ? (stats.temporadasRecientes / stats.total) * 100 : 0
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.getEstadisticas');
    }
  }
  
  /**
   * Obtiene temporadas más vendidas basado en datos de ventas
   * @param {Array} ventasData - Datos de líneas de factura
   * @param {Array} articulosList - Lista de artículos para relacionar con temporadas
   * @param {number} limit - Límite de resultados (por defecto 10)
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @returns {Promise<Array>} Top temporadas más vendidas
   */
  async getTemporadasMasVendidas(ventasData = [], articulosList = [], limit = 10, temporadasList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(temporadasList);
      
      // Crear mapa de artículos -> temporadas
      const articuloTemporadaMap = {};
      articulosList.forEach(articulo => {
        if (articulo.id && articulo.temp) {
          articuloTemporadaMap[articulo.id] = articulo.temp;
        }
      });
      
      const actividadTemporadas = {};
      
      ventasData.forEach(linea => {
        const articuloId = linea.art;
        const temporadaId = articuloId ? articuloTemporadaMap[articuloId] : null;
        const ventas = linea.imp_pvp || 0;
        const cantidad = linea.can || 0;
        const beneficio = linea.ben || 0;
        
        if (temporadaId && ventas > 0) {
          if (!actividadTemporadas[temporadaId]) {
            actividadTemporadas[temporadaId] = {
              temporadaId,
              nombre: mapaNombres[temporadaId] || `Temporada ${temporadaId}`,
              totalVentas: 0,
              totalBeneficio: 0,
              cantidadVendida: 0,
              numeroLineas: 0,
              numeroProductos: new Set(),
              promedioVenta: 0,
              margenPorcentual: 0,
              participacionMercado: 0
            };
          }
          
          const actividad = actividadTemporadas[temporadaId];
          actividad.totalVentas += ventas;
          actividad.totalBeneficio += beneficio;
          actividad.cantidadVendida += cantidad;
          actividad.numeroLineas += 1;
          
          if (articuloId) {
            actividad.numeroProductos.add(articuloId);
          }
        }
      });
      
      const totalVentasMercado = Object.values(actividadTemporadas)
        .reduce((sum, temporada) => sum + temporada.totalVentas, 0);
      
      return Object.values(actividadTemporadas)
        .map(temporada => ({
          ...temporada,
          numeroProductos: temporada.numeroProductos.size,
          promedioVenta: temporada.numeroLineas > 0 ? 
            temporada.totalVentas / temporada.numeroLineas : 0,
          margenPorcentual: temporada.totalVentas > 0 ? 
            (temporada.totalBeneficio / temporada.totalVentas) * 100 : 0,
          participacionMercado: totalVentasMercado > 0 ? 
            (temporada.totalVentas / totalVentasMercado) * 100 : 0
        }))
        .sort((a, b) => b.totalVentas - a.totalVentas)
        .slice(0, limit);
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.getTemporadasMasVendidas');
    }
  }
  
  /**
   * Análisis estacional de ventas por temporada
   * @param {Array} ventasData - Datos de líneas de factura
   * @param {Array} articulosList - Lista de artículos para relacionar con temporadas
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @returns {Promise<Object>} Análisis estacional
   */
  async getAnalisisEstacional(ventasData = [], articulosList = [], temporadasList = null) {
    try {
      const mapaNombres = await this.crearMapaNombres(temporadasList);
      
      // Crear mapa de artículos -> temporadas
      const articuloTemporadaMap = {};
      articulosList.forEach(articulo => {
        if (articulo.id && articulo.temp) {
          articuloTemporadaMap[articulo.id] = articulo.temp;
        }
      });
      
      const analisisEstacional = {};
      
      ventasData.forEach(linea => {
        const articuloId = linea.art;
        const temporadaId = articuloId ? articuloTemporadaMap[articuloId] : null;
        const ventas = linea.imp_pvp || 0;
        
        if (temporadaId && ventas > 0 && linea.fch) {
          const fecha = new Date(linea.fch);
          const año = fecha.getFullYear();
          const mes = fecha.getMonth() + 1;
          const trimestre = Math.ceil(mes / 3);
          
          if (!analisisEstacional[temporadaId]) {
            analisisEstacional[temporadaId] = {
              temporadaId,
              nombre: mapaNombres[temporadaId] || `Temporada ${temporadaId}`,
              ventasPorMes: {},
              ventasPorTrimestre: {},
              ventasPorAño: {},
              picos: [],
              valles: [],
              estacionalidad: 'neutral'
            };
          }
          
          const temporada = analisisEstacional[temporadaId];
          
          // Acumular por mes
          temporada.ventasPorMes[mes] = (temporada.ventasPorMes[mes] || 0) + ventas;
          
          // Acumular por trimestre
          temporada.ventasPorTrimestre[trimestre] = (temporada.ventasPorTrimestre[trimestre] || 0) + ventas;
          
          // Acumular por año
          temporada.ventasPorAño[año] = (temporada.ventasPorAño[año] || 0) + ventas;
        }
      });
      
      // Procesar análisis estacional
      const temporadasProcesadas = Object.values(analisisEstacional).map(temporada => {
        // Convertir a arrays ordenados
        const ventasMensuales = Object.entries(temporada.ventasPorMes)
          .map(([mes, ventas]) => ({ 
            mes: parseInt(mes), 
            nombreMes: this._getNombreMes(parseInt(mes)),
            ventas 
          }))
          .sort((a, b) => a.mes - b.mes);
        
        const ventasTrimestrales = Object.entries(temporada.ventasPorTrimestre)
          .map(([trimestre, ventas]) => ({ 
            trimestre: parseInt(trimestre), 
            nombreTrimestre: `Q${trimestre}`,
            ventas 
          }))
          .sort((a, b) => a.trimestre - b.trimestre);
        
        const ventasAnuales = Object.entries(temporada.ventasPorAño)
          .map(([año, ventas]) => ({ 
            año: parseInt(año), 
            ventas 
          }))
          .sort((a, b) => a.año - b.año);
        
        // Detectar picos y valles
        const promedioMensual = ventasMensuales.length > 0 ? 
          ventasMensuales.reduce((sum, item) => sum + item.ventas, 0) / ventasMensuales.length : 0;
        
        const picos = ventasMensuales.filter(item => item.ventas > promedioMensual * 1.5);
        const valles = ventasMensuales.filter(item => item.ventas < promedioMensual * 0.5);
        
        // Determinar tipo de estacionalidad
        let estacionalidad = 'neutral';
        const maxVentas = Math.max(...ventasMensuales.map(item => item.ventas));
        const minVentas = Math.min(...ventasMensuales.map(item => item.ventas));
        const variabilidad = maxVentas > 0 ? (maxVentas - minVentas) / maxVentas : 0;
        
        if (variabilidad > 0.7) {
          estacionalidad = 'alta';
        } else if (variabilidad > 0.3) {
          estacionalidad = 'media';
        }
        
        return {
          ...temporada,
          ventasMensuales,
          ventasTrimestrales,
          ventasAnuales,
          picos,
          valles,
          estacionalidad,
          variabilidadEstacional: variabilidad,
          promedioMensual,
          mejorMes: ventasMensuales.length > 0 ? 
            ventasMensuales.reduce((max, item) => item.ventas > max.ventas ? item : max) : null,
          peorMes: ventasMensuales.length > 0 ? 
            ventasMensuales.reduce((min, item) => item.ventas < min.ventas ? item : min) : null
        };
      });
      
      return {
        temporadas: temporadasProcesadas.sort((a, b) => b.variabilidadEstacional - a.variabilidadEstacional),
        resumen: {
          totalTemporadas: temporadasProcesadas.length,
          temporadasAltaEstacionalidad: temporadasProcesadas.filter(t => t.estacionalidad === 'alta').length,
          temporadasMediaEstacionalidad: temporadasProcesadas.filter(t => t.estacionalidad === 'media').length,
          temporadasBajaEstacionalidad: temporadasProcesadas.filter(t => t.estacionalidad === 'neutral').length
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.getAnalisisEstacional');
    }
  }
  
  /**
   * Comparativa entre temporadas por años
   * @param {Array} ventasData - Datos de líneas de factura
   * @param {Array} articulosList - Lista de artículos para relacionar con temporadas
   * @param {Array} años - Años a comparar (por defecto últimos 2 años)
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @returns {Promise<Object>} Comparativa entre años
   */
  async getComparativaAnual(ventasData = [], articulosList = [], años = null, temporadasList = null) {
    try {
      // Si no se especifican años, usar los últimos 2
      if (!años) {
        const añoActual = new Date().getFullYear();
        años = [añoActual - 1, añoActual];
      }
      
      const mapaNombres = await this.crearMapaNombres(temporadasList);
      
      // Crear mapa de artículos -> temporadas
      const articuloTemporadaMap = {};
      articulosList.forEach(articulo => {
        if (articulo.id && articulo.temp) {
          articuloTemporadaMap[articulo.id] = articulo.temp;
        }
      });
      
      const comparativa = {};
      
      ventasData.forEach(linea => {
        const articuloId = linea.art;
        const temporadaId = articuloId ? articuloTemporadaMap[articuloId] : null;
        const ventas = linea.imp_pvp || 0;
        
        if (temporadaId && ventas > 0 && linea.fch) {
          const fecha = new Date(linea.fch);
          const año = fecha.getFullYear();
          
          if (años.includes(año)) {
            if (!comparativa[temporadaId]) {
              comparativa[temporadaId] = {
                temporadaId,
                nombre: mapaNombres[temporadaId] || `Temporada ${temporadaId}`,
                ventasPorAño: {}
              };
            }
            
            comparativa[temporadaId].ventasPorAño[año] = 
              (comparativa[temporadaId].ventasPorAño[año] || 0) + ventas;
          }
        }
      });
      
      // Procesar comparativa
      const temporadasComparadas = Object.values(comparativa).map(temporada => {
        const ventasAños = años.map(año => ({
          año,
          ventas: temporada.ventasPorAño[año] || 0
        }));
        
        // Calcular crecimiento entre años
        const crecimiento = ventasAños.length >= 2 ? 
          this._calcularCrecimiento(ventasAños[0].ventas, ventasAños[ventasAños.length - 1].ventas) : 0;
        
        return {
          ...temporada,
          ventasAños,
          crecimiento,
          tendencia: crecimiento > 10 ? 'creciente' : crecimiento < -10 ? 'decreciente' : 'estable'
        };
      });
      
      return {
        temporadas: temporadasComparadas.sort((a, b) => Math.abs(b.crecimiento) - Math.abs(a.crecimiento)),
        años,
        resumen: {
          totalTemporadas: temporadasComparadas.length,
          crecientes: temporadasComparadas.filter(t => t.tendencia === 'creciente').length,
          decrecientes: temporadasComparadas.filter(t => t.tendencia === 'decreciente').length,
          estables: temporadasComparadas.filter(t => t.tendencia === 'estable').length,
          crecimientoPromedio: temporadasComparadas.length > 0 ? 
            temporadasComparadas.reduce((sum, t) => sum + t.crecimiento, 0) / temporadasComparadas.length : 0
        }
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.getComparativaAnual');
    }
  }
  
  /**
   * Obtiene opciones formateadas para selectores
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @param {boolean} soloActivas - Si incluir solo temporadas activas (por defecto false)
   * @returns {Promise<Array>} Opciones formateadas
   */
  async getOpcionesSelect(temporadasList = null, soloActivas = false) {
    try {
      // Si no se proporciona la lista, obtenerla
      if (!temporadasList) {
        const response = await this.getTemporadas();
        temporadasList = response[this.dataKey] || [];
      }
      
      const opciones = [{ value: 'todas', label: 'Todas las temporadas' }];
      
      let temporadasFiltradas = temporadasList;
      
      // Filtrar solo activas si se solicita
      if (soloActivas) {
        temporadasFiltradas = temporadasList.filter(temporada => temporada.act);
      }
      
      temporadasFiltradas
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(temporada => {
          opciones.push({
            value: temporada.id.toString(),
            label: temporada.name,
            clave: temporada.clavetemporada || '',
            activa: temporada.act
          });
        });
      
      return opciones;
    } catch (error) {
      throw apiUtils.handleError(error, 'TemporadasService.getOpcionesSelect');
    }
  }
  
  /**
   * Valida si una temporada existe
   * @param {string|number} id - ID de la temporada
   * @returns {Promise<boolean>} True si existe, false si no
   */
  async existeTemporada(id) {
    try {
      await this.getTemporada(id);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Limpia la caché de temporadas
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
  
  // === MÉTODOS PRIVADOS ===
  
  /**
   * Obtiene el nombre de un mes
   * @private
   * @param {number} mes - Número del mes (1-12)
   * @returns {string} Nombre del mes
   */
  _getNombreMes(mes) {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return mes >= 1 && mes <= 12 ? meses[mes - 1] : `Mes ${mes}`;
  }
  
  /**
   * Calcula el crecimiento porcentual entre dos valores
   * @private
   * @param {number} valorInicial - Valor inicial
   * @param {number} valorFinal - Valor final
   * @returns {number} Porcentaje de crecimiento
   */
  _calcularCrecimiento(valorInicial, valorFinal) {
    if (valorInicial === 0) return valorFinal > 0 ? 100 : 0;
    return ((valorFinal - valorInicial) / valorInicial) * 100;
  }
  
  /**
   * Limpia la caché interna
   * @private
   */
  _clearCache() {
    this._cache.clear();
    console.log('Caché de temporadas limpiada');
  }
}

// Crear instancia singleton
export const temporadasService = new TemporadasService();

// Exportación por defecto
export default temporadasService;