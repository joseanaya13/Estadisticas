// components/ventas/proveedores/ProveedoresGraficos.jsx
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import { ChartContainer } from '../../common';
import { formatCurrency, formatPercentage, obtenerNombreMes } from '../../../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const ProveedoresGraficos = ({ 
  proveedoresData = [], 
  loading = false,
  viewMode = "full" // "dashboard" | "full"
}) => {
  
  // Top proveedores por ventas
  const topProveedoresPorVentas = useMemo(() => {
    if (!proveedoresData.length) return [];
    
    return [...proveedoresData]
      .sort((a, b) => (b.ventasTotal || 0) - (a.ventasTotal || 0))
      .slice(0, viewMode === "dashboard" ? 5 : 10)
      .map(proveedor => ({
        nombre: proveedor.nombre.length > 15 ? 
          proveedor.nombre.substring(0, 15) + '...' : 
          proveedor.nombre,
        nombreCompleto: proveedor.nombre,
        ventas: proveedor.ventasTotal || 0,
        beneficio: proveedor.beneficioTotal || 0,
        margen: proveedor.margenPorcentual || 0,
        productos: proveedor.numeroProductos || 0,
        facturas: proveedor.numeroFacturas || 0
      }));
  }, [proveedoresData, viewMode]);

  // Distribución de ventas (para gráfico de pastel)
  const distribucionVentas = useMemo(() => {
    if (!proveedoresData.length) return [];
    
    const totalVentas = proveedoresData.reduce((sum, p) => sum + (p.ventasTotal || 0), 0);
    
    // Top 5 + Otros
    const top5 = [...proveedoresData]
      .sort((a, b) => (b.ventasTotal || 0) - (a.ventasTotal || 0))
      .slice(0, 5);
    
    const ventasTop5 = top5.reduce((sum, p) => sum + (p.ventasTotal || 0), 0);
    const ventasOtros = totalVentas - ventasTop5;
    
    const distribucion = top5.map(proveedor => ({
      nombre: proveedor.nombre.length > 12 ? 
        proveedor.nombre.substring(0, 12) + '...' : 
        proveedor.nombre,
      nombreCompleto: proveedor.nombre,
      valor: proveedor.ventasTotal || 0,
      porcentaje: totalVentas > 0 ? ((proveedor.ventasTotal || 0) / totalVentas) * 100 : 0
    }));
    
    if (ventasOtros > 0) {
      distribucion.push({
        nombre: 'Otros',
        nombreCompleto: `Otros ${proveedoresData.length - 5} proveedores`,
        valor: ventasOtros,
        porcentaje: totalVentas > 0 ? (ventasOtros / totalVentas) * 100 : 0
      });
    }
    
    return distribucion;
  }, [proveedoresData]);

  // Análisis de márgenes
  const analisisMargen = useMemo(() => {
    if (!proveedoresData.length) return [];
    
    return [...proveedoresData]
      .filter(p => (p.ventasTotal || 0) > 0) // Solo proveedores con ventas
      .sort((a, b) => (b.margenPorcentual || 0) - (a.margenPorcentual || 0))
      .slice(0, viewMode === "dashboard" ? 8 : 15)
      .map(proveedor => ({
        nombre: proveedor.nombre.length > 12 ? 
          proveedor.nombre.substring(0, 12) + '...' : 
          proveedor.nombre,
        nombreCompleto: proveedor.nombre,
        margen: proveedor.margenPorcentual || 0,
        ventas: proveedor.ventasTotal || 0,
        beneficio: proveedor.beneficioTotal || 0
      }));
  }, [proveedoresData, viewMode]);

  // Evolución temporal (solo en modo completo)
  const evolucionTemporal = useMemo(() => {
    if (!proveedoresData.length || viewMode === "dashboard") return [];
    
    // Obtener todos los meses únicos
    const mesesSet = new Set();
    proveedoresData.forEach(proveedor => {
      if (proveedor.ventasPorMes) {
        proveedor.ventasPorMes.forEach(mesData => {
          mesesSet.add(mesData.mes);
        });
      }
    });
    
    const mesesOrdenados = Array.from(mesesSet).sort();
    
    // Solo mostrar los top 5 proveedores para evitar saturación
    const top5Proveedores = [...proveedoresData]
      .sort((a, b) => (b.ventasTotal || 0) - (a.ventasTotal || 0))
      .slice(0, 5);
    
    return mesesOrdenados.map(mes => {
      const mesData = {
        mes,
        mesNombre: mes.length === 7 ? // YYYY-MM format
          `${obtenerNombreMes(parseInt(mes.split('-')[1]))} ${mes.split('-')[0]}` :
          mes
      };
      
      top5Proveedores.forEach((proveedor, index) => {
        const ventasMes = proveedor.ventasPorMes?.find(vm => vm.mes === mes);
        mesData[`proveedor_${index}`] = ventasMes?.ventas || 0;
        mesData[`nombre_${index}`] = proveedor.nombre;
      });
      
      return mesData;
    });
  }, [proveedoresData, viewMode]);

  // Matriz ventas vs margen (scatter plot simulado)
  const matrizVentasMargen = useMemo(() => {
    if (!proveedoresData.length || viewMode === "dashboard") return [];
    
    return proveedoresData
      .filter(p => (p.ventasTotal || 0) > 0)
      .map(proveedor => ({
        nombre: proveedor.nombre.length > 10 ? 
          proveedor.nombre.substring(0, 10) + '...' : 
          proveedor.nombre,
        nombreCompleto: proveedor.nombre,
        ventas: proveedor.ventasTotal || 0,
        margen: proveedor.margenPorcentual || 0,
        productos: proveedor.numeroProductos || 0,
        // Categorizar por cuadrantes
        categoria: (proveedor.ventasTotal || 0) > (proveedoresData.reduce((sum, p) => sum + (p.ventasTotal || 0), 0) / proveedoresData.length) ?
          (proveedor.margenPorcentual || 0) > 20 ? 'estrella' : 'volumen' :
          (proveedor.margenPorcentual || 0) > 20 ? 'nicho' : 'bajo'
      }));
  }, [proveedoresData, viewMode]);

  if (loading) {
    return (
      <div className="charts-container loading">
        {[1, 2, 3].map(i => (
          <div key={i} className="chart-box loading">
            <div className="loading-shimmer"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!proveedoresData.length) {
    return (
      <div className="charts-container">
        <div className="no-data-message">
          <i className="fas fa-industry"></i>
          <h3>No hay datos de proveedores</h3>
          <p>No se encontraron datos de proveedores con los filtros aplicados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="charts-container">
      
      {/* Top Proveedores por Ventas - SIEMPRE */}
      <ChartContainer title={`Top ${topProveedoresPorVentas.length} Proveedores por Ventas`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProveedoresPorVentas} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="nombre" 
              type="category" 
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'ventas' ? formatCurrency(value) : value,
                name === 'ventas' ? 'Ventas' : 
                name === 'beneficio' ? 'Beneficio' : 
                name === 'margen' ? 'Margen %' : name
              ]}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.nombreCompleto;
                }
                return label;
              }}
            />
            <Legend />
            <Bar dataKey="ventas" fill="#0088FE" name="Ventas" />
            <Bar dataKey="beneficio" fill="#00C49F" name="Beneficio" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Distribución de Ventas (Pie Chart) - SIEMPRE */}
      <ChartContainer title="Distribución de Ventas por Proveedor">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={distribucionVentas}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({nombre, porcentaje}) => `${nombre} (${porcentaje.toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="valor"
            >
              {distribucionVentas.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Gráficos adicionales solo en modo completo */}
      {viewMode === "full" && (
        <>
          {/* Análisis de Márgenes */}
          <ChartContainer title="Análisis de Márgenes por Proveedor">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analisisMargen}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 10 }}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'margen' ? `${value.toFixed(1)}%` : formatCurrency(value),
                    name === 'margen' ? 'Margen' : 
                    name === 'ventas' ? 'Ventas' : name
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.nombreCompleto;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="ventas" fill="#8884d8" name="Ventas" />
                <Line yAxisId="right" type="monotone" dataKey="margen" stroke="#ff7300" strokeWidth={3} name="Margen %" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Evolución Temporal */}
          {evolucionTemporal.length > 0 && (
            <ChartContainer title="Evolución Temporal - Top 5 Proveedores">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evolucionTemporal}>
                  <defs>
                    {[0, 1, 2, 3, 4].map(i => (
                      <linearGradient key={i} id={`colorProveedor${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0.1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mesNombre" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Período: ${label}`}
                  />
                  <Legend />
                  {[0, 1, 2, 3, 4].map(i => (
                    evolucionTemporal[0] && evolucionTemporal[0][`nombre_${i}`] && (
                      <Area
                        key={i}
                        type="monotone"
                        dataKey={`proveedor_${i}`}
                        stackId="1"
                        stroke={COLORS[i]}
                        fill={`url(#colorProveedor${i})`}
                        name={evolucionTemporal[0][`nombre_${i}`].length > 15 ? 
                          evolucionTemporal[0][`nombre_${i}`].substring(0, 15) + '...' :
                          evolucionTemporal[0][`nombre_${i}`]
                        }
                      />
                    )
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}

          {/* Matriz Ventas vs Margen */}
          <ChartContainer title="Matriz Ventas vs Margen - Análisis de Cuadrantes">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={matrizVentasMargen}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="ventas" 
                  type="number"
                  name="Ventas"
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis 
                  dataKey="margen"
                  type="number" 
                  name="Margen %"
                  domain={[0, 'dataMax + 10']}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          backgroundColor: 'white', 
                          padding: '10px', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}>
                          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                            {data.nombreCompleto}
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: '#0088FE' }}>
                            💰 Ventas: {formatCurrency(data.ventas)}
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: '#00C49F' }}>
                            📊 Margen: {data.margen.toFixed(1)}%
                          </p>
                          <p style={{ margin: 0, color: '#666' }}>
                            📦 Productos: {data.productos}
                          </p>
                          <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontStyle: 'italic' }}>
                            Categoría: {
                              data.categoria === 'estrella' ? '⭐ Estrella' :
                              data.categoria === 'volumen' ? '📈 Alto Volumen' :
                              data.categoria === 'nicho' ? '🎯 Nicho' : '⚠️ Bajo Rendimiento'
                            }
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="ventas" 
                  fill={(entry) => {
                    switch(entry.categoria) {
                      case 'estrella': return '#00C49F';
                      case 'volumen': return '#0088FE';
                      case 'nicho': return '#FFBB28';
                      default: return '#FF8042';
                    }
                  }}
                  name="Ventas por Proveedor"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </>
      )}
    </div>
  );
};

export default ProveedoresGraficos;