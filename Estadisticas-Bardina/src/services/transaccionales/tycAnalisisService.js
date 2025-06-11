// services/transaccionales/tycAnalisisService.js
import { apiClient, apiUtils } from '../core/apiClient.js';

/**
 * Servicio de análisis de Tallas y Colores (TyC)
 * Replica la funcionalidad del proceso Velneo TYC_CAN3_MEM
 */
export class TycAnalisisService {
  constructor() {
    this.endpoints = {
      articulos: '/art_m',
      articulosTyc: '/art_tyc', 
      movimientos: '/mov_tyc_g'
    };
    this._cache = new Map();
    this._cacheExpiry = 10 * 60 * 1000; // 10 minutos
    
    // Maestros hardcodeados (luego se pueden mover a endpoints)
    this.maestroTallas = this._initMaestroTallas();
    this.maestroColores = this._initMaestroColores();
  }

  /**
   * Inicializar maestro de tallas
   */
  _initMaestroTallas() {
    return {
      1: { id: 1, abr: 'XS', name: 'Extra Small', ord: 1 },
      2: { id: 2, abr: 'S', name: 'Small', ord: 2 },
      3: { id: 3, abr: 'M', name: 'Medium', ord: 3 },
      4: { id: 4, abr: 'L', name: 'Large', ord: 4 },
      5: { id: 5, abr: 'XL', name: 'Extra Large', ord: 5 },
      6: { id: 6, abr: 'XXL', name: 'Extra Extra Large', ord: 6 },
      7: { id: 7, abr: '34', name: 'Talla 34', ord: 7 },
      8: { id: 8, abr: '36', name: 'Talla 36', ord: 8 },
      9: { id: 9, abr: '38', name: 'Talla 38', ord: 9 },
      10: { id: 10, abr: '40', name: 'Talla 40', ord: 10 },
      11: { id: 11, abr: '42', name: 'Talla 42', ord: 11 },
      12: { id: 12, abr: '44', name: 'Talla 44', ord: 12 },
      13: { id: 13, abr: '46', name: 'Talla 46', ord: 13 },
      14: { id: 14, abr: '48', name: 'Talla 48', ord: 14 },
      15: { id: 15, abr: '50', name: 'Talla 50', ord: 15 },
      16: { id: 16, abr: 'U', name: 'Única', ord: 16 },
      17: { id: 17, abr: '37', name: 'Talla 37', ord: 17 },
      18: { id: 18, abr: '39', name: 'Talla 39', ord: 18 },
      19: { id: 19, abr: '41', name: 'Talla 41', ord: 19 },
      20: { id: 20, abr: '43', name: 'Talla 43', ord: 20 }
    };
  }

  /**
   * Inicializar maestro de colores
   */
  _initMaestroColores() {
    return {
      1: { id: 1, name: 'Blanco', abr: 'BLA', ref: 'WHITE' },
      2: { id: 2, name: 'Negro', abr: 'NEG', ref: 'BLACK' },
      3: { id: 3, name: 'Rojo', abr: 'ROJ', ref: 'RED' },
      4: { id: 4, name: 'Azul', abr: 'AZU', ref: 'BLUE' },
      5: { id: 5, name: 'Verde', abr: 'VER', ref: 'GREEN' },
      6: { id: 6, name: 'Amarillo', abr: 'AMA', ref: 'YELLOW' },
      7: { id: 7, name: 'Rosa', abr: 'ROS', ref: 'PINK' },
      8: { id: 8, name: 'Gris', abr: 'GRI', ref: 'GRAY' },
      9: { id: 9, name: 'Marrón', abr: 'MAR', ref: 'BROWN' },
      10: { id: 10, name: 'Naranja', abr: 'NAR', ref: 'ORANGE' },
      11: { id: 11, name: 'Morado', abr: 'MOR', ref: 'PURPLE' },
      12: { id: 12, name: 'Beige', abr: 'BEI', ref: 'BEIGE' },
      13: { id: 13, name: 'Plateado', abr: 'PLA', ref: 'SILVER' },
      14: { id: 14, name: 'Dorado', abr: 'DOR', ref: 'GOLD' },
      15: { id: 15, name: 'Multicolor', abr: 'MUL', ref: 'MULTI' },
      16: { id: 16, name: 'Transparente', abr: 'TRA', ref: 'CLEAR' },
      17: { id: 17, name: 'Azul Marino', abr: 'AMA', ref: 'NAVY' },
      18: { id: 18, name: 'Verde Oliva', abr: 'VOL', ref: 'OLIVE' },
      19: { id: 19, name: 'Burdeos', abr: 'BUR', ref: 'BURGUNDY' },
      20: { id: 20, name: 'Crema', abr: 'CRE', ref: 'CREAM' }
    };
  }

