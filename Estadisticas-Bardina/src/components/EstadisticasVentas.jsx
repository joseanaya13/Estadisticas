// components/EstadisticasVentas.jsx - Completo con todos los gráficos de ventas
// Incluye: Ventas por tiendas, vendedores, días, horas y media hora
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { ChartContainer, DataCard, LoadingSpinner, ErrorMessage, FilterBar } from './index';
import { formatCurrency, obtenerNombreMes, formatDate, obtenerNombreMesCorto } from '../utils/formatters';
import { contactosService, usuariosService } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

const EstadisticasVentas = ({ data, contactos, usuarios }) => {
  const [filtros, setFiltros] = useState({
    año: new Date().getFullYear().toString(),
    mes: 'todos',
    tienda: 'todas',
    vendedor: 'todos',
    fechaDesde: '',
    fechaHasta: ''
  });
  
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Crear mapas de nombres para búsquedas rápidas
  const mapaNombresContactos = useMemo(() => {
    return contactos?.ent_m ? contactosService.crearMapaNombres(contactos.ent_m) : {};
  }, [contactos]);
  
  const mapaNombresUsuarios = useMemo(() => {
    return usuarios?.usr_m ? usuariosService.crearMapaNombres(usuarios.usr_m) : {};
  }, [usuarios]);
  
  // Obtener años únicos disponibles
  const añosDisponibles = useMemo(() => {
    if (!data?.fac_t) return [];
    const años = new Set();
    data.fac_t.forEach(item => {
      if (item.eje) años.add(item.eje);
    });
    return Array.from(años).sort((a, b) => b - a).map(año => ({
      value: año.toString(),
      label: año.toString()
    }));
  }, [data]);
  
  // Opciones para filtros
  const opcionesTienda = useMemo(() => {
    if (!data?.fac_t) return [];
    const tiendas = new Set();
    data.fac_t.forEach(item => {
      if (item.tnd) tiendas.add(item.tnd);
    });
    return [
      { value: 'todas', label: 'Todas las tiendas' },
      ...Array.from(tiendas).sort((a, b) => a - b).map(tienda => ({
        value: tienda.toString(),
        label: `Tienda ${tienda}`
      }))
    ];
  }, [data]);
  
  const opcionesVendedor = useMemo(() => {
    if (!data?.fac_t) return [];
    const vendedores = new Set();
    data.fac_t.forEach(item => {
      if (item.alt_usr !== undefined && item.alt_usr !== null) {
        vendedores.add(item.alt_usr);
      }
    });
    return [
      { value: 'todos', label: 'Todos los vendedores' },
      ...Array.from(vendedores).sort((a, b) => a - b).map(vendedor => ({
        value: vendedor.toString(),
        label: mapaNombresUsuarios[vendedor] || `Vendedor ${vendedor}`
      }))
    ];
  }, [data, mapaNombresUsuarios]);
  
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
        ...Array.from({length: 12}, (_, i) => ({
          value: (i + 1).toString(),
          label: obtenerNombreMes(i + 1)
        }))
      ]
    },
    {
      id: 'tienda',
      label: 'Tienda',
      type: 'select',
      value: filtros.tienda,
      options: opcionesTienda
    },
    {
      id: 'vendedor',
      label: 'Vendedor',
      type: 'select',
      value: filtros.vendedor,
      options: opcionesVendedor
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
  
  // Aplicar filtros
  useEffect(() => {
    if (!data?.fac_t) return;
    
    setLoading(true);
    try {
      let filtered = [...data.fac_t];
      
      // Filtro por año
      if (filtros.año !== 'todos') {
        filtered = filtered.filter(item => item.eje === parseInt(filtros.año));
      }
      
      // Filtro por mes
      if (filtros.mes !== 'todos') {
        filtered = filtered.filter(item => item.mes === parseInt(filtros.mes));
      }
      
      // Filtro por tienda
      if (filtros.tienda !== 'todas') {
        filtered = filtered.filter(item => item.tnd === parseInt(filtros.tienda));
      }
      
      // Filtro por vendedor
      if (filtros.vendedor !== 'todos') {
        filtered = filtered.filter(item => item.alt_usr === parseInt(filtros.vendedor));
      }
      
      // Filtro por fechas
      if (filtros.fechaDesde) {
        const fechaDesde = new Date(filtros.fechaDesde);
        filtered = filtered.filter(item => {
          if (!item.fch) return false;
          const fechaItem = new Date(item.fch);
          return fechaItem >= fechaDesde;
        });
      }
      
      if (filtros.fechaHasta) {
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => {
          if (!item.fch) return false;
          const fechaItem = new Date(item.fch);
          return fechaItem <= fechaHasta;
        });
      }
      
      setFilteredData(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [data, filtros]);
  
  // 1. VENTAS POR TIENDAS
  const ventasPorTiendas = useMemo(() => {
    if (!filteredData.length) return [];
    
    const tiendas = {};
    filteredData.forEach(item => {
      const tienda = item.tnd;
      if (tienda !== undefined && tienda !== null) {
        tiendas[tienda] = (tiendas[tienda] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(tiendas)
      .map(([tienda, total]) => ({
        tienda: parseInt(tienda),
        nombreTienda: `Tienda ${tienda}`,
        total,
        porcentaje: 0 // Se calculará después
      }))
      .sort((a, b) => b.total - a.total)
      .map((item, index, arr) => {
        const totalGeneral = arr.reduce((sum, i) => sum + i.total, 0);
        return {
          ...item,
          porcentaje: totalGeneral > 0 ? (item.total / totalGeneral) * 100 : 0
        };
      });
  }, [filteredData]);
  
  // 2. VENTAS POR VENDEDOR
  const ventasPorVendedor = useMemo(() => {
    if (!filteredData.length) return [];
    
    const vendedores = {};
    filteredData.forEach(item => {
      const vendedor = item.alt_usr;
      if (vendedor !== undefined && vendedor !== null) {
        if (!vendedores[vendedor]) {
          vendedores[vendedor] = {
            vendedor,
            nombreVendedor: mapaNombresUsuarios[vendedor] || `Vendedor ${vendedor}`,
            total: 0,
            cantidadFacturas: 0
          };
        }
        vendedores[vendedor].total += (item.tot || 0);
        vendedores[vendedor].cantidadFacturas += 1;
      }
    });
    
    return Object.values(vendedores)
      .map(item => ({
        ...item,
        promedio: item.cantidadFacturas > 0 ? item.total / item.cantidadFacturas : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData, mapaNombresUsuarios]);
  
  // 3. VENTAS POR DÍAS
  const ventasPorDias = useMemo(() => {
    if (!filteredData.length) return [];
    
    const dias = {};
    filteredData.forEach(item => {
      if (item.fch) {
        const fecha = new Date(item.fch);
        const fechaKey = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
        const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
        
        if (!dias[fechaKey]) {
          dias[fechaKey] = {
            fecha: fechaKey,
            fechaFormateada: formatDate(fecha),
            diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
            total: 0,
            cantidadFacturas: 0
          };
        }
        
        dias[fechaKey].total += (item.tot || 0);
        dias[fechaKey].cantidadFacturas += 1;
      }
    });
    
    return Object.values(dias)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .map(item => ({
        ...item,
        promedio: item.cantidadFacturas > 0 ? item.total / item.cantidadFacturas : 0
      }));
  }, [filteredData]);
  
  // 4. VENTAS POR HORAS
  const ventasPorHoras = useMemo(() => {
    if (!filteredData.length) return [];
    
    const horas = {};
    
    // Inicializar todas las horas (0-23)
    for (let i = 0; i < 24; i++) {
      horas[i] = {
        hora: i,
        horaFormateada: `${i.toString().padStart(2, '0')}:00`,
        total: 0,
        cantidadFacturas: 0
      };
    }
    
    filteredData.forEach(item => {
      let hora = 0;
      
      // Intentar obtener la hora de diferentes campos
      if (item.hor) {
        // Si hay campo hora específico
        if (typeof item.hor === 'string') {
          const horaParts = item.hor.split(':');
          hora = parseInt(horaParts[0]) || 0;
        } else {
          hora = parseInt(item.hor) || 0;
        }
      } else if (item.fch) {
        // Si solo hay fecha, extraer hora
        const fecha = new Date(item.fch);
        hora = fecha.getHours();
      }
      
      // Asegurar que la hora esté en rango válido
      if (hora >= 0 && hora < 24) {
        horas[hora].total += (item.tot || 0);
        horas[hora].cantidadFacturas += 1;
      }
    });
    
    return Object.values(horas).map(item => ({
      ...item,
      promedio: item.cantidadFacturas > 0 ? item.total / item.cantidadFacturas : 0
    }));
  }, [filteredData]);
  
  // 5. VENTAS POR MEDIA HORA
  const ventasPorMediaHora = useMemo(() => {
    if (!filteredData.length) return [];
    
    const mediaHoras = {};
    
    // Inicializar todas las medias horas (00:00, 00:30, 01:00, etc.)
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 2; j++) {
        const minutos = j * 30;
        const key = `${i}-${j}`;
        mediaHoras[key] = {
          hora: i,
          minutos,
          mediaHora: `${i.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`,
          total: 0,
          cantidadFacturas: 0
        };
      }
    }
    
    filteredData.forEach(item => {
      let hora = 0;
      let minutos = 0;
      
      if (item.hor) {
        if (typeof item.hor === 'string') {
          const horaParts = item.hor.split(':');
          hora = parseInt(horaParts[0]) || 0;
          minutos = parseInt(horaParts[1]) || 0;
        }
      } else if (item.fch) {
        const fecha = new Date(item.fch);
        hora = fecha.getHours();
        minutos = fecha.getMinutes();
      }
      
      // Determinar la media hora (0 para :00-:29, 1 para :30-:59)
      const mediaHoraIndex = minutos < 30 ? 0 : 1;
      const key = `${hora}-${mediaHoraIndex}`;
      
      if (mediaHoras[key]) {
        mediaHoras[key].total += (item.tot || 0);
        mediaHoras[key].cantidadFacturas += 1;
      }
    });
    
    return Object.values(mediaHoras)
      .filter(item => item.total > 0 || item.cantidadFacturas > 0) // Solo mostrar franjas con datos
      .map(item => ({
        ...item,
        promedio: item.cantidadFacturas > 0 ? item.total / item.cantidadFacturas : 0
      }));
  }, [filteredData]);
  
  // Calcular totales generales
  const totales = useMemo(() => {
    if (!filteredData.length) return { total: 0, cantidad: 0, promedio: 0 };
    
    const total = filteredData.reduce((sum, item) => sum + (item.tot || 0), 0);
    const cantidad = filteredData.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;
    
    return { total, cantidad, promedio };
  }, [filteredData]);
  
  // Manejar cambios en filtros
  const handleFilterChange = (id, value) => {
    setFiltros(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleResetFilters = () => {
    setFiltros({
      año: new Date().getFullYear().toString(),
      mes: 'todos',
      tienda: 'todas',
      vendedor: 'todos',
      fechaDesde: '',
      fechaHasta: ''
    });
  };
  
  if (!data?.fac_t) {
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

      {/* Tarjetas de resumen */}
      <div className="summary-cards">
        <DataCard 
          title="Total Ventas" 
          value={totales.total} 
          format="currency" 
          icon="shopping-cart"
          type="primary"
        />
        <DataCard 
          title="Número de Facturas" 
          value={totales.cantidad} 
          format="number" 
          icon="file-invoice"
          type="secondary"
        />
        <DataCard 
          title="Promedio por Factura" 
          value={totales.promedio} 
          format="currency" 
          icon="calculator"
          type="primary"
        />
        <DataCard 
          title="Tiendas Activas" 
          value={ventasPorTiendas.length} 
          format="number" 
          icon="store"
          type="warning"
        />
      </div>

      <div className="charts-container">
        {/* 1. VENTAS POR TIENDAS */}
        <ChartContainer title="Ventas por Tiendas" height={400}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ventasPorTiendas} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombreTienda" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Total Ventas']}
                labelFormatter={() => ''}
              />
              <Legend />
              <Bar dataKey="total" fill="#0088FE" name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Gráfico de pie para tiendas */}
        <ChartContainer title="Distribución de Ventas por Tiendas" height={400}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ventasPorTiendas}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="total"
                label={({ nombreTienda, porcentaje }) => `${nombreTienda}: ${porcentaje.toFixed(1)}%`}
              >
                {ventasPorTiendas.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 2. VENTAS POR VENDEDOR */}
        <ChartContainer title="Ventas por Vendedor" height={400}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ventasPorVendedor.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nombreVendedor" type="category" width={150} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Total Ventas') return formatCurrency(value);
                  if (name === 'Facturas') return value;
                  return value;
                }}
              />
              <Legend />
              <Bar dataKey="total" fill="#00C49F" name="Total Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 3. VENTAS POR DÍAS */}
        <ChartContainer title="Evolución de Ventas por Días" height={400}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ventasPorDias} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fechaFormateada" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={Math.ceil(ventasPorDias.length / 10)}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Ventas']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Legend />
              <Area type="monotone" dataKey="total" stackId="1" stroke="#FFBB28" fill="#FFBB28" name="Ventas" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 4. VENTAS POR HORAS */}
        <ChartContainer title="Ventas por Horas del Día" height={400}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ventasPorHoras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="horaFormateada" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Total Ventas') return formatCurrency(value);
                  if (name === 'Facturas') return value;
                  return value;
                }}
              />
              <Legend />
              <Bar dataKey="total" fill="#FF8042" name="Total Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* 5. VENTAS POR MEDIA HORA */}
        {ventasPorMediaHora.length > 0 && (
          <ChartContainer title="Ventas por Media Hora" height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventasPorMediaHora} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mediaHora" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={4}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Ventas']}
                  labelFormatter={(label) => `Hora: ${label}`}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="Ventas" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {/* Tabla top vendedores */}
        <ChartContainer title="Top 10 Vendedores - Detalles" height={400}>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Vendedor</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Total Ventas</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Facturas</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Promedio</th>
                </tr>
              </thead>
              <tbody>
                {ventasPorVendedor.slice(0, 10).map((vendedor, index) => (
                  <tr key={vendedor.vendedor} style={{ background: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{vendedor.nombreVendedor}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(vendedor.total)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{vendedor.cantidadFacturas}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(vendedor.promedio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      </div>
    </div>
  );
};

export default EstadisticasVentas;