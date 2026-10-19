// Redirecionamento legado para a rota oficial /filhos
import { Navigate } from 'react-router-dom'

export default function CriancasLista() {
  return <Navigate to="/filhos" replace />
}
