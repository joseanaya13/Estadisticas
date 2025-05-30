// components/ventas/VentasGraficos.jsx
import React, { useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, 
  AreaChart, Area, ComposedChart 
} from 'recharts';
import ChartContainer from '../ChartContainer';
import { formatCurrency, obtenerNombreMes } from '../../utils/formatters';
import { analizarDuplicados } from '../../utils/usuariosUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const VentasGraficos = ({ 
  ventasData = [], 
  mapaContactos = {}, 
  mapaUsuarios = {}, 
  mapaFormasPago = {},
  filtrosActivos = {}
}) => {
  
  // Ventas por mes
  const ventasPorMes = useMemo(() => {
    if (!ventasData.length) return [];
    
    const meses = {};
    const cantidadPorMes = {};
    
    ventasData.forEach(item => {
      const mes = typeof item.mes === 'string' ? parseInt(item.mes) : item.mes;
      if (mes) {
        meses[mes] = (meses[mes] || 0) + (item.tot || 0);
        cantidadPorMes[mes] = (cantidadPorMes[mes] || 0) + 1;
      }
    });
    
    return Object.entries(meses)
      .map(([mes, total]) => ({
        mes: parseInt(mes),
        nombreMes: obtenerNombreMes(parseInt(mes)),
        total,
        cantidad: cantidadPorMes[mes],
        promedio: cantidadPorMes[mes] > 0 ? total / cantidadPorMes[mes] : 0
      }))
      .sort((a, b) => a.mes - b.mes);
  }, [ventasData]);
  
  // Ventas por semana (para filtros de mes específico)
  const ventasPorSemana = useMemo(() => {
    if (!ventasData.length || !filtrosActivos.mesEspecifico) return [];
    
    const semanas = {};
    ventasData.forEach(item => {
      if (item.fch) {
        const fecha = new Date(item.fch);
        const weekNum = Math.ceil(fecha.getDate() / 7);
        const semanaKey = `Semana ${weekNum}`;
        semanas[semanaKey] = (semanas[semanaKey] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(semanas)
      .map(([semana, total]) => ({ semana, total }))
      .sort((a, b) => parseInt(a.semana.split(' ')[1]) - parseInt(b.semana.split(' ')[1]));
  }, [ventasData, filtrosActivos.mesEspecifico]);
  
  // Consolidar vendedores duplicados
  const mapaUsuariosConsolidado = useMemo(() => {
    // Crear lista de usuarios para análisis
    const usuariosList = Object.entries(mapaUsuarios).map(([id, name]) => ({
      id: parseInt(id),
      name: name
    }));
    
    if (usuariosList.length === 0) {
      return mapaUsuarios;
    }
    
    // Analizar duplicados
    const analisis = analizarDuplicados(usuariosList);
    
    // Crear mapa consolidado
    const mapaConsolidado = { ...mapaUsuarios };
    
    analisis.duplicados.forEach(duplicado => {
      // Usar el nombre consolidado para todos los IDs del grupo
      const nombreConsolidado = duplicado.nombre;
      duplicado.usuarios.forEach(usuario => {
        mapaConsolidado[usuario.id] = nombreConsolidado;
      });
    });
    
    return mapaConsolidado;
  }, [mapaUsuarios]);
  // Top vendedores (consolidados)
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
            cantidad: 0
          };
        }
        vendedores[nombreVendedor].total += (item.tot || 0);
        vendedores[nombreVendedor].cantidad += 1;
      }
    });
    
    return Object.values(vendedores)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(v => ({
        ...v,
        promedio: v.cantidad > 0 ? v.total / v.cantidad : 0
      }));
  }, [ventasData, mapaUsuariosConsolidado]);
  
  // Top clientes
  const topClientes = useMemo(() => {
    if (!ventasData.length) return [];
    
    const clientes = {};
    ventasData.forEach(item => {
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
      .slice(0, 10)
      .map(c => ({
        ...c,
        promedio: c.cantidad > 0 ? c.total / c.cantidad : 0
      }));
  }, [ventasData, mapaContactos]);
  
  // Ventas por forma de pago
  const ventasPorFormaPago = useMemo(() => {
    if (!ventasData.length) return [];
    
    const formasPago = {};
    ventasData.forEach(item => {
      const formaPagoId = typeof item.fpg === 'string' ? parseInt(item.fpg) : item.fpg;
      if (formaPagoId !== undefined && formaPagoId !== null) {
        const nombre = mapaFormasPago[formaPagoId] || `Forma de pago ${formaPagoId}`;
        formasPago[nombre] = (formasPago[nombre] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(formasPago)
      .map(([nombre, total]) => ({ nombre, total }))
      .filter(fp => fp.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [ventasData, mapaFormasPago]);
  
  // Análisis temporal avanzado (ventas vs cantidad)
  const analisisTemporal = useMemo(() => {
    return ventasPorMes.map(mes => ({
      ...mes,
      ticketPromedio: mes.promedio
    }));
  }, [ventasPorMes]);

  if (!ventasData.length) {
    return (
      <div className="graficos-ventas">
        <div className="no-data-message">
          <i className="fas fa-chart-bar"></i>
          <h3>No hay datos para mostrar</h3>
          <p>No se encontraron ventas con los filtros aplicados.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="graficos-ventas">
      <div className="charts-container">
        
        {/* Gráfico temporal principal */}
        {filtrosActivos.mesEspecifico && ventasPorSemana.length > 0 ? (
          <ChartContainer title={`Ventas por Semana - ${obtenerNombreMes(parseInt(filtrosActivos.mesSeleccionado))}`}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ventasPorSemana}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#0088FE" 
                  fillOpacity={1} 
                  fill="url(#colorVentas)" 
                  name="Ventas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : ventasPorMes.length > 0 && (
          <ChartContainer title="Ventas y Ticket Promedio por Mes">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analisisTemporal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombreMes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'total' ? formatCurrency(value) : 
                    name === 'cantidad' ? `${value} facturas` :
                    formatCurrency(value),
                    name === 'total' ? 'Ventas' :
                    name === 'cantidad' ? 'Cantidad' : 'Ticket Promedio'
                  ]} 
                />
                <Legend />
                <Bar yAxisId="left" dataKey="total" fill="#0088FE" name="Ventas" />
                <Line yAxisId="right" type="monotone" dataKey="ticketPromedio" stroke="#FF8042" strokeWidth={3} name="Ticket Promedio" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        
        {/* Top Vendedores */}
        {topVendedores.length > 0 && (
          <ChartContainer title="Top 10 Vendedores por Ventas">
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
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'total' ? formatCurrency(value) : 
                    name === 'cantidad' ? `${value} facturas` :
                    formatCurrency(value),
                    name === 'total' ? 'Total Ventas' :
                    name === 'cantidad' ? 'Facturas' : 'Promedio'
                  ]} 
                />
                <Bar dataKey="total" fill="#00C49F" name="Total Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        
        {/* Top Clientes */}
        {topClientes.length > 0 && (
          <ChartContainer title="Top 10 Clientes por Ventas">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClientes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'total' ? formatCurrency(value) : 
                    name === 'cantidad' ? `${value} facturas` :
                    formatCurrency(value),
                    name === 'total' ? 'Total Compras' :
                    name === 'cantidad' ? 'Facturas' : 'Ticket Promedio'
                  ]} 
                />
                <Legend />
                <Bar dataKey="total" fill="#FFBB28" name="Total Compras" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        
        {/* Formas de Pago */}
        {ventasPorFormaPago.length > 0 && (
          <ChartContainer title="Distribución por Forma de Pago">
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
                  nameKey="nombre"
                  label={({ nombre, percent }) => 
                    `${nombre}: ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {ventasPorFormaPago.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        
      </div>
    </div>
  );
};

export default VentasGraficos;