  /**
   * Obtener análisis completo TyC
   * @param {Object} filtros - Filtros de análisis
   * @returns {Promise} Análisis TyC completo
   */
  async getAnalisisTyC(filtros = {}) {
    try {
      const cacheKey = `analisis_tyc_${JSON.stringify(filtros)}`;
      
      // Verificar caché
      if (this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando análisis TyC desde caché');
          return cached.data;
        }
      }

      console.log('Iniciando análisis TyC con filtros:', filtros);

      // Paso 1: Obtener artículos base
      const articulosBase = await this._obtenerArticulosBase(filtros);
      console.log(`Artículos base encontrados: ${articulosBase.length}`);

      // Paso 2: Obtener existencias por TyC
      const existenciasTyC = await this._obtenerExistenciasTyC(articulosBase, filtros);
      console.log(`Registros de existencias TyC: ${existenciasTyC.length}`);

      // Paso 3: Obtener ventas por TyC
      const ventasTyC = await this._obtenerVentasTyC(articulosBase, filtros);
      console.log(`Registros de ventas TyC: ${ventasTyC.length}`);

      // Paso 4: Generar matriz consolidada
      const matrizTyC = await this._generarMatrizTyC(articulosBase, existenciasTyC, ventasTyC);
      console.log(`Matriz TyC generada: ${matrizTyC.length} filas`);

      // Paso 5: Calcular estadísticas
      const estadisticas = this._calcularEstadisticas(matrizTyC);

      const resultado = {
        matriz: matrizTyC,
        estadisticas,
        maestros: {
          tallas: this.maestroTallas,
          colores: this.maestroColores
        },
        metadatos: {
          totalArticulos: articulosBase.length,
          totalRegistrosStock: existenciasTyC.length,
          totalRegistrosVentas: ventasTyC.length,
          fechaGeneracion: new Date().toISOString(),
          filtrosAplicados: filtros
        }
      };

      // Guardar en caché
      this._cache.set(cacheKey, {
        data: resultado,
        timestamp: Date.now()
      });

      return resultado;

    } catch (error) {
      throw apiUtils.handleError(error, 'TycAnalisisService.getAnalisisTyC');
    }
  }

  /**
   * Obtener artículos base con filtros
   */
  async _obtenerArticulosBase(filtros) {
    try {
      const apiFilters = {};
      
      // Aplicar filtros de artículos
      if (filtros.proveedor && filtros.proveedor !== 'todos') {
        apiFilters.prv = filtros.proveedor;
      }
      if (filtros.marca && filtros.marca !== 'todas') {
        apiFilters.mar = filtros.marca;
      }
      if (filtros.familia && filtros.familia !== 'todas') {
        apiFilters.fam = filtros.familia;
      }
      if (filtros.temporada && filtros.temporada !== 'todas') {
        apiFilters.temp = filtros.temporada;
      }
      if (filtros.articulo) {
        apiFilters.id = filtros.articulo;
      }

      const queryString = apiClient.buildQueryParams(apiFilters);
      const endpoint = queryString ? `${this.endpoints.articulos}?${queryString}` : this.endpoints.articulos;
      
      const response = await apiClient.getAllPaginated(endpoint, 'art_m');
      return response.art_m || [];

    } catch (error) {
      throw apiUtils.handleError(error, 'TycAnalisisService._obtenerArticulosBase');
    }
  }

  /**
   * Obtener existencias por TyC
   */
  async _obtenerExistenciasTyC(articulosBase, filtros) {
    try {
      if (!articulosBase.length) return [];

      const articulosIds = articulosBase.map(art => art.id);
      const apiFilters = {
        art: articulosIds.join(',') // Filtrar por artículos específicos
      };

      if (filtros.almacen && filtros.almacen !== 'todos') {
        apiFilters.alm = filtros.almacen;
      }
      if (filtros.empresa && filtros.empresa !== 'todas') {
        apiFilters.emp = filtros.empresa;
      }

      const queryString = apiClient.buildQueryParams(apiFilters);
      const endpoint = queryString ? `${this.endpoints.articulosTyc}?${queryString}` : this.endpoints.articulosTyc;
      
      const response = await apiClient.getAllPaginated(endpoint, 'art_tyc');
      return response.art_tyc || [];

    } catch (error) {
      throw apiUtils.handleError(error, 'TycAnalisisService._obtenerExistenciasTyC');
    }
  }

  /**
   * Obtener ventas por TyC en período
   */
  async _obtenerVentasTyC(articulosBase, filtros) {
    try {
      if (!articulosBase.length) return [];

      const articulosIds = articulosBase.map(art => art.id);
      const apiFilters = {
        art: articulosIds.join(','),
        es_ven_rea: true // Solo ventas reales
      };

      // Filtros de fecha
      if (filtros.fechaInicio) {
        apiFilters.fch_inicio = filtros.fechaInicio;
      }
      if (filtros.fechaFin) {
        apiFilters.fch_fin = filtros.fechaFin;
      }

      // Filtros adicionales
      if (filtros.proveedor && filtros.proveedor !== 'todos') {
        apiFilters.prv = filtros.proveedor;
      }
      if (filtros.marca && filtros.marca !== 'todas') {
        apiFilters.mar = filtros.marca;
      }

      const queryString = apiClient.buildQueryParams(apiFilters);
      const endpoint = queryString ? `${this.endpoints.movimientos}?${queryString}` : this.endpoints.movimientos;
      
      const response = await apiClient.getAllPaginated(endpoint, 'mov_tyc_g');
      return response.mov_tyc_g || [];

    } catch (error) {
      throw apiUtils.handleError(error, 'TycAnalisisService._obtenerVentasTyC');
    }
  }

  /**
   * Generar matriz consolidada TyC (similar a TYC_CAN3_MEM de Velneo)
   */
  async _generarMatrizTyC(articulosBase, existenciasTyC, ventasTyC) {
    try {
      // Mapas de artículos para referencias
      const mapaArticulos = {};
      articulosBase.forEach(art => {
        mapaArticulos[art.id] = art;
      });

      // Agrupar existencias por art-col
      const stockPorArtCol = {};
      existenciasTyC.forEach(item => {
        const key = `${item.art}-${item.col}`;
        if (!stockPorArtCol[key]) {
          stockPorArtCol[key] = {
            art: item.art,
            col: item.col,
            tallas: {}
          };
        }
        stockPorArtCol[key].tallas[item.tll] = (stockPorArtCol[key].tallas[item.tll] || 0) + (item.exs || 0);
      });

      // Agrupar ventas por art-col-tll
      const ventasPorArtColTll = {};
      ventasTyC.forEach(item => {
        const key = `${item.art}-${item.col}-${item.tll}`;
        ventasPorArtColTll[key] = (ventasPorArtColTll[key] || 0) + (item.can || 0);
      });

      // Obtener tallas únicas y ordenarlas
      const tallasUnicas = new Set();
      Object.values(stockPorArtCol).forEach(artCol => {
        Object.keys(artCol.tallas).forEach(talla => tallasUnicas.add(parseInt(talla)));
      });
      
      const tallasOrdenadas = Array.from(tallasUnicas)
        .filter(talla => this.maestroTallas[talla])
        .sort((a, b) => this.maestroTallas[a].ord - this.maestroTallas[b].ord)
        .slice(0, 20); // Máximo 20 tallas como Velneo

      // Generar matriz final
      const matriz = [];
      
      Object.values(stockPorArtCol).forEach(artCol => {
        const articulo = mapaArticulos[artCol.art];
        if (!articulo) return;

        const fila = {
          // Identificadores
          art: artCol.art,
          articuloNombre: articulo.name,
          col: artCol.col,
          colorNombre: this.maestroColores[artCol.col]?.name || `Color ${artCol.col}`,
          colorRef: this.maestroColores[artCol.col]?.ref || '',
          
          // Información del artículo
          proveedor: articulo.prv,
          marca: articulo.mar,
          familia: articulo.fam,
          temporada: articulo.temp,
          
          // Tallas disponibles (nombres)
          tallas: tallasOrdenadas.map(tallaId => this.maestroTallas[tallaId]?.abr || tallaId),
          tallasIds: tallasOrdenadas,
          
          // Existencias por talla
          existencias: tallasOrdenadas.map(tallaId => artCol.tallas[tallaId] || 0),
          
          // Ventas por talla
          ventas: tallasOrdenadas.map(tallaId => {
            const key = `${artCol.art}-${artCol.col}-${tallaId}`;
            return ventasPorArtColTll[key] || 0;
          }),
          
          // Totales
          totalExistencias: tallasOrdenadas.reduce((sum, tallaId) => sum + (artCol.tallas[tallaId] || 0), 0),
          totalVentas: tallasOrdenadas.reduce((sum, tallaId) => {
            const key = `${artCol.art}-${artCol.col}-${tallaId}`;
            return sum + (ventasPorArtColTll[key] || 0);
          }, 0)
        };

        // Calcular rotación
        fila.rotacion = fila.totalExistencias > 0 ? fila.totalVentas / fila.totalExistencias : 0;
        
        matriz.push(fila);
      });

      return matriz.sort((a, b) => {
        // Ordenar por artículo, luego por color
        if (a.art !== b.art) return a.art - b.art;
        return a.col - b.col;
      });

    } catch (error) {
      throw apiUtils.handleError(error, 'TycAnalisisService._generarMatrizTyC');
    }
  }

  /**
   * Calcular estadísticas del análisis
   */
  _calcularEstadisticas(matriz) {
    try {
      const stats = {
        resumen: {
          totalFilas: matriz.length,
          totalExistencias: 0,
          totalVentas: 0,
          valorStock: 0,
          rotacionPromedio: 0
        },
        porTalla: {},
        porColor: {},
        porArticulo: {},
        top: {
          masStock: [],
          masVentas: [],
          mayorRotacion: [],
          menorRotacion: []
        }
      };

      // Calcular totales
      matriz.forEach(fila => {
        stats.resumen.totalExistencias += fila.totalExistencias;
        stats.resumen.totalVentas += fila.totalVentas;
        
        // Estadísticas por talla
        fila.tallas.forEach((talla, index) => {
          if (!stats.porTalla[talla]) {
            stats.porTalla[talla] = { existencias: 0, ventas: 0 };
          }
          stats.porTalla[talla].existencias += fila.existencias[index];
          stats.porTalla[talla].ventas += fila.ventas[index];
        });

        // Estadísticas por color
        if (!stats.porColor[fila.colorNombre]) {
          stats.porColor[fila.colorNombre] = { existencias: 0, ventas: 0, articulos: 0 };
        }
        stats.porColor[fila.colorNombre].existencias += fila.totalExistencias;
        stats.porColor[fila.colorNombre].ventas += fila.totalVentas;
        stats.porColor[fila.colorNombre].articulos += 1;
      });

      // Rotación promedio
      const rotaciones = matriz.map(f => f.rotacion).filter(r => r > 0);
      stats.resumen.rotacionPromedio = rotaciones.length > 0 ? 
        rotaciones.reduce((sum, r) => sum + r, 0) / rotaciones.length : 0;

      // Tops
      const matrizOrdenada = [...matriz];
      
      stats.top.masStock = matrizOrdenada
        .sort((a, b) => b.totalExistencias - a.totalExistencias)
        .slice(0, 10)
        .map(f => ({
          articulo: f.articuloNombre,
          color: f.colorNombre,
          stock: f.totalExistencias
        }));

      stats.top.masVentas = matrizOrdenada
        .sort((a, b) => b.totalVentas - a.totalVentas)
        .slice(0, 10)
        .map(f => ({
          articulo: f.articuloNombre,
          color: f.colorNombre,
          ventas: f.totalVentas
        }));

      stats.top.mayorRotacion = matrizOrdenada
        .filter(f => f.rotacion > 0)
        .sort((a, b) => b.rotacion - a.rotacion)
        .slice(0, 10)
        .map(f => ({
          articulo: f.articuloNombre,
          color: f.colorNombre,
          rotacion: f.rotacion
        }));

      return stats;

    } catch (error) {
      throw apiUtils.handleError(error, 'TycAnalisisService._calcularEstadisticas');
    }
  }

  /**
   * Exportar matriz a formato Excel/CSV
   */
  async exportarMatriz(matriz, formato = 'csv') {
    try {
      const headers = [
        'Artículo',
        'Nombre Artículo', 
        'Color',
        'Nombre Color',
        'Proveedor',
        'Marca',
        'Familia',
        'Temporada'
      ];

      // Agregar columnas de tallas dinámicamente
      const tallasEjemplo = matriz[0]?.tallas || [];
      tallasEjemplo.forEach(talla => {
        headers.push(`Stock ${talla}`, `Ventas ${talla}`);
      });
      
      headers.push('Total Stock', 'Total Ventas', 'Rotación');

      const rows = matriz.map(fila => {
        const row = [
          fila.art,
          fila.articuloNombre,
          fila.col,
          fila.colorNombre,
          fila.proveedor,
          fila.marca,
          fila.familia,
          fila.temporada
        ];

        // Agregar datos de tallas
        fila.tallas.forEach((talla, index) => {
          row.push(fila.existencias[index], fila.ventas[index]);
        });

        row.push(fila.totalExistencias, fila.totalVentas, fila.rotacion.toFixed(2));
        return row;
      });

      return {
        headers,
        rows,
        formato,
        nombreArchivo: `analisis_tyc_${new Date().toISOString().slice(0, 10)}.${formato}`
      };

    } catch (error) {
      throw apiUtils.handleError(error, 'TycAnalisisService.exportarMatriz');
    }
  }

  /**
   * Limpiar caché
   */
  limpiarCache() {
    this._cache.clear();
    console.log('Caché de TycAnalisisService limpiado');
  }
}

// Instancia singleton
export const tycAnalisisService = new TycAnalisisService();