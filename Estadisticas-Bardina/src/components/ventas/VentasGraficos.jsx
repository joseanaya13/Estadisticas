// components/ventas/VentasGraficos.jsx - MEJORADO CON MODOS DE VISTA
import React, { useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, 
  AreaChart, Area, ComposedChart 
} from 'recharts';
import { ChartContainer } from '../common';
import { formatCurrency, obtenerNombreMes, formatDate, roundToPrecision } from '../../utils/formatters';
import { analizarDuplicados } from '../../utils/usuariosUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const VentasGraficos = ({ 
  ventasData = [], 
  mapaContactos = {}, 
  mapaUsuarios = {}, 
  mapaFormasPago = {},
  mapaEmpresas = {},
  filtrosActivos = {},
  filtros = {},
  viewMode = "full" // "dashboard" | "full"
}) => {
  
  // Crear mapa consolidado de usuarios (análisis de duplicados)
  const mapaUsuariosConsolidado = useMemo(() => {
    const usuariosList = Object.entries(mapaUsuarios).map(([id, name]) => ({
      id: parseInt(id),
      name: name
    }));
    
    if (usuariosList.length === 0) {
      return mapaUsuarios;
    }
    
    const analisis = analizarDuplicados(usuariosList);
    const mapaConsolidado = { ...mapaUsuarios };
    
    analisis.duplicados.forEach(duplicado => {
      const nombreConsolidado = duplicado.nombre;
      duplicado.usuarios.forEach(usuario => {
        mapaConsolidado[usuario.id] = nombreConsolidado;
      });
    });
    
    return mapaConsolidado;
  }, [mapaUsuarios]);

  // Separar ventas positivas de devoluciones
  const { ventasPositivas, devoluciones } = useMemo(() => {
    const positivas = ventasData.filter(venta => (venta.tot || 0) > 0);
    const negativas = ventasData.filter(venta => (venta.tot || 0) <= 0);
    
    return {
      ventasPositivas: positivas,
      devoluciones: negativas
    };
  }, [ventasData]);
  
  // Ventas por mes - INCLUYENDO DEVOLUCIONES PARA TOTAL NETO REAL
  const ventasPorMes = useMemo(() => {
    if (!ventasData.length) return [];
    
    const meses = {};
    const cantidadPorMes = {};
    const ventasPositivasPorMes = {};
    
    ventasData.forEach(item => {
      const mes = typeof item.mes === 'string' ? parseInt(item.mes) : item.mes;
      if (mes) {
        const monto = item.tot || 0;
        meses[mes] = (meses[mes] || 0) + monto;
        cantidadPorMes[mes] = (cantidadPorMes[mes] || 0) + 1;
        
        if (monto > 0) {
          ventasPositivasPorMes[mes] = (ventasPositivasPorMes[mes] || 0) + monto;
        }
      }
    });
    
    const resultado = Object.entries(meses)
      .map(([mes, total]) => ({
        mes: parseInt(mes),
        nombreMes: obtenerNombreMes(parseInt(mes)),
        total: roundToPrecision(total),
        cantidad: cantidadPorMes[mes],
        promedio: cantidadPorMes[mes] > 0 ? roundToPrecision(total / cantidadPorMes[mes]) : 0,
        ventasPositivas: roundToPrecision(ventasPositivasPorMes[mes] || 0)
      }))
      .sort((a, b) => a.mes - b.mes);
    
    return resultado;
  }, [ventasData]);
  
  // Top vendedores - VENTAS NETAS (incluyendo devoluciones)
  const topVendedores = useMemo(() => {
    if (!ventasData.length) return [];
    
    const vendedores = {};
    
    ventasData.forEach(item => {
      const vendedorId = item.alt_usr;
      if (vendedorId !== undefined && vendedorId !== null) {
        const nombreVendedor = mapaUsuariosConsolidado[vendedorId] || `Vendedor ${vendedorId}`;
        
        if (!vendedores[nombreVendedor]) {
          vendedores[nombreVendedor] = {
            nombre: nombreVendedor,
            total: 0,
            cantidad: 0,
            ventasPositivas: 0,
            cantidadPositivas: 0,
            tieneVentasPositivas: false
          };
        }
        
        const monto = item.tot || 0;
        vendedores[nombreVendedor].total += monto;
        vendedores[nombreVendedor].cantidad += 1;
        
        if (monto > 0) {
          vendedores[nombreVendedor].ventasPositivas += monto;
          vendedores[nombreVendedor].cantidadPositivas += 1;
          vendedores[nombreVendedor].tieneVentasPositivas = true;
        }
      }
    });
    
    return Object.values(vendedores)
      .filter(v => v.tieneVentasPositivas)
      .sort((a, b) => b.total - a.total)
      .slice(0, viewMode === "dashboard" ? 5 : 10) // Menos vendedores en dashboard
      .map(v => ({
        ...v,
        total: roundToPrecision(v.total),
        ventasPositivas: roundToPrecision(v.ventasPositivas),
        promedio: v.cantidad > 0 ? roundToPrecision(v.total / v.cantidad) : 0
      }));
  }, [ventasData, mapaUsuariosConsolidado, viewMode]);
  
  // Top clientes (solo ventas positivas)
  const topClientes = useMemo(() => {
    if (!ventasPositivas.length) return [];
    
    const clientes = {};
    ventasPositivas.forEach(item => {
      const clienteId = item.clt;
      if (clienteId) {
        if (!clientes[clienteId]) {
          clientes[clienteId] = {
            clienteId,
            nombre: mapaContactos[clienteId] || `Cliente ${clienteId}`,
            total: 0,
            cantidad: 0
          };
        }
        clientes[clienteId].total += (item.tot || 0);
        clientes[clienteId].cantidad += 1;
      }
    });
    
    return Object.values(clientes)
      .sort((a, b) => b.total - a.total)
      .slice(0, viewMode === "dashboard" ? 5 : 10) // Menos clientes en dashboard
      .map(c => ({
        ...c,
        total: roundToPrecision(c.total),
        promedio: c.cantidad > 0 ? roundToPrecision(c.total / c.cantidad) : 0
      }));
  }, [ventasPositivas, mapaContactos, viewMode]);
  
  // Ventas por forma de pago
  const ventasPorFormaPago = useMemo(() => {
    if (!ventasPositivas.length) return [];
    
    const formasPago = {};
    
    ventasPositivas.forEach(item => {
      const formaPagoId = typeof item.fpg === 'string' ? parseInt(item.fpg) : item.fpg;
      
      if (formaPagoId !== undefined && formaPagoId !== null) {
        const nombre = mapaFormasPago[formaPagoId] || `Forma de pago ${formaPagoId}`;
        const monto = item.tot || 0;
        formasPago[nombre] = (formasPago[nombre] || 0) + monto;
      }
    });
    
    return Object.entries(formasPago)
      .map(([nombre, total]) => ({ 
        nombre, 
        total: roundToPrecision(total)
      }))
      .filter(fp => fp.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [ventasPositivas, mapaFormasPago]);

  // Ventas por días (adaptado a filtros aplicados)
  const ventasPorDias = useMemo(() => {
    if (!ventasPositivas.length || viewMode === "dashboard") return { datos: [], titulo: "" };
    
    // Para modo completo, mostrar análisis por días
    let fechaInicio, fechaFin, tituloperiodo;
    
    if (filtrosActivos.mesEspecifico && filtros.año !== 'todos' && filtros.mes !== 'todos') {
      const año = parseInt(filtros.año);
      const mes = parseInt(filtros.mes);
      fechaInicio = new Date(año, mes - 1, 1);
      fechaFin = new Date(año, mes, 0);
      tituloperiodo = `${obtenerNombreMes(mes)} ${año}`;
    } else if (filtrosActivos.rangoFechas && (filtros.fechaDesde || filtros.fechaHasta)) {
      fechaInicio = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
      fechaFin = filtros.fechaHasta ? new Date(filtros.fechaHasta) : null;
      
      if (!fechaInicio) {
        fechaInicio = new Date(fechaFin);
        fechaInicio.setDate(fechaInicio.getDate() - 30);
      }
      if (!fechaFin) {
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 30);
      }
      
      tituloperiodo = `${fechaInicio.toLocaleDateString('es-ES')} - ${fechaFin.toLocaleDateString('es-ES')}`;
    } else {
      // Sin filtros: último mes con datos
      const fechas = ventasPositivas
        .map(item => new Date(item.fch))
        .filter(fecha => !isNaN(fecha.getTime()))
        .sort((a, b) => b - a);
      
      if (!fechas.length) return { datos: [], titulo: "" };
      
      const fechaMasReciente = fechas[0];
      fechaInicio = new Date(fechaMasReciente.getFullYear(), fechaMasReciente.getMonth(), 1);
      fechaFin = new Date(fechaMasReciente.getFullYear(), fechaMasReciente.getMonth() + 1, 0);
      tituloperiodo = fechaMasReciente.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
    
    // Crear array con todos los días del período
    const diasDelPeriodo = [];
    const diasTotal = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < diasTotal; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + i);
      
      diasDelPeriodo.push({
        dia: fecha.getDate(),
        fecha: new Date(fecha),
        total: 0,
        cantidad: 0
      });
    }
    
    // Llenar con datos reales
    ventasPositivas.forEach(item => {
      if (item.fch) {
        const fechaItem = new Date(item.fch);
        if (!isNaN(fechaItem.getTime()) && fechaItem >= fechaInicio && fechaItem <= fechaFin) {
          const diaData = diasDelPeriodo.find(d => 
            d.fecha.toDateString() === fechaItem.toDateString()
          );
          if (diaData) {
            diaData.total += (item.tot || 0);
            diaData.cantidad += 1;
          }
        }
      }
    });
    
    return {
      datos: diasDelPeriodo.map(dia => ({
        ...dia,
        total: roundToPrecision(dia.total),
        label: `${dia.dia}`,
        fechaCompleta: dia.fecha.toLocaleDateString('es-ES')
      })),
      titulo: tituloperiodo
    };
  }, [ventasPositivas, filtrosActivos, filtros, viewMode]);

  if (!ventasData.length) {
    return (
      <div className="charts-container">
        <div className="no-data-message">
          <i className="fas fa-chart-bar"></i>
          <h3>No hay datos para mostrar</h3>
          <p>No se encontraron ventas con los filtros aplicados.</p>
        </div>
      </div>
    );
  }

  // Configurar qué gráficos mostrar según el modo
  const mostrarGraficosCompletos = viewMode === "full";
  const mostrarGraficosDashboard = viewMode === "dashboard";
  
  return (
    <div className="charts-container">
      
      {/* Gráficos principales - SIEMPRE */}
      <ChartContainer title="Ventas por Mes (Netas)">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ventasPorMes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombreMes" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="total" fill="#0088FE" name="Ventas Netas" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Top Vendedores - SIEMPRE */}
      {topVendedores.length > 0 && (
        <ChartContainer title={`Top ${topVendedores.length} Vendedores por Ventas Netas`}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topVendedores} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="nombre" 
                type="category" 
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="total" fill="#00C49F" name="Ventas Netas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Gráficos adicionales solo en modo completo */}
      {mostrarGraficosCompletos && (
        <>
          {/* Ticket Promedio por Mes */}
          <ChartContainer title="Ticket Promedio por Mes">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ventasPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombreMes" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="promedio" 
                  stroke="#FF8042" 
                  strokeWidth={3} 
                  name="Ticket Promedio"
                  dot={{ fill: '#FF8042', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Ventas por Días */}
          {ventasPorDias.datos && ventasPorDias.datos.length > 0 && (
            <ChartContainer title={`Ventas por Día - ${ventasPorDias.titulo}`}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={ventasPorDias.datos}>
                  <defs>
                    <linearGradient id="colorVentasDias" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00C49F" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10 }}
                    interval={Math.max(1, Math.floor(ventasPorDias.datos.length / 15))}
                  />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload, label }) => {
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
                              Día {label} - {data.fechaCompleta}
                            </p>
                            <p style={{ margin: '0 0 5px 0', color: '#00C49F' }}>
                              💰 Ventas: {formatCurrency(data.total)}
                            </p>
                            <p style={{ margin: 0, color: '#666' }}>
                              📄 Facturas: {data.cantidad}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#00C49F" 
                    fillOpacity={1} 
                    fill="url(#colorVentasDias)" 
                    name="Ventas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}

          {/* Top Clientes */}
          {topClientes.length > 0 && (
            <ChartContainer title={`Top ${topClientes.length} Clientes por Compras`}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topClientes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nombre" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total" fill="#FFBB28" name="Total Compras" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}

          {/* Formas de Pago */}
          {ventasPorFormaPago.length > 0 && (
            <ChartContainer title="Ventas por Forma de Pago">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasPorFormaPago}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nombre" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="total" fill="#8884d8" name="Ventas">
                    {ventasPorFormaPago.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </>
      )}
    </div>
  );
};

export default VentasGraficos;


