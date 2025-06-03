// src/pages/Dashboard.jsx - Versión actualizada con nueva estructura
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// Componentes actualizados con nuevas rutas
import { ChartContainer, DataCard, LoadingSpinner, ErrorMessage, FilterBar } from '../components/common';
import { formatCurrency, obtenerNombreMes } from '../utils/formatters';

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
  
  // Usar el nuevo sistema de filtros
  const { filters, updateFilter, resetFilters, hasActiveFilters } = useFilters();
  const { showNotification } = useNotifications();
  const { nameMaps } = useAppStore();
  
  // Debug: Verificar tipos de datos al cargar
  useEffect(() => {
    if (APP_CONFIG.features.debugging) {
      if (initialVentasData && initialVentasData.fac_t.length > 0) {
        console.log('🔍 Dashboard - Datos de ventas:', {
          primerRegistro: initialVentasData.fac_t[0],
          tipoMes: typeof initialVentasData.fac_t[0].mes,
          valorMes: initialVentasData.fac_t[0].mes,
          totalRegistros: initialVentasData.fac_t.length
        });
      }
      if (initialComprasData && initialComprasData.com_alb_g.length > 0) {
        console.log('🔍 Dashboard - Datos de compras:', {
          primerRegistro: initialComprasData.com_alb_g[0],
          tipoMes: typeof initialComprasData.com_alb_g[0].mes,
          valorMes: initialComprasData.com_alb_g[0].mes,
          totalRegistros: initialComprasData.com_alb_g.length
        });
      }
    }
  }, [initialVentasData, initialComprasData]);
  
  // Obtener años únicos de los datos usando el nuevo sistema
  const añosDisponibles = useMemo(() => {
    if (!initialVentasData || !initialComprasData) return [];
    
    const años = new Set();
    
    // Extraer años de las facturas
    initialVentasData.fac_t?.forEach(item => {
      if (item.eje) años.add(item.eje);
    });
    
    // Extraer años de los albaranes
    initialComprasData.com_alb_g?.forEach(item => {
      if (item.eje) años.add(item.eje);
    });
    
    return Array.from(años).sort((a, b) => b - a).map(año => ({
      value: año.toString(),
      label: año.toString()
    }));
  }, [initialVentasData, initialComprasData]);
  
  // Configuración de filtros usando el nuevo sistema
  const filterConfig = [
    {
      id: 'selectedYear',
      label: 'Año',
      type: 'select',
      value: filters.selectedYear,
      options: [
        { value: 'todos', label: 'Todos los años' },
        ...añosDisponibles
      ]
    },
    {
      id: 'selectedMonth',
      label: 'Mes',
      type: 'select',
      value: filters.selectedMonth,
      options: [
        { value: 'todos', label: 'Todos los meses' },
        { value: '1', label: 'Enero' },
        { value: '2', label: 'Febrero' },
        { value: '3', label: 'Marzo' },
        { value: '4', label: 'Abril' },
        { value: '5', label: 'Mayo' },
        { value: '6', label: 'Junio' },
        { value: '7', label: 'Julio' },
        { value: '8', label: 'Agosto' },
        { value: '9', label: 'Septiembre' },
        { value: '10', label: 'Octubre' },
        { value: '11', label: 'Noviembre' },
        { value: '12', label: 'Diciembre' }
      ]
    },
    {
      id: 'dateRange.from',
      label: 'Desde',
      type: 'date',
      value: filters.dateRange.from || ''
    },
    {
      id: 'dateRange.to',
      label: 'Hasta',
      type: 'date',
      value: filters.dateRange.to || ''
    }
  ];
  
  // Aplicar filtros usando el servicio de dashboard
  const applyFilters = async (ventasData, comprasData) => {
    if (!ventasData || !comprasData) return null;
    
    try {
      setLoading(true);
      
      // Usar el servicio de dashboard para procesar datos con filtros
      const filteredData = await dashboardService.procesarDatosExistentes(
        ventasData, 
        comprasData, 
        {
          año: filters.selectedYear !== 'todos' ? filters.selectedYear : null,
          mes: filters.selectedMonth !== 'todos' ? filters.selectedMonth : null,
          fechaDesde: filters.dateRange.from,
          fechaHasta: filters.dateRange.to
        }
      );
      
      return filteredData;
    } catch (err) {
      console.error("Error al aplicar filtros en dashboard:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!initialVentasData || !initialComprasData) return;
      
      try {
        setLoading(true);
        
        if (APP_CONFIG.features.debugging) {
          console.log('🔍 Dashboard - Filtros actuales:', filters);
        }
        
        // Usar el servicio de dashboard mejorado
        const processedData = await applyFilters(initialVentasData, initialComprasData);
        
        if (processedData) {
          setDashboardData(processedData);
          
          if (APP_CONFIG.features.debugging) {
            console.log('🔍 Dashboard - Datos procesados:', processedData);
          }
        }
      } catch (err) {
        console.error("❌ Error al procesar datos del dashboard:", err);
        setError(err.message || "Error al procesar los datos");
        showNotification(`Error en dashboard: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [initialVentasData, initialComprasData, filters]);
  
  // Datos para gráfico de pie usando las nuevas constantes
  const datosPie = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      { 
        name: 'Ventas', 
        value: dashboardData.ventasTotales,
        color: COLORS[0]
      },
      { 
        name: 'Compras', 
        value: dashboardData.comprasTotales,
        color: COLORS[1]
      }
    ];
  }, [dashboardData]);
  
  // Manejar cambios en los filtros con el nuevo sistema
  const handleFilterChange = (id, value) => {
    if (APP_CONFIG.features.debugging) {
      console.log(`🔧 Dashboard - Cambiando filtro ${id} a:`, value, `(tipo: ${typeof value})`);
    }
    
    // Manejar filtros anidados como dateRange.from
    if (id.includes('.')) {
      const [parent, child] = id.split('.');
      updateFilter(parent, {
        ...filters[parent],
        [child]: value
      });
    } else {
      updateFilter(id, value);
    }
  };
  
  // Resetear filtros con notificación
  const handleResetFilters = () => {
    resetFilters();
    showNotification('Filtros reiniciados', 'info');
  };
  
  // Estados de carga y error mejorados
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
  
  if (!dashboardData) {
    return <LoadingSpinner text="Cargando dashboard..." />;
  }

  return (
    <div className="dashboard">
      {/* Filtros con el nuevo componente */}
      <FilterBar 
        filters={filterConfig} 
        onChange={handleFilterChange} 
        onReset={handleResetFilters}
      />
      
      {/* Indicador de filtros activos */}
      {hasActiveFilters && (
        <div className="filtros-activos-info">
          <i className="fas fa-info-circle"></i>
          <span>Filtros aplicados - Los datos pueden no representar la totalidad</span>
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
        <DataCard 
          title="Balance" 
          value={dashboardData.balance} 
          format="currency" 
          icon="balance-scale"
          type={dashboardData.balance >= 0 ? "positive" : "negative"}
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
        
      </div>

      {/* Contenedor de gráficos */}
      <div className="charts-container">
        <ChartContainer title="Ventas vs Compras por Mes" height={APP_CONFIG.ui.charts.defaultHeight}>
          <ResponsiveContainer width="100%" height={APP_CONFIG.ui.charts.defaultHeight}>
            <BarChart data={dashboardData.datosPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombreMes" />
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
            <LineChart data={dashboardData.datosPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombreMes" />
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
      </div>

      {/* Alertas del dashboard */}
      {dashboardData.alertas && dashboardData.alertas.length > 0 && (
        <div className="dashboard-alerts">
          <h3>
            <i className="fas fa-exclamation-triangle"></i>
            Alertas de Negocio
          </h3>
          {dashboardData.alertas.map((alerta, index) => (
            <div key={index} className={`alert alert-${alerta.tipo}`}>
              <strong>{alerta.titulo}</strong>
              <p>{alerta.mensaje}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
