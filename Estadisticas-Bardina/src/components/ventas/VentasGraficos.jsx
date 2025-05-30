// components/ventas/GraficosVentas.jsx
import React, { useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import ChartContainer from '../ChartContainer';
import { formatCurrency, obtenerNombreMes } from '../../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const GraficosVentas = ({ 
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
    ventasData.forEach(item => {
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
  }, [ventasData]);

  // Ventas por vendedor (top 10)
  const ventasPorVendedor = useMemo(() => {
    if (!ventasData.length) return [];
    
    const vendedores = {};
    ventasData.forEach(item => {
      const vendedorId = item.alt_usr;
      if (vendedorId !== undefined && vendedorId !== null) {
        const key = vendedorId.toString();
        vendedores[key] = (vendedores[key] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(vendedores)
      .map(([vendedorId, total]) => ({
        vendedorId: parseInt(vendedorId),
        nombre: mapaUsuarios[vendedorId] || `Vendedor ${vendedorId}`,
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10
  }, [ventasData, mapaUsuarios]);

  // Ventas por cliente (top 10)
  const ventasPorCliente = useMemo(() => {
    if (!ventasData.length) return [];
    
    const clientes = {};
    ventasData.forEach(item => {
      if (item.clt) {
        const key = item.clt.toString();
        clientes[key] = (clientes[key] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(clientes)
      .map(([clienteId, total]) => ({
        clienteId,
        nombre: mapaContactos[clienteId] || `Cliente ${clienteId}`,
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10
  }, [ventasData, mapaContactos]);

  // Ventas por forma de pago
  const ventasPorFormaPago = useMemo(() => {
    if (!ventasData.length) return [];
    
    const formasPago = {};
    ventasData.forEach(item => {
      const formaPagoId = item.fpg;
      if (formaPagoId !== undefined && formaPagoId !== null) {
        const key = formaPagoId.toString();
        formasPago[key] = (formasPago[key] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(formasPago)
      .map(([formaPagoId, total]) => ({
        formaPagoId: parseInt(formaPagoId),
        nombre: mapaFormasPago[formaPagoId] || `Forma de pago ${formaPagoId}`,
        total
      }))
      .filter(fp => fp.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [ventasData, mapaFormasPago]);

  // Tendencia de ventas (para detectar patrones)
  const tendenciaVentas = useMemo(() => {
    if (!ventasData.length) return [];
    
    // Agrupar por día si hay filtro de fecha específico, sino por mes
    const agrupacion = {};
    
    ventasData.forEach(item => {
      let clave;
      if (filtrosActivos.rangoFechas && item.fch) {
        // Agrupar por día
        const fecha = new Date(item.fch);
        clave = fecha.toLocaleDateString('es-ES');
      } else {
        // Agrupar por mes
        const mes = typeof item.mes === 'string' ? parseInt(item.mes) : item.mes;
        clave = mes ? obtenerNombreMes(mes) : 'Sin mes';
      }
      
      if (clave) {
        agrupacion[clave] = (agrupacion[clave] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(agrupacion)
      .map(([periodo, total]) => ({ periodo, total }))
      .sort((a, b) => {
        if (filtrosActivos.rangoFechas) {
          // Ordenar por fecha
          const [diaA, mesA, añoA] = a.periodo.split('/');
          const [diaB, mesB, añoB] = b.periodo.split('/');
          return new Date(añoA, mesA - 1, diaA) - new Date(añoB, mesB - 1, diaB);
        } else {
          // Mantener orden de meses
          const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ];
          return meses.indexOf(a.periodo) - meses.indexOf(b.periodo);
        }
      });
  }, [ventasData, filtrosActivos]);

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
        {/* Gráfico de tendencia temporal */}
        {tendenciaVentas.length > 0 && (
          <ChartContainer 
            title={filtrosActivos.rangoFechas ? "Tendencia de Ventas por Día" : "Ventas por Mes"}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={tendenciaVentas}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="periodo" 
                  angle={tendenciaVentas.length > 6 ? -45 : 0}
                  textAnchor={tendenciaVentas.length > 6 ? "end" : "middle"}
                  height={tendenciaVentas.length > 6 ? 80 : 60}
                />
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
        )}

        {/* Top 10 Vendedores */}
        {ventasPorVendedor.length > 0 && (
          <ChartContainer title="Top 10 Vendedores">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorVendedor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="nombre" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value), 'Ventas']}
                  labelFormatter={(label) => `Vendedor: ${label}`}
                />
                <Bar dataKey="total" fill="#00C49F" name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {/* Top 10 Clientes */}
        {ventasPorCliente.length > 0 && (
          <ChartContainer title="Top 10 Clientes">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorCliente}>
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
                  formatter={(value, name) => [formatCurrency(value), 'Ventas']}
                  labelFormatter={(label) => `Cliente: ${label}`}
                />
                <Bar dataKey="total" fill="#FFBB28" name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {/* Distribución por Forma de Pago */}
        {ventasPorFormaPago.length > 0 && (
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

        {/* Comparativa Vendedores vs Clientes */}
        {ventasPorVendedor.length > 0 && ventasPorCliente.length > 0 && (
          <ChartContainer title="Comparativa: Vendedores vs Clientes (Top 5)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={[
                  ...ventasPorVendedor.slice(0, 5).map(v => ({ ...v, tipo: 'Vendedor' })),
                  ...ventasPorCliente.slice(0, 5).map(c => ({ ...c, tipo: 'Cliente' }))
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="total" fill="#8884d8" name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>
    </div>
  );
};

export default GraficosVentas;