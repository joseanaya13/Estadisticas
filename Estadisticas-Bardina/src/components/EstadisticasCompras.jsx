// components/EstadisticasCompras.jsx - Importaciones corregidas
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
import { formatCurrency, obtenerNombreMes } from '../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const EstadisticasCompras = ({ data }) => {
  const [filtros, setFiltros] = useState({
    mes: 'todos',
    proveedor: 'todos'
  });
  
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Opciones para el filtro de mes
  const opcionesMes = useMemo(() => {
    if (!data || !data.com_alb_g) return [];
    
    const meses = new Set();
    data.com_alb_g.forEach(item => {
      if (item.mes) {
        meses.add(item.mes);
      }
    });
    
    return [
      { value: 'todos', label: 'Todos los meses' },
      ...Array.from(meses)
        .sort((a, b) => a - b)
        .map(mes => ({
          value: mes.toString(),
          label: obtenerNombreMes(mes)
        }))
    ];
  }, [data]);
  
  // Opciones para el filtro de proveedor
  const opcionesProveedor = useMemo(() => {
    if (!data || !data.com_alb_g) return [];
    
    const proveedores = new Set();
    data.com_alb_g.forEach(item => {
      if (item.prv) {
        proveedores.add(item.prv);
      }
    });
    
    return [
      { value: 'todos', label: 'Todos los proveedores' },
      ...Array.from(proveedores)
        .sort((a, b) => a - b)
        .map(proveedor => ({
          value: proveedor.toString(),
          label: `Proveedor ${proveedor}`
        }))
    ];
  }, [data]);
  
  // Configuración de filtros
  const filterConfig = [
    {
      id: 'mes',
      label: 'Mes',
      type: 'select',
      value: filtros.mes,
      options: opcionesMes
    },
    {
      id: 'proveedor',
      label: 'Proveedor',
      type: 'select',
      value: filtros.proveedor,
      options: opcionesProveedor
    }
  ];
  
  // Aplicar filtros a los datos
  useEffect(() => {
    if (!data || !data.com_alb_g) return;
    
    setLoading(true);
    
    try {
      let filtered = [...data.com_alb_g];
      
      if (filtros.mes !== 'todos') {
        filtered = filtered.filter(item => item.mes === parseInt(filtros.mes));
      }
      
      if (filtros.proveedor !== 'todos') {
        filtered = filtered.filter(item => item.prv === parseInt(filtros.proveedor));
      }
      
      setFilteredData(filtered);
    } catch (err) {
      console.error("Error al filtrar datos:", err);
      setError(err.message || "Error al filtrar los datos");
    } finally {
      setLoading(false);
    }
  }, [data, filtros]);
  
  // Calcular compras por mes
  const comprasPorMes = useMemo(() => {
    if (!filteredData.length) return [];
    
    const meses = {};
    filteredData.forEach(item => {
      const mes = item.mes;
      if (mes) {
        meses[mes] = (meses[mes] || 0) + (item.tot_alb || 0);
      }
    });
    
    return Object.entries(meses)
      .map(([mes, total]) => ({
        mes: parseInt(mes),
        nombreMes: obtenerNombreMes(parseInt(mes)),
        total
      }))
      .sort((a, b) => a.mes - b.mes);
  }, [filteredData]);
  
  // Calcular compras por proveedor
  const comprasPorProveedor = useMemo(() => {
    if (!filteredData.length) return [];
    
    const proveedores = {};
    filteredData.forEach(item => {
      const proveedor = item.prv;
      if (proveedor) {
        proveedores[proveedor] = (proveedores[proveedor] || 0) + (item.tot_alb || 0);
      }
    });
    
    return Object.entries(proveedores)
      .map(([proveedor, total]) => ({
        proveedor: parseInt(proveedor),
        nombreProveedor: `Proveedor ${proveedor}`,
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5 proveedores
  }, [filteredData]);
  
  // Calcular compras por serie
  const comprasPorSerie = useMemo(() => {
    if (!filteredData.length) return [];
    
    const series = {};
    filteredData.forEach(item => {
      const serie = item.ser;
      if (serie !== undefined) {
        series[serie] = (series[serie] || 0) + (item.tot_alb || 0);
      }
    });
    
    return Object.entries(series).map(([serie, total]) => ({
      serie: parseInt(serie),
      nombreSerie: `Serie ${serie}`,
      total
    }));
  }, [filteredData]);
  
  // Calcular totales
  const totales = useMemo(() => {
    if (!filteredData.length) return { total: 0, cantidad: 0, promedio: 0 };
    
    const total = filteredData.reduce((sum, item) => sum + (item.tot_alb || 0), 0);
    const cantidad = filteredData.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;
    
    return { total, cantidad, promedio };
  }, [filteredData]);
  
  // Manejar cambios en los filtros
  const handleFilterChange = (id, value) => {
    setFiltros(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Resetear filtros
  const handleResetFilters = () => {
    setFiltros({
      mes: 'todos',
      proveedor: 'todos'
    });
  };
  
  if (!data || !data.com_alb_g) {
    return <LoadingSpinner text="Cargando datos de compras..." />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="estadisticas-container">
      <FilterBar 
        filters={filterConfig} 
        onChange={handleFilterChange} 
        onReset={handleResetFilters}
      />

      <div className="summary-cards">
        <DataCard 
          title="Total Compras" 
          value={totales.total} 
          format="currency" 
          icon="truck"
          type="primary"
        />
        <DataCard 
          title="Cantidad de Albaranes" 
          value={totales.cantidad} 
          format="number" 
          icon="file-invoice"
          type="secondary"
        />
        <DataCard 
          title="Promedio por Albarán" 
          value={totales.promedio} 
          format="currency" 
          icon="calculator"
          type="primary"
        />
      </div>

      <div className="charts-container">
        <ChartContainer title="Compras por Mes">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comprasPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombreMes" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="total" fill="#FF8042" name="Compras" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Top 5 Proveedores">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comprasPorProveedor} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nombreProveedor" type="category" width={100} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="total" fill="#FFBB28" name="Compras" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Compras por Serie">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={comprasPorSerie}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="total"
                nameKey="nombreSerie"
                label={({ nombreSerie, percent }) => `${nombreSerie}: ${(percent * 100).toFixed(0)}%`}
              >
                {comprasPorSerie.map((entry, index) => (
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

export default EstadisticasCompras;