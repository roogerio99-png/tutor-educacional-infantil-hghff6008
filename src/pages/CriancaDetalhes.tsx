// Redirecionamento legado para a rota oficial /filhos/:id
import { Navigate, useParams } from 'react-router-dom'

export default function CriancaDetalhes() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/filhos/${id || ''}`} replace />
}
