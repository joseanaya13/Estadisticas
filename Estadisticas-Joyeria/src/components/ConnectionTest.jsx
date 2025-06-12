import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { velneoAPI } from '../services/velneoAPI';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, XCircle, RefreshCw, Database, Wifi } from 'lucide-react';

const ConnectionTest = () => {
  const [testResults, setTestResults] = useState({});

  // Test de conexión básica
  const { data: connectionTest, isLoading: isTestingConnection, refetch: retestConnection } = useQuery({
    queryKey: ['connection-test'],
    queryFn: velneoAPI.testConnection,
    enabled: false, // No ejecutar automáticamente
    retry: 1
  });

  // Test de tablas disponibles
  const { data: tablesTest, isLoading: isTestingTables, refetch: retestTables } = useQuery({
    queryKey: ['tables-test'],
    queryFn: async () => {
      try {
        console.log('🔍 Probando acceso a tablas...');
        
        const facturas = await velneoAPI.getFacturas({ limit: 5 });
        const articulos = await velneoAPI.getArticulos({ limit: 5 });
        const formasPago = await velneoAPI.getFormasPago();
        
        // Log para debugging
        console.log('Respuesta facturas:', facturas);
        console.log('Respuesta artículos:', articulos);
        console.log('Respuesta formas de pago:', formasPago);
        
        return {
          success: true,
          tables: {
            facturas: !!(facturas?.fac_t && Array.isArray(facturas.fac_t)),
            articulos: !!(articulos?.art_m && Array.isArray(articulos.art_m)),
            formasPago: !!(formasPago?.fpg_m && Array.isArray(formasPago.fpg_m))
          },
          counts: {
            facturas: facturas?.count || 0,
            facturasTotal: facturas?.total_count || 0,
            articulos: articulos?.count || 0,
            formasPago: formasPago?.count || 0
          }
        };
      } catch (error) {
        console.error('Error en test de tablas:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },
    enabled: false
  });

  const runAllTests = async () => {
    console.log('🧪 Ejecutando pruebas de conexión...');
    
    try {
      await retestConnection();
      await retestTables();
    } catch (error) {
      console.error('Error en pruebas:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Prueba de Conexión a Velneo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Información de configuración */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Configuración Actual:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <strong>URL:</strong> {import.meta.env.VITE_VELNEO_API_URL}
                </div>
                <div>
                  <strong>API Key:</strong> {import.meta.env.VITE_VELNEO_API_KEY ? '✓ Configurada' : '❌ No configurada'}
                </div>
              </div>
            </div>

            {/* Botón para ejecutar pruebas */}
            <Button 
              onClick={runAllTests}
              loading={isTestingConnection || isTestingTables}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Probar Conexión
            </Button>

            {/* Resultados de las pruebas */}
            <div className="space-y-3">
              {/* Test de conexión básica */}
              {connectionTest && (
                <TestResult
                  title="Conexión Básica"
                  success={connectionTest.success}
                  message={connectionTest.success ? 'Conexión exitosa' : connectionTest.error}
                  loading={isTestingConnection}
                />
              )}

              {/* Test de tablas */}
              {tablesTest && (
                <div className="space-y-2">
                  <TestResult
                    title="Acceso a Tablas"
                    success={tablesTest.success}
                    message={tablesTest.success ? 'Tablas accesibles' : tablesTest.error}
                    loading={isTestingTables}
                  />
                  
                  {tablesTest.success && tablesTest.tables && (
                    <div className="ml-6 space-y-1 text-sm">
                      <TableStatus 
                        name={`Facturas (fac_t)`} 
                        status={tablesTest.tables.facturas}
                        count={tablesTest.counts?.facturas}
                        totalCount={tablesTest.counts?.facturasTotal}
                      />
                      <TableStatus 
                        name="Artículos (art_m)" 
                        status={tablesTest.tables.articulos}
                        count={tablesTest.counts?.articulos}
                      />
                      <TableStatus 
                        name="Formas de Pago (fpg_m)" 
                        status={tablesTest.tables.formasPago}
                        count={tablesTest.counts?.formasPago}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Información de ayuda */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Información:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• La API de Velneo puede tardar unos segundos en responder</li>
                <li>• Verifica que la URL y API key sean correctas</li>
                <li>• Consulta la documentación Swagger en: <br/>
                    <code className="text-xs bg-blue-100 px-1 rounded">
                      {import.meta.env.VITE_VELNEO_API_URL}/swagger?api_key={import.meta.env.VITE_VELNEO_API_KEY}
                    </code>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para mostrar resultados de pruebas
const TestResult = ({ title, success, message, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
        <span className="font-medium text-gray-700">{title}</span>
        <span className="text-gray-500">Probando...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg ${
      success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
    }`}>
      {success ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
      <span className="font-medium">{title}</span>
      <span className="text-sm">{message}</span>
    </div>
  );
};

// Componente para mostrar estado de tablas
const TableStatus = ({ name, status, count, totalCount }) => (
  <div className="flex items-center gap-2">
    {status ? (
      <CheckCircle className="h-3 w-3 text-green-600" />
    ) : (
      <XCircle className="h-3 w-3 text-red-600" />
    )}
    <span className={status ? 'text-green-700' : 'text-red-700'}>
      {name}
    </span>
    {status && count !== undefined && (
      <span className="text-xs text-gray-500 ml-2">
        ({count}{totalCount ? ` de ${totalCount} total` : ''} registros)
      </span>
    )}
  </div>
);

export default ConnectionTest;