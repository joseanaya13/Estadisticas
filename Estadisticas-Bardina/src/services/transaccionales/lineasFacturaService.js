// services/transaccionales/lineasFacturasService.js - Servicio para líneas de factura
import { apiClient, apiUtils } from '../core/apiClient.js';

/**
 * Servicio de líneas de factura - Gestiona análisis detallado por productos, proveedores, marcas y temporadas
 */
export class LineasFacturasService {
  constructor() {
    this.endpoint = '/fac_lin_t';
    this.dataKey = 'fac_lin_t';
    this._cache = new Map();
    this._cacheExpiry = 5 * 60 * 1000; // 5 minutos - datos transaccionales
  }
  
  /**
   * Obtiene todas las líneas de factura (con paginación completa)
   * @param {Object} params - Parámetros de filtrado
   * @param {boolean} useCache - Si usar caché (por defecto true)
   * @returns {Promise} Promesa con los datos
   */
  async getLineasFacturas(params = {}, useCache = true) {
    try {
      const cacheKey = `lineas_facturas_${JSON.stringify(params)}`;
      
      // Verificar caché
      if (useCache && this._cache.has(cacheKey)) {
        const cached = this._cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this._cacheExpiry) {
          console.log('Usando líneas de factura desde caché');
          return cached.data;
        }
      }
      
      const queryString = apiClient.buildQueryParams(params);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log('Obteniendo líneas de factura desde la API');
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
      throw apiUtils.handleError(error, 'LineasFacturasService.getLineasFacturas');
    }
  }
  
  /**
   * Obtiene líneas de factura con filtros específicos de la API
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise} Promesa con los datos filtrados
   */
  async getLineasFacturasFiltered(filters = {}) {
    try {
      const apiFilters = apiClient.buildApiFilters(filters);
      const queryString = apiClient.buildQueryParams(apiFilters);
      const endpoint = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log(`Obteniendo líneas de factura con filtros:`, filters);
      console.log(`Endpoint: ${endpoint}`);
      
      return await apiClient.getAllPaginated(endpoint, this.dataKey);
    } catch (error) {
      throw apiUtils.handleError(error, 'LineasFacturasService.getLineasFacturasFiltered');
    }
  }
  
  /**
   * Análisis de ventas por proveedores
   * @param {Object} filters - Filtros a aplicar
   * @param {Array} proveedoresList - Lista de proveedores (opcional)
   * @returns {Promise} Análisis por proveedores
   */
  async getAnalisisPorProveedores(filters = {}, proveedoresList = null) {
    try {
      const lineasData = await this.getLineasFacturasFiltered(filters);
      const lineas = lineasData[this.dataKey] || [];
      
      console.log(`Analizando ${lineas.length} líneas de factura por proveedores`);
      
      // Agrupar por proveedor
      const proveedores = {};
      
      lineas.forEach(linea => {
        const proveedorId = linea.prv;
        if (proveedorId !== undefined && proveedorId !== null) {
          if (!proveedores[proveedorId]) {
            proveedores[proveedorId] = {
              proveedorId,
              nombre: this._getNombreProveedor(proveedorId, proveedoresList),
              ventasTotal: 0,
              beneficioTotal: 0,
              cantidadTotal: 0,
              numeroLineas: 0,
              numeroFacturas: new Set(),
              productos: new Set(),
              margenPorcentual: 0,
              ticketPromedio: 0,
              precioPromedio: 0,
              porMes: {},
              topProductos: {}
            };
          }
          
          const proveedor = proveedores[proveedorId];
          const ventaLinea = linea.imp_pvp || 0;
          const beneficioLinea = linea.ben || 0;
          const cantidadLinea = linea.can || 0;
          
          // Acumular métricas
          proveedor.ventasTotal += ventaLinea;
          proveedor.beneficioTotal += beneficioLinea;
          proveedor.cantidadTotal += cantidadLinea;
          proveedor.numeroLineas += 1;
          
          // Facturas únicas
          if (linea.fac) {
            proveedor.numeroFacturas.add(linea.fac);
          }
          
          // Productos únicos
          if (linea.art) {
            proveedor.productos.add(linea.art);
          }
          
          // Ventas por mes
          if (linea.fch) {
            const fecha = new Date(linea.fch);
            const mesClave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            proveedor.porMes[mesClave] = (proveedor.porMes[mesClave] || 0) + ventaLinea;
          }
          
          // Top productos por proveedor
          if (linea.name) {
            if (!proveedor.topProductos[linea.name]) {
              proveedor.topProductos[linea.name] = {
                nombre: linea.name,
                ventasTotal: 0,
                cantidadTotal: 0
              };
            }
            proveedor.topProductos[linea.name].ventasTotal += ventaLinea;
            proveedor.topProductos[linea.name].cantidadTotal += cantidadLinea;
          }
        }
      });
      
      // Procesar métricas finales
      const proveedoresArray = Object.values(proveedores).map(proveedor => ({
        ...proveedor,
        numeroFacturas: proveedor.numeroFacturas.size,
        numeroProductos: proveedor.productos.size,
        margenPorcentual: proveedor.ventasTotal > 0 ? 
          (proveedor.beneficioTotal / proveedor.ventasTotal) * 100 : 0,
        ticketPromedio: proveedor.numeroFacturas > 0 ? 
          proveedor.ventasTotal / proveedor.numeroFacturas : 0,
        precioPromedio: proveedor.cantidadTotal > 0 ? 
          proveedor.ventasTotal / proveedor.cantidadTotal : 0,
        ventasPorMes: Object.entries(proveedor.porMes)
          .map(([mes, ventas]) => ({ mes, ventas }))
          .sort((a, b) => a.mes.localeCompare(b.mes)),
        topProductos: Object.values(proveedor.topProductos)
          .sort((a, b) => b.ventasTotal - a.ventasTotal)
          .slice(0, 5)
      }));
      
      // Ordenar por ventas
      proveedoresArray.sort((a, b) => b.ventasTotal - a.ventasTotal);
      
      const totalVentas = proveedoresArray.reduce((sum, p) => sum + p.ventasTotal, 0);
      const totalBeneficios = proveedoresArray.reduce((sum, p) => sum + p.beneficioTotal, 0);
      
      return {
        proveedores: proveedoresArray,
        resumen: {
          totalProveedores: proveedoresArray.length,
          ventasTotal: totalVentas,
          beneficioTotal: totalBeneficios,
          margenGeneralPorcentual: totalVentas > 0 ? (totalBeneficios / totalVentas) * 100 : 0,
          fechaAnalisis: new Date().toISOString()
        },
        datosOriginales: lineasData
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'LineasFacturasService.getAnalisisPorProveedores');
    }
  }
  
  /**
   * Análisis de ventas por marcas
   * @param {Object} filters - Filtros a aplicar
   * @param {Array} marcasList - Lista de marcas (opcional)
   * @returns {Promise} Análisis por marcas
   */
  async getAnalisisPorMarcas(filters = {}, marcasList = null) {
    try {
      const lineasData = await this.getLineasFacturasFiltered(filters);
      const lineas = lineasData[this.dataKey] || [];
      
      console.log(`Analizando ${lineas.length} líneas de factura por marcas`);
      
      // Agrupar por marca
      const marcas = {};
      
      lineas.forEach(linea => {
        const marcaId = linea.mar_m;
        if (marcaId !== undefined && marcaId !== null) {
          if (!marcas[marcaId]) {
            marcas[marcaId] = {
              marcaId,
              nombre: this._getNombreMarca(marcaId, marcasList),
              ventasTotal: 0,
              beneficioTotal: 0,
              cantidadTotal: 0,
              numeroLineas: 0,
              numeroFacturas: new Set(),
              productos: new Set(),
              proveedores: new Set(),
              margenPorcentual: 0,
              participacionMercado: 0,
              porMes: {},
              topProductos: {}
            };
          }
          
          const marca = marcas[marcaId];
          const ventaLinea = linea.imp_pvp || 0;
          const beneficioLinea = linea.ben || 0;
          const cantidadLinea = linea.can || 0;
          
          // Acumular métricas
          marca.ventasTotal += ventaLinea;
          marca.beneficioTotal += beneficioLinea;
          marca.cantidadTotal += cantidadLinea;
          marca.numeroLineas += 1;
          
          // Facturas, productos y proveedores únicos
          if (linea.fac) marca.numeroFacturas.add(linea.fac);
          if (linea.art) marca.productos.add(linea.art);
          if (linea.prv) marca.proveedores.add(linea.prv);
          
          // Ventas por mes
          if (linea.fch) {
            const fecha = new Date(linea.fch);
            const mesClave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            marca.porMes[mesClave] = (marca.porMes[mesClave] || 0) + ventaLinea;
          }
          
          // Top productos por marca
          if (linea.name) {
            if (!marca.topProductos[linea.name]) {
              marca.topProductos[linea.name] = {
                nombre: linea.name,
                ventasTotal: 0,
                cantidadTotal: 0
              };
            }
            marca.topProductos[linea.name].ventasTotal += ventaLinea;
            marca.topProductos[linea.name].cantidadTotal += cantidadLinea;
          }
        }
      });
      
      const totalVentasMercado = Object.values(marcas).reduce((sum, m) => sum + m.ventasTotal, 0);
      
      // Procesar métricas finales
      const marcasArray = Object.values(marcas).map(marca => ({
        ...marca,
        numeroFacturas: marca.numeroFacturas.size,
        numeroProductos: marca.productos.size,
        numeroProveedores: marca.proveedores.size,
        margenPorcentual: marca.ventasTotal > 0 ? 
          (marca.beneficioTotal / marca.ventasTotal) * 100 : 0,
        participacionMercado: totalVentasMercado > 0 ? 
          (marca.ventasTotal / totalVentasMercado) * 100 : 0,
        ticketPromedio: marca.numeroFacturas > 0 ? 
          marca.ventasTotal / marca.numeroFacturas : 0,
        ventasPorMes: Object.entries(marca.porMes)
          .map(([mes, ventas]) => ({ mes, ventas }))
          .sort((a, b) => a.mes.localeCompare(b.mes)),
        topProductos: Object.values(marca.topProductos)
          .sort((a, b) => b.ventasTotal - a.ventasTotal)
          .slice(0, 5)
      }));
      
      // Ordenar por ventas
      marcasArray.sort((a, b) => b.ventasTotal - a.ventasTotal);
      
      const totalBeneficios = marcasArray.reduce((sum, m) => sum + m.beneficioTotal, 0);
      
      return {
        marcas: marcasArray,
        resumen: {
          totalMarcas: marcasArray.length,
          ventasTotal: totalVentasMercado,
          beneficioTotal: totalBeneficios,
          margenGeneralPorcentual: totalVentasMercado > 0 ? (totalBeneficios / totalVentasMercado) * 100 : 0,
          concentracionMercado: this._calcularConcentracion(marcasArray),
          fechaAnalisis: new Date().toISOString()
        },
        datosOriginales: lineasData
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'LineasFacturasService.getAnalisisPorMarcas');
    }
  }
  
  /**
   * Análisis de ventas por temporadas
   * @param {Object} filters - Filtros a aplicar
   * @param {Array} temporadasList - Lista de temporadas (opcional)
   * @param {Array} articulosList - Lista de artículos para relación con temporadas (opcional)
   * @returns {Promise} Análisis por temporadas
   */
  async getAnalisisPorTemporadas(filters = {}, temporadasList = null, articulosList = null) {
    try {
      const lineasData = await this.getLineasFacturasFiltered(filters);
      const lineas = lineasData[this.dataKey] || [];
      
      console.log(`Analizando ${lineas.length} líneas de factura por temporadas`);
      
      // Crear mapa de artículos -> temporadas
      const articuloTemporadaMap = {};
      if (articulosList) {
        articulosList.forEach(articulo => {
          if (articulo.id && articulo.temp) {
            articuloTemporadaMap[articulo.id] = articulo.temp;
          }
        });
      }
      
      // Agrupar por temporada
      const temporadas = {};
      
      lineas.forEach(linea => {
        // Obtener temporada a través del artículo
        const articuloId = linea.art;
        const temporadaId = articuloId ? articuloTemporadaMap[articuloId] : null;
        
        if (temporadaId !== undefined && temporadaId !== null) {
          if (!temporadas[temporadaId]) {
            temporadas[temporadaId] = {
              temporadaId,
              nombre: this._getNombreTemporada(temporadaId, temporadasList),
              ventasTotal: 0,
              beneficioTotal: 0,
              cantidadTotal: 0,
              numeroLineas: 0,
              numeroFacturas: new Set(),
              productos: new Set(),
              proveedores: new Set(),
              marcas: new Set(),
              margenPorcentual: 0,
              participacionMercado: 0,
              porMes: {},
              porAño: {},
              topProductos: {},
              estacionalidad: {}
            };
          }
          
          const temporada = temporadas[temporadaId];
          const ventaLinea = linea.imp_pvp || 0;
          const beneficioLinea = linea.ben || 0;
          const cantidadLinea = linea.can || 0;
          
          // Acumular métricas
          temporada.ventasTotal += ventaLinea;
          temporada.beneficioTotal += beneficioLinea;
          temporada.cantidadTotal += cantidadLinea;
          temporada.numeroLineas += 1;
          
          // Entidades únicas
          if (linea.fac) temporada.numeroFacturas.add(linea.fac);
          if (linea.art) temporada.productos.add(linea.art);
          if (linea.prv) temporada.proveedores.add(linea.prv);
          if (linea.mar_m) temporada.marcas.add(linea.mar_m);
          
          // Análisis temporal
          if (linea.fch) {
            const fecha = new Date(linea.fch);
            const año = fecha.getFullYear();
            const mes = fecha.getMonth() + 1;
            const mesClave = `${año}-${String(mes).padStart(2, '0')}`;
            
            temporada.porMes[mesClave] = (temporada.porMes[mesClave] || 0) + ventaLinea;
            temporada.porAño[año] = (temporada.porAño[año] || 0) + ventaLinea;
            
            // Estacionalidad (por mes del año, sin año específico)
            temporada.estacionalidad[mes] = (temporada.estacionalidad[mes] || 0) + ventaLinea;
          }
          
          // Top productos por temporada
          if (linea.name) {
            if (!temporada.topProductos[linea.name]) {
              temporada.topProductos[linea.name] = {
                nombre: linea.name,
                ventasTotal: 0,
                cantidadTotal: 0
              };
            }
            temporada.topProductos[linea.name].ventasTotal += ventaLinea;
            temporada.topProductos[linea.name].cantidadTotal += cantidadLinea;
          }
        }
      });
      
      const totalVentasMercado = Object.values(temporadas).reduce((sum, t) => sum + t.ventasTotal, 0);
      
      // Procesar métricas finales
      const temporadasArray = Object.values(temporadas).map(temporada => ({
        ...temporada,
        numeroFacturas: temporada.numeroFacturas.size,
        numeroProductos: temporada.productos.size,
        numeroProveedores: temporada.proveedores.size,
        numeroMarcas: temporada.marcas.size,
        margenPorcentual: temporada.ventasTotal > 0 ? 
          (temporada.beneficioTotal / temporada.ventasTotal) * 100 : 0,
        participacionMercado: totalVentasMercado > 0 ? 
          (temporada.ventasTotal / totalVentasMercado) * 100 : 0,
        ventasPorMes: Object.entries(temporada.porMes)
          .map(([mes, ventas]) => ({ mes, ventas }))
          .sort((a, b) => a.mes.localeCompare(b.mes)),
        ventasPorAño: Object.entries(temporada.porAño)
          .map(([año, ventas]) => ({ año: parseInt(año), ventas }))
          .sort((a, b) => a.año - b.año),
        estacionalidadMeses: Object.entries(temporada.estacionalidad)
          .map(([mes, ventas]) => ({ 
            mes: parseInt(mes), 
            nombreMes: this._getNombreMes(parseInt(mes)),
            ventas 
          }))
          .sort((a, b) => a.mes - b.mes),
        topProductos: Object.values(temporada.topProductos)
          .sort((a, b) => b.ventasTotal - a.ventasTotal)
          .slice(0, 5)
      }));
      
      // Ordenar por ventas
      temporadasArray.sort((a, b) => b.ventasTotal - a.ventasTotal);
      
      const totalBeneficios = temporadasArray.reduce((sum, t) => sum + t.beneficioTotal, 0);
      
      return {
        temporadas: temporadasArray,
        resumen: {
          totalTemporadas: temporadasArray.length,
          ventasTotal: totalVentasMercado,
          beneficioTotal: totalBeneficios,
          margenGeneralPorcentual: totalVentasMercado > 0 ? (totalBeneficios / totalVentasMercado) * 100 : 0,
          temporadaMasVendida: temporadasArray.length > 0 ? temporadasArray[0] : null,
          fechaAnalisis: new Date().toISOString()
        },
        datosOriginales: lineasData
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'LineasFacturasService.getAnalisisPorTemporadas');
    }
  }
  
  /**
   * Obtiene el top de productos más vendidos
   * @param {Object} filters - Filtros a aplicar
   * @param {number} limit - Límite de resultados
   * @returns {Promise} Top productos
   */
  async getTopProductos(filters = {}, limit = 20) {
    try {
      const lineasData = await this.getLineasFacturasFiltered(filters);
      const lineas = lineasData[this.dataKey] || [];
      
      const productos = {};
      
      lineas.forEach(linea => {
        const productoId = linea.art;
        const productoNombre = linea.name || `Producto ${productoId}`;
        
        if (productoId && productoNombre) {
          if (!productos[productoId]) {
            productos[productoId] = {
              productoId,
              nombre: productoNombre,
              ventasTotal: 0,
              beneficioTotal: 0,
              cantidadTotal: 0,
              numeroLineas: 0,
              precioPromedio: 0,
              margenPorcentual: 0,
              proveedorId: linea.prv,
              marcaId: linea.mar_m
            };
          }
          
          const producto = productos[productoId];
          producto.ventasTotal += (linea.imp_pvp || 0);
          producto.beneficioTotal += (linea.ben || 0);
          producto.cantidadTotal += (linea.can || 0);
          producto.numeroLineas += 1;
        }
      });
      
      return Object.values(productos)
        .map(producto => ({
          ...producto,
          precioPromedio: producto.cantidadTotal > 0 ? 
            producto.ventasTotal / producto.cantidadTotal : 0,
          margenPorcentual: producto.ventasTotal > 0 ? 
            (producto.beneficioTotal / producto.ventasTotal) * 100 : 0
        }))
        .sort((a, b) => b.ventasTotal - a.ventasTotal)
        .slice(0, limit);
    } catch (error) {
      throw apiUtils.handleError(error, 'LineasFacturasService.getTopProductos');
    }
  }
  
  /**
   * Análisis de rentabilidad general
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise} Análisis de rentabilidad
   */
  async getAnalisisRentabilidad(filters = {}) {
    try {
      const lineasData = await this.getLineasFacturasFiltered(filters);
      const lineas = lineasData[this.dataKey] || [];
      
      let ventasTotal = 0;
      let beneficioTotal = 0;
      let cantidadTotal = 0;
      let costoTotal = 0;
      
      const rentabilidadPorMes = {};
      
      lineas.forEach(linea => {
        const ventas = linea.imp_pvp || 0;
        const beneficio = linea.ben || 0;
        const cantidad = linea.can || 0;
        const costo = (linea.cos || 0) * cantidad;
        
        ventasTotal += ventas;
        beneficioTotal += beneficio;
        cantidadTotal += cantidad;
        costoTotal += costo;
        
        // Rentabilidad por mes
        if (linea.fch) {
          const fecha = new Date(linea.fch);
          const mesClave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          
          if (!rentabilidadPorMes[mesClave]) {
            rentabilidadPorMes[mesClave] = {
              mes: mesClave,
              ventas: 0,
              beneficio: 0,
              costo: 0,
              margen: 0
            };
          }
          
          rentabilidadPorMes[mesClave].ventas += ventas;
          rentabilidadPorMes[mesClave].beneficio += beneficio;
          rentabilidadPorMes[mesClave].costo += costo;
        }
      });
      
      // Calcular márgen por mes
      const rentabilidadMensual = Object.values(rentabilidadPorMes)
        .map(mes => ({
          ...mes,
          margen: mes.ventas > 0 ? (mes.beneficio / mes.ventas) * 100 : 0
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes));
      
      return {
        resumen: {
          ventasTotal,
          beneficioTotal,
          costoTotal,
          cantidadTotal,
          margenPorcentual: ventasTotal > 0 ? (beneficioTotal / ventasTotal) * 100 : 0,
          ticketPromedio: lineas.length > 0 ? ventasTotal / lineas.length : 0,
          numeroLineas: lineas.length
        },
        rentabilidadMensual,
        datosOriginales: lineasData
      };
    } catch (error) {
      throw apiUtils.handleError(error, 'LineasFacturasService.getAnalisisRentabilidad');
    }
  }
  
  /**
   * Filtra líneas localmente (útil para filtros que no soporta la API)
   * @param {Array} lineas - Array de líneas
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} Líneas filtradas
   */
  filtrarLineasLocalmente(lineas = [], filters = {}) {
    return apiUtils.filterAndSort(lineas, filters);
  }
  
  /**
   * Limpia la caché
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
   * Obtiene el nombre de un proveedor
   * @private
   * @param {number} id - ID del proveedor
   * @param {Array} lista - Lista de proveedores
   * @returns {string} Nombre del proveedor
   */
  _getNombreProveedor(id, lista = null) {
    if (!lista) return `Proveedor ${id}`;
    const proveedor = lista.find(p => p.id == id && p.es_prv === true);
    return proveedor ? proveedor.name : `Proveedor ${id}`;
  }
  
  /**
   * Obtiene el nombre de una marca
   * @private
   * @param {number} id - ID de la marca
   * @param {Array} lista - Lista de marcas
   * @returns {string} Nombre de la marca
   */
  _getNombreMarca(id, lista = null) {
    if (!lista) return `Marca ${id}`;
    const marca = lista.find(m => m.id == id);
    return marca ? marca.name : `Marca ${id}`;
  }
  
  /**
   * Obtiene el nombre de una temporada
   * @private
   * @param {number} id - ID de la temporada
   * @param {Array} lista - Lista de temporadas
   * @returns {string} Nombre de la temporada
   */
  _getNombreTemporada(id, lista = null) {
    if (!lista) return `Temporada ${id}`;
    const temporada = lista.find(t => t.id == id);
    return temporada ? temporada.name : `Temporada ${id}`;
  }
  
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
   * Calcula la concentración del mercado (índice de Herfindahl)
   * @private
   * @param {Array} entidades - Array de entidades con participación de mercado
   * @returns {number} Índice de concentración
   */
  _calcularConcentracion(entidades) {
    return entidades.reduce((sum, entidad) => {
      const participacion = entidad.participacionMercado / 100;
      return sum + (participacion * participacion);
    }, 0);
  }
  
  /**
   * Limpia la caché interna
   * @private
   */
  _clearCache() {
    this._cache.clear();
    console.log('Caché de líneas de factura limpiada');
  }
}

// Crear instancia singleton
export const lineasFacturasService = new LineasFacturasService();

// Exportación por defecto
export default lineasFacturasService;