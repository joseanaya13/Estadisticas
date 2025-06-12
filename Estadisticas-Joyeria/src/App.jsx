import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Aquí puedes agregar más rutas según avances */}
        {/* <Route path="/sales" element={<Sales />} /> */}
        {/* <Route path="/products" element={<Products />} /> */}
        {/* <Route path="/reports" element={<Reports />} /> */}
      </Routes>
    </div>
  );
}

export default App;
