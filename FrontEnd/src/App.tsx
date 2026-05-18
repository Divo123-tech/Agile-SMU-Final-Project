import { Route, Routes, useParams } from 'react-router-dom'
import Home from './pages/Home'
import Stall from './pages/Stall'
import './App.css'

function StallRoute() {
  const { id } = useParams()
  return <Stall key={id} />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/stall/:id" element={<StallRoute />} />
    </Routes>
  )
}

export default App
