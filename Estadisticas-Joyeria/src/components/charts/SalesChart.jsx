import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Gráfico de líneas para ventas en el tiempo
export const SalesLineChart = ({ data, height = 400 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="fecha" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatDate(value)}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip 
          formatter={(value, name) => [formatCurrency(value), name === 'ventas' ? 'Ventas' : 'Beneficio']}
          labelFormatter={(label) => formatDate(label)}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="ventas" 
          stroke="#d97706" 
          strokeWidth={3}
          dot={{ fill: '#d97706', r: 4 }}
          name="Ventas"
        />
        <Line 
          type="monotone" 
          dataKey="beneficio" 
          stroke="#059669" 
          strokeWidth={3}
          dot={{ fill: '#059669', r: 4 }}
          name="Beneficio"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Gráfico de barras para ventas por familia
export const FamilyBarChart = ({ data, height = 400 }) => {
  const COLORS = {
    'ORO': '#f59e0b',
    'PLATA': '#6b7280',
    'PILAS': '#3b82f6',
    'CORREAS': '#f97316',
    'default': '#8b5cf6'
  };

  const getColor = (familiaName) => {
    const family = familiaName?.toUpperCase();
    if (family?.includes('ORO')) return COLORS.ORO;
    if (family?.includes('PLATA')) return COLORS.PLATA;
    if (family?.includes('PILA')) return COLORS.PILAS;
    if (family?.includes('CORREA')) return COLORS.CORREAS;
    return COLORS.default;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="familia" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip 
          formatter={(value) => formatCurrency(value)}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        <Legend />
        <Bar 
          dataKey="ventas" 
          name="Ventas"
          fill={(entry) => getColor(entry.familia)}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Gráfico de dona para distribución por vendedor
export const VendorPieChart = ({ data, height = 400 }) => {
  const COLORS = ['#d97706', '#059669', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={120}
          paddingAngle={5}
          dataKey="ventas"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => formatCurrency(value)}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value, entry) => (
            <span style={{ color: entry.color, fontSize: '14px' }}>
              {entry.payload.vendedor}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Gráfico combinado de ventas y transacciones
export const SalesTransactionsChart = ({ data, height = 400 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="fecha" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatDate(value)}
        />
        <YAxis 
          yAxisId="left"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right"
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value, name) => {
            if (name === 'transacciones') return [value, 'Transacciones'];
            return [formatCurrency(value), 'Ventas'];
          }}
          labelFormatter={(label) => formatDate(label)}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        <Legend />
        <Bar 
          yAxisId="left"
          dataKey="ventas" 
          fill="#d97706" 
          name="Ventas"
          radius={[4, 4, 0, 0]}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="transacciones" 
          stroke="#059669" 
          strokeWidth={3}
          name="Transacciones"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Componente wrapper para diferentes tipos de gráficos
export const ChartContainer = ({ 
  title, 
  children, 
  loading = false, 
  error = null,
  className = "" 
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-gray-600">Error cargando el gráfico</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
};

// Tooltip personalizado para mostrar más información
export const CustomTooltip = ({ active, payload, label, formatValue, formatLabel }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">
          {formatLabel ? formatLabel(label) : label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${formatValue ? formatValue(entry.value) : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};