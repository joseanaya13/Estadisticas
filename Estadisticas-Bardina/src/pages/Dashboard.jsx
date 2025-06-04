// src/pages/Dashboard.jsx - Versión Corregida con Filtros Funcionales
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// Componentes actualizados con nuevas rutas
import { ChartContainer, DataCard, LoadingSpinner, ErrorMessage, FilterBar } from '../components/common';
import { formatCurrency, obtenerNombreMes, parseFechaRobusta, formatDate } from '../utils/formatters';

// Servicios y hooks actualizados
import { dashboardService } from '../services/core/dashboardService';
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

  // Función para validar datos
  const validarDatos = (datos) => {
    if (!datos) return false;
    if (typeof datos !== 'object') return false;
    return true;
  };

  // Función para obtener años disponibles con validación robusta
  const añosDisponibles = useMemo(() => {
    const años = new Set();
    
    // Procesar ventas
    if (initialVentasData?.fac_t && Array.isArray(initialVentasData.fac_t)) {
      initialVentasData.fac_t.forEach(item => {
        if (item && item.eje && item.eje > 0) {
          años.add(item.eje);
        }
        // También intentar extraer año de la fecha si eje no es válido
        if (item && item.fch && (!item.eje || item.eje <= 0)) {
          const fecha = parseFechaRobusta(item.fch);
          if (fecha) {
            const año = fecha.getFullYear();
            if (año >= 2020 && año <= 2030) { // Rango razonable
              años.add(año);
            }
          }
        }
      });
    }

    // Procesar compras
    if (initialComprasData?.com_alb_g && Array.isArray(initialComprasData.com_alb_g)) {
      initialComprasData.com_alb_g.forEach(item => {
        if (item && item.eje && item.eje > 0) {
          años.add(item.eje);
        }
        // También intentar extraer año de la fecha si eje no es válido
        if (item && item.fch && (!item.eje || item.eje <= 0)) {
          const fecha = parseFechaRobusta(item.fch);
          if (fecha) {
            const año = fecha.getFullYear();
            if (año >= 2020 && año <= 2030) { // Rango razonable
              años.add(año);
            }
          }
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
        if (item && item.mes && item.mes >= 1 && item.mes <= 12) {
          meses.add(item.mes);
        }
        // También intentar extraer mes de la fecha
        if (item && item.fch && (!item.mes || item.mes <= 0 || item.mes > 12)) {
          const fecha = parseFechaRobusta(item.fch);
          if (fecha) {
            const mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11
            if (mes >= 1 && mes <= 12) {
              meses.add(mes);
            }
          }
        }
      });
    }

    // Procesar compras
    if (initialComprasData?.com_alb_g && Array.isArray(initialComprasData.com_alb_g)) {
      initialComprasData.com_alb_g.forEach(item => {
        if (item && item.mes && item.mes >= 1 && item.mes <= 12) {
          meses.add(item.mes);
        }
        // También intentar extraer mes de la fecha
        if (item && item.fch && (!item.mes || item.mes <= 0 || item.mes > 12)) {
          const fecha = parseFechaRobusta(item.fch);
          if (fecha) {
            const mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11
            if (mes >= 1 && mes <= 12) {
              meses.add(mes);
            }
          }
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

  // Función para obtener año y mes de un item con fallback a fecha
  const obtenerAñoMes = (item) => {
    let año = item.eje;
    let mes = item.mes;

    // Si año o mes no son válidos, extraer de la fecha
    if (!año || año <= 0 || !mes || mes <= 0 || mes > 12) {
      const fecha = parseFechaRobusta(item.fch);
      if (fecha) {
        if (!año || año <= 0) {
          año = fecha.getFullYear();
        }
        if (!mes || mes <= 0 || mes > 12) {
          mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11
        }
      }
    }

    return { año, mes };
  };

  // Función mejorada para filtrar datos
  const filtrarDatos = (datos, esFacTt = true) => {
    if (!datos || !Array.isArray(datos)) return [];

    return datos.filter(item => {
      if (!validarDatos(item)) return false;

      const { año, mes } = obtenerAñoMes(item);

      // Filtro por año
      if (filtros.selectedYear !== 'todos') {
        const añoFiltro = parseInt(filtros.selectedYear);
        if (año !== añoFiltro) return false;
      }

      // Filtro por mes
      if (filtros.selectedMonth !== 'todos') {
        const mesFiltro = parseInt(filtros.selectedMonth);
        if (mes !== mesFiltro) return false;
      }

      // Filtro por rango de fechas
      if (filtros.dateFrom || filtros.dateTo) {
        const fechaItem = parseFechaRobusta(item.fch);
        if (!fechaItem) return false;

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

      return true;
    });
  };

  // Función mejorada para procesar datos del dashboard
  const processDashboardData = (ventasFiltradas, comprasFiltradas) => {
    // Calcular totales con validación
    const ventasTotales = ventasFiltradas.reduce((sum, v) => {
      const total = parseFloat(v.tot) || 0;
      return sum + total;
    }, 0);

    const comprasTotales = comprasFiltradas.reduce((sum, c) => {
      const total = parseFloat(c.tot_alb) || 0;
      return sum + total;
    }, 0);

    const balance = ventasTotales - comprasTotales;
    const margenBeneficio = ventasTotales > 0 ? ((balance / ventasTotales) * 100) : 0;

    // Agrupar por mes mejorado
    const datosPorMes = {};

    // Procesar ventas
    ventasFiltradas.forEach(venta => {
      const { año, mes } = obtenerAñoMes(venta);
      if (!año || !mes) return;

      const claveMes = `${año}-${String(mes).padStart(2, '0')}`;
      if (!datosPorMes[claveMes]) {
        datosPorMes[claveMes] = {
          periodo: claveMes,
          ventas: 0,
          compras: 0,
          balance: 0,
          mes: mes,
          año: año,
          cantidadVentas: 0,
          cantidadCompras: 0
        };
      }
      
      const total = parseFloat(venta.tot) || 0;
      datosPorMes[claveMes].ventas += total;
      datosPorMes[claveMes].cantidadVentas += 1;
    });

    // Procesar compras
    comprasFiltradas.forEach(compra => {
      const { año, mes } = obtenerAñoMes(compra);
      if (!año || !mes) return;

      const claveMes = `${año}-${String(mes).padStart(2, '0')}`;
      if (!datosPorMes[claveMes]) {
        datosPorMes[claveMes] = {
          periodo: claveMes,
          ventas: 0,
          compras: 0,
          balance: 0,
          mes: mes,
          año: año,
          cantidadVentas: 0,
          cantidadCompras: 0
        };
      }
      
      const total = parseFloat(compra.tot_alb) || 0;
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
        const ventasFiltradas = filtrarDatos(ventasArray, true);
        const comprasFiltradas = filtrarDatos(comprasArray, false);

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
