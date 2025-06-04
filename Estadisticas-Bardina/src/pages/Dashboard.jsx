// src/pages/Dashboard.jsx - Versión con filtros corregidos
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// Componentes actualizados con nuevas rutas
import { ChartContainer, DataCard, LoadingSpinner, ErrorMessage, FilterBar } from '../components/common';
import { formatCurrency, obtenerNombreMes, parseFechaRobusta, formatDate, normalizeNumber, normalizeYear, normalizeMonth } from '../utils/formatters';

// Servicios y hooks actualizados
import { useNotifications, useFilters } from '../hooks';
import useAppStore from '../stores/useAppStore';

// Configuración centralizada
import { APP_CONFIG, CONSTANTS } from '../config/app.config';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = ({ ventasData: initialVentasData, comprasData: initialComprasData }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados locales para filtros (más confiable que el store para esta página)
  const [filtros, setFiltros] = useState({
    selectedYear: 'todos',
    selectedMonth: 'todos',
    dateFrom: '',
    dateTo: ''
  });

  const { showNotification } = useNotifications();

  // Debug mejorado
  useEffect(() => {
    if (APP_CONFIG.features.debugging) {
      console.log('🔍 Dashboard - Datos recibidos:', {
        ventas: initialVentasData ? {
          count: initialVentasData.count,
          registros: initialVentasData.fac_t?.length || 0,
          primerRegistro: initialVentasData.fac_t?.[0]
        } : null,
        compras: initialComprasData ? {
          count: initialComprasData.count,
          registros: initialComprasData.com_alb_g?.length || 0,
          primerRegistro: initialComprasData.com_alb_g?.[0]
        } : null
      });
    }
  }, [initialVentasData, initialComprasData]);

  // Función mejorada para validar y normalizar datos
  const validarYNormalizarItem = (item) => {
    if (!item || typeof item !== 'object') return null;

    // Normalizar campos críticos
    const itemNormalizado = {
      ...item,
      // Normalizar año (eje)
      eje: item.eje !== undefined && item.eje !== null ?
        normalizeYear(item.eje) : null,
      // Normalizar mes
      mes: item.mes !== undefined && item.mes !== null ?
        normalizeMonth(item.mes) : null,
      // Normalizar totales
      tot: normalizeNumber(item.tot, 0),
      tot_alb: normalizeNumber(item.tot_alb, 0)
    };

    // Si no tenemos año o mes válidos, intentar extraer de la fecha
    if ((!itemNormalizado.eje || !itemNormalizado.mes) && item.fch) {
      const fecha = parseFechaRobusta(item.fch);
      if (fecha) {
        if (!itemNormalizado.eje || itemNormalizado.eje < 2000) {
          itemNormalizado.eje = fecha.getFullYear();
        }
        if (!itemNormalizado.mes || itemNormalizado.mes < 1 || itemNormalizado.mes > 12) {
          itemNormalizado.mes = fecha.getMonth() + 1;
        }
      }
    }

    // Validar que tenemos los datos mínimos necesarios
    if (!itemNormalizado.eje || itemNormalizado.eje < 2000 || itemNormalizado.eje > 2050) {
      console.warn('❌ Item sin año válido:', item);
      return null;
    }

    if (!itemNormalizado.mes || itemNormalizado.mes < 1 || itemNormalizado.mes > 12) {
      console.warn('❌ Item sin mes válido:', item);
      return null;
    }

    return itemNormalizado;
  };

  // Función para obtener años disponibles con validación robusta
  const añosDisponibles = useMemo(() => {
    const años = new Set();

    // Procesar ventas
    if (initialVentasData?.fac_t && Array.isArray(initialVentasData.fac_t)) {
      initialVentasData.fac_t.forEach(item => {
        const itemNormalizado = validarYNormalizarItem(item);
        if (itemNormalizado?.eje) {
          años.add(itemNormalizado.eje);
        }
      });
    }

    // Procesar compras
    if (initialComprasData?.com_alb_g && Array.isArray(initialComprasData.com_alb_g)) {
      initialComprasData.com_alb_g.forEach(item => {
        const itemNormalizado = validarYNormalizarItem(item);
        if (itemNormalizado?.eje) {
          años.add(itemNormalizado.eje);
        }
      });
    }

    // Si no hay años válidos, usar el año actual
    if (años.size === 0) {
      años.add(new Date().getFullYear());
    }

    const añosArray = Array.from(años).sort((a, b) => b - a);

    if (APP_CONFIG.features.debugging) {
      console.log('🔍 Dashboard - Años disponibles:', añosArray);
    }

    return añosArray.map(año => ({
      value: año.toString(),
      label: año.toString()
    }));
  }, [initialVentasData, initialComprasData]);

  // Función para obtener meses disponibles con validación
  const mesesDisponibles = useMemo(() => {
    const meses = new Set();

    // Procesar ventas
    if (initialVentasData?.fac_t && Array.isArray(initialVentasData.fac_t)) {
      initialVentasData.fac_t.forEach(item => {
        const itemNormalizado = validarYNormalizarItem(item);
        if (itemNormalizado?.mes) {
          meses.add(itemNormalizado.mes);
        }
      });
    }

    // Procesar compras
    if (initialComprasData?.com_alb_g && Array.isArray(initialComprasData.com_alb_g)) {
      initialComprasData.com_alb_g.forEach(item => {
        const itemNormalizado = validarYNormalizarItem(item);
        if (itemNormalizado?.mes) {
          meses.add(itemNormalizado.mes);
        }
      });
    }

    return Array.from(meses).sort((a, b) => a - b);
  }, [initialVentasData, initialComprasData]);

  // Configuración de filtros mejorada
  const filterConfig = [
    {
      id: 'selectedYear',
      label: 'Año',
      type: 'select',
      value: filtros.selectedYear,
      options: [
        { value: 'todos', label: 'Todos los años' },
        ...añosDisponibles
      ]
    },
    {
      id: 'selectedMonth',
      label: 'Mes',
      type: 'select',
      value: filtros.selectedMonth,
      options: [
        { value: 'todos', label: 'Todos los meses' },
        ...mesesDisponibles.map(mes => ({
          value: mes.toString(),
          label: obtenerNombreMes(mes)
        }))
      ]
    },
    {
      id: 'dateFrom',
      label: 'Desde',
      type: 'date',
      value: filtros.dateFrom
    },
    {
      id: 'dateTo',
      label: 'Hasta',
      type: 'date',
      value: filtros.dateTo
    }
  ];

  // Función mejorada para filtrar datos
  const filtrarDatos = (datosOriginales, tipoData = 'fac_t') => {
    if (!datosOriginales || !Array.isArray(datosOriginales)) {
      console.warn(`❌ Datos no válidos para filtrar: ${tipoData}`);
      return [];
    }

    const datosNormalizados = datosOriginales
      .map(item => validarYNormalizarItem(item))
      .filter(item => item !== null);

    if (APP_CONFIG.features.debugging) {
      console.log(`🔍 Dashboard - Datos normalizados ${tipoData}:`, {
        originales: datosOriginales.length,
        normalizados: datosNormalizados.length,
        ejemploNormalizado: datosNormalizados[0]
      });
    }

    const datosFiltrados = datosNormalizados.filter(item => {
      // Filtro por año
      if (filtros.selectedYear !== 'todos') {
        const añoFiltro = parseInt(filtros.selectedYear);
        if (item.eje !== añoFiltro) {
          return false;
        }
      }

      // Filtro por mes
      if (filtros.selectedMonth !== 'todos') {
        const mesFiltro = parseInt(filtros.selectedMonth);
        if (item.mes !== mesFiltro) {
          return false;
        }
      }

      // Filtro por rango de fechas
      if (filtros.dateFrom || filtros.dateTo) {
        const fechaItem = parseFechaRobusta(item.fch);
        if (!fechaItem) {
          // Si no hay fecha válida, usar año/mes para crear una fecha aproximada
          const fechaAproximada = new Date(item.eje, item.mes - 1, 15); // Día 15 del mes
          if (!isNaN(fechaAproximada.getTime())) {
            // Usar fecha aproximada para el filtrado
            if (filtros.dateFrom) {
              const fechaDesde = new Date(filtros.dateFrom);
              fechaDesde.setHours(0, 0, 0, 0);
              if (fechaAproximada < fechaDesde) return false;
            }

            if (filtros.dateTo) {
              const fechaHasta = new Date(filtros.dateTo);
              fechaHasta.setHours(23, 59, 59, 999);
              if (fechaAproximada > fechaHasta) return false;
            }
          } else {
            return false; // Si no podemos crear fecha, excluir el item
          }
        } else {
          // Usar fecha real
          if (filtros.dateFrom) {
            const fechaDesde = new Date(filtros.dateFrom);
            fechaDesde.setHours(0, 0, 0, 0);
            if (fechaItem < fechaDesde) return false;
          }

          if (filtros.dateTo) {
            const fechaHasta = new Date(filtros.dateTo);
            fechaHasta.setHours(23, 59, 59, 999);
            if (fechaItem > fechaHasta) return false;
          }
        }
      }

      return true;
    });

    if (APP_CONFIG.features.debugging) {
      console.log(`🔍 Dashboard - Después del filtrado ${tipoData}:`, {
        normalizados: datosNormalizados.length,
        filtrados: datosFiltrados.length,
        filtros: filtros
      });
    }

    return datosFiltrados;
  };

  // Función mejorada para procesar datos del dashboard
  const processDashboardData = (ventasFiltradas, comprasFiltradas) => {
    // Calcular totales con validación
    const ventasTotales = ventasFiltradas.reduce((sum, v) => {
      const total = v.tot || 0;
      return sum + total;
    }, 0);

    const comprasTotales = comprasFiltradas.reduce((sum, c) => {
      const total = c.tot_alb || 0;
      return sum + total;
    }, 0);

    const balance = ventasTotales - comprasTotales;
    const margenBeneficio = ventasTotales > 0 ? ((balance / ventasTotales) * 100) : 0;

    // Agrupar por mes mejorado
    const datosPorMes = {};

    // Procesar ventas
    ventasFiltradas.forEach(venta => {
      const claveMes = `${venta.eje}-${String(venta.mes).padStart(2, '0')}`;
      if (!datosPorMes[claveMes]) {
        datosPorMes[claveMes] = {
          periodo: claveMes,
          ventas: 0,
          compras: 0,
          balance: 0,
          mes: venta.mes,
          año: venta.eje,
          cantidadVentas: 0,
          cantidadCompras: 0
        };
      }

      const total = venta.tot || 0;
      datosPorMes[claveMes].ventas += total;
      datosPorMes[claveMes].cantidadVentas += 1;
    });

    // Procesar compras
    comprasFiltradas.forEach(compra => {
      const claveMes = `${compra.eje}-${String(compra.mes).padStart(2, '0')}`;
      if (!datosPorMes[claveMes]) {
        datosPorMes[claveMes] = {
          periodo: claveMes,
          ventas: 0,
          compras: 0,
          balance: 0,
          mes: compra.mes,
          año: compra.eje,
          cantidadVentas: 0,
          cantidadCompras: 0
        };
      }

      const total = compra.tot_alb || 0;
      datosPorMes[claveMes].compras += total;
      datosPorMes[claveMes].cantidadCompras += 1;
    });

    // Calcular balance y formatear
    const datosTemporales = Object.values(datosPorMes)
      .map(periodo => ({
        ...periodo,
        balance: periodo.ventas - periodo.compras,
        nombrePeriodo: obtenerNombreMes(periodo.mes) + ' ' + periodo.año
      }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));

    // Calcular tendencias mejoradas
    let tendencias = {
      tendenciaVentas: 0,
      tendenciaCompras: 0,
      tendenciaBalance: 0,
      variacionVentas: 0,
      variacionCompras: 0,
      variacionBalance: 0
    };

    if (datosTemporales.length >= 2) {
      const ultimo = datosTemporales[datosTemporales.length - 1];
      const penultimo = datosTemporales[datosTemporales.length - 2];

      tendencias.variacionVentas = penultimo.ventas > 0 ?
        ((ultimo.ventas - penultimo.ventas) / penultimo.ventas) * 100 : 0;
      tendencias.variacionCompras = penultimo.compras > 0 ?
        ((ultimo.compras - penultimo.compras) / penultimo.compras) * 100 : 0;
      tendencias.variacionBalance = penultimo.balance !== 0 ?
        ((ultimo.balance - penultimo.balance) / Math.abs(penultimo.balance)) * 100 : 0;
    }

    // Generar alertas mejoradas
    const alertas = [];

    if (ventasFiltradas.length === 0 && comprasFiltradas.length === 0) {
      alertas.push({
        tipo: 'warning',
        titulo: 'Sin Datos',
        mensaje: 'No hay datos que coincidan con los filtros aplicados'
      });
    }

    if (balance < 0) {
      alertas.push({
        tipo: 'warning',
        titulo: 'Balance Negativo',
        mensaje: `Las compras superan a las ventas en ${formatCurrency(Math.abs(balance))}`
      });
    }

    if (margenBeneficio < 10 && margenBeneficio > 0) {
      alertas.push({
        tipo: 'warning',
        titulo: 'Margen de Beneficio Bajo',
        mensaje: `El margen de beneficio es solo del ${margenBeneficio.toFixed(1)}%`
      });
    }

    if (tendencias.variacionVentas < -10) {
      alertas.push({
        tipo: 'error',
        titulo: 'Caída en Ventas',
        mensaje: `Las ventas han disminuido un ${Math.abs(tendencias.variacionVentas).toFixed(1)}%`
      });
    }

    if (ventasTotales > 0 && comprasTotales === 0) {
      alertas.push({
        tipo: 'info',
        titulo: 'Solo Ventas',
        mensaje: 'No hay datos de compras en el período seleccionado'
      });
    }

    if (comprasTotales > 0 && ventasTotales === 0) {
      alertas.push({
        tipo: 'info',
        titulo: 'Solo Compras',
        mensaje: 'No hay datos de ventas en el período seleccionado'
      });
    }

    return {
      ventasTotales,
      comprasTotales,
      balance,
      margenBeneficio,
      totalFacturas: ventasFiltradas.length,
      totalAlbaranes: comprasFiltradas.length,
      promedioFactura: ventasFiltradas.length > 0 ? ventasTotales / ventasFiltradas.length : 0,
      promedioAlbaran: comprasFiltradas.length > 0 ? comprasTotales / comprasFiltradas.length : 0,
      datosTemporales,
      tendencias,
      alertas,
      // Información adicional para debug
      debug: {
        ventasOriginales: initialVentasData?.fac_t?.length || 0,
        comprasOriginales: initialComprasData?.com_alb_g?.length || 0,
        ventasFiltradas: ventasFiltradas.length,
        comprasFiltradas: comprasFiltradas.length,
        periodosConDatos: datosTemporales.length
      }
    };
  };

  // Efecto principal para procesar datos
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validar que tenemos datos
        if (!initialVentasData || !initialComprasData) {
          if (APP_CONFIG.features.debugging) {
            console.log('🔍 Dashboard - Datos no disponibles aún');
          }
          return;
        }

        // Obtener datos seguros
        const ventasArray = initialVentasData.fac_t || [];
        const comprasArray = initialComprasData.com_alb_g || [];

        if (APP_CONFIG.features.debugging) {
          console.log('🔍 Dashboard - Procesando datos:', {
            ventasOriginales: ventasArray.length,
            comprasOriginales: comprasArray.length,
            filtros: filtros
          });
        }

        // Filtrar datos
        const ventasFiltradas = filtrarDatos(ventasArray, 'fac_t');
        const comprasFiltradas = filtrarDatos(comprasArray, 'com_alb_g');

        if (APP_CONFIG.features.debugging) {
          console.log('🔍 Dashboard - Después del filtrado:', {
            ventasFiltradas: ventasFiltradas.length,
            comprasFiltradas: comprasFiltradas.length
          });
        }

        // Procesar datos
        const processedData = processDashboardData(ventasFiltradas, comprasFiltradas);

        if (APP_CONFIG.features.debugging) {
          console.log('🔍 Dashboard - Datos procesados:', processedData);
        }

        setDashboardData(processedData);

      } catch (err) {
        console.error("❌ Error al procesar datos del dashboard:", err);
        setError(err.message || "Error al procesar los datos");
        if (showNotification) {
          showNotification(`Error en dashboard: ${err.message}`, 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [initialVentasData, initialComprasData, filtros]);

  // Datos para gráfico de pie con validación
  const datosPie = useMemo(() => {
    if (!dashboardData || (dashboardData.ventasTotales === 0 && dashboardData.comprasTotales === 0)) {
      return [];
    }

    const datos = [];

    if (dashboardData.ventasTotales > 0) {
      datos.push({
        name: 'Ventas',
        value: dashboardData.ventasTotales,
        color: COLORS[0]
      });
    }

    if (dashboardData.comprasTotales > 0) {
      datos.push({
        name: 'Compras',
        value: dashboardData.comprasTotales,
        color: COLORS[1]
      });
    }

    return datos;
  }, [dashboardData]);

  // Manejar cambios en los filtros
  const handleFilterChange = (id, value) => {
    if (APP_CONFIG.features.debugging) {
      console.log(`🔧 Dashboard - Cambiando filtro ${id} a:`, value);
    }

    setFiltros(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Resetear filtros
  const handleResetFilters = () => {
    setFiltros({
      selectedYear: 'todos',
      selectedMonth: 'todos',
      dateFrom: '',
      dateTo: ''
    });

    if (showNotification) {
      showNotification('Filtros reiniciados', 'info');
    }
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = filtros.selectedYear !== 'todos' ||
    filtros.selectedMonth !== 'todos' ||
    filtros.dateFrom ||
    filtros.dateTo;

  // Estados de carga y error
  if (loading) {
    return <LoadingSpinner text="Procesando datos del dashboard..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        retry={() => {
          setError(null);
          window.location.reload();
        }}
      />
    );
  }

  if (!initialVentasData || !initialComprasData) {
    return <LoadingSpinner text="Esperando datos del dashboard..." />;
  }

  if (!dashboardData) {
    return <LoadingSpinner text="Cargando dashboard..." />;
  }

  return (
    <div className="dashboard">
      {/* Filtros */}
      <FilterBar
        filters={filterConfig}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Indicador de filtros activos */}
      {hayFiltrosActivos && (
        <div className="filtros-activos-info">
          <i className="fas fa-info-circle"></i>
          <span>Filtros aplicados</span>
          {filtros.selectedYear !== 'todos' && <span>Año: {filtros.selectedYear}</span>}
          {filtros.selectedMonth !== 'todos' && <span>Mes: {obtenerNombreMes(parseInt(filtros.selectedMonth))}</span>}
          {filtros.dateFrom && <span>Desde: {filtros.dateFrom}</span>}
          {filtros.dateTo && <span>Hasta: {filtros.dateTo}</span>}
          <span className="filtros-count">
            ({dashboardData.totalFacturas} facturas, {dashboardData.totalAlbaranes} albaranes)
          </span>
        </div>
      )}

      {/* Debug info si está habilitado */}
      {APP_CONFIG.features.debugging && dashboardData.debug && (
        <div className="alert alert-info">
          <i className="fas fa-bug"></i>
          <div>
            <strong>Debug Info:</strong>
            <ul>
              <li>Ventas originales: {dashboardData.debug.ventasOriginales}</li>
              <li>Compras originales: {dashboardData.debug.comprasOriginales}</li>
              <li>Ventas filtradas: {dashboardData.debug.ventasFiltradas}</li>
              <li>Compras filtradas: {dashboardData.debug.comprasFiltradas}</li>
              <li>Períodos con datos: {dashboardData.debug.periodosConDatos}</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="summary-cards">
        <DataCard
          title="Total Ventas"
          value={dashboardData.ventasTotales}
          format="currency"
          icon="shopping-cart"
          type="primary"
        />
        <DataCard
          title="Total Compras"
          value={dashboardData.comprasTotales}
          format="currency"
          icon="truck"
          type="secondary"
        />
      </div>

      {/* Información estadística */}
      <div className="stats-info">
        <div className="stat-item">
          <i className="fas fa-file-invoice"></i>
          <span>Total Facturas: {dashboardData.totalFacturas}</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-file-alt"></i>
          <span>Total Albaranes: {dashboardData.totalAlbaranes}</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-percentage"></i>
          <span>Margen: {dashboardData.margenBeneficio.toFixed(1)}%</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-calculator"></i>
          <span>Promedio Factura: {formatCurrency(dashboardData.promedioFactura)}</span>
        </div>
      </div>

      {/* Contenedor de gráficos */}
      {dashboardData.datosTemporales.length > 0 ? (
        <div className="charts-container">
          <ChartContainer title="Ventas vs Compras por Mes" height={APP_CONFIG.ui.charts.defaultHeight}>
            <ResponsiveContainer width="100%" height={APP_CONFIG.ui.charts.defaultHeight}>
              <BarChart data={dashboardData.datosTemporales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="nombrePeriodo"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="ventas" fill={COLORS[0]} name="Ventas" />
                <Bar dataKey="compras" fill={COLORS[1]} name="Compras" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Balance Mensual" height={APP_CONFIG.ui.charts.defaultHeight}>
            <ResponsiveContainer width="100%" height={APP_CONFIG.ui.charts.defaultHeight}>
              <LineChart data={dashboardData.datosTemporales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="nombrePeriodo"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={COLORS[4]}
                  activeDot={{ r: 8 }}
                  name="Balance"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          {datosPie.length > 0 && (
            <ChartContainer title="Distribución de Ingresos y Gastos" height={APP_CONFIG.ui.charts.defaultHeight}>
              <ResponsiveContainer width="100%" height={APP_CONFIG.ui.charts.defaultHeight}>
                <PieChart>
                  <Pie
                    data={datosPie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {datosPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      ) : (
        <div className="no-data-message">
          <i className="fas fa-chart-bar"></i>
          <h3>Sin datos para mostrar</h3>
          <p>No hay datos que coincidan con los filtros aplicados. Intenta ajustar los filtros o verificar que hay datos disponibles.</p>
        </div>
      )}

      {/* Alertas del dashboard */}
      {dashboardData.alertas && dashboardData.alertas.length > 0 && (
        <div className="dashboard-alerts">
          <h3>
            <i className="fas fa-exclamation-triangle"></i>
            Alertas de Negocio
          </h3>
          {dashboardData.alertas.map((alerta, index) => (
            <div key={index} className={`alert alert-${alerta.tipo}`}>
              <i className={`fas fa-${alerta.tipo === 'error' ? 'times-circle' :
                alerta.tipo === 'warning' ? 'exclamation-triangle' :
                  alerta.tipo === 'success' ? 'check-circle' :
                    'info-circle'}`}></i>
              <div>
                <strong>{alerta.titulo}</strong>
                <p>{alerta.mensaje}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
