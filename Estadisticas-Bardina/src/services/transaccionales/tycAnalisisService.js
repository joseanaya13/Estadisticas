// services/transaccionales/tycAnalisisService.js
import { apiClient, apiUtils } from '../core/apiClient.js';
import { tallasService } from '../maestros/tallasService.js';
import { coloresService } from '../maestros/coloresService.js';

/**
 * Servicio de análisis de Tallas y Colores (TyC)
 * Replica la funcionalidad del proceso Velneo TYC_CAN3_MEM
 * ACTUALIZADO: Usa servicios reales de tallas y colores
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

      // Paso 1: Cargar maestros de tallas y colores
      const [tallasActivas, coloresActivos] = await Promise.all([
        tallasService.getTallasActivas(),
        coloresService.getColoresActivos()
      ]);

      console.log(`Maestros cargados: ${tallasActivas.length} tallas, ${coloresActivos.length} colores`);

      // Paso 2: Obtener artículos base
      const articulosBase = await this._obtenerArticulosBase(filtros);
      console.log(`Artículos base encontrados: ${articulosBase.length}`);

      // Paso 3: Obtener existencias por TyC
      const existenciasTyC = await this._obtenerExistenciasTyC(articulosBase, filtros);
      console.log(`Registros de existencias TyC: ${existenciasTyC.length}`);

      // Paso 4: Obtener ventas por TyC
      const ventasTyC = await this._obtenerVentasTyC(articulosBase, filtros);
      console.log(`Registros de ventas TyC: ${ventasTyC.length}`);

      // Paso 5: Generar matriz consolidada
      const matrizTyC = await this._generarMatrizTyC(
        articulosBase, 
        existenciasTyC, 
        ventasTyC, 
        tallasActivas, 
        coloresActivos
      );
      console.log(`Matriz TyC generada: ${matrizTyC.length} filas`);

      // Paso 6: Calcular estadísticas
      const estadisticas = this._calcularEstadisticas(matrizTyC);

      // Paso 7: Preparar maestros para respuesta
      const maestroTallas = tallasService.tallasToMap(tallasActivas);
      const maestroColores = coloresService.colorsToMap(coloresActivos);

      const resultado = {
        matriz: matrizTyC,
        estadisticas,
        maestros: {
          tallas: maestroTallas,
          colores: maestroColores
        },
        metadatos: {
          totalArticulos: articulosBase.length,
          totalRegistrosStock: existenciasTyC.length,
          totalRegistrosVentas: ventasTyC.length,
          totalTallas: tallasActivas.length,
          totalColores: coloresActivos.length,
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
   * ACTUALIZADO: Usa datos reales de tallas y colores
   */
  async _generarMatrizTyC(articulosBase, existenciasTyC, ventasTyC, tallasActivas, coloresActivos) {
    try {
      // Mapas de artículos, tallas y colores para referencias
      const mapaArticulos = {};
      articulosBase.forEach(art => {
        mapaArticulos[art.id] = art;
      });

      const mapaTallas = tallasService.tallasToMap(tallasActivas);
      const mapaColores = coloresService.colorsToMap(coloresActivos);

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

      // Obtener tallas únicas presentes en los datos y ordenarlas
      const tallasUnicas = new Set();
      Object.values(stockPorArtCol).forEach(artCol => {
        Object.keys(artCol.tallas).forEach(talla => {
          const tallaId = parseInt(talla);
          if (mapaTallas[tallaId]) {
            tallasUnicas.add(tallaId);
          }
        });
      });
      
      // Agregar tallas de ventas también
      Object.keys(ventasPorArtColTll).forEach(key => {
        const [, , tallaId] = key.split('-');
        const tallaIdNum = parseInt(tallaId);
        if (mapaTallas[tallaIdNum]) {
          tallasUnicas.add(tallaIdNum);
        }
      });

      // Ordenar tallas por el campo 'ord'
      const tallasOrdenadas = Array.from(tallasUnicas)
        .filter(tallaId => mapaTallas[tallaId])
        .sort((a, b) => (mapaTallas[a].ord || 0) - (mapaTallas[b].ord || 0))
        .slice(0, 20); // Máximo 20 tallas como Velneo

      console.log(`Tallas ordenadas para matriz: ${tallasOrdenadas.length}`, 
        tallasOrdenadas.map(id => `${id}:${mapaTallas[id].abr}`));

      // Generar matriz final
      const matriz = [];
      
      Object.values(stockPorArtCol).forEach(artCol => {
        const articulo = mapaArticulos[artCol.art];
        const colorInfo = mapaColores[artCol.col];
        
        if (!articulo) {
          console.warn(`Artículo no encontrado: ${artCol.art}`);
          return;
        }

        const fila = {
          // Identificadores
          art: artCol.art,
          articuloNombre: articulo.name || `Artículo ${artCol.art}`,
          col: artCol.col,
          colorNombre: colorInfo?.name || `Color ${artCol.col}`,
          colorAbr: colorInfo?.abr || '',
          colorHex: colorInfo?.hex || '#CCCCCC',
          
          // Información del artículo
          proveedor: articulo.prv,
          marca: articulo.mar,
          familia: articulo.fam,
          temporada: articulo.temp,
          
          // Tallas disponibles (nombres y IDs)
          tallas: tallasOrdenadas.map(tallaId => mapaTallas[tallaId]?.abr || tallaId),
          tallasIds: tallasOrdenadas,
          tallasNombres: tallasOrdenadas.map(tallaId => mapaTallas[tallaId]?.name || `Talla ${tallaId}`),
          
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

        // Calcular rotación y cobertura
        fila.rotacion = fila.totalExistencias > 0 ? fila.totalVentas / fila.totalExistencias : 0;
        fila.cobertura = fila.totalVentas > 0 ? fila.totalExistencias / fila.totalVentas : 0;
        fila.disponibilidad = fila.totalExistencias > 0 ? 'Disponible' : 'Sin Stock';
        
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