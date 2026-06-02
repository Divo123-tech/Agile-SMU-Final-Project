import { Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import Home from './pages/Home'
import Stall from './pages/Stall'
import AddDishPage from './pages/Add-Dish'
import CreateAccountPage from './pages/Create-Account'
import CreateStallPage from './pages/Create-Stall'
import EditStallPage from './pages/Edit-Stall'
import MyStallsPage from './pages/My-Stalls'
import MyAccountPage from './pages/My-Account'
import StallQRPage from './pages/Stall-QR'
import LoginPage from './pages/Login'
import { Toaster } from '@/components/ui/sonner'
import './App.css'

function StallRoute() {
  const { id } = useParams()
  return <Stall key={id} />
}

function AddDishRoute() {
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  return <AddDishPage key={editId ?? 'new'} />
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stall/:id" element={<StallRoute />} />
        <Route path="/add-dish" element={<AddDishRoute />} />
        <Route path="/create-stall" element={<CreateStallPage />} />
        <Route path="/edit-stall/:id" element={<EditStallPage />} />
        <Route path="/my-stalls" element={<MyStallsPage />} />
        <Route path="/my-account" element={<MyAccountPage />} />
        <Route path="/stall-qr/:id" element={<StallQRPage />} />
        <Route path="/sign-up" element={<CreateAccountPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
