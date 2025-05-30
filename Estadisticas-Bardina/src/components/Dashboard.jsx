// components/Dashboard.jsx - Con importaciones corregidas
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import ChartContainer from './ChartContainer';
import DataCard from './DataCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import FilterBar from './FilterBar';
import { formatCurrency, obtenerNombreMes, formatDateRange } from '../utils/formatters';
import { dashboardService } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = ({ ventasData: initialVentasData, comprasData: initialComprasData }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  
  // Estados para los filtros
  const [filtros, setFiltros] = useState({
    año: 'todos', // Empezar con todos los años para ver todos los datos
    mes: 'todos',
    fechaDesde: '',
    fechaHasta: ''
  });
  
  // Debug: Verificar tipos de datos al cargar
  useEffect(() => {
    if (initialVentasData && initialVentasData.fac_t.length > 0) {
      console.log('Tipo de datos en ventas:', {
        primerRegistro: initialVentasData.fac_t[0],
        tipoMes: typeof initialVentasData.fac_t[0].mes,
        valorMes: initialVentasData.fac_t[0].mes
      });
    }
    if (initialComprasData && initialComprasData.com_alb_g.length > 0) {
      console.log('Tipo de datos en compras:', {
        primerRegistro: initialComprasData.com_alb_g[0],
        tipoMes: typeof initialComprasData.com_alb_g[0].mes,
        valorMes: initialComprasData.com_alb_g[0].mes
      });
    }
  }, [initialVentasData, initialComprasData]);
  
  // Obtener años únicos de los datos
  const añosDisponibles = useMemo(() => {
    if (!initialVentasData || !initialComprasData) return [];
    
    const años = new Set();
    
    // Extraer años de las facturas
    initialVentasData.fac_t.forEach(item => {
      if (item.eje) años.add(item.eje);
    });
    
    // Extraer años de los albaranes
    initialComprasData.com_alb_g.forEach(item => {
      if (item.eje) años.add(item.eje);
    });
    
    return Array.from(años).sort((a, b) => b - a).map(año => ({
      value: año.toString(),
      label: año.toString()
    }));
  }, [initialVentasData, initialComprasData]);
  
  // Configuración de filtros
  const filterConfig = [
    {
      id: 'año',
      label: 'Año',
      type: 'select',
      value: filtros.año,
      options: [
        { value: 'todos', label: 'Todos los años' },
        ...añosDisponibles
      ]
    },
    {
      id: 'mes',
      label: 'Mes',
      type: 'select',
      value: filtros.mes,
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
      id: 'fechaDesde',
      label: 'Desde',
      type: 'date',
      value: filtros.fechaDesde
    },
    {
      id: 'fechaHasta',
      label: 'Hasta',
      type: 'date',
      value: filtros.fechaHasta
    }
  ];
  
  // Aplicar filtros a los datos
  const applyFilters = (ventasData, comprasData) => {
    if (!ventasData || !comprasData) return null;
    
    let ventasFiltradas = [...ventasData.fac_t];
    let comprasFiltradas = [...comprasData.com_alb_g];
    
    // Filtrar por año
    if (filtros.año !== 'todos') {
      const año = parseInt(filtros.año);
      ventasFiltradas = ventasFiltradas.filter(item => item.eje === año);
      comprasFiltradas = comprasFiltradas.filter(item => item.eje === año);
    }
    
    // Filtrar por mes
    if (filtros.mes !== 'todos') {
      const mes = parseInt(filtros.mes);
      ventasFiltradas = ventasFiltradas.filter(item => {
        // Asegurarse de comparar números con números
        const itemMes = typeof item.mes === 'string' ? parseInt(item.mes) : item.mes;
        return itemMes === mes;
      });
      comprasFiltradas = comprasFiltradas.filter(item => {
        // Asegurarse de comparar números con números
        const itemMes = typeof item.mes === 'string' ? parseInt(item.mes) : item.mes;
        return itemMes === mes;
      });
    }
    
    // Filtrar por rango de fechas
    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde);
      fechaDesde.setHours(0, 0, 0, 0); // Inicio del día
      
      ventasFiltradas = ventasFiltradas.filter(item => {
        if (!item.fch) return false;
        const fechaItem = new Date(item.fch);
        return fechaItem >= fechaDesde;
      });
      comprasFiltradas = comprasFiltradas.filter(item => {
        if (!item.fch) return false;
        const fechaItem = new Date(item.fch);
        return fechaItem >= fechaDesde;
      });
    }
    
    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999); // Fin del día
      
      ventasFiltradas = ventasFiltradas.filter(item => {
        if (!item.fch) return false;
        const fechaItem = new Date(item.fch);
        return fechaItem <= fechaHasta;
      });
      comprasFiltradas = comprasFiltradas.filter(item => {
        if (!item.fch) return false;
        const fechaItem = new Date(item.fch);
        return fechaItem <= fechaHasta;
      });
    }
    
    return {
      ventasData: { ...ventasData, fac_t: ventasFiltradas },
      comprasData: { ...comprasData, com_alb_g: comprasFiltradas }
    };
  };
  
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!initialVentasData || !initialComprasData) return;
      
      try {
        setLoading(true);
        
        // Debug: Ver qué filtros se están aplicando
        console.log('Filtros actuales:', filtros);
        
        // Aplicar filtros
        const filtered = applyFilters(initialVentasData, initialComprasData);
        if (!filtered) return;
        
        const { ventasData, comprasData } = filtered;
        
        // Debug: Ver cuántos registros quedaron después del filtro
        console.log(`Registros después de filtrar - Ventas: ${ventasData.fac_t.length}, Compras: ${comprasData.com_alb_g.length}`);
        
        // Si hay filtro de mes activo, verificar algunos registros
        if (filtros.mes !== 'todos') {
          console.log('Muestra de datos filtrados por mes:', {
            primerasVentas: ventasData.fac_t.slice(0, 3).map(v => ({ mes: v.mes, total: v.tot })),
            primerasCompras: comprasData.com_alb_g.slice(0, 3).map(c => ({ mes: c.mes, total: c.tot_alb }))
          });
        }
        
        // Calcular totales
        const ventasTotales = ventasData.fac_t.reduce((sum, item) => sum + (item.tot || 0), 0);
        const comprasTotales = comprasData.com_alb_g.reduce((sum, item) => sum + (item.tot_alb || 0), 0);
        const balance = ventasTotales - comprasTotales;
        
        // Calcular margen de beneficio
        const margenBeneficio = ventasTotales > 0 ? ((balance / ventasTotales) * 100) : 0;
        
        // Procesar datos por mes
        const mesesVentas = {};
        ventasData.fac_t.forEach(item => {
          const mes = item.mes;
          if (mes) {
            mesesVentas[mes] = (mesesVentas[mes] || 0) + (item.tot || 0);
          }
        });
        
        const mesesCompras = {};
        comprasData.com_alb_g.forEach(item => {
          const mes = item.mes;
          if (mes) {
            mesesCompras[mes] = (mesesCompras[mes] || 0) + (item.tot_alb || 0);
          }
        });
        
        // Combinar datos de ventas y compras por mes
        const mesesUnicos = new Set([
          ...Object.keys(mesesVentas).map(m => parseInt(m)),
          ...Object.keys(mesesCompras).map(m => parseInt(m))
        ]);
        
        const datosPorMes = Array.from(mesesUnicos).map(mes => {
          const ventasMes = mesesVentas[mes] || 0;
          const comprasMes = mesesCompras[mes] || 0;
          return {
            mes,
            ventas: ventasMes,
            compras: comprasMes,
            balance: ventasMes - comprasMes,
            nombreMes: obtenerNombreMes(mes)
          };
        }).sort((a, b) => a.mes - b.mes);
        
        // Calcular tendencias (comparación con período anterior si hay datos suficientes)
        const tendenciaVentas = calcularTendencia(datosPorMes.map(d => d.ventas));
        const tendenciaCompras = calcularTendencia(datosPorMes.map(d => d.compras));
        
        setDashboardData({
          ventasTotales,
          comprasTotales,
          balance,
          margenBeneficio,
          datosPorMes,
          totalFacturas: ventasData.fac_t.length,
          totalAlbaranes: comprasData.com_alb_g.length,
          tendenciaVentas,
          tendenciaCompras
        });
      } catch (err) {
        console.error("Error al procesar datos del dashboard:", err);
        setError(err.message || "Error al procesar los datos");
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [initialVentasData, initialComprasData, filtros]);
  
  // Función para calcular tendencia
  const calcularTendencia = (valores) => {
    if (valores.length < 2) return 0;
    const mitad = Math.floor(valores.length / 2);
    const primeraMitad = valores.slice(0, mitad).reduce((a, b) => a + b, 0) / mitad;
    const segundaMitad = valores.slice(mitad).reduce((a, b) => a + b, 0) / (valores.length - mitad);
    return ((segundaMitad - primeraMitad) / primeraMitad) * 100;
  };
  
  // Datos para gráfico de pie
  const datosPie = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      { name: 'Ventas', value: dashboardData.ventasTotales },
      { name: 'Compras', value: dashboardData.comprasTotales }
    ];
  }, [dashboardData]);
  
  // Manejar cambios en los filtros
  const handleFilterChange = (id, value) => {
    console.log(`Cambiando filtro ${id} a:`, value, `(tipo: ${typeof value})`);
    
    setFiltros(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Resetear filtros
  const handleResetFilters = () => {
    setFiltros({
      año: new Date().getFullYear().toString(),
      mes: 'todos',
      fechaDesde: '',
      fechaHasta: '',
      empresa: 'todas'
    });
  };
  
  if (loading) {
    return <LoadingSpinner text="Procesando datos del dashboard..." />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  if (!dashboardData) {
    return <LoadingSpinner text="Cargando dashboard..." />;
  }

  return (
    <div className="dashboard">
      <FilterBar 
        filters={filterConfig} 
        onChange={handleFilterChange} 
        onReset={handleResetFilters}
      />
      
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
          <i className={`fas fa-arrow-${dashboardData.tendenciaVentas >= 0 ? 'up' : 'down'}`}></i>
          <span>Tendencia Ventas: {dashboardData.tendenciaVentas.toFixed(1)}%</span>
        </div>
        <div className="stat-item">
          <i className={`fas fa-arrow-${dashboardData.tendenciaCompras >= 0 ? 'up' : 'down'}`}></i>
          <span>Tendencia Compras: {dashboardData.tendenciaCompras.toFixed(1)}%</span>
        </div>
      </div>

      <div className="charts-container">
        <ChartContainer title="Ventas vs Compras por Mes">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.datosPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombreMes" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="ventas" fill="#0088FE" name="Ventas" />
              <Bar dataKey="compras" fill="#00C49F" name="Compras" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Balance Mensual">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.datosPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombreMes" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }}
                name="Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Distribución de Ingresos y Gastos">
          <ResponsiveContainer width="100%" height={300}>
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default Dashboard;
