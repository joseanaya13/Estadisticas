// components/EstadisticasVentas.jsx - Sin filtro de clientes ni tabla
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { ChartContainer, DataCard, LoadingSpinner, ErrorMessage, FilterBar } from './index';
import { formatCurrency, formatDate, obtenerNombreMes } from '../utils/formatters';
import { ventasService, empresasService } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const EstadisticasVentas = ({ data }) => {
  const [filtros, setFiltros] = useState({
    año: 'todos',
    mes: 'todos',
    tienda: 'todas',
    fechaDesde: '',
    fechaHasta: ''
  });
  
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  
  // Cargar empresas al montar el componente
  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        setLoadingEmpresas(true);
        const empresasData = await empresasService.getEmpresas();
        setEmpresas(empresasData.emp_m || []);
        
        console.log('Empresas cargadas:', empresasData.emp_m?.length || 0);
      } catch (err) {
        console.error('Error al cargar empresas:', err);
        setError(err.message || 'Error al cargar empresas');
      } finally {
        setLoadingEmpresas(false);
      }
    };
    
    loadEmpresas();
  }, []);
  
  // Debug: Verificar tipos de datos al cargar
  useEffect(() => {
    if (data && data.fac_t.length > 0) {
      console.log('Tipo de datos en ventas:', {
        primerRegistro: data.fac_t[0],
        tipoMes: typeof data.fac_t[0].mes,
        valorMes: data.fac_t[0].mes,
        tipoAño: typeof data.fac_t[0].eje,
        valorAño: data.fac_t[0].eje
      });
    }
  }, [data]);
  
  // Obtener años únicos de los datos
  const añosDisponibles = useMemo(() => {
    if (!data || !data.fac_t) return [];
    
    const años = new Set();
    data.fac_t.forEach(item => {
      if (item.eje) años.add(item.eje);
    });
    
    return Array.from(años).sort((a, b) => b - a).map(año => ({
      value: año.toString(),
      label: año.toString()
    }));
  }, [data]);
  
  // Opciones para el filtro de mes
  const opcionesMes = useMemo(() => {
    if (!data || !data.fac_t) return [];
    
    const meses = new Set();
    data.fac_t.forEach(item => {
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
  
  // Opciones para el filtro de tienda/división
  const opcionesTienda = useMemo(() => {
    if (!empresas.length) return [{ value: 'todas', label: 'Cargando tiendas...' }];
    
    const tiendas = empresas.filter(emp => !emp.es_emp || emp.es_emp === false);
    const empresasPrincipales = empresas.filter(emp => emp.es_emp === true);
    
    const opciones = [{ value: 'todas', label: 'Todas las tiendas' }];
    
    empresasPrincipales.forEach(emp => {
      opciones.push({
        value: `emp_${emp.id}`,
        label: `🏢 ${emp.name}`
      });
    });
    
    tiendas.forEach(tienda => {
      opciones.push({
        value: `div_${tienda.id}`,
        label: `🏪 ${tienda.name}`
      });
    });
    
    return opciones;
  }, [empresas]);
  
  // Configuración de filtros (sin cliente)
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
      options: opcionesMes
    },
    {
      id: 'tienda',
      label: 'Tienda',
      type: 'select',
      value: filtros.tienda,
      options: opcionesTienda
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
  useEffect(() => {
    if (!data || !data.fac_t) return;
    
    setLoading(true);
    
    try {
      let filtered = [...data.fac_t];
      
      console.log('Aplicando filtros a ventas:', filtros);
      console.log(`Total registros iniciales: ${filtered.length}`);
      
      // Filtrar por año
      if (filtros.año !== 'todos') {
        const año = parseInt(filtros.año);
        const antes = filtered.length;
        filtered = filtered.filter(item => {
          const itemAño = typeof item.eje === 'string' ? parseInt(item.eje) : item.eje;
          return itemAño === año;
        });
        console.log(`Filtro año ${año}: ${antes} -> ${filtered.length} registros`);
      }
      
      // Filtrar por mes
      if (filtros.mes !== 'todos') {
        const mes = parseInt(filtros.mes);
        const antes = filtered.length;
        filtered = filtered.filter(item => {
          const itemMes = typeof item.mes === 'string' ? parseInt(item.mes) : item.mes;
          return itemMes === mes;
        });
        console.log(`Filtro mes ${mes}: ${antes} -> ${filtered.length} registros`);
      }
      
      // Filtrar por tienda/división
      if (filtros.tienda !== 'todas') {
        const antes = filtered.length;
        
        if (filtros.tienda.startsWith('emp_')) {
          const empresaId = filtros.tienda.replace('emp_', '');
          filtered = filtered.filter(item => {
            const itemEmp = typeof item.emp === 'string' ? item.emp : item.emp?.toString();
            return itemEmp === empresaId;
          });
        } else if (filtros.tienda.startsWith('div_')) {
          const divisionId = filtros.tienda.replace('div_', '');
          filtered = filtered.filter(item => {
            const itemDiv = typeof item.emp_div === 'string' ? item.emp_div : item.emp_div?.toString();
            return itemDiv === divisionId;
          });
        }
        
        console.log(`Filtro tienda ${filtros.tienda}: ${antes} -> ${filtered.length} registros`);
      }
      
      // Filtrar por rango de fechas
      if (filtros.fechaDesde) {
        const fechaDesde = new Date(filtros.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);
        
        const antes = filtered.length;
        filtered = filtered.filter(item => {
          if (!item.fch) return false;
          const fechaItem = new Date(item.fch);
          return fechaItem >= fechaDesde;
        });
        console.log(`Filtro fecha desde ${filtros.fechaDesde}: ${antes} -> ${filtered.length} registros`);
      }
      
      if (filtros.fechaHasta) {
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        
        const antes = filtered.length;
        filtered = filtered.filter(item => {
          if (!item.fch) return false;
          const fechaItem = new Date(item.fch);
          return fechaItem <= fechaHasta;
        });
        console.log(`Filtro fecha hasta ${filtros.fechaHasta}: ${antes} -> ${filtered.length} registros`);
      }
      
      console.log(`Total registros después de filtros: ${filtered.length}`);
      
      setFilteredData(filtered);
    } catch (err) {
      console.error("Error al filtrar datos:", err);
      setError(err.message || "Error al filtrar los datos");
    } finally {
      setLoading(false);
    }
  }, [data, filtros]);
  
  // Calcular ventas por mes
  const ventasPorMes = useMemo(() => {
    if (!filteredData.length) return [];
    
    const meses = {};
    filteredData.forEach(item => {
      const mes = typeof item.mes === 'string' ? parseInt(item.mes) : item.mes;
      if (mes) {
        meses[mes] = (meses[mes] || 0) + (item.tot || 0);
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
  
  // Calcular ventas por tienda
  const ventasPorTienda = useMemo(() => {
    if (!filteredData.length || !empresas.length) return [];
    
    const tiendas = {};
    filteredData.forEach(item => {
      const tiendaId = item.emp_div || item.emp;
      if (tiendaId) {
        tiendas[tiendaId] = (tiendas[tiendaId] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(tiendas)
      .map(([tiendaId, total]) => {
        const empresa = empresas.find(e => e.id === tiendaId);
        return {
          tiendaId,
          nombreTienda: empresa ? empresa.name : `Tienda ${tiendaId}`,
          total
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData, empresas]);
  
  // Calcular ventas por forma de pago
  const ventasPorFormaPago = useMemo(() => {
    if (!filteredData.length) return [];
    
    const formasPago = {};
    filteredData.forEach(item => {
      const formaPago = typeof item.fpg === 'string' ? parseInt(item.fpg) : item.fpg;
      if (formaPago !== undefined && formaPago !== null) {
        formasPago[formaPago] = (formasPago[formaPago] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(formasPago).map(([formaPago, total]) => ({
      formaPago: parseInt(formaPago),
      nombreFormaPago: `Forma ${formaPago}`,
      total
    }));
  }, [filteredData]);
  
  // Calcular totales
  const totales = useMemo(() => {
    if (!filteredData.length) return { total: 0, cantidad: 0, promedio: 0 };
    
    const total = filteredData.reduce((sum, item) => sum + (item.tot || 0), 0);
    const cantidad = filteredData.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;
    
    return { total, cantidad, promedio };
  }, [filteredData]);
  
  // Manejar cambios en los filtros
  const handleFilterChange = (id, value) => {
    console.log(`Cambiando filtro ventas ${id} a:`, value);
    
    setFiltros(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Resetear filtros
  const handleResetFilters = () => {
    setFiltros({
      año: 'todos',
      mes: 'todos',
      tienda: 'todas',
      fechaDesde: '',
      fechaHasta: ''
    });
  };
  
  if (loadingEmpresas) {
    return <LoadingSpinner text="Cargando información de tiendas..." />;
  }
  
  if (!data || !data.fac_t) {
    return <LoadingSpinner text="Cargando datos de ventas..." />;
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
      
      {/* Información de filtros activos */}
      {(filtros.año !== 'todos' || filtros.mes !== 'todos' || 
        filtros.tienda !== 'todas' || filtros.fechaDesde || filtros.fechaHasta) && (
        <div className="filtros-activos-info">
          <i className="fas fa-info-circle"></i>
          <span>Filtros activos:</span>
          {filtros.año !== 'todos' && <span>Año: {filtros.año}</span>}
          {filtros.mes !== 'todos' && <span>Mes: {obtenerNombreMes(parseInt(filtros.mes))}</span>}
          {filtros.tienda !== 'todas' && (
            <span>Tienda: {
              empresas.find(e => e.id === filtros.tienda.replace('emp_', '').replace('div_', ''))?.name || 
              filtros.tienda
            }</span>
          )}
          {filtros.fechaDesde && <span>Desde: {formatDate(filtros.fechaDesde)}</span>}
          {filtros.fechaHasta && <span>Hasta: {formatDate(filtros.fechaHasta)}</span>}
        </div>
      )}

      <div className="summary-cards">
        <DataCard 
          title="Total Ventas" 
          value={totales.total} 
          format="currency" 
          icon="shopping-cart"
          type="primary"
        />
        <DataCard 
          title="Cantidad de Facturas" 
          value={totales.cantidad} 
          format="number" 
          icon="file-invoice-dollar"
          type="secondary"
        />
        <DataCard 
          title="Promedio por Factura" 
          value={totales.promedio} 
          format="currency" 
          icon="calculator"
          type="primary"
        />
      </div>

      <div className="charts-container">
        <ChartContainer title="Ventas por Mes">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombreMes" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="total" fill="#0088FE" name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Top 5 Tiendas">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasPorTienda} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nombreTienda" type="category" width={150} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="total" fill="#00C49F" name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Ventas por Forma de Pago">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ventasPorFormaPago}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="total"
                nameKey="nombreFormaPago"
                label={({ nombreFormaPago, percent }) => `${nombreFormaPago}: ${(percent * 100).toFixed(0)}%`}
              >
                {ventasPorFormaPago.map((entry, index) => (
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

export default EstadisticasVentas